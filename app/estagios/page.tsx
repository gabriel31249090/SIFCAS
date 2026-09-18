import { BriefcaseBusiness, Building2, CheckCircle2, UsersRound } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listInternships } from "@/lib/integrated-modules";
import { applyInternship, createInternshipOpportunity, reviewInternshipApplication } from "./actions";

type Params=Promise<{message?:string;error?:string}>;
const statusLabels:Record<string,string>={draft:"Rascunho",open:"Aberta",closed:"Encerrada",archived:"Arquivada",submitted:"Enviada",under_review:"Em análise",approved:"Aprovada",rejected:"Não aprovada",withdrawn:"Retirada"};
function money(v:number|null){return v===null?"Não informada":new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);}
function date(v:string|null){return v?new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeZone:"America/Cuiaba"}).format(new Date(v+"T12:00:00-04:00")):"—";}

export default async function InternshipsPage({searchParams}:{searchParams:Params}){
  const account=await requireAccount();
  const params=await searchParams;
  const {opportunities,applications,profiles}=await listInternships(account);
  const canManage=["staff","manager","admin"].includes(account.role);
  const profileMap=new Map(profiles.map((p:any)=>[p.id,p.full_name||p.institutional_email||"Estudante"]));
  const myApps=new Map(applications.filter(a=>a.student_user_id===account.id).map(a=>[a.opportunity_id,a]));
  const open=opportunities.filter(o=>o.status==="open").length;

  return <>
    <PageHeader title="Estágios e Jovem Aprendiz" description="Vagas, inscrições e acompanhamento de oportunidades de prática profissional." action={<span className="badge">Extensão • carreira</span>}/>
    {params.message&&<div className="infoBox successBox">{params.message}</div>}
    {params.error&&<div className="infoBox errorBox">{params.error}</div>}
    <div className="statGrid">
      <StatCard label="Vagas abertas" value={String(open)} foot="Disponíveis para inscrição" icon={BriefcaseBusiness}/>
      <StatCard label="Oportunidades" value={String(opportunities.length)} foot="Visíveis para seu perfil" icon={Building2}/>
      <StatCard label={canManage?"Candidaturas":"Minhas inscrições"} value={String(canManage?applications.length:applications.filter(a=>a.student_user_id===account.id).length)} foot="Registradas no SIFCAS" icon={UsersRound}/>
      <StatCard label="Aprovadas" value={String(applications.filter(a=>a.status==="approved").length)} foot="Candidaturas aprovadas" icon={CheckCircle2}/>
    </div>

    {canManage&&<>
      <SectionTitle title="Publicar oportunidade" description="Cadastre uma vaga real e defina o período de inscrição."/>
      <form action={createInternshipOpportunity} className="card panel formStack">
        <div className="formRow2"><label>Título<input name="title" minLength={3} maxLength={180} required/></label><label>Organização<input name="organization" minLength={2} maxLength={180} required/></label></div>
        <label>Descrição<textarea name="description" rows={4} maxLength={12000}/></label>
        <div className="formRow2"><label>Local<input name="location" maxLength={180}/></label><label>Vagas<input type="number" name="slots" min={1} max={500} defaultValue={1}/></label></div>
        <div className="formRow2"><label>Carga horária semanal<input type="number" name="workloadHours" min={1} max={80}/></label><label>Bolsa (R$)<input name="stipend" inputMode="decimal"/></label></div>
        <div className="formRow2"><label>Prazo de inscrição<input type="date" name="applicationDeadline"/></label><label>Status<select name="status" defaultValue="open"><option value="draft">Rascunho</option><option value="open">Aberta</option><option value="closed">Encerrada</option><option value="archived">Arquivada</option></select></label></div>
        <div className="formRow2"><label>Início previsto<input type="date" name="startsOn"/></label><label>Fim previsto<input type="date" name="endsOn"/></label></div>
        <button className="button primary" type="submit">Salvar oportunidade</button>
      </form>
    </>}

    <SectionTitle title="Oportunidades" description="Vagas disponíveis e histórico recente."/>
    <div className="opportunityGrid">
      {opportunities.length===0&&<div className="infoBox">Nenhuma oportunidade cadastrada.</div>}
      {opportunities.map(o=>{const mine=myApps.get(o.id); return <article className="card opportunityCard" key={o.id}>
        <div className="requestHead"><div><span className="badge">{statusLabels[o.status]??o.status}</span><h3>{o.title}</h3><small>{o.organization}{o.location?" • "+o.location:""}</small></div><b>{money(o.stipend)}</b></div>
        <p className="requestBody">{o.description||"Sem descrição adicional."}</p>
        <div className="requestMeta"><span className="badge">{o.slots} vaga(s)</span>{o.workload_hours&&<span className="badge">{o.workload_hours}h/semana</span>}<span className="badge">Prazo: {date(o.application_deadline)}</span></div>
        {account.role==="student"&&o.status==="open"&&!mine&&<form action={applyInternship} className="formStack requestManager"><input type="hidden" name="opportunityId" value={o.id}/><label>Apresentação<textarea name="statement" rows={3} maxLength={6000} placeholder="Conte brevemente seu interesse na oportunidade."/></label><button className="button primary" type="submit">Quero me inscrever</button></form>}
        {mine&&<div className="infoBox">Sua inscrição: <b>{statusLabels[mine.status]??mine.status}</b></div>}
      </article>})}
    </div>

    {canManage&&<>
      <SectionTitle title="Candidaturas" description="Analise as inscrições recebidas."/>
      <div className="requestGrid">{applications.length===0&&<div className="infoBox">Nenhuma candidatura recebida.</div>}
      {applications.map(a=><article className="card requestCard" key={a.id}><div className="requestHead"><div><span className="badge">{statusLabels[a.status]??a.status}</span><h3>{profileMap.get(a.student_user_id)??"Estudante"}</h3><small>{opportunities.find(o=>o.id===a.opportunity_id)?.title??"Vaga"}</small></div></div>{a.statement&&<p className="requestBody">{a.statement}</p>}<form action={reviewInternshipApplication} className="requestActions"><input type="hidden" name="id" value={a.id}/><select name="status" defaultValue={a.status}><option value="submitted">Enviada</option><option value="under_review">Em análise</option><option value="approved">Aprovada</option><option value="rejected">Não aprovada</option></select><button className="button soft" type="submit">Atualizar</button></form></article>)}</div>
    </>}
  </>;
}
