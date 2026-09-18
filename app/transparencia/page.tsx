import Link from "next/link";
import { BadgeDollarSign, BookOpenCheck, CalendarClock, ChartNoAxesCombined, FlaskConical, GraduationCap, Landmark, Newspaper, School, Sprout } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { createClient } from "@/lib/supabase/server";

type Snapshot = {
  generated_at: string;
  campuses_active: number;
  courses_active: number;
  classes_active: number;
  enrollments_active: number;
  publications_public: number;
  editais_public: number;
  events_public: number;
  projects_visible: number;
  research_projects: number;
  extension_projects: number;
  tcc_scheduled: number;
  tcc_completed: number;
  internships_open: number;
  aid_programs_open: number;
};

const emptySnapshot: Snapshot = {
  generated_at: "",
  campuses_active: 0,
  courses_active: 0,
  classes_active: 0,
  enrollments_active: 0,
  publications_public: 0,
  editais_public: 0,
  events_public: 0,
  projects_visible: 0,
  research_projects: 0,
  extension_projects: 0,
  tcc_scheduled: 0,
  tcc_completed: 0,
  internships_open: 0,
  aid_programs_open: 0,
};

function formatGeneratedAt(value: string) {
  if (!value) return "agora";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

export default async function TransparencyPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_transparency_snapshot");
  const snapshot: Snapshot = !error && data && typeof data === "object" ? { ...emptySnapshot, ...(data as Partial<Snapshot>) } : emptySnapshot;

  return <>
    <PageHeader title="Transparência" description="Indicadores institucionais calculados diretamente a partir das bases do SIFCAS, sem dados pessoais identificáveis." action={<span className="badge">Atualizado {formatGeneratedAt(snapshot.generated_at)}</span>}/>

    {error && <div className="infoBox errorBox">Os indicadores detalhados estão temporariamente indisponíveis. Os canais públicos abaixo continuam acessíveis.</div>}

    <div className="statGrid">
      <StatCard label="Campi ativos" value={String(snapshot.campuses_active)} foot="Estrutura institucional" icon={School}/>
      <StatCard label="Cursos ativos" value={String(snapshot.courses_active)} foot={snapshot.classes_active + " turmas ativas"} icon={GraduationCap}/>
      <StatCard label="Matrículas ativas" value={String(snapshot.enrollments_active)} foot="Vínculos acadêmicos" icon={BookOpenCheck}/>
      <StatCard label="Publicações públicas" value={String(snapshot.publications_public)} foot={snapshot.editais_public + " editais • " + snapshot.events_public + " eventos"} icon={Newspaper}/>
    </div>

    <SectionTitle title="Ensino, pesquisa e extensão" description="Indicadores agregados, sem exposição de nomes, notas ou outros dados pessoais."/>
    <div className="statGrid">
      <StatCard label="Projetos institucionais" value={String(snapshot.projects_visible)} foot="Publicados, em execução ou concluídos" icon={ChartNoAxesCombined}/>
      <StatCard label="Pesquisa" value={String(snapshot.research_projects)} foot="Projetos visíveis" icon={FlaskConical}/>
      <StatCard label="Extensão" value={String(snapshot.extension_projects)} foot="Projetos visíveis" icon={Sprout}/>
      <StatCard label="Defesas de TCC" value={String(snapshot.tcc_scheduled)} foot={snapshot.tcc_completed + " concluídas"} icon={CalendarClock}/>
    </div>

    <SectionTitle title="Oportunidades abertas" description="Programas cadastrados e atualmente marcados como abertos no SIFCAS."/>
    <div className="statGrid">
      <StatCard label="Estágios" value={String(snapshot.internships_open)} foot="Oportunidades abertas" icon={Landmark}/>
      <StatCard label="Auxílios" value={String(snapshot.aid_programs_open)} foot="Programas com inscrição aberta" icon={BadgeDollarSign}/>
    </div>

    <SectionTitle title="Fontes públicas" description="Acesse os conteúdos que alimentam parte dos indicadores acima."/>
    <div className="quickGrid">
      <Link href="/noticias"><Newspaper/>Notícias e eventos</Link>
      <Link href="/editais"><BookOpenCheck/>Editais</Link>
      <Link href="/agenda-institucional"><CalendarClock/>Agenda institucional</Link>
      <Link href="/campus"><School/>Campus</Link>
      <Link href="/verificar-documento"><BookOpenCheck/>Verificar documento</Link>
    </div>

    <div className="infoBox" style={{ marginTop: 18 }}>
      Esta página publica somente totais e informações institucionais. Notas, frequência, documentos pessoais, solicitações e outros registros protegidos não entram nos indicadores públicos.
    </div>
  </>;
}
