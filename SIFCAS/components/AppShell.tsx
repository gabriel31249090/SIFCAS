import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="appShell"><Sidebar/><div className="appMain"><Topbar/><main className="pageContainer">{children}</main></div></div>;
}
