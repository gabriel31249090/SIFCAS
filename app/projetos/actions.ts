"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function done(message:string,error=false,axis?:string):never{
  revalidatePath("/projetos");
  const suffix=axis?"&eixo="+encodeURIComponent(axis):"";
  redirect("/projetos?"+(error?"error=":"message=")+encodeURIComponent(message)+suffix);
}

export async function createInstitutionalProject(formData:FormData){
  const account=await requireAccount();
  if(!["teacher","staff","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const axis=String(formData.get("axis")??"");
  const title=String(formData.get("title")??"").trim();
  const summary=String(formData.get("summary")??"").trim();
  const details=String(formData.get("details")??"").trim();
  const callReference=String(formData.get("callReference")??"").trim();
  const requestedStatus=String(formData.get("status")??"draft");
  const openForApplications=formData.get("openForApplications")==="on";
  const startsOn=String(formData.get("startsOn")??"").trim()||null;
  const endsOn=String(formData.get("endsOn")??"").trim()||null;
  if(!["teaching","research","extension"].includes(axis)||title.length<3||title.length>220||summary.length>1200||details.length>16000||callReference.length>160) done("Revise os dados do projeto.",true,axis);
  const status=["manager","admin"].includes(account.role)&&["draft","submitted","published","in_progress","completed","cancelled"].includes(requestedStatus)
    ? requestedStatus
    : (requestedStatus==="submitted"?"submitted":"draft");
  const supabase=await createClient();
  const {error}=await supabase.from("institutional_projects").insert({
    axis,title,summary,details,call_reference:callReference,leader_user_id:account.id,status,
    open_for_applications:openForApplications,starts_on:startsOn,ends_on:endsOn,created_by:account.id
  });
  if(error) done("Não foi possível salvar o projeto.",true,axis);
  done(status==="submitted"?"Projeto submetido para análise.":"Projeto salvo.",false,axis);
}

export async function updateProjectStatus(formData:FormData){
  const account=await requireAccount();
  const id=String(formData.get("id")??"");
  const status=String(formData.get("status")??"");
  const openForApplications=formData.get("openForApplications")==="on";
  if(!id||!["draft","submitted","published","in_progress","completed","cancelled"].includes(status)) done("Atualização inválida.",true);
  const supabase=await createClient();
  const {data:project,error:readError}=await supabase.from("institutional_projects").select("leader_user_id,axis").eq("id",id).single();
  if(readError) done("Projeto não encontrado.",true);
  const isManager=["manager","admin"].includes(account.role);
  if(!isManager&&project.leader_user_id!==account.id) redirect("/acesso-negado");
  if(!isManager&&!["draft","submitted"].includes(status)) done("Somente gestão pode publicar ou concluir projetos.",true,project.axis);
  const {error}=await supabase.from("institutional_projects").update({status,open_for_applications:openForApplications,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) done("Não foi possível atualizar o projeto.",true,project.axis);
  done("Projeto atualizado.",false,project.axis);
}

export async function applyProject(formData:FormData){
  const account=await requireAccount();
  if(account.role!=="student") redirect("/acesso-negado");
  const projectId=String(formData.get("projectId")??"");
  const motivation=String(formData.get("motivation")??"").trim();
  if(!projectId||motivation.length>6000) done("Candidatura inválida.",true);
  const supabase=await createClient();
  const {data:project,error:projectError}=await supabase.from("institutional_projects").select("id,status,open_for_applications,axis").eq("id",projectId).single();
  if(projectError||!project.open_for_applications||!["published","in_progress"].includes(project.status)) done("Este projeto não está recebendo candidaturas.",true);
  const {error}=await supabase.from("project_applications").insert({project_id:projectId,applicant_user_id:account.id,motivation});
  if(error) done(error.code==="23505"?"Você já se candidatou a este projeto.":"Não foi possível enviar a candidatura.",true,project.axis);
  done("Candidatura enviada.",false,project.axis);
}

export async function reviewProjectApplication(formData:FormData){
  const account=await requireAccount();
  const id=String(formData.get("id")??"");
  const status=String(formData.get("status")??"");
  if(!id||!["submitted","under_review","approved","rejected"].includes(status)) done("Revisão inválida.",true);
  const supabase=await createClient();
  const {data:application,error:appError}=await supabase.from("project_applications").select("project_id").eq("id",id).single();
  if(appError) done("Candidatura não encontrada.",true);
  const {data:project,error:projectError}=await supabase.from("institutional_projects").select("leader_user_id,axis").eq("id",application.project_id).single();
  if(projectError) done("Projeto não encontrado.",true);
  if(project.leader_user_id!==account.id&&!["manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const {error}=await supabase.from("project_applications").update({status,reviewed_by:account.id,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) done("Não foi possível atualizar a candidatura.",true,project.axis);
  done("Candidatura atualizada.",false,project.axis);
}
