"use client";
import { usePathname } from "next/navigation";
import { moduleCatalog } from "@/lib/module-catalog";
export function PageLocation() {
  const pathname = usePathname();
  const page = moduleCatalog.find((item) => item.href === pathname);
  return <div className="pageLocation"><small>{page?.group ?? "SIFCAS"}</small><strong>{pathname === "/aplicativos" ? "Aplicativos" : page?.label ?? "Campus Cáceres"}</strong></div>;
}
