import { BookOpen, BookOpenCheck, CalendarClock, CalendarRange, Clock3, GraduationCap, School, UsersRound } from "lucide-react";
import { ModuleCard, PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { getAcademicOverview } from "@/lib/academic";

export default async function EnsinoPage() {
  const account = await requireAccount();
  const overview = await getAcademicOverview();

  return <>
    <PageHeader
      title="Ensino"
      description="Núcleo acadêmico conectado ao banco do SIFCAS: campi, cursos, disciplinas, turmas, matrículas, diário e vínculos docentes."
      action={<span className="badge">Base acadêmica ativa</span>}
    />

    <div className="statGrid">
      <StatCard label="Campi ativos" value={String(overview.campusCount)} foot="Unidades cadastradas" icon={School}/>
      <StatCard label="Cursos ativos" value={String(overview.courseCount)} foot="Catálogo acadêmico" icon={GraduationCap}/>
      <StatCard label="Disciplinas" value={String(overview.subjectCount)} foot="Componentes curriculares" icon={BookOpen}/>
      <StatCard label="Turmas ativas" value={String(overview.classCount)} foot={overview.enrollmentCount + " matrículas ativas"} icon={UsersRound}/>
    </div>

    <SectionTitle title="Estrutura acadêmica" description="Os módulos abaixo utilizam a fundação de dados e permissões do SIFCAS."/>
    <div className="moduleGrid">
      <ModuleCard title="Cursos e matrizes" description="Cursos e componentes curriculares organizados por campus." icon={GraduationCap} badge="banco real"/>
      <ModuleCard title="Turmas e vínculos" description="Turmas, disciplinas ofertadas, matrículas e professores vinculados." icon={UsersRound} badge="RBAC + RLS"/>
      <ModuleCard title="Períodos letivos" description="Períodos acadêmicos associados a cada unidade." icon={CalendarRange} badge="estrutura"/>
      <ModuleCard title="Agenda das turmas" description="Planejamento publicado por professores e exibido somente aos vínculos autorizados." icon={CalendarRange} badge="funcional" href="/agenda-aluno"/>
      <ModuleCard title="Agenda de Defesas de TCC" description="Defesas, bancas, horários, locais e resultados." icon={CalendarClock} badge="funcional" href="/tcc"/>
      <ModuleCard title="Diário do Professor" description="Conteúdo ministrado, chamada, avaliações e lançamento de notas por turma." icon={BookOpenCheck} badge={account.role === "teacher" || account.role === "manager" || account.role === "admin" ? "funcional" : "acesso docente"} href="/diario-professor"/>
      <ModuleCard title="Boletim e frequência" description="Visão do estudante calculada a partir dos lançamentos feitos no diário." icon={BookOpen} badge="funcional" href="/boletim"/>
      {account.role === "student" && <ModuleCard title="Minhas disciplinas" description="Componentes curriculares, códigos e carga horária." icon={BookOpen} badge="aluno" href="/disciplinas"/>}
      {account.role === "student" && <ModuleCard title="Locais e horários de aula" description="Grade semanal, salas e horários cadastrados." icon={Clock3} badge="aluno" href="/horarios"/>}
      {account.role === "student" && <ModuleCard title="Minhas avaliações" description="Provas, trabalhos e atividades avaliativas." icon={CalendarClock} badge="aluno" href="/avaliacoes"/>}
    </div>

    <SectionTitle title="Campi cadastrados" description="Unidades disponíveis na base acadêmica."/>
    <section className="card panel">
      {overview.campuses.length === 0 ? <div className="infoBox">Nenhum campus cadastrado.</div> : <div className="stackList">
        {overview.campuses.map((campus) => <div key={campus.id}>
          <b>{campus.name}</b>
          <span>{campus.code} • {campus.city}/{campus.state}</span>
        </div>)}
      </div>}
    </section>

    <div className="infoBox" style={{ marginTop: 18 }}>
      Notas e frequência permanecem vazias até que professores autorizados façam lançamentos reais no Diário do Professor.
    </div>
  </>;
}
