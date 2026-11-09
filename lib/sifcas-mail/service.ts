import "server-only";

import { createClient as createSupabaseAdmin, type SupabaseClient } from "@supabase/supabase-js";
import type { CurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/config";
import { readDiaryIds, readDiaryRows, requireDiaryAccess } from "@/lib/diary-security";
import { decryptRefreshToken, encryptRefreshToken, sendGoogleMail } from "./google";
import { isMailAddress, MAIL_BATCH_SIZE, MAIL_DAILY_SAFETY_LIMIT, MAIL_MAX_RECIPIENTS, MailValidationError, parseMailSchedule, renderMailTemplate, validateMailTemplate } from "./templates";

const mailRoles = new Set(["teacher", "manager", "admin"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function mailConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SIFCAS_MAIL_GOOGLE_CLIENT_ID && process.env.SIFCAS_MAIL_GOOGLE_CLIENT_SECRET && process.env.SIFCAS_MAIL_PUBLIC_URL && process.env.SIFCAS_MAIL_TOKEN_KEY);
}

export function assertMailRole(account: CurrentAccount) {
  if (account.accountStatus !== "active" || !mailRoles.has(account.role)) throw new MailValidationError("Acesso restrito aos professores e gestores autorizados.");
}

export function mailAdmin(): SupabaseClient {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("A conexão protegida do SIFCAS Mail não foi configurada.");
  return createSupabaseAdmin(supabaseUrl, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getGoogleConnection(userId: string) {
  const { data, error } = await mailAdmin().from("sifcas_mail_connections").select("user_id,email,refresh_token_ciphertext").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data as { user_id: string; email: string; refresh_token_ciphertext: string } | null;
}

export async function saveGoogleConnection(userId: string, email: string, refreshToken: string | undefined) {
  const admin = mailAdmin();
  const existing = await getGoogleConnection(userId);
  if (!refreshToken && (!existing || existing.email !== email)) throw new MailValidationError("O Google não enviou uma autorização permanente. Reconecte a conta com consentimento.");
  const encrypted = refreshToken ? encryptRefreshToken(refreshToken) : existing!.refresh_token_ciphertext;
  // Verify encryption configuration before persisting an OAuth credential.
  decryptRefreshToken(encrypted);
  const { error } = await admin.from("sifcas_mail_connections").upsert({ user_id: userId, email, refresh_token_ciphertext: encrypted, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function removeGoogleConnection(userId: string) {
  const { error } = await mailAdmin().from("sifcas_mail_connections").delete().eq("user_id", userId);
  if (error) throw error;
}

type MailClass = { classSubjectId: string; classId: string; label: string; className: string; subjectName: string };

export async function listMailClasses(account: CurrentAccount): Promise<MailClass[]> {
  assertMailRole(account);
  const client = await createClient();
  let subjectIds: string[];
  if (account.role === "teacher") {
    const assignments = await readDiaryRows((from, to) => client.from("teaching_assignments").select("class_subject_id").eq("teacher_user_id", account.id).order("id").range(from, to));
    subjectIds = [...new Set(assignments.map((row) => row.class_subject_id))];
  } else {
    const visible = await readDiaryRows((from, to) => client.from("class_subjects").select("id").eq("active", true).order("id").range(from, to));
    subjectIds = visible.map((row) => row.id);
  }
  if (!subjectIds.length) return [];
  const subjects = await readDiaryIds(subjectIds, (ids, from, to) => client.from("class_subjects").select("id,class_id,subject_id").eq("active", true).in("id", ids).order("id").range(from, to));
  const classIds = [...new Set(subjects.map((row) => row.class_id))];
  const disciplineIds = [...new Set(subjects.map((row) => row.subject_id))];
  const [classes, disciplines] = await Promise.all([
    readDiaryIds(classIds, (ids, from, to) => client.from("classes").select("id,name,code").in("id", ids).order("id").range(from, to)),
    readDiaryIds(disciplineIds, (ids, from, to) => client.from("subjects").select("id,name,code").in("id", ids).order("id").range(from, to)),
  ]);
  const classMap = new Map(classes.map((row) => [row.id, row.name || row.code]));
  const disciplineMap = new Map(disciplines.map((row) => [row.id, row.name || row.code]));
  return subjects.map((row) => {
    const className = classMap.get(row.class_id) || "Turma";
    const subjectName = disciplineMap.get(row.subject_id) || "Disciplina";
    return { classSubjectId: row.id, classId: row.class_id, className, subjectName, label: `${className} • ${subjectName}` };
  }).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

type Recipient = { userId: string; email: string; name: string };

async function recipientsForClass(account: CurrentAccount, classSubjectId: string): Promise<{ recipients: Recipient[]; omitted: number; scope: { classId: string; classSubjectId: string } }> {
  const client = await createClient();
  const scope = await requireDiaryAccess(client, account, classSubjectId);
  const enrollments = await readDiaryRows((from, to) => client.from("enrollments")
    .select("student_user_id").eq("class_id", scope.classId).eq("status", "active").order("id").range(from, to));
  const ids = [...new Set(enrollments.map((row) => row.student_user_id))];
  if (ids.length > MAIL_MAX_RECIPIENTS) throw new MailValidationError(`Envie para no máximo ${MAIL_MAX_RECIPIENTS} alunos por comunicado.`);
  if (!ids.length) throw new MailValidationError("Esta turma não possui matrículas ativas.");
  const admin = mailAdmin();
  const profiles = await readDiaryIds(ids, (chunk, from, to) => admin.from("profiles").select("id,full_name,institutional_email").in("id", chunk).order("id").range(from, to));
  const profileMap = new Map(profiles.map((row) => [row.id, row]));
  const resolved = await Promise.all(ids.map(async (id) => {
    const profile = profileMap.get(id);
    const institutionalEmail = profile?.institutional_email?.trim().toLowerCase();
    if (isMailAddress(institutionalEmail)) return { userId: id, email: institutionalEmail, name: profile?.full_name?.trim() || "Estudante" };
    const { data, error } = await admin.auth.admin.getUserById(id);
    const authEmail = data.user?.email?.trim().toLowerCase();
    if (error || !data.user?.email_confirmed_at || !isMailAddress(authEmail)) return null;
    return { userId: id, email: authEmail, name: profile?.full_name?.trim() || "Estudante" };
  }));
  const recipients: Recipient[] = [];
  const usedEmails = new Set<string>();
  for (const recipient of resolved) {
    if (recipient && !usedEmails.has(recipient.email)) {
      recipients.push(recipient);
      usedEmails.add(recipient.email);
    }
  }
  if (!recipients.length) throw new MailValidationError("Nenhum aluno possui endereço de e-mail válido e autorizado.");
  return { recipients, omitted: ids.length - recipients.length, scope };
}

export async function enqueueMailCampaign(input: {
  actor: CurrentAccount;
  classSubjectId: string;
  senderUserId: string;
  subject: string;
  body: string;
  schedule?: string;
  type?: "manual" | "assessment";
  eventKey?: string;
}) {
  assertMailRole(input.actor);
  if (!uuid.test(input.classSubjectId) || !uuid.test(input.senderUserId)) throw new MailValidationError("Turma ou remetente inválido.");
  if (!input.eventKey && input.senderUserId !== input.actor.id) throw new MailValidationError("Você só pode enviar e-mails pela sua própria conta conectada.");
  const templates = validateMailTemplate(input.subject, input.body);
  const scheduledFor = input.schedule ? parseMailSchedule(input.schedule) : new Date().toISOString();
  const { recipients, omitted } = await recipientsForClass(input.actor, input.classSubjectId);
  const connection = await getGoogleConnection(input.senderUserId);
  if (!connection) throw new MailValidationError("Conecte uma conta Gmail autorizada antes de criar um envio.");
  const classes = await listMailClasses(input.actor);
  const selected = classes.find((option) => option.classSubjectId === input.classSubjectId);
  if (!selected) throw new MailValidationError("Turma indisponível para sua conta.");
  const admin = mailAdmin();
  const source = input.type ?? "manual";
  const { data: campaign, error: campaignError } = await admin.from("sifcas_mail_campaigns").insert({
    created_by: input.actor.id, sender_user_id: input.senderUserId, class_subject_id: input.classSubjectId,
    category: source, event_key: input.eventKey ?? null, subject_template: templates.subject, body_template: templates.body,
    scheduled_for: scheduledFor,
  }).select("id").single();
  if (campaignError) {
    if (input.eventKey && campaignError.code === "23505") return { recipients: 0, omitted: 0, duplicate: true };
    throw campaignError;
  }
  const siteUrl = process.env.SIFCAS_MAIL_PUBLIC_URL ?? "https://sifcas.vercel.app";
  const deliveries = recipients.map((recipient) => {
    const values = { nome: recipient.name, turma: selected.className, disciplina: selected.subjectName, professor: input.actor.fullName, data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(scheduledFor)), sifcas_url: siteUrl };
    return {
      campaign_id: campaign.id, sender_user_id: input.senderUserId, recipient_user_id: recipient.userId,
      to_email: recipient.email, subject: renderMailTemplate(templates.subject, values), body: renderMailTemplate(templates.body, values),
      status: "queued", next_attempt_at: scheduledFor,
    };
  });
  const { error: deliveriesError } = await admin.from("sifcas_mail_deliveries").insert(deliveries);
  if (deliveriesError) {
    await admin.from("sifcas_mail_campaigns").delete().eq("id", campaign.id);
    throw deliveriesError;
  }
  return { recipients: deliveries.length, omitted, duplicate: false };
}

export async function queueAssessmentNotice(actor: CurrentAccount, classSubjectId: string, assessmentId: string, title: string, date: string) {
  if (process.env.SIFCAS_MAIL_AUTOMATIC_ASSESSMENTS !== "true") return;
  const systemSender = process.env.SIFCAS_MAIL_SYSTEM_SENDER_USER_ID;
  if (!systemSender || !uuid.test(systemSender)) return;
  await enqueueMailCampaign({
    actor, senderUserId: systemSender, classSubjectId, type: "assessment", eventKey: `assessment:${assessmentId}`,
    subject: "Nova avaliação de {{disciplina}} — {{turma}}",
    body: `Olá, {{nome}}!\n\nUma nova avaliação foi registrada no SIFCAS.\n\nAvaliação: ${title}\nData: ${date}\nDisciplina: {{disciplina}}\nTurma: {{turma}}\n\nConsulte os detalhes em {{sifcas_url}}.\n\nEquipe SIFCAS`,
  });
}

export async function mailDashboard(userId: string) {
  const admin = mailAdmin();
  const [connection, campaigns] = await Promise.all([
    getGoogleConnection(userId),
    admin.from("sifcas_mail_campaigns").select("id,category,subject_template,created_at,scheduled_for").eq("created_by", userId).order("created_at", { ascending: false }).limit(12),
  ]);
  if (campaigns.error) throw campaigns.error;
  const ids = (campaigns.data ?? []).map((row) => row.id);
  const deliveries = ids.length ? await admin.from("sifcas_mail_deliveries").select("campaign_id,status").in("campaign_id", ids).limit(2000) : { data: [], error: null };
  if (deliveries.error) throw deliveries.error;
  return {
    connectedEmail: connection?.email ?? null,
    campaigns: (campaigns.data ?? []).map((row) => {
      const statuses = (deliveries.data ?? []).filter((delivery) => delivery.campaign_id === row.id);
      return { ...row, sent: statuses.filter((delivery) => delivery.status === "sent").length, pending: statuses.filter((delivery) => ["queued", "sending"].includes(delivery.status)).length, failed: statuses.filter((delivery) => delivery.status === "failed").length };
    }),
  };
}

export async function processMailQueue(senderUserId?: string, batchSize = MAIL_BATCH_SIZE) {
  const admin = mailAdmin();
  const now = new Date();
  const claimedBefore = new Date(now.getTime() - 30 * 60_000).toISOString();
  // A stopped function can leave a claimed message behind. Retrying may very rarely duplicate an email.
  await admin.from("sifcas_mail_deliveries").update({ status: "queued" }).eq("status", "sending").lt("claimed_at", claimedBefore);
  let query = admin.from("sifcas_mail_deliveries").select("id,sender_user_id,to_email,subject,body,attempts")
    .eq("status", "queued").lte("next_attempt_at", now.toISOString()).order("next_attempt_at").limit(Math.min(batchSize * 4, 100));
  if (senderUserId) query = query.eq("sender_user_id", senderUserId);
  const { data: queued, error } = await query;
  if (error) throw error;
  const sentCounts = new Map<string, number>();
  const connections = new Map<string, Awaited<ReturnType<typeof getGoogleConnection>>>();
  let sent = 0;
  let failed = 0;
  for (const candidate of queued ?? []) {
    if (sent + failed >= batchSize) break;
    let count = sentCounts.get(candidate.sender_user_id);
    if (count === undefined) {
      const { count: last24h, error: countError } = await admin.from("sifcas_mail_deliveries")
        .select("id", { count: "exact", head: true }).eq("sender_user_id", candidate.sender_user_id).eq("status", "sent")
        .gte("sent_at", new Date(now.getTime() - 86_400_000).toISOString());
      if (countError) throw countError;
      count = last24h ?? 0;
    }
    if (count >= MAIL_DAILY_SAFETY_LIMIT) continue;
    const { data: claimed, error: claimError } = await admin.from("sifcas_mail_deliveries")
      .update({ status: "sending", claimed_at: new Date().toISOString(), attempts: candidate.attempts + 1 })
      .eq("id", candidate.id).eq("status", "queued").lte("next_attempt_at", new Date().toISOString()).select("id").maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) continue;
    try {
      if (!connections.has(candidate.sender_user_id)) connections.set(candidate.sender_user_id, await getGoogleConnection(candidate.sender_user_id));
      const connection = connections.get(candidate.sender_user_id);
      if (!connection) throw new Error("Conta Gmail desconectada.");
      const messageId = await sendGoogleMail(connection, candidate);
      const { error: updateError } = await admin.from("sifcas_mail_deliveries").update({ status: "sent", sent_at: new Date().toISOString(), gmail_message_id: messageId, last_error: null }).eq("id", candidate.id).eq("status", "sending");
      if (updateError) throw updateError;
      sent++;
      count++;
      sentCounts.set(candidate.sender_user_id, count);
    } catch (cause) {
      failed++;
      const retry = candidate.attempts + 1 < 3;
      await admin.from("sifcas_mail_deliveries").update({ status: retry ? "queued" : "failed", next_attempt_at: new Date(Date.now() + 60 * 60_000).toISOString(), last_error: cause instanceof Error && /Gmail \(429\)/.test(cause.message) ? "Limite temporário do Gmail." : "Envio não confirmado. Reconecte a conta ou tente novamente." }).eq("id", candidate.id).eq("status", "sending");
    }
  }
  return { sent, failed, considered: queued?.length ?? 0 };
}
