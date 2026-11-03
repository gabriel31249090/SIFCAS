-- Somente banco vazio/descartável. Base MÍNIMA SINTÉTICA, não baseline de produção.
create schema auth;
create role anon nologin;
create role authenticated nologin;
grant usage on schema auth,public to authenticated,anon;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant execute on function auth.uid() to authenticated,anon;
create table public.profiles(id uuid primary key, account_status text not null);
create table public.user_roles(user_id uuid primary key references public.profiles(id),role text not null);
create table public.classes(id uuid primary key);
create table public.class_subjects(id uuid primary key,class_id uuid not null references public.classes(id));
create table public.teaching_assignments(teacher_user_id uuid references public.profiles(id),class_subject_id uuid references public.class_subjects(id),primary key(teacher_user_id,class_subject_id));
create table public.enrollments(id uuid primary key,student_user_id uuid references public.profiles(id),class_id uuid references public.classes(id),status text not null);
insert into public.profiles values
 ('10000000-0000-0000-0000-000000000001','active'),('10000000-0000-0000-0000-000000000002','active'),
 ('10000000-0000-0000-0000-000000000003','active'),('10000000-0000-0000-0000-000000000004','active'),
 ('10000000-0000-0000-0000-000000000005','active'),('10000000-0000-0000-0000-000000000006','active'),('10000000-0000-0000-0000-000000000007','suspended');
insert into public.user_roles values
 ('10000000-0000-0000-0000-000000000001','teacher'),('10000000-0000-0000-0000-000000000002','teacher'),
 ('10000000-0000-0000-0000-000000000003','student'),('10000000-0000-0000-0000-000000000004','student'),
 ('10000000-0000-0000-0000-000000000005','manager'),('10000000-0000-0000-0000-000000000006','admin'),('10000000-0000-0000-0000-000000000007','teacher');
insert into public.classes values('20000000-0000-0000-0000-000000000001'),('20000000-0000-0000-0000-000000000002');
insert into public.class_subjects values('20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001'),('20000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002');
insert into public.teaching_assignments values('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003'),('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004'),('10000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000003');
insert into public.enrollments values('20000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','active'),('20000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','active');
