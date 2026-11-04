import type { ReactNode } from "react";
import { getCurrentAccount } from "@/lib/auth";
import { Topbar } from "./Topbar";
import { AppChrome } from "./AppChrome";
export async function AppShell({ children }: { children: ReactNode }) {
  const account = await getCurrentAccount();
  const role = account?.accountStatus === "active" ? account.role : null;
  return <AppChrome role={role} accountId={account?.id ?? null} topbar={<Topbar />}>{children}</AppChrome>;
}
