"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function done(message:string,error=false):never{
  revalidatePath("/tcc");
  revalidatePath("/pendencias");
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

  const parsedDate=new Date(scheduledAt+":00-04:00");
  if(Number.isNaN(parsedDate.getTime())) done("Data e hora da defesa inválidas.",true);

  const supabase=await createClient();
  if(studentId){
    const {data:student,error:studentError}=await supabase.from("profiles").select("id").eq("id",studentId).maybeSingle();
    if(studentError||!student) done("O estudante informado não está disponível para seu perfil.",true);
  }
  if(courseId){
    const {data:course,error:courseError}=await supabase.from("courses").select("id").eq("id",courseId).eq("active",true).maybeSingle();
    if(courseError||!course) done("O curso informado não está ativo.",true);
  }

  const {error}=await supabase.from("tcc_defenses").insert({
    student_user_id:studentId,course_id:courseId,advisor_user_id:account.role==="teacher"?account.id:null,
    title,summary,scheduled_at:parsedDate.toISOString(),room,panel_members:panelMembers,created_by:account.id
  });
  if(error){
    console.error("tcc defense insert failed",error.message);
    done("Não foi possível agendar a defesa. Verifique estudante, curso e vínculo acadêmico.",true);
  }
  done("Defesa de TCC agendada.");
}

export async function updateTccDefense(formData:FormData){
  const account=await requireAccount();
  if(!["teacher","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const id=String(formData.get("id")??"").trim();
  const status=String(formData.get("status")??"").trim();
  const result=String(formData.get("result")??"").trim();
  if(!id||!["scheduled","completed","cancelled"].includes(status)||result.length>4000) done("Atualização inválida.",true);
  const supabase=await createClient();
  const {error}=await supabase.from("tcc_defenses").update({status,result,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) done("Não foi possível atualizar a defesa.",true);
  done("Defesa atualizada.");
}
