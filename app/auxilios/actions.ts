"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function done(message:string,error=false):never{
  revalidatePath("/auxilios");
  redirect("/auxilios?"+(error?"error=":"message=")+encodeURIComponent(message));
}

export async function createAidProgram(formData:FormData){
  const account=await requireAccount();
  if(!["staff","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const title=String(formData.get("title")??"").trim();
  const description=String(formData.get("description")??"").trim();
  const benefitType=String(formData.get("benefitType")??"other");
  const valueRaw=String(formData.get("benefitValue")??"").trim().replace(",",".");
  const deadline=String(formData.get("applicationDeadline")??"").trim()||null;
  const startsOn=String(formData.get("startsOn")??"").trim()||null;
  const endsOn=String(formData.get("endsOn")??"").trim()||null;
  const status=String(formData.get("status")??"draft");
  const allowedTypes=["food","transport","housing","digital_inclusion","emergency","scholarship","other"];
  const allowedStatus=["draft","open","closed","archived"];
  if(title.length<3||title.length>180||description.length>12000||!allowedTypes.includes(benefitType)||!allowedStatus.includes(status)) done("Revise os dados do programa.",true);
  const benefitValue=valueRaw?Number(valueRaw):null;
  if(benefitValue!==null&&(!Number.isFinite(benefitValue)||benefitValue<0)) done("Valor do benefício inválido.",true);
  const supabase=await createClient();
  const {error}=await supabase.from("student_aid_programs").insert({
    title,description,benefit_type:benefitType,benefit_value:benefitValue,application_deadline:deadline,starts_on:startsOn,ends_on:endsOn,status,created_by:account.id
  });
  if(error) done("Não foi possível salvar o programa.",true);
  done("Programa de auxílio salvo.");
}

export async function applyAid(formData:FormData){
  const account=await requireAccount();
  if(account.role!=="student") redirect("/acesso-negado");
  const programId=String(formData.get("programId")??"");
  const notes=String(formData.get("notes")??"").trim();
  if(!programId||notes.length>6000) done("Inscrição inválida.",true);
  const supabase=await createClient();
  const {data:program,error:programError}=await supabase.from("student_aid_programs").select("id,status,application_deadline").eq("id",programId).single();
  if(programError||program.status!=="open") done("Este programa não está com inscrições abertas.",true);
  if(program.application_deadline&&program.application_deadline<new Date().toISOString().slice(0,10)) done("O prazo deste programa terminou.",true);
  const {error}=await supabase.from("student_aid_applications").insert({program_id:programId,student_user_id:account.id,notes});
  if(error) done(error.code==="23505"?"Você já se inscreveu neste programa.":"Não foi possível enviar a inscrição.",true);
  done("Inscrição enviada.");
}

export async function reviewAidApplication(formData:FormData){
  const account=await requireAccount();
  if(!["staff","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const id=String(formData.get("id")??"");
  const status=String(formData.get("status")??"");
  if(!id||!["submitted","under_review","approved","rejected","waitlist"].includes(status)) done("Revisão inválida.",true);
  const supabase=await createClient();
  const {error}=await supabase.from("student_aid_applications").update({status,reviewed_by:account.id,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) done("Não foi possível atualizar a inscrição.",true);
  done("Inscrição atualizada.");
}
