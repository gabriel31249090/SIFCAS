import type { CurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ElectronicProcess = {
  id:string; protocol:string; process_type:string; subject:string; description:string; status:string; priority:string;
  current_sector:string; requester_user_id:string; responsible_user_id:string|null; opened_at:string; updated_at:string; closed_at:string|null;
};
export type ProcessMovement = { id:string; process_id:string; action:string; note:string; from_status:string|null; to_status:string|null; created_at:string; actor_user_id:string|null };
export type InternshipOpportunity = {
  id:string; title:string; organization:string; description:string; location:string; workload_hours:number|null; stipend:number|null;
  slots:number; application_deadline:string|null; starts_on:string|null; ends_on:string|null; status:string; created_at:string;
};
export type InternshipApplication = { id:string; opportunity_id:string; student_user_id:string; statement:string; status:string; applied_at:string };
export type AidProgram = { id:string; title:string; description:string; benefit_type:string; benefit_value:number|null; application_deadline:string|null; starts_on:string|null; ends_on:string|null; status:string; created_at:string };
export type AidApplication = { id:string; program_id:string; student_user_id:string; notes:string; status:string; applied_at:string };
export type TccDefense = { id:string; student_user_id:string|null; course_id:string|null; advisor_user_id:string|null; title:string; summary:string; scheduled_at:string; room:string; panel_members:string[]; status:string; result:string; created_by:string|null };
export type InstitutionalProject = { id:string; axis:string; title:string; summary:string; details:string; call_reference:string; leader_user_id:string; status:string; open_for_applications:boolean; starts_on:string|null; ends_on:string|null; created_at:string };
export type ProjectApplication = { id:string; project_id:string; applicant_user_id:string; motivation:string; status:string; applied_at:string };

export async function listProcesses(account: CurrentAccount) {
  const supabase = await createClient();
  let query = supabase.from("electronic_processes")
    .select("id,protocol,process_type,subject,description,status,priority,current_sector,requester_user_id,responsible_user_id,opened_at,updated_at,closed_at")
    .order("updated_at",{ascending:false}).limit(100);
  if (!["staff","manager","admin"].includes(account.role)) query = query.eq("requester_user_id",account.id);
  const {data,error}=await query;
  if(error) throw error;
  const rows=(data??[]) as ElectronicProcess[];
  const ids=rows.map(r=>r.id);
  const movements = ids.length
    ? await supabase.from("process_movements").select("id,process_id,action,note,from_status,to_status,created_at,actor_user_id").in("process_id",ids).order("created_at",{ascending:false})
    : {data:[],error:null};
  if(movements.error) throw movements.error;
  return { processes: rows, movements: (movements.data??[]) as ProcessMovement[] };
}

export async function listInternships(account: CurrentAccount) {
  const supabase = await createClient();
  const [opportunities,applications]=await Promise.all([
    supabase.from("internship_opportunities").select("id,title,organization,description,location,workload_hours,stipend,slots,application_deadline,starts_on,ends_on,status,created_at").order("application_deadline",{ascending:true}).limit(100),
    supabase.from("internship_applications").select("id,opportunity_id,student_user_id,statement,status,applied_at").order("applied_at",{ascending:false}).limit(200),
  ]);
  if(opportunities.error) throw opportunities.error;
  if(applications.error) throw applications.error;
  const appRows=(applications.data??[]) as InternshipApplication[];
  const studentIds=[...new Set(appRows.map(r=>r.student_user_id))];
  const profiles = studentIds.length && ["staff","manager","admin"].includes(account.role)
    ? await supabase.from("profiles").select("id,full_name,institutional_email").in("id",studentIds)
    : {data:[],error:null};
  if(profiles.error) throw profiles.error;
  return { opportunities:(opportunities.data??[]) as InternshipOpportunity[], applications:appRows, profiles:profiles.data??[] };
}

export async function listAidPrograms(account: CurrentAccount) {
  const supabase=await createClient();
  const [programs,applications]=await Promise.all([
    supabase.from("student_aid_programs").select("id,title,description,benefit_type,benefit_value,application_deadline,starts_on,ends_on,status,created_at").order("application_deadline",{ascending:true}).limit(100),
    supabase.from("student_aid_applications").select("id,program_id,student_user_id,notes,status,applied_at").order("applied_at",{ascending:false}).limit(200),
  ]);
  if(programs.error) throw programs.error;
  if(applications.error) throw applications.error;
  const appRows=(applications.data??[]) as AidApplication[];
  const studentIds=[...new Set(appRows.map(r=>r.student_user_id))];
  const profiles = studentIds.length && ["staff","manager","admin"].includes(account.role)
    ? await supabase.from("profiles").select("id,full_name,institutional_email").in("id",studentIds)
    : {data:[],error:null};
  if(profiles.error) throw profiles.error;
  return { programs:(programs.data??[]) as AidProgram[], applications:appRows, profiles:profiles.data??[] };
}

export async function listTccDefenses() {
  const supabase=await createClient();
  const {data,error}=await supabase.from("tcc_defenses")
    .select("id,student_user_id,course_id,advisor_user_id,title,summary,scheduled_at,room,panel_members,status,result,created_by")
    .order("scheduled_at",{ascending:true}).limit(200);
  if(error) throw error;
  const rows=(data??[]) as TccDefense[];
  const userIds=[...new Set(rows.flatMap(r=>[r.student_user_id,r.advisor_user_id].filter(Boolean) as string[]))];
  const courseIds=[...new Set(rows.map(r=>r.course_id).filter(Boolean) as string[])];
  const [profiles,courses]=await Promise.all([
    userIds.length ? supabase.from("profiles").select("id,full_name,institutional_email").in("id",userIds) : Promise.resolve({data:[],error:null}),
    courseIds.length ? supabase.from("courses").select("id,name,code").in("id",courseIds) : Promise.resolve({data:[],error:null}),
  ]);
  if(profiles.error) throw profiles.error;
  if(courses.error) throw courses.error;
  return { defenses:rows, profiles:profiles.data??[], courses:courses.data??[] };
}

export async function listProjects(account: CurrentAccount, axis?: string) {
  const supabase=await createClient();
  let projectQuery=supabase.from("institutional_projects")
    .select("id,axis,title,summary,details,call_reference,leader_user_id,status,open_for_applications,starts_on,ends_on,created_at")
    .order("created_at",{ascending:false}).limit(120);
  if(axis && ["teaching","research","extension"].includes(axis)) projectQuery=projectQuery.eq("axis",axis);
  const [projects,applications]=await Promise.all([
    projectQuery,
    supabase.from("project_applications").select("id,project_id,applicant_user_id,motivation,status,applied_at").order("applied_at",{ascending:false}).limit(240),
  ]);
  if(projects.error) throw projects.error;
  if(applications.error) throw applications.error;
  const projectRows=(projects.data??[]) as InstitutionalProject[];
  const appRows=(applications.data??[]) as ProjectApplication[];
  const userIds=[...new Set([...projectRows.map(p=>p.leader_user_id),...appRows.map(a=>a.applicant_user_id)])];
  const profiles=userIds.length ? await supabase.from("profiles").select("id,full_name,institutional_email").in("id",userIds) : {data:[],error:null};
  if(profiles.error) throw profiles.error;
  return { projects:projectRows, applications:appRows, profiles:profiles.data??[] };
}
