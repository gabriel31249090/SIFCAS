import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { googleMailConfig } from "@/lib/sifcas-mail/google";
import { assertMailRole, mailConfigured } from "@/lib/sifcas-mail/service";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "https://sifcas.vercel.app"));
  try {
    assertMailRole(account);
    if (!mailConfigured()) throw new Error("Configuração pendente.");
    const { clientId, redirectUri } = googleMailConfig();
    const state = randomBytes(32).toString("base64url");
    const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorization.search = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri, response_type: "code", access_type: "offline", prompt: "consent",
      scope: "openid email https://www.googleapis.com/auth/gmail.send", state,
    }).toString();
    const response = NextResponse.redirect(authorization);
    response.cookies.set("sifcas-mail-oauth-state", `${account.id}.${state}`, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/sifcas-mail/google", maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/sifcas-mail?error=Conex%C3%A3o%20Google%20indispon%C3%ADvel.", process.env.NEXT_PUBLIC_SITE_URL ?? "https://sifcas.vercel.app"));
  }
}
