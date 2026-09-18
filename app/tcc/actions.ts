"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function done(message:string,error=false):never{
  revalidatePath("/tcc");
  redirect("/tcc?"+(error?"error=":"message=")+encodeURIComponent(message));
}

export async function createTccDefense(formData:FormData){
  const account=await requireAccount();
  if(!["teacher","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const title=String(formData.get("title")??"").trim();
  const summary=String(formData.get("summary")??"").trim();
  const scheduledAt=String(formData.get("scheduledAt")??"").trim();
  const room=String(formData.get("room")??"").trim();
  const studentId=String(formData.get("studentId")??"").trim()||null;
  const courseId=String(formData.get("courseId")??"").trim()||null;
  const panelMembers=String(formData.get("panelMembers")??"").split("\n").map(v=>v.trim()).filter(Boolean).slice(0,12);
  if(title.length<3||title.length>300||summary.length>8000||!scheduledAt||room.length>180) done("Revise os dados da defesa.",true);
  const iso=new Date(scheduledAt+":00-04:00").toISOString();
  const supabase=await createClient();
  const {error}=await supabase.from("tcc_defenses").insert({
    student_user_id:studentId,course_id:courseId,advisor_user_id:account.role==="teacher"?account.id:null,title,summary,scheduled_at:iso,room,panel_members:panelMembers,created_by:account.id
  });
  if(error) done("Não foi possível agendar a defesa.",true);
  done("Defesa de TCC agendada.");
}

export async function updateTccDefense(formData:FormData){
  const account=await requireAccount();
  if(!["teacher","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const id=String(formData.get("id")??"");
  const status=String(formData.get("status")??"");
  const result=String(formData.get("result")??"").trim();
  if(!id||!["scheduled","completed","cancelled"].includes(status)||result.length>4000) done("Atualização inválida.",true);
  const supabase=await createClient();
  const {error}=await supabase.from("tcc_defenses").update({status,result,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) done("Não foi possível atualizar a defesa.",true);
  done("Defesa atualizada.");
}
