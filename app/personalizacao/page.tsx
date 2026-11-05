import { requireAccount } from "@/lib/auth";
import { StudentExperienceSettings } from "@/components/StudentExperienceSettings";

export default async function PersonalizacaoPage() {
  const account = await requireAccount();
  return <StudentExperienceSettings role={account.role} />;
}
