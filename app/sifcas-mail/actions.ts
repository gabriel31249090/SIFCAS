"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { assertMailRole, enqueueMailCampaign, processMailQueue, removeGoogleConnection } from "@/lib/sifcas-mail/service";
import { safeMailError } from "@/lib/sifcas-mail/templates";

function mailRedirect(kind: "error" | "message", message: string): never {
  redirect(`/sifcas-mail?${kind}=${encodeURIComponent(message)}`);
}

export async function queueMail(formData: FormData) {
  const account = await requireAccount();
  assertMailRole(account);
  let message: string;
  try {
    const classSubjectId = String(formData.get("classSubjectId") ?? "").trim();
    const subject = String(formData.get("subject") ?? "");
    const body = String(formData.get("body") ?? "");
    const schedule = String(formData.get("schedule") ?? "");
    const result = await enqueueMailCampaign({ actor: account, senderUserId: account.id, classSubjectId, subject, body, schedule });
    // Small synchronous batch; remaining recipients are processed by the daily cron
    // or by the authenticated manual queue button.
    const processing = await processMailQueue(account.id, 5);
    revalidatePath("/sifcas-mail");
    message = `${result.recipients} mensagens criadas (${result.omitted} alunos sem e-mail autorizado). ${processing.sent} envio(s) confirmado(s) agora; demais mensagens permanecem na fila.`;
  } catch (error) {
    mailRedirect("error", safeMailError(error));
  }
  mailRedirect("message", message);
}

export async function processMyMail() {
  const account = await requireAccount();
  assertMailRole(account);
  let message: string;
  try {
    const result = await processMailQueue(account.id);
    revalidatePath("/sifcas-mail");
    message = `${result.sent} mensagem(ns) enviada(s); ${result.failed} tentativa(s) não confirmada(s).`;
  } catch (error) {
    mailRedirect("error", safeMailError(error));
  }
  mailRedirect("message", message);
}

export async function disconnectMyGoogle() {
  const account = await requireAccount();
  assertMailRole(account);
  try {
    await removeGoogleConnection(account.id);
    revalidatePath("/sifcas-mail");
  } catch (error) {
    mailRedirect("error", safeMailError(error));
  }
  mailRedirect("message", "A conexão Google foi removida. Os e-mails pendentes não serão enviados por essa conta até nova autorização.");
}
