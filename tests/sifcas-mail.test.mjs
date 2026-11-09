import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { isMailAddress, MAIL_BATCH_SIZE, MAIL_DAILY_SAFETY_LIMIT, MAIL_MAX_RECIPIENTS, parseMailSchedule, renderMailTemplate, validateMailTemplate } from "../lib/sifcas-mail/templates.ts";

test("SIFCAS Mail validates personalized templates before queueing", () => {
  assert.equal(validateMailTemplate("Lembrete {{turma}}", "Olá, {{nome}}! Consulte o SIFCAS.").subject, "Lembrete {{turma}}");
  const values = { nome: "Aluno Fictício", turma: "2º A", disciplina: "Física", professor: "Professor Exemplo", data: "12/11/2026", sifcas_url: "https://sifcas.vercel.app" };
  assert.equal(renderMailTemplate("Olá {{nome}} — {{turma}}", values), "Olá Aluno Fictício — 2º A");
  for (const invalid of ["{{senha}}", "{{nome", "{{nome}}\nBcc: intruso@example.com"]) {
    assert.throws(() => validateMailTemplate(invalid, "Mensagem válida para os estudantes."));
  }
  assert.ok(isMailAddress("aluno@ifmt.edu.br"));
  for (const bad of ["aluno@", "aluno\r\nBcc:evil@example.com", "sem arroba", "a b@example.com"]) assert.equal(isMailAddress(bad), false);
  assert.ok(MAIL_MAX_RECIPIENTS <= 100 && MAIL_BATCH_SIZE <= 20 && MAIL_DAILY_SAFETY_LIMIT < 100);
});

test("SIFCAS Mail schedules using the Cuiabá UTC offset and rejects distant dates", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  assert.equal(parseMailSchedule("2026-11-10T08:00", now), "2026-11-10T12:00:00.000Z");
  assert.throws(() => parseMailSchedule("2026-11-08T08:00", now));
  assert.throws(() => parseMailSchedule("2027-03-01T08:00", now));
  assert.throws(() => parseMailSchedule("2026-11-99T08:00", now));
});

test("isolated SIFCAS Mail schema hides OAuth secrets and delivery lists from browser roles", async () => {
  const db = new PGlite();
  try {
    await db.waitReady;
    await db.exec(readFileSync("supabase/isolated/academic-import.fixture.sql", "utf8"));
    await db.exec("create role service_role nologin bypassrls; grant usage on schema public to service_role");
    await db.exec(readFileSync("supabase/isolated/sifcas-mail.sql", "utf8"));
    const teacher = "10000000-0000-0000-0000-000000000001";
    const student = "10000000-0000-0000-0000-000000000003";
    const classSubject = "20000000-0000-0000-0000-000000000003";
    await db.query("insert into public.sifcas_mail_connections(user_id,email,refresh_token_ciphertext) values($1,'professor@example.invalid',$2)", [teacher, "v1." + "a".repeat(80)]);
    const campaign = await db.query("insert into public.sifcas_mail_campaigns(created_by,sender_user_id,class_subject_id,category,subject_template,body_template) values($1,$1,$2,'manual','Avaliação de Física','Mensagem privada para o estudante') returning id", [teacher, classSubject]);
    await db.query("insert into public.sifcas_mail_deliveries(campaign_id,sender_user_id,recipient_user_id,to_email,subject,body) values($1,$2,$3,'aluno@example.invalid','Avaliação','Mensagem individual de teste')", [campaign.rows[0].id, teacher, student]);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      for (const table of ["sifcas_mail_connections", "sifcas_mail_campaigns", "sifcas_mail_deliveries"]) {
        await assert.rejects(db.query(`select * from public.${table}`), /permission denied/i);
        await assert.rejects(db.query(`delete from public.${table}`), /permission denied/i);
      }
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    assert.equal((await db.query("select count(*)::int as total from public.sifcas_mail_deliveries")).rows[0].total, 1);
    await db.exec("reset role");
    await db.exec(readFileSync("supabase/isolated/sifcas-mail-rollback.sql", "utf8"));
    assert.equal((await db.query("select count(*)::int as total from public.enrollments")).rows[0].total, 2);
  } finally {
    await db.close();
  }
});
