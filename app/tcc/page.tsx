import { CalendarClock, GraduationCap, MapPin, UsersRound } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listTccDefenses } from "@/lib/integrated-modules";
import { createClient } from "@/lib/supabase/server";
import { createTccDefense, updateTccDefense } from "./actions";

type Params=Promise<{message?:string;error?:string}>;
const statusLabels:Record<string,string>={scheduled:"Agendada",completed:"Concluída",cancelled:"Cancelada"};

function fmt(value:string){return new Intl.DateTimeFormat("pt-BR",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Cuiaba"}).format(new Date(value));}

export default async function TccPage({searchParams}:{searchParams:Params}){
  const account=await requireAccount();
  const params=await searchParams;
  const canManage=["teacher","manager","admin"].includes(account.role);
  const [{defenses,profiles,courses},options]=await Promise.all([
    listTccDefenses(),
    canManage?(async()=>{
      const supabase=await createClient();
      const coursesResult=await supabase.from("courses").select("id,name,code").eq("active",true).order("name").limit(100);
      if(account.role==="teacher"){
        const students=await supabase.from("profiles").select("id,full_name,institutional_email").neq("id",account.id).order("full_name").limit(200);
        return {students:students.data??[],courses:coursesResult.data??[]};
      }
      const studentRoles=await supabase.from("user_roles").select("user_id").eq("role","student").limit(300);
      const studentIds=(studentRoles.data??[]).map(row=>row.user_id);
      const students=studentIds.length
        ? await supabase.from("profiles").select("id,full_name,institutional_email").in("id",studentIds).order("full_name")
        : {data:[],error:null};
      return {students:students.data??[],courses:coursesResult.data??[]};
    })():Promise.resolve({students:[],courses:[]}),
  ]);
  const profileMap=new Map(profiles.map((p:any)=>[p.id,p.full_name||p.institutional_email||"Usuário"]));
  const courseMap=new Map(courses.map((c:any)=>[c.id,c.name]));
  const upcoming=defenses.filter(d=>d.status==="scheduled"&&new Date(d.scheduled_at)>=new Date());

  return <>
    <PageHeader title="Agenda de Defesas de TCC" description="Calendário de apresentações, bancas, locais e resultados de trabalhos de conclusão." action={<span className="badge">Ensino</span>}/>
    {params.message&&<div className="infoBox successBox">{params.message}</div>}
    {params.error&&<div className="infoBox errorBox">{params.error}</div>}
    <div className="statGrid">
      <StatCard label="Próximas defesas" value={String(upcoming.length)} foot="Agendadas" icon={CalendarClock}/>
      <StatCard label="Concluídas" value={String(defenses.filter(d=>d.status==="completed").length)} foot="Histórico" icon={GraduationCap}/>
      <StatCard label="Cursos envolvidos" value={String(new Set(defenses.map(d=>d.course_id).filter(Boolean)).size)} foot="Com defesas registradas" icon={UsersRound}/>
      <StatCard label="Locais" value={String(new Set(defenses.map(d=>d.room).filter(Boolean)).size)} foot="Salas/ambientes" icon={MapPin}/>
    </div>

    {canManage&&<>
      <SectionTitle title="Agendar defesa" description="Professor, gestor ou ADM pode cadastrar a banca e o horário."/>
      <form action={createTccDefense} className="card panel formStack">
        <label>Título do trabalho<input name="title" minLength={3} maxLength={300} required/></label>
        <label>Resumo<textarea name="summary" rows={4} maxLength={8000}/></label>
        <div className="formRow2">
          <label>Estudante<select name="studentId" defaultValue=""><option value="">Não vincular agora</option>{options.students.map((s:any)=><option key={s.id} value={s.id}>{s.full_name||s.institutional_email||s.id}</option>)}</select></label>
          <label>Curso<select name="courseId" defaultValue=""><option value="">Não vincular agora</option>{options.courses.map((c:any)=><option key={c.id} value={c.id}>{c.code} • {c.name}</option>)}</select></label>
        </div>
        <div className="formRow2"><label>Data e hora<input type="datetime-local" name="scheduledAt" required/></label><label>Local<input name="room" maxLength={180} placeholder="Ex.: Auditório 1"/></label></div>
        <label>Banca (um nome por linha)<textarea name="panelMembers" rows={4} placeholder={"Prof. A\nProf. B\nProf. C"}/></label>
        <button className="button primary" type="submit">Agendar defesa</button>
      </form>
    </>}

    <SectionTitle title="Agenda" description="Defesas registradas no SIFCAS."/>
    <div className="tccGrid">
      {defenses.length===0&&<div className="infoBox">Nenhuma defesa cadastrada.</div>}
      {defenses.map(defense=><article className="card tccCard" key={defense.id}>
        <div className="requestHead"><div><span className="badge">{statusLabels[defense.status]??defense.status}</span><h3>{defense.title}</h3><small>{fmt(defense.scheduled_at)}{defense.room?" • "+defense.room:""}</small></div></div>
        <p className="requestBody">{defense.summary||"Sem resumo cadastrado."}</p>
        <div className="requestMeta">
          {defense.student_user_id&&<span className="badge">Aluno: {profileMap.get(defense.student_user_id)??"Vinculado"}</span>}
          {defense.course_id&&<span className="badge">Curso: {courseMap.get(defense.course_id)??"Vinculado"}</span>}
          {defense.advisor_user_id&&<span className="badge">Orientador: {profileMap.get(defense.advisor_user_id)??"Vinculado"}</span>}
        </div>
        {defense.panel_members.length>0&&<div className="infoBox"><b>Banca:</b> {defense.panel_members.join(" • ")}</div>}
        {defense.result&&<div className="infoBox successBox"><b>Resultado:</b> {defense.result}</div>}
        {canManage&&<form action={updateTccDefense} className="formStack requestManager"><input type="hidden" name="id" value={defense.id}/><label>Status<select name="status" defaultValue={defense.status}><option value="scheduled">Agendada</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option></select></label><label>Resultado/observação<textarea name="result" rows={3} maxLength={4000} defaultValue={defense.result}/></label><button className="button soft" type="submit">Salvar</button></form>}
      </article>)}
    </div>
  </>;
}
