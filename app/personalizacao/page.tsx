import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { StudentExperienceSettings } from "@/components/StudentExperienceSettings";

export default async function PersonalizacaoPage() {
  const account = await requireAccount();
  if (account.role !== "student") redirect("/acesso-negado");
  return <StudentExperienceSettings />;
}
