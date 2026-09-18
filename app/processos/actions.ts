"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const processTypes=new Set(["general","academic","administrative","documents","student_assistance","internship","research","extension"]);
const priorities=new Set(["low","normal","high","urgent"]);
const statuses=new Set(["open","triage","in_progress","waiting_user","completed","archived"]);

function done(message:string,error=false):never{
  revalidatePath("/processos");
  revalidatePath("/pendencias");
  redirect("/processos?"+(error?"error=":"message=")+encodeURIComponent(message));
}

export async function createProcess(formData:FormData){
  const account=await requireAccount();
  const processType=String(formData.get("processType")??"general");
  const subject=String(formData.get("subject")??"").trim();
  const description=String(formData.get("description")??"").trim();
  const priority=String(formData.get("priority")??"normal");
  if(!processTypes.has(processType)||!priorities.has(priority)||subject.length<3||subject.length>180||description.length>12000) done("Revise os dados do processo.",true);
  const supabase=await createClient();
  const {data,error}=await supabase.from("electronic_processes").insert({
    requester_user_id:account.id,process_type:processType,subject,description,priority
  }).select("protocol").single();
  if(error) done("Não foi possível abrir o processo.",true);
  done("Processo "+data.protocol+" aberto com sucesso.");
}

export async function updateProcess(formData:FormData){
  const account=await requireAccount();
  if(!["staff","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const id=String(formData.get("id")??"").trim();
  const status=String(formData.get("status")??"").trim();
  const sector=String(formData.get("sector")??"Protocolo").trim();
  const note=String(formData.get("note")??"").trim();
  if(!id||!statuses.has(status)||sector.length<2||sector.length>120||note.length>8000) done("Dados de tramitação inválidos.",true);

  const supabase=await createClient();
  const {error}=await supabase.rpc("advance_electronic_process",{
    p_id:id,p_status:status,p_sector:sector,p_note:note
  });
  if(error){
    console.error("process advance failed",error.message);
    done("Não foi possível registrar a tramitação do processo.",true);
  }
  done("Processo atualizado com histórico registrado.");
}
