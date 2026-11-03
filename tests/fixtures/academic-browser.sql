-- Synthetic browser-only fixture. Not a remote baseline or institutional dataset.
alter table public.profiles add column full_name text not null default 'Pessoa sintética';
alter table public.profiles add column campus text not null default 'Campus de teste';
alter table public.profiles add column avatar_url text;
alter table public.profiles add column institutional_email text;
alter table public.user_roles add column is_general_admin boolean not null default false;
update public.profiles set full_name=case right(id::text,1)
  when '1' then 'Aurora Docente' when '2' then 'Nilo Docente' when '3' then 'Lia Estudante'
  when '4' then 'Caio Estudante' when '5' then 'Iara Gestora' when '6' then 'Admin Sintético' else 'Conta Suspensa' end;

create table public.campuses(id uuid primary key,code text,name text,city text,state text,active boolean default true);
create table public.courses(id uuid primary key,campus_id uuid references public.campuses(id),name text,code text,active boolean default true);
create table public.academic_periods(id uuid primary key,campus_id uuid references public.campuses(id),name text,year int,term int,status text,starts_on date,ends_on date);
create table public.subjects(id uuid primary key,course_id uuid references public.courses(id),name text,code text,workload_hours numeric default 80,active boolean default true);
insert into public.campuses values('30000000-0000-0000-0000-000000000001','TESTE','Campus de teste','Cáceres','MT',true);
insert into public.courses values('30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Curso sintético','SINT',true);
insert into public.academic_periods values('30000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','2026/2',2026,2,'active','2026-07-01','2026-12-31');
insert into public.subjects values('30000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000002','Matemática','MAT',80,true),('30000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000002','Física','FIS',80,true);
alter table public.classes add column name text;
alter table public.classes add column code text;
alter table public.classes add column shift text default 'morning';
alter table public.classes add column course_id uuid references public.courses(id);
alter table public.classes add column academic_period_id uuid references public.academic_periods(id);
alter table public.classes add column active boolean default true;
alter table public.classes add column capacity int default 30;
alter table public.classes add column created_at timestamptz default now();
update public.classes set name=case right(id::text,1) when '1' then 'Turma sintética A' else 'Turma sintética B' end,code=case right(id::text,1) when '1' then 'SINT-A' else 'SINT-B' end,course_id='30000000-0000-0000-0000-000000000002',academic_period_id='30000000-0000-0000-0000-000000000003';
alter table public.class_subjects add column subject_id uuid references public.subjects(id);
alter table public.class_subjects add column active boolean default true;
alter table public.class_subjects add column room text default 'Sala sintética';
alter table public.class_subjects add column created_at timestamptz default now();
update public.class_subjects set subject_id=case right(id::text,1) when '3' then '30000000-0000-0000-0000-000000000004'::uuid else '30000000-0000-0000-0000-000000000005'::uuid end;
alter table public.teaching_assignments add column id uuid default gen_random_uuid();
alter table public.teaching_assignments add column is_primary boolean default true;
alter table public.teaching_assignments add column created_at timestamptz default now();
alter table public.enrollments add column enrollment_number text;
alter table public.enrollments add column enrolled_at timestamptz default now();
alter table public.enrollments add column created_at timestamptz default now();
update public.enrollments set enrollment_number=case right(id::text,1) when '7' then '000001' else '000002' end;

create table public.class_schedules(id uuid primary key default gen_random_uuid(),class_subject_id uuid references public.class_subjects(id),weekday int,starts_at time,ends_at time,room text);
create table public.class_sessions(id uuid primary key default gen_random_uuid(),class_subject_id uuid references public.class_subjects(id),session_date date,starts_at time,ends_at time,content text,notes text default '',created_by uuid,created_at timestamptz default now());
create table public.academic_assessments(id uuid primary key default gen_random_uuid(),class_subject_id uuid references public.class_subjects(id),title text,description text default '',assessment_date date,max_score numeric,weight numeric default 1,created_by uuid,created_at timestamptz default now());
create table public.attendance_records(id uuid primary key default gen_random_uuid(),session_id uuid references public.class_sessions(id),student_user_id uuid references public.profiles(id),status text,unique(session_id,student_user_id));
create table public.grades(id uuid primary key default gen_random_uuid(),assessment_id uuid references public.academic_assessments(id),student_user_id uuid references public.profiles(id),score numeric,unique(assessment_id,student_user_id));
create table public.class_agenda_entries(id uuid primary key default gen_random_uuid(),class_subject_id uuid references public.class_subjects(id),entry_date date,starts_at time,entry_type text,title text,description text default '',status text default 'published');
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id),read_at timestamptz,title text,body text,created_at timestamptz default now());
create table public.service_requests(id uuid primary key default gen_random_uuid(),requester_user_id uuid,status text);
create table public.bug_reports(id uuid primary key default gen_random_uuid(),user_id uuid,status text);
create table public.user_shortcuts(id uuid primary key default gen_random_uuid(),user_id uuid,label text,href text,sort_order int,created_at timestamptz default now());
insert into public.class_schedules(class_subject_id,weekday,starts_at,ends_at,room) values('20000000-0000-0000-0000-000000000003',1,'08:00','09:40','Sala sintética');
insert into public.class_sessions(id,class_subject_id,session_date,starts_at,ends_at,content,created_by) values('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003',current_date,'08:00','09:40','Conteúdo sintético local','10000000-0000-0000-0000-000000000001');
insert into public.academic_assessments(id,class_subject_id,title,assessment_date,max_score,weight,created_by) values('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','Avaliação local sintética',current_date+1,10,1,'10000000-0000-0000-0000-000000000001');
insert into public.class_agenda_entries(class_subject_id,entry_date,starts_at,entry_type,title) values('20000000-0000-0000-0000-000000000003',current_date,'14:00','class','Planejamento local sintético');
insert into public.user_shortcuts(user_id,label,href,sort_order) values('10000000-0000-0000-0000-000000000001','Minhas turmas','/minhas-turmas',1),('10000000-0000-0000-0000-000000000003','Minha agenda','/agenda-aluno',1);

-- A scoped manager is supplied explicitly for the review workflow.
insert into public.academic_import_operator_scopes values('10000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000003');

create function public.fixture_can_class(p_class uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_status='active') and (
    exists(select 1 from public.teaching_assignments t join public.class_subjects cs on cs.id=t.class_subject_id where t.teacher_user_id=auth.uid() and cs.class_id=p_class)
    or exists(select 1 from public.enrollments e where e.student_user_id=auth.uid() and e.class_id=p_class and e.status='active')
    or exists(select 1 from public.academic_import_operator_scopes s join public.class_subjects cs on cs.id=s.class_subject_id where s.user_id=auth.uid() and cs.class_id=p_class)
  )
$$;
revoke all on function public.fixture_can_class(uuid) from public,anon;
grant execute on function public.fixture_can_class(uuid) to authenticated;
grant select on public.profiles,public.user_roles,public.campuses,public.courses,public.academic_periods,public.subjects,public.classes,public.class_subjects,public.teaching_assignments,public.enrollments,public.class_schedules,public.class_sessions,public.academic_assessments,public.attendance_records,public.grades,public.class_agenda_entries,public.notifications,public.service_requests,public.bug_reports,public.user_shortcuts to authenticated;
alter table public.profiles enable row level security;
create policy fixture_profile_read on public.profiles for select to authenticated using(id=auth.uid() or exists(select 1 from public.enrollments e where e.student_user_id=id and public.fixture_can_class(e.class_id)));
alter table public.user_roles enable row level security;
create policy fixture_role_read on public.user_roles for select to authenticated using(user_id=auth.uid());
alter table public.classes enable row level security;
create policy fixture_classes_read on public.classes for select to authenticated using(public.fixture_can_class(id));
alter table public.class_subjects enable row level security;
create policy fixture_subjects_read on public.class_subjects for select to authenticated using(public.fixture_can_class(class_id));
alter table public.enrollments enable row level security;
create policy fixture_enrollments_read on public.enrollments for select to authenticated using(student_user_id=auth.uid() or public.academic_import_can_access((select cs.id from public.class_subjects cs where cs.class_id=enrollments.class_id order by cs.id limit 1),true));
alter table public.teaching_assignments enable row level security;
create policy fixture_teachers_read on public.teaching_assignments for select to authenticated using(teacher_user_id=auth.uid());
alter table public.class_sessions enable row level security;
create policy fixture_sessions_read on public.class_sessions for select to authenticated using(exists(select 1 from public.class_subjects cs where cs.id=class_subject_id and public.fixture_can_class(cs.class_id)));
alter table public.academic_assessments enable row level security;
create policy fixture_assessments_read on public.academic_assessments for select to authenticated using(exists(select 1 from public.class_subjects cs where cs.id=class_subject_id and public.fixture_can_class(cs.class_id)));
alter table public.grades enable row level security;
create policy fixture_grades_read on public.grades for select to authenticated using(student_user_id=auth.uid() or exists(select 1 from public.academic_assessments a where a.id=assessment_id and public.academic_import_can_access(a.class_subject_id,true)));
alter table public.attendance_records enable row level security;
create policy fixture_attendance_read on public.attendance_records for select to authenticated using(student_user_id=auth.uid() or exists(select 1 from public.class_sessions s where s.id=session_id and public.academic_import_can_access(s.class_subject_id,true)));
alter table public.class_agenda_entries enable row level security;
create policy fixture_agenda_read on public.class_agenda_entries for select to authenticated using(exists(select 1 from public.class_subjects cs where cs.id=class_subject_id and public.fixture_can_class(cs.class_id)));
alter table public.class_schedules enable row level security;
create policy fixture_schedules_read on public.class_schedules for select to authenticated using(exists(select 1 from public.class_subjects cs where cs.id=class_subject_id and public.fixture_can_class(cs.class_id)));
alter table public.notifications enable row level security;
create policy fixture_notifications on public.notifications for select to authenticated using(user_id=auth.uid());
alter table public.user_shortcuts enable row level security;
create policy fixture_shortcuts on public.user_shortcuts for select to authenticated using(user_id=auth.uid());
alter table public.service_requests enable row level security;
create policy fixture_requests on public.service_requests for select to authenticated using(requester_user_id=auth.uid());
alter table public.bug_reports enable row level security;
create policy fixture_reports on public.bug_reports for select to authenticated using(user_id=auth.uid());
create function public.sifcas_health() returns jsonb language sql as $$select '{"status":"ok"}'::jsonb$$;
grant execute on function public.sifcas_health() to anon,authenticated;
