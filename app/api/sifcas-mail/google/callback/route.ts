import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { exchangeGoogleCode, googleMailConfig } from "@/lib/sifcas-mail/google";
import { assertMailRole, saveGoogleConnection } from "@/lib/sifcas-mail/service";

export async function GET(request: NextRequest) {
  const { redirectUri } = googleMailConfig();
  const base = new URL(redirectUri).origin;
  const success = new URL("/sifcas-mail?message=Conta%20Google%20conectada%20com%20sucesso.", base);
  const failure = new URL("/sifcas-mail?error=Conex%C3%A3o%20n%C3%A3o%20conclu%C3%ADda.%20Tente%20novamente.", base);
  let destination = failure;
  try {
    const account = await getCurrentAccount();
    if (!account) throw new Error("Sessão expirada.");
    assertMailRole(account);
    const cookie = request.cookies.get("sifcas-mail-oauth-state")?.value ?? "";
    const [boundUserId, expected] = cookie.split(".");
    const state = request.nextUrl.searchParams.get("state") ?? "";
    const code = request.nextUrl.searchParams.get("code") ?? "";
    if (!state || !expected || !code || boundUserId !== account.id || Buffer.byteLength(state) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) {
      throw new Error("Estado OAuth inválido ou expirado.");
    }
    const identity = await exchangeGoogleCode(code);
    await saveGoogleConnection(account.id, identity.email, identity.refreshToken);
    destination = success;
  } catch {
    // Never expose authorization codes or Google OAuth error bodies in redirects.
  }
  const response = NextResponse.redirect(destination);
  response.cookies.set("sifcas-mail-oauth-state", "", { path: "/api/sifcas-mail/google", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0 });
  return response;
}
