import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

type AppRole = "student" | "teacher" | "staff" | "manager" | "admin";

const PUBLIC_PREFIXES = [
  "/login",
  "/auth",
  "/api/health",
  "/recuperar-senha",
  "/noticias",
  "/editais",
  "/agenda-institucional",
  "/transparencia",
  "/campus",
  "/acesso-negado",
  "/verificar-documento",
  "/buscar",
  "/aplicativos",
  "/publicacoes",
];

const STAFF_PREFIXES = ["/administracao", "/pessoas", "/painel-institucional"];
const STAFF_ROLES: AppRole[] = ["staff", "manager", "admin"];
const MANAGEMENT_PREFIXES = ["/gestao-academica"];
const MANAGEMENT_ROLES: AppRole[] = ["manager", "admin"];
const DIARY_PREFIXES = ["/diario-professor"];
const DIARY_ROLES: AppRole[] = ["teacher", "manager", "admin"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectWithSession(request: NextRequest, response: NextResponse, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const pathname = request.nextUrl.pathname;

  if (!claims?.sub) {
    if (isPublic(pathname)) return response;
    const next = `${pathname}${request.nextUrl.search}`;
    return redirectWithSession(request, response, "/login", { next });
  }

  if (pathname === "/login" || pathname === "/recuperar-senha") {
    return redirectWithSession(request, response, "/");
  }

  const needsStaffRole = STAFF_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const needsManagementRole = MANAGEMENT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const needsDiaryRole = DIARY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (needsStaffRole || needsManagementRole || needsDiaryRole) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.sub)
      .maybeSingle();

    const role = (roleRow?.role ?? "student") as AppRole;
    if (needsManagementRole && !MANAGEMENT_ROLES.includes(role)) {
      return redirectWithSession(request, response, "/acesso-negado");
    }
    if (needsStaffRole && !STAFF_ROLES.includes(role)) {
      return redirectWithSession(request, response, "/acesso-negado");
    }
    if (needsDiaryRole && !DIARY_ROLES.includes(role)) {
      return redirectWithSession(request, response, "/acesso-negado");
    }
  }

  return response;
}
