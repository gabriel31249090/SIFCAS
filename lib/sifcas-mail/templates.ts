export const MAIL_MAX_RECIPIENTS = 100;
export const MAIL_DAILY_SAFETY_LIMIT = 70;
export const MAIL_BATCH_SIZE = 15;

export const MAIL_VARIABLES = ["nome", "turma", "disciplina", "professor", "data", "sifcas_url"] as const;
export type MailVariables = Record<(typeof MAIL_VARIABLES)[number], string>;

export class MailValidationError extends Error {}

export function validateMailTemplate(subject: string, body: string) {
  const cleanSubject = subject.trim();
  const cleanBody = body.trim();
  if (cleanSubject.length < 3 || cleanSubject.length > 150 || /[\r\n\x00-\x1f\x7f]/.test(cleanSubject)) {
    throw new MailValidationError("O assunto deve ter de 3 a 150 caracteres, em uma linha.");
  }
  if (cleanBody.length < 10 || cleanBody.length > 5000 || /\x00/.test(cleanBody)) {
    throw new MailValidationError("A mensagem deve ter de 10 a 5.000 caracteres.");
  }
  const placeholders = `${cleanSubject} ${cleanBody}`.match(/{{\s*([^{}]+?)\s*}}/g) ?? [];
  for (const placeholder of placeholders) {
    const key = placeholder.replace(/[{}\s]/g, "");
    if (!(MAIL_VARIABLES as readonly string[]).includes(key)) {
      throw new MailValidationError(`Variável não permitida: ${placeholder}.`);
    }
  }
  if (/{{|}}/.test(`${cleanSubject} ${cleanBody}`.replace(/{{\s*(nome|turma|disciplina|professor|data|sifcas_url)\s*}}/g, ""))) {
    throw new MailValidationError("Há uma variável incompleta na mensagem.");
  }
  return { subject: cleanSubject, body: cleanBody };
}

export function renderMailTemplate(template: string, values: MailVariables) {
  return template.replace(/{{\s*(nome|turma|disciplina|professor|data|sifcas_url)\s*}}/g, (_, key: keyof MailVariables) => values[key]);
}

export function isMailAddress(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s<>@\x00-\x1f]+@[^\s<>@\x00-\x1f]+\.[^\s<>@\x00-\x1f]+$/.test(value);
}

export function parseMailSchedule(raw: string, now = new Date()) {
  if (!raw.trim()) return now.toISOString();
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
    throw new MailValidationError("Informe data e hora válidas para o agendamento.");
  }
  // Cáceres/MT observes UTC-4, without daylight-saving time.
  const date = new Date(`${raw}:00-04:00`);
  if (Number.isNaN(date.getTime()) || date.getTime() < now.getTime() - 60_000 || date.getTime() > now.getTime() + 30 * 86_400_000) {
    throw new MailValidationError("Agende um horário entre agora e os próximos 30 dias.");
  }
  return date.toISOString();
}

export function safeMailError(error: unknown) {
  return error instanceof MailValidationError ? error.message : "Não foi possível concluir a operação do SIFCAS Mail.";
}
