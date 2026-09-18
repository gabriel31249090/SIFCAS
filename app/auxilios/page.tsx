import { BadgeDollarSign, CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listAidPrograms } from "@/lib/integrated-modules";
import { applyAid, createAidProgram, reviewAidApplication } from "./actions";

type Params=Promise<{message?:string;error?:string}>;
const statusLabels:Record<string,string>={draft:"Rascunho",open:"Inscrições abertas",closed:"Encerrado",archived:"Arquivado",submitted:"Enviada",under_review:"Em análise",approved:"Aprovada",rejected:"Não aprovada",waitlist:"Lista de espera",withdrawn:"Retirada"};
const benefitLabels:Record<string,string>={food:"Alimentação",transport:"Transporte",housing:"Moradia",digital_inclusion:"Inclusão digital",emergency:"Emergencial",scholarship:"Bolsa",other:"Outro"};
function money(v:number|null){return v===null?"Valor variável":new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);}
function date(v:string|null){return v?new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeZone:"America/Cuiaba"}).format(new Date(v+"T12:00:00-04:00")):"—";}

export default async function AidPage({searchParams}:{searchParams:Params}){
  const account=await requireAccount();
  const params=await searchParams;
  const {programs,applications,profiles}=await listAidPrograms(account);
  const canManage=["staff","manager","admin"].includes(account.role);
  const profileMap=new Map(profiles.map((p:any)=>[p.id,p.full_name||p.institutional_email||"Estudante"]));
  const mine=new Map(applications.filter(a=>a.student_user_id===account.id).map(a=>[a.program_id,a]));
  return <>
    <PageHeader title="Auxílios Estudantis" description="Programas de assistência estudantil, inscrições e acompanhamento de resultados." action={<span className="badge">Assistência estudantil</span>}/>
    {params.message&&<div className="infoBox successBox">{params.message}</div>}
    {params.error&&<div className="infoBox errorBox">{params.error}</div>}
    <div className="statGrid">
      <StatCard label="Programas abertos" value={String(programs.filter(p=>p.status==="open").length)} foot="Com inscrição disponível" icon={BadgeDollarSign}/>
      <StatCard label="Programas visíveis" value={String(programs.length)} foot="Atuais e encerrados" icon={Clock3}/>
      <StatCard label={canManage?"Inscrições":"Minhas inscrições"} value={String(canManage?applications.length:applications.filter(a=>a.student_user_id===account.id).length)} foot="Registradas" icon={UsersRound}/>
      <StatCard label="Aprovadas" value={String(applications.filter(a=>a.status==="approved").length)} foot="Resultado aprovado" icon={CheckCircle2}/>
    </div>

    {canManage&&<>
      <SectionTitle title="Criar programa" description="Cadastre o auxílio e abra inscrições quando estiver pronto."/>
      <form action={createAidProgram} className="card panel formStack">
        <label>Título<input name="title" minLength={3} maxLength={180} required/></label>
        <label>Descrição<textarea name="description" rows={4} maxLength={12000}/></label>
        <div className="formRow2"><label>Tipo de benefício<select name="benefitType" defaultValue="other"><option value="food">Alimentação</option><option value="transport">Transporte</option><option value="housing">Moradia</option><option value="digital_inclusion">Inclusão digital</option><option value="emergency">Emergencial</option><option value="scholarship">Bolsa</option><option value="other">Outro</option></select></label><label>Valor (R$)<input name="benefitValue" inputMode="decimal"/></label></div>
        <div className="formRow2"><label>Prazo de inscrição<input type="date" name="applicationDeadline"/></label><label>Status<select name="status" defaultValue="open"><option value="draft">Rascunho</option><option value="open">Inscrições abertas</option><option value="closed">Encerrado</option><option value="archived">Arquivado</option></select></label></div>
        <div className="formRow2"><label>Início<input type="date" name="startsOn"/></label><label>Fim<input type="date" name="endsOn"/></label></div>
        <button className="button primary" type="submit">Salvar programa</button>
      </form>
    </>}

    <SectionTitle title="Programas" description="Benefícios disponíveis e histórico recente."/>
    <div className="opportunityGrid">
      {programs.length===0&&<div className="infoBox">Nenhum programa cadastrado.</div>}
      {programs.map(program=>{const app=mine.get(program.id);return <article className="card opportunityCard" key={program.id}>
        <div className="requestHead"><div><span className="badge">{statusLabels[program.status]??program.status}</span><h3>{program.title}</h3><small>{benefitLabels[program.benefit_type]??program.benefit_type} • prazo {date(program.application_deadline)}</small></div><b>{money(program.benefit_value)}</b></div>
        <p className="requestBody">{program.description||"Sem descrição adicional."}</p>
        {account.role==="student"&&program.status==="open"&&!app&&<form action={applyAid} className="formStack requestManager"><input type="hidden" name="programId" value={program.id}/><label>Observação<textarea name="notes" rows={3} maxLength={6000} placeholder="Informe algo relevante para sua inscrição, se necessário."/></label><button className="button primary" type="submit">Inscrever-me</button></form>}
        {app&&<div className="infoBox">Sua inscrição: <b>{statusLabels[app.status]??app.status}</b></div>}
      </article>})}
    </div>

    {canManage&&<>
      <SectionTitle title="Análise das inscrições" description="Atualize o andamento de cada solicitação de auxílio."/>
      <div className="requestGrid">{applications.length===0&&<div className="infoBox">Nenhuma inscrição recebida.</div>}
        {applications.map(a=><article className="card requestCard" key={a.id}><div className="requestHead"><div><span className="badge">{statusLabels[a.status]??a.status}</span><h3>{profileMap.get(a.student_user_id)??"Estudante"}</h3><small>{programs.find(p=>p.id===a.program_id)?.title??"Programa"}</small></div></div>{a.notes&&<p className="requestBody">{a.notes}</p>}<form action={reviewAidApplication} className="requestActions"><input type="hidden" name="id" value={a.id}/><select name="status" defaultValue={a.status}><option value="submitted">Enviada</option><option value="under_review">Em análise</option><option value="approved">Aprovada</option><option value="waitlist">Lista de espera</option><option value="rejected">Não aprovada</option></select><button className="button soft" type="submit">Atualizar</button></form></article>)}
      </div>
    </>}
  </>;
}
