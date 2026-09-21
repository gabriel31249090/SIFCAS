import { LayoutDashboard, Sparkles, ListTodo, GraduationCap, BookOpenCheck, CalendarDays, ChartNoAxesCombined, Clock3, Files, PanelsTopLeft, MessagesSquare, CircleHelp, Bookmark, Compass, Workflow, BriefcaseBusiness, HeartHandshake, Microscope, Newspaper, Megaphone, School, Search, UserRound, Bell, Settings2, UsersRound, ClipboardCheck, Activity, ShieldCheck, Bug } from "lucide-react";
import type { ModuleIconName } from "@/lib/module-catalog";

const icons = { home: LayoutDashboard, assistant: Sparkles, tasks: ListTodo, student: GraduationCap, book: BookOpenCheck, calendar: CalendarDays, grades: ChartNoAxesCombined, clock: Clock3, file: Files, services: PanelsTopLeft, request: MessagesSquare, help: CircleHelp, link: Bookmark, compass: Compass, process: Workflow, briefcase: BriefcaseBusiness, heart: HeartHandshake, research: Microscope, news: Newspaper, notice: Megaphone, campus: School, search: Search, profile: UserRound, bell: Bell, settings: Settings2, users: UsersRound, audit: ClipboardCheck, activity: Activity, shield: ShieldCheck, bug: Bug };
export function ModuleIcon({ name, size = 22 }: { name: ModuleIconName; size?: number }) {
  const Icon = icons[name];
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
