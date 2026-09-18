import { CheckCircle2, Clock3, FileStack, FolderKanban } from "lucide-react";
import { PageHeader, SectionTitle, StatCard } from "@/components/UI";
import { requireAccount } from "@/lib/auth";
import { listProcesses } from "@/lib/integrated-modules";
import { createProcess, updateProcess } from "./actions";

type Params=Promise<{message?:string;error?:string}>;

const statusLabels:Record<string,string>={open:"Aberto",triage:"Triagem",in_progress:"Em andamento",waiting_user:"Aguardando usuário",completed:"Concluído",archived:"Arquivado"};
const typeLabels:Record<string,string>={general:"Geral",academic:"Acadêmico",administrative:"Administrativo",documents:"Documentos",student_assistance:"Assistência estudantil",internship:"Estágio",research:"Pesquisa",extension:"Extensão"};

function fmt(v:string){return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Cuiaba"}).format(new Date(v));}

export default async function ProcessesPage({searchParams}:{searchParams:Params}){
  const account=await requireAccount();
  const params=await searchParams;
  const {processes,movements}=await listProcesses(account);
  const canManage=["staff","manager","admin"].includes(account.role);
  const active=processes.filter(p=>!["completed","archived"].includes(p.status)).length;
  const done=processes.length-active;
  const movementMap=new Map<string,typeof movements>();
  for(const movement of movements){
    const list=movementMap.get(movement.process_id)??[];
    list.push(movement);
    movementMap.set(movement.process_id,list);
  }

  return <>
    <PageHeader title="Processos Eletrônicos" description="Abra, acompanhe e tramite processos internos com protocolo e histórico rastreável." action={<span className="badge">Fluxo eletrônico</span>}/>
    {params.message&&<div className="infoBox successBox">{params.message}</div>}
    {params.error&&<div className="infoBox errorBox">{params.error}</div>}
    <div className="statGrid">
      <StatCard label="Visíveis" value={String(processes.length)} foot={canManage?"Fila institucional":"Seus processos"} icon={FolderKanban}/>
      <StatCard label="Ativos" value={String(active)} foot="Em tratamento" icon={Clock3}/>
      <StatCard label="Finalizados" value={String(done)} foot="Concluídos ou arquivados" icon={CheckCircle2}/>
      <StatCard label="Histórico" value={String(movements.length)} foot="Movimentações registradas" icon={FileStack}/>
    </div>

    <SectionTitle title="Abrir processo" description="Use este fluxo para demandas que precisam de protocolo e tramitação formal."/>
    <form action={createProcess} className="card panel formStack">
      <div className="formRow2">
        <label>Tipo<select name="processType" defaultValue="general"><option value="general">Geral</option><option value="academic">Acadêmico</option><option value="administrative">Administrativo</option><option value="documents">Documentos</option><option value="student_assistance">Assistência estudantil</option><option value="internship">Estágio</option><option value="research">Pesquisa</option><option value="extension">Extensão</option></select></label>
        <label>Prioridade<select name="priority" defaultValue="normal"><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
      </div>
      <label>Assunto<input name="subject" minLength={3} maxLength={180} required placeholder="Ex.: aproveitamento de estudos"/></label>
      <label>Descrição<textarea name="description" rows={5} maxLength={12000} placeholder="Descreva a demanda e as informações necessárias."/></label>
      <button className="button primary" type="submit">Abrir processo</button>
    </form>

    <SectionTitle title={canManage?"Fila de processos":"Meus processos"} description="Status, setor atual e histórico de tramitação."/>
    <div className="processGrid">
      {processes.length===0&&<div className="infoBox">Nenhum processo disponível.</div>}
      {processes.map(process=><article className="card processCard" key={process.id}>
        <div className="requestHead"><div><span className="badge">{statusLabels[process.status]??process.status}</span><h3>{process.subject}</h3><small>{process.protocol} • {typeLabels[process.process_type]??process.process_type} • {fmt(process.opened_at)}</small></div><strong>{process.current_sector}</strong></div>
        {process.description&&<p className="requestBody">{process.description}</p>}
        {(movementMap.get(process.id)?.length??0)>0&&<details className="processHistory"><summary>Histórico ({movementMap.get(process.id)?.length})</summary><div className="stackList">{movementMap.get(process.id)?.slice(0,8).map(m=><div key={m.id}><b>{m.action} • {fmt(m.created_at)}</b><span>{m.from_status??"—"} → {m.to_status??"—"}{m.note?" • "+m.note:""}</span></div>)}</div></details>}
        {canManage&&<form action={updateProcess} className="formStack requestManager">
          <input type="hidden" name="id" value={process.id}/>
          <div className="formRow2">
            <label>Status<select name="status" defaultValue={process.status}><option value="open">Aberto</option><option value="triage">Triagem</option><option value="in_progress">Em andamento</option><option value="waiting_user">Aguardando usuário</option><option value="completed">Concluído</option><option value="archived">Arquivado</option></select></label>
            <label>Setor atual<input name="sector" defaultValue={process.current_sector} maxLength={120} required/></label>
          </div>
          <label>Nota da tramitação<textarea name="note" rows={3} maxLength={8000}/></label>
          <button className="button soft" type="submit">Registrar tramitação</button>
        </form>}
      </article>)}
    </div>
  </>;
}
