import { FlaskConical, GraduationCap, Sprout, UsersRound } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listProjects } from "@/lib/integrated-modules";
import { applyProject, createInstitutionalProject, reviewProjectApplication, updateProjectStatus } from "./actions";

type Params=Promise<{message?:string;error?:string;eixo?:string}>;
const axisLabels:Record<string,string>={teaching:"Ensino",research:"Pesquisa",extension:"Extensão"};
const statusLabels:Record<string,string>={draft:"Rascunho",submitted:"Submetido",published:"Publicado",in_progress:"Em execução",completed:"Concluído",cancelled:"Cancelado"};
function date(v:string|null){return v?new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeZone:"America/Cuiaba"}).format(new Date(v+"T12:00:00-04:00")):"—";}

export default async function ProjectsPage({searchParams}:{searchParams:Params}){
  const account=await requireAccount();
  const params=await searchParams;
  const axis=["teaching","research","extension"].includes(params.eixo??"")?params.eixo:undefined;
  const {projects,applications,profiles}=await listProjects(account,axis);
  const canCreate=["teacher","staff","manager","admin"].includes(account.role);
  const canPublish=["manager","admin"].includes(account.role);
  const profileMap=new Map(profiles.map((p:any)=>[p.id,p.full_name||p.institutional_email||"Usuário"]));
  const myApps=new Map(applications.filter(a=>a.applicant_user_id===account.id).map(a=>[a.project_id,a]));
  const visibleApps=applications.filter(a=>projects.some(p=>p.id===a.project_id&&(p.leader_user_id===account.id||canPublish)));

  return <>
    <PageHeader title="Projetos Institucionais" description="Ensino, Pesquisa e Extensão em uma mesma estrutura, com submissão, publicação e candidaturas." action={<div className="heroActions"><a className="button soft" href="/projetos">Todos</a><a className="button soft" href="/projetos?eixo=research">Pesquisa</a><a className="button soft" href="/projetos?eixo=extension">Extensão</a></div>}/>
    {params.message&&<div className="infoBox successBox">{params.message}</div>}
    {params.error&&<div className="infoBox errorBox">{params.error}</div>}
    <div className="statGrid">
      <StatCard label="Projetos visíveis" value={String(projects.length)} foot={axis?axisLabels[axis]:"Todos os eixos"} icon={FlaskConical}/>
      <StatCard label="Em execução" value={String(projects.filter(p=>p.status==="in_progress").length)} foot="Ativos" icon={Sprout}/>
      <StatCard label="Com vagas" value={String(projects.filter(p=>p.open_for_applications&&["published","in_progress"].includes(p.status)).length)} foot="Aceitando estudantes" icon={UsersRound}/>
      <StatCard label="Candidaturas" value={String(account.role==="student"?applications.filter(a=>a.applicant_user_id===account.id).length:visibleApps.length)} foot="Registradas" icon={GraduationCap}/>
    </div>

    {canCreate&&<>
      <SectionTitle title="Novo projeto" description="Docentes e servidores podem preparar projetos; publicação institucional exige gestão."/>
      <form action={createInstitutionalProject} className="card panel formStack">
        <div className="formRow2"><label>Eixo<select name="axis" defaultValue={axis??"research"}><option value="teaching">Ensino</option><option value="research">Pesquisa</option><option value="extension">Extensão</option></select></label><label>Referência do edital<input name="callReference" maxLength={160} placeholder="Opcional"/></label></div>
        <label>Título<input name="title" minLength={3} maxLength={220} required/></label>
        <label>Resumo<textarea name="summary" rows={3} maxLength={1200}/></label>
        <label>Detalhes<textarea name="details" rows={5} maxLength={16000}/></label>
        <div className="formRow2"><label>Início<input type="date" name="startsOn"/></label><label>Fim<input type="date" name="endsOn"/></label></div>
        <div className="formRow2"><label>Status<select name="status" defaultValue={canPublish?"published":"submitted"}><option value="draft">Rascunho</option><option value="submitted">Submeter</option>{canPublish&&<><option value="published">Publicado</option><option value="in_progress">Em execução</option></>}</select></label><label className="checkLine"><input type="checkbox" name="openForApplications"/> Receber candidaturas de estudantes</label></div>
        <button className="button primary" type="submit">Salvar projeto</button>
      </form>
    </>}

    <SectionTitle title="Projetos" description="Projetos acessíveis ao seu perfil."/>
    <div className="projectGrid">
      {projects.length===0&&<div className="infoBox">Nenhum projeto disponível.</div>}
      {projects.map(project=>{const mine=myApps.get(project.id);const canManage=project.leader_user_id===account.id||canPublish;return <article className="card projectCard" key={project.id}>
        <div className="requestHead"><div><span className="badge">{axisLabels[project.axis]??project.axis}</span><span className="badge">{statusLabels[project.status]??project.status}</span><h3>{project.title}</h3><small>Líder: {profileMap.get(project.leader_user_id)??"Responsável"}{project.call_reference?" • "+project.call_reference:""}</small></div></div>
        <p className="requestBody">{project.summary||project.details||"Sem resumo cadastrado."}</p>
        <div className="requestMeta"><span className="badge">{date(project.starts_on)} → {date(project.ends_on)}</span>{project.open_for_applications&&<span className="badge">Aceitando candidaturas</span>}</div>
        {account.role==="student"&&project.open_for_applications&&["published","in_progress"].includes(project.status)&&!mine&&<form action={applyProject} className="formStack requestManager"><input type="hidden" name="projectId" value={project.id}/><label>Motivação<textarea name="motivation" rows={3} maxLength={6000} placeholder="Explique por que deseja participar."/></label><button className="button primary" type="submit">Candidatar-me</button></form>}
        {mine&&<div className="infoBox">Sua candidatura: <b>{statusLabels[mine.status]??mine.status}</b></div>}
        {canManage&&<form action={updateProjectStatus} className="requestManager formStack"><input type="hidden" name="id" value={project.id}/><div className="formRow2"><label>Status<select name="status" defaultValue={project.status}><option value="draft">Rascunho</option><option value="submitted">Submetido</option>{canPublish&&<><option value="published">Publicado</option><option value="in_progress">Em execução</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></>}</select></label><label className="checkLine"><input type="checkbox" name="openForApplications" defaultChecked={project.open_for_applications}/> Receber candidaturas</label></div><button className="button soft" type="submit">Atualizar projeto</button></form>}
      </article>})}
    </div>

    {visibleApps.length>0&&<>
      <SectionTitle title="Candidaturas recebidas" description="Líderes e gestores podem analisar candidatos."/>
      <div className="requestGrid">{visibleApps.map(a=><article className="card requestCard" key={a.id}><div className="requestHead"><div><span className="badge">{statusLabels[a.status]??a.status}</span><h3>{profileMap.get(a.applicant_user_id)??"Estudante"}</h3><small>{projects.find(p=>p.id===a.project_id)?.title??"Projeto"}</small></div></div>{a.motivation&&<p className="requestBody">{a.motivation}</p>}<form action={reviewProjectApplication} className="requestActions"><input type="hidden" name="id" value={a.id}/><select name="status" defaultValue={a.status}><option value="submitted">Enviada</option><option value="under_review">Em análise</option><option value="approved">Aprovada</option><option value="rejected">Não aprovada</option></select><button className="button soft" type="submit">Atualizar</button></form></article>)}</div>
    </>}
  </>;
}
