import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { isMailAddress } from "./templates";

const GOOGLE_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export function googleMailConfig() {
  const clientId = process.env.SIFCAS_MAIL_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.SIFCAS_MAIL_GOOGLE_CLIENT_SECRET;
  const publicUrl = process.env.SIFCAS_MAIL_PUBLIC_URL;
  if (!clientId || !clientSecret || !publicUrl) throw new Error("A conexão Google do SIFCAS Mail não foi configurada.");
  const url = new URL(publicUrl);
  if (!['https:', 'http:'].includes(url.protocol) || (url.protocol !== "https:" && url.hostname !== "localhost")) throw new Error("URL pública do SIFCAS Mail inválida.");
  return { clientId, clientSecret, redirectUri: new URL("/api/sifcas-mail/google/callback", url).toString() };
}

function encryptionKey() {
  const raw = process.env.SIFCAS_MAIL_TOKEN_KEY ?? "";
  const key = Buffer.from(raw, "base64url");
  if (key.length !== 32) throw new Error("SIFCAS_MAIL_TOKEN_KEY deve conter 32 bytes codificados em base64url.");
  return key;
}

export function encryptRefreshToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptRefreshToken(token: string) {
  const [version, iv, tag, body] = token.split(".");
  if (version !== "v1" || !iv || !tag || !body) throw new Error("Credencial Google inválida.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}

type GoogleTokenResponse = { access_token?: string; refresh_token?: string; scope?: string };

async function tokenRequest(params: URLSearchParams): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params,
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("O Google não autorizou a conexão de e-mail.");
  return await response.json() as GoogleTokenResponse;
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = googleMailConfig();
  const tokens = await tokenRequest(new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }));
  if (!tokens.access_token || !tokens.scope?.split(" ").includes(GOOGLE_SEND_SCOPE)) throw new Error("A permissão de envio de e-mails não foi autorizada.");
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Não foi possível verificar a conta Google.");
  const identity = await response.json() as { email?: string; email_verified?: boolean };
  if (!identity.email_verified || !isMailAddress(identity.email)) throw new Error("A conta Google precisa ter um e-mail verificado.");
  return { email: identity.email.toLowerCase(), refreshToken: tokens.refresh_token };
}

async function googleAccessToken(encryptedToken: string) {
  const { clientId, clientSecret } = googleMailConfig();
  const tokens = await tokenRequest(new URLSearchParams({ refresh_token: decryptRefreshToken(encryptedToken), client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" }));
  if (!tokens.access_token) throw new Error("Reconecte a conta Google para continuar enviando.");
  return tokens.access_token;
}

function encodeMimeContent(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function composeGoogleMessage(input: { from: string; to: string; subject: string; body: string; deliveryId: string }) {
  if (!isMailAddress(input.from) || !isMailAddress(input.to) || /[\r\n]/.test(input.subject)) throw new Error("Cabeçalho de e-mail inválido.");
  const boundary = `sifcas-${randomBytes(16).toString("hex")}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#12243b"><div style="padding:22px 26px;background:#e8f7ff;border-radius:14px 14px 0 0"><strong style="color:#1664a5">SIFCAS</strong><div style="font-size:13px;color:#385975">Comunicação escolar</div></div><div style="padding:24px 26px;border:1px solid #dfebf3;border-top:0;border-radius:0 0 14px 14px;line-height:1.65;white-space:pre-wrap">${escapeHtml(input.body)}</div></div>`;
  const lines = [
    `From: SIFCAS Mail <${input.from}>`, `To: ${input.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`,
    `Message-ID: <sifcas-${input.deliveryId}@mail.sifcas.local>`,
    "MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary="${boundary}"`, "",
    `--${boundary}`, 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", encodeMimeContent(input.body), "",
    `--${boundary}`, 'Content-Type: text/html; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", encodeMimeContent(html), "",
    `--${boundary}--`, "",
  ];
  return Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
}

export async function sendGoogleMail(connection: { email: string; refresh_token_ciphertext: string }, delivery: { id: string; to_email: string; subject: string; body: string }) {
  const token = await googleAccessToken(connection.refresh_token_ciphertext);
  const raw = composeGoogleMessage({ from: connection.email, to: delivery.to_email, subject: delivery.subject, body: delivery.body, deliveryId: delivery.id });
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }), cache: "no-store", signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Falha de envio pelo Gmail (${response.status}).`);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error("O Gmail não confirmou o identificador do envio.");
  return result.id;
}
