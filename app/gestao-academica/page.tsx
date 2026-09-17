import { redirect } from "next/navigation";
import { BookOpenCheck, CalendarClock, GraduationCap, School, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount, roleLabels } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  assignTeacher,
  attachSubjectToClass,
  createAcademicPeriod,
  createClass,
  createCourse,
  createSchedule,
  createSubject,
  enrollStudent,
  setUserRole,
} from "./actions";

const roleOptions = [
  ["student", "Estudante"],
  ["teacher", "Professor"],
  ["staff", "Servidor"],
  ["manager", "Gestor"],
  ["admin", "Administrador Geral"],
] as const;

const weekdayLabels: Record<number, string> = { 1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta", 6: "Sábado", 7: "Domingo" };

export default async function AcademicManagementPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const account = await requireAccount();
  if (!["manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const params = await searchParams;
  const supabase = await createClient();

  const [campusesRes, periodsRes, coursesRes, subjectsRes, classesRes, classSubjectsRes, schedulesRes, teachingRes, enrollmentsRes, profilesRes, rolesRes] = await Promise.all([
    supabase.from("campuses").select("id,name,city,state,code,active").order("name"),
    supabase.from("academic_periods").select("id,campus_id,name,year,term,status,starts_on,ends_on").order("year", { ascending: false }).order("term", { ascending: false }),
    supabase.from("courses").select("id,campus_id,code,name,level,shift,total_semesters,active").order("name"),
    supabase.from("subjects").select("id,course_id,code,name,workload_hours,semester,active").order("name"),
    supabase.from("classes").select("id,course_id,academic_period_id,code,name,shift,capacity,active").order("name"),
    supabase.from("class_subjects").select("id,class_id,subject_id,room,active").order("created_at", { ascending: false }),
    supabase.from("class_schedules").select("id,class_subject_id,weekday,starts_at,ends_at,room").order("weekday").order("starts_at"),
    supabase.from("teaching_assignments").select("id,class_subject_id,teacher_user_id,is_primary").order("created_at", { ascending: false }),
    supabase.from("enrollments").select("id,class_id,student_user_id,enrollment_number,status").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,full_name,institutional_email,campus").order("full_name"),
    supabase.from("user_roles").select("user_id,role"),
  ]);

  const campuses = campusesRes.data ?? [];
  const periods = periodsRes.data ?? [];
  const courses = coursesRes.data ?? [];
  const subjects = subjectsRes.data ?? [];
  const classes = classesRes.data ?? [];
  const classSubjects = classSubjectsRes.data ?? [];
  const schedules = schedulesRes.data ?? [];
  const teaching = teachingRes.data ?? [];
  const enrollments = enrollmentsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const roles = rolesRes.data ?? [];

  const campusMap = new Map(campuses.map((x) => [x.id, x]));
  const courseMap = new Map(courses.map((x) => [x.id, x]));
  const periodMap = new Map(periods.map((x) => [x.id, x]));
  const subjectMap = new Map(subjects.map((x) => [x.id, x]));
  const classMap = new Map(classes.map((x) => [x.id, x]));
  const classSubjectMap = new Map(classSubjects.map((x) => [x.id, x]));
  const profileMap = new Map(profiles.map((x) => [x.id, x]));
  const roleMap = new Map(roles.map((x) => [x.user_id, x.role]));

  const classSubjectLabel = (id: string) => {
    const link = classSubjectMap.get(id);
    if (!link) return "Vínculo removido";
    const turma = classMap.get(link.class_id);
    const disciplina = subjectMap.get(link.subject_id);
    return `${turma?.name ?? "Turma"} • ${disciplina?.name ?? "Disciplina"}`;
  };

  return <>
    <PageHeader
      title="Gestão Acadêmica"
      description="Painel central para montar a estrutura acadêmica do SIFCAS, atribuir papéis, vincular professores, matricular estudantes e definir horários."
      action={<span className="badge">{roleLabels[account.role]}</span>}
    />

    {params.message && <div className="infoBox successBox">{params.message}</div>}
    {params.error && <div className="infoBox errorBox">{params.error}</div>}

    <div className="statGrid adminStats">
      <StatCard label="Cursos" value={String(courses.length)} foot="Cadastrados" icon={GraduationCap}/>
      <StatCard label="Turmas" value={String(classes.length)} foot="Estrutura acadêmica" icon={UsersRound}/>
      <StatCard label="Professores vinculados" value={String(teaching.length)} foot="Vínculos ativos" icon={BookOpenCheck}/>
      <StatCard label="Matrículas" value={String(enrollments.filter((x) => x.status === "active").length)} foot="Ativas" icon={School}/>
    </div>

    <SectionTitle title="1. Estrutura acadêmica" description="Cadastre primeiro período, curso, disciplinas e turma."/>
    <div className="adminFormGrid">
      <section className="card adminFormCard">
        <h3>Período letivo</h3>
        <form className="formStack" action={createAcademicPeriod}>
          <label>Campus<select name="campusId" required defaultValue=""><option value="" disabled>Selecione</option>{campuses.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Nome<input name="name" required placeholder="Ex.: 2026/2"/></label>
          <div className="formRow"><label>Ano<input name="year" type="number" min="2020" max="2100" defaultValue="2026" required/></label><label>Período<select name="term" defaultValue="2"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label></div>
          <div className="formRow"><label>Início<input name="startsOn" type="date"/></label><label>Fim<input name="endsOn" type="date"/></label></div>
          <button className="button soft" type="submit">Criar período</button>
        </form>
      </section>

      <section className="card adminFormCard">
        <h3>Curso</h3>
        <form className="formStack" action={createCourse}>
          <label>Campus<select name="campusId" required defaultValue=""><option value="" disabled>Selecione</option>{campuses.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <div className="formRow"><label>Código<input name="code" required placeholder="INFO"/></label><label>Semestres<input name="totalSemesters" type="number" min="1" max="20"/></label></div>
          <label>Nome<input name="name" required placeholder="Técnico em Informática"/></label>
          <div className="formRow"><label>Nível<select name="level" defaultValue="technical"><option value="technical">Técnico</option><option value="integrated">Técnico integrado</option><option value="undergraduate">Graduação</option><option value="postgraduate">Pós-graduação</option></select></label><label>Turno<select name="shift" defaultValue="full_time"><option value="morning">Matutino</option><option value="afternoon">Vespertino</option><option value="evening">Noturno</option><option value="full_time">Integral</option></select></label></div>
          <button className="button soft" type="submit">Cadastrar curso</button>
        </form>
      </section>

      <section className="card adminFormCard">
        <h3>Disciplina</h3>
        <form className="formStack" action={createSubject}>
          <label>Curso<select name="courseId" required defaultValue=""><option value="" disabled>Selecione</option>{courses.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <div className="formRow"><label>Código<input name="code" required placeholder="MAT-02"/></label><label>Carga horária<input name="workloadHours" type="number" min="0" defaultValue="60"/></label></div>
          <label>Nome<input name="name" required placeholder="Matemática"/></label>
          <label>Semestre/Ano<input name="semester" type="number" min="1" max="20"/></label>
          <button className="button soft" type="submit">Cadastrar disciplina</button>
        </form>
      </section>

      <section className="card adminFormCard">
        <h3>Turma</h3>
        <form className="formStack" action={createClass}>
          <label>Curso<select name="courseId" required defaultValue=""><option value="" disabled>Selecione</option>{courses.map((x)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Período letivo<select name="academicPeriodId" required defaultValue=""><option value="" disabled>Selecione</option>{periods.map((x)=><option key={x.id} value={x.id}>{x.name} • {campusMap.get(x.campus_id)?.name}</option>)}</select></label>
          <div className="formRow"><label>Código<input name="code" required placeholder="2A-2026"/></label><label>Capacidade<input name="capacity" type="number" min="1" max="300"/></label></div>
          <label>Nome<input name="name" required placeholder="2º Ano A"/></label>
          <label>Turno<select name="shift" defaultValue="full_time"><option value="morning">Matutino</option><option value="afternoon">Vespertino</option><option value="evening">Noturno</option><option value="full_time">Integral</option></select></label>
          <button className="button soft" type="submit">Criar turma</button>
        </form>
      </section>
    </div>

    <SectionTitle title="2. Montagem das turmas" description="Associe disciplinas à turma e defina os horários semanais."/>
    <div className="adminFormGrid twoAdminForms">
      <section className="card adminFormCard">
        <h3>Vincular disciplina à turma</h3>
        <form className="formStack" action={attachSubjectToClass}>
          <label>Turma<select name="classId" required defaultValue=""><option value="" disabled>Selecione</option>{classes.map((x)=><option key={x.id} value={x.id}>{x.name} • {courseMap.get(x.course_id)?.name}</option>)}</select></label>
          <label>Disciplina<select name="subjectId" required defaultValue=""><option value="" disabled>Selecione</option>{subjects.map((x)=><option key={x.id} value={x.id}>{x.name} • {courseMap.get(x.course_id)?.name}</option>)}</select></label>
          <label>Sala padrão<input name="room" placeholder="Ex.: B-12"/></label>
          <button className="button soft" type="submit">Vincular disciplina</button>
        </form>
      </section>

      <section className="card adminFormCard">
        <h3>Adicionar horário</h3>
        <form className="formStack" action={createSchedule}>
          <label>Turma e disciplina<select name="classSubjectId" required defaultValue=""><option value="" disabled>Selecione</option>{classSubjects.map((x)=><option key={x.id} value={x.id}>{classSubjectLabel(x.id)}</option>)}</select></label>
          <label>Dia<select name="weekday" defaultValue="1">{Object.entries(weekdayLabels).map(([n,label])=><option key={n} value={n}>{label}</option>)}</select></label>
          <div className="formRow"><label>Início<input name="startsAt" type="time" required/></label><label>Fim<input name="endsAt" type="time" required/></label></div>
          <label>Sala<input name="room" placeholder="Opcional"/></label>
          <button className="button soft" type="submit">Adicionar horário</button>
        </form>
      </section>
    </div>

    <SectionTitle title="3. Pessoas e vínculos" description="Localize contas existentes pelo e-mail cadastrado no SIFCAS."/>
    <div className="adminFormGrid">
      {account.role === "admin" && <section className="card adminFormCard accentCard">
        <div className="adminCardTitle"><span className="iconBox"><ShieldCheck size={19}/></span><div><h3>Papéis de acesso</h3><small>Somente Administrador Geral</small></div></div>
        <form className="formStack" action={setUserRole}>
          <label>E-mail da conta<input name="email" type="email" required placeholder="usuario@exemplo.com"/></label>
          <label>Papel<select name="role" defaultValue="student">{roleOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <button className="button soft" type="submit">Atualizar papel</button>
        </form>
      </section>}

      <section className="card adminFormCard">
        <div className="adminCardTitle"><span className="iconBox"><UserRoundCog size={19}/></span><div><h3>Vínculo docente</h3><small>Professor → disciplina/turma</small></div></div>
        <form className="formStack" action={assignTeacher}>
          <label>Turma e disciplina<select name="classSubjectId" required defaultValue=""><option value="" disabled>Selecione</option>{classSubjects.map((x)=><option key={x.id} value={x.id}>{classSubjectLabel(x.id)}</option>)}</select></label>
          <label>E-mail do professor<input name="email" type="email" required placeholder="professor@exemplo.com"/></label>
          <button className="button soft" type="submit">Vincular professor</button>
        </form>
      </section>

      <section className="card adminFormCard">
        <div className="adminCardTitle"><span className="iconBox"><School size={19}/></span><div><h3>Matrícula</h3><small>Estudante → turma</small></div></div>
        <form className="formStack" action={enrollStudent}>
          <label>Turma<select name="classId" required defaultValue=""><option value="" disabled>Selecione</option>{classes.map((x)=><option key={x.id} value={x.id}>{x.name} • {courseMap.get(x.course_id)?.name}</option>)}</select></label>
          <label>E-mail do estudante<input name="email" type="email" required placeholder="aluno@exemplo.com"/></label>
          <label>Nº de matrícula<input name="enrollmentNumber" placeholder="Opcional"/></label>
          <button className="button soft" type="submit">Matricular estudante</button>
        </form>
      </section>
    </div>

    <SectionTitle title="Visão geral" description="Conferência rápida da estrutura já cadastrada."/>
    <div className="twoCols academicOverviewGrid">
      <section className="card panel">
        <h3>Turmas e disciplinas</h3>
        {classSubjects.length === 0 ? <div className="infoBox">Nenhuma disciplina foi vinculada a uma turma ainda.</div> : <div className="stackList">{classSubjects.slice(0,12).map((x)=><div key={x.id}><b>{classSubjectLabel(x.id)}</b><span>{x.room || "Sem sala"}</span></div>)}</div>}
      </section>
      <section className="card panel">
        <h3>Horários</h3>
        {schedules.length === 0 ? <div className="infoBox">Nenhum horário cadastrado.</div> : <div className="stackList">{schedules.slice(0,12).map((x)=><div key={x.id}><b>{weekdayLabels[x.weekday]} • {String(x.starts_at).slice(0,5)}–{String(x.ends_at).slice(0,5)}</b><span>{classSubjectLabel(x.class_subject_id)}</span></div>)}</div>}
      </section>
    </div>

    <SectionTitle title="Contas institucionais" description="Diretório visível apenas para gestão autorizada."/>
    <div className="card tableWrap">
      <table className="dataTable"><thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Campus</th></tr></thead><tbody>
        {profiles.length === 0 ? <tr><td colSpan={4}>Nenhuma conta encontrada.</td></tr> : profiles.map((p)=><tr key={p.id}><td>{p.full_name || "Sem nome"}</td><td>{p.institutional_email || "—"}</td><td>{roleLabels[(roleMap.get(p.id) ?? "student") as keyof typeof roleLabels]}</td><td>{p.campus || "—"}</td></tr>)}
      </tbody></table>
    </div>

    <SectionTitle title="Vínculos atuais" description="Professores e estudantes ligados à estrutura acadêmica."/>
    <div className="twoCols academicOverviewGrid">
      <section className="card panel"><div className="adminCardTitle"><span className="iconBox"><BookOpenCheck size={19}/></span><div><h3>Docentes</h3><small>{teaching.length} vínculos</small></div></div>{teaching.length===0?<div className="infoBox">Nenhum professor vinculado.</div>:<div className="stackList">{teaching.slice(0,15).map((x)=><div key={x.id}><b>{profileMap.get(x.teacher_user_id)?.full_name || profileMap.get(x.teacher_user_id)?.institutional_email || "Professor"}</b><span>{classSubjectLabel(x.class_subject_id)}</span></div>)}</div>}</section>
      <section className="card panel"><div className="adminCardTitle"><span className="iconBox"><CalendarClock size={19}/></span><div><h3>Estudantes</h3><small>{enrollments.length} matrículas</small></div></div>{enrollments.length===0?<div className="infoBox">Nenhum estudante matriculado.</div>:<div className="stackList">{enrollments.slice(0,15).map((x)=><div key={x.id}><b>{profileMap.get(x.student_user_id)?.full_name || profileMap.get(x.student_user_id)?.institutional_email || "Estudante"}</b><span>{classMap.get(x.class_id)?.name || "Turma"}</span></div>)}</div>}</section>
    </div>

    <div className="infoBox managementFootnote">Fluxo recomendado: período letivo → curso → disciplina → turma → vincular disciplinas → horários → definir papéis → professor/aluno → agenda da turma.</div>
  </>;
}
