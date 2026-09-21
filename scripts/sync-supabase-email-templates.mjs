import { readFile } from "node:fs/promises";
import process from "node:process";

const manifestUrl = new URL("../supabase/email-templates.json", import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const entries = await Promise.all(
  Object.entries(manifest.templates).map(async ([kind, template]) => {
    const content = await readFile(new URL(`../${template.contentPath}`, import.meta.url), "utf8");
    return [kind, { ...template, content }];
  }),
);
const templates = Object.fromEntries(entries);

const payload = {
  mailer_subjects_confirmation: templates.confirmation.subject,
  mailer_templates_confirmation_content: templates.confirmation.content,
  mailer_subjects_recovery: templates.recovery.subject,
  mailer_templates_recovery_content: templates.recovery.content,
};

if (!process.argv.includes("--apply")) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(0);
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const requestedProject = process.env.SUPABASE_PROJECT_REF ?? manifest.projectRef;

if (!accessToken) {
  throw new Error("SUPABASE_ACCESS_TOKEN não definido; nenhuma alteração foi enviada.");
}
if (requestedProject !== manifest.projectRef) {
  throw new Error(`Projeto recusado: esperado ${manifest.projectRef}, recebido ${requestedProject}.`);
}

const endpoint = `https://api.supabase.com/v1/projects/${manifest.projectRef}/config/auth`;
const response = await fetch(endpoint, {
  method: "PATCH",
  headers: {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const detail = (await response.text()).slice(0, 500);
  throw new Error(`Supabase recusou a atualização (${response.status}): ${detail}`);
}

const applied = await response.json();
for (const [key, expected] of Object.entries(payload)) {
  if (applied[key] !== expected) throw new Error(`A resposta do Supabase não confirmou ${key}.`);
}

process.stdout.write(`Templates de confirmação e recuperação aplicados em ${manifest.projectRef}.\n`);
