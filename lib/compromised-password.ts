import { createHash } from "node:crypto";
import { newPasswordError } from "./password-policy.ts";

export const BREACHED_PASSWORD_MESSAGE =
  "Essa senha foi encontrada em vazamentos conhecidos. Escolha outra senha exclusiva.";
export const PASSWORD_CHECK_UNAVAILABLE_MESSAGE =
  "Não foi possível verificar vazamentos de senha agora. Tente novamente em instantes.";

const COMMON_PATTERNS = [
  /^(.)\1{11,}$/u,
  /^(?:1234567890|0123456789|123456789|12345678)+$/u,
  /^(?:senha|password|qwerty|admin|letmein)[0-9!@#._-]*$/iu,
];

export function rangeHasPassword(sha1: string, response: string): boolean {
  const hash = sha1.toUpperCase();
  if (!/^[A-F0-9]{40}$/.test(hash) || response.length > 100_000) return false;
  const suffix = hash.slice(5);
  return response.split(/\r?\n/).some((line) => {
    const [candidate, count] = line.split(":");
    return candidate?.toUpperCase() === suffix && /^[0-9]+$/.test(count ?? "") && Number(count) > 0;
  });
}

/** Password check runs only after submission, server-side, with HIBP k-anonymity.
 * Never transmit a password or its complete hash; only the 5-character SHA-1 prefix.
 * The service is free and does not require a subscription or API key.
 */
export async function validateNewPassword(
  password: string,
  request: typeof fetch = fetch,
): Promise<string | null> {
  const basicError = newPasswordError(password);
  if (basicError) return basicError;

  if (COMMON_PATTERNS.some((pattern) => pattern.test(password))) return BREACHED_PASSWORD_MESSAGE;

  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  try {
    const response = await request(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`, {
      method: "GET",
      headers: {
        "Add-Padding": "true",
        "User-Agent": "SIFCAS/1.0 Password Security",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return PASSWORD_CHECK_UNAVAILABLE_MESSAGE;
    const body = await response.text();
    if (body.length > 100_000) return PASSWORD_CHECK_UNAVAILABLE_MESSAGE;
    return rangeHasPassword(sha1, body) ? BREACHED_PASSWORD_MESSAGE : null;
  } catch {
    // Fail closed for NEW passwords, without modifying existing users' login.
    return PASSWORD_CHECK_UNAVAILABLE_MESSAGE;
  }
}
