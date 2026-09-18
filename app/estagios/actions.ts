"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function done(message:string,error=false):never{
  revalidatePath("/estagios");
  redirect("/estagios?"+(error?"error=":"message=")+encodeURIComponent(message));
}

export async function createInternshipOpportunity(formData:FormData){
  const account=await requireAccount();
  if(!["staff","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const title=String(formData.get("title")??"").trim();
  const organization=String(formData.get("organization")??"").trim();
  const description=String(formData.get("description")??"").trim();
  const location=String(formData.get("location")??"").trim();
  const workloadRaw=String(formData.get("workloadHours")??"").trim();
  const stipendRaw=String(formData.get("stipend")??"").trim().replace(",",".");
  const slots=Number(formData.get("slots")??1);
  const deadline=String(formData.get("applicationDeadline")??"").trim()||null;
  const startsOn=String(formData.get("startsOn")??"").trim()||null;
  const endsOn=String(formData.get("endsOn")??"").trim()||null;
  const status=String(formData.get("status")??"draft");
  if(title.length<3||title.length>180||organization.length<2||organization.length>180||description.length>12000||!["draft","open","closed","archived"].includes(status)||!Number.isInteger(slots)||slots<1||slots>500) done("Revise os dados da vaga.",true);
  const workload=workloadRaw?Number(workloadRaw):null;
  const stipend=stipendRaw?Number(stipendRaw):null;
  if((workload!==null&&(!Number.isFinite(workload)||workload<1||workload>80))||(stipend!==null&&(!Number.isFinite(stipend)||stipend<0))) done("Carga horária ou bolsa inválida.",true);
  const supabase=await createClient();
  const {error}=await supabase.from("internship_opportunities").insert({
    title,organization,description,location,workload_hours:workload,stipend,slots,application_deadline:deadline,starts_on:startsOn,ends_on:endsOn,status,created_by:account.id
  });
  if(error) done("Não foi possível publicar a vaga.",true);
  done("Vaga de estágio salva.");
}

export async function applyInternship(formData:FormData){
  const account=await requireAccount();
  if(account.role!=="student") redirect("/acesso-negado");
  const opportunityId=String(formData.get("opportunityId")??"");
  const statement=String(formData.get("statement")??"").trim();
  if(!opportunityId||statement.length>6000) done("Inscrição inválida.",true);
  const supabase=await createClient();
  const {data:opportunity,error:oppError}=await supabase.from("internship_opportunities").select("id,status,application_deadline").eq("id",opportunityId).single();
  if(oppError||opportunity.status!=="open") done("Esta vaga não está aberta.",true);
  if(opportunity.application_deadline&&opportunity.application_deadline<new Date().toISOString().slice(0,10)) done("O prazo desta vaga terminou.",true);
  const {error}=await supabase.from("internship_applications").insert({opportunity_id:opportunityId,student_user_id:account.id,statement});
  if(error) done(error.code==="23505"?"Você já se inscreveu nesta vaga.":"Não foi possível enviar a inscrição.",true);
  done("Inscrição enviada.");
}

export async function reviewInternshipApplication(formData:FormData){
  const account=await requireAccount();
  if(!["staff","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const id=String(formData.get("id")??"");
  const status=String(formData.get("status")??"");
  if(!id||!["submitted","under_review","approved","rejected"].includes(status)) done("Revisão inválida.",true);
  const supabase=await createClient();
  const {error}=await supabase.from("internship_applications").update({status,reviewed_by:account.id,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) done("Não foi possível atualizar a candidatura.",true);
  done("Candidatura atualizada.");
}
