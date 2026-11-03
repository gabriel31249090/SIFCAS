-- CONTRATO DE HOMOLOGAÇÃO ISOLADA. Não aplicar na produção sem inventário/baseline real.
-- Pré-requisitos usados pelo código existente: profiles, user_roles, classes,
-- class_subjects, enrollments e teaching_assignments. Nenhuma dessas tabelas é alterada.
begin;

create table public.academic_import_diaries (
  id uuid primary key default gen_random_uuid(),
  class_subject_id uuid not null references public.class_subjects(id),
  instance text not null check (instance in ('https://suap.ifmt.edu.br', 'https://online.ifmt.edu.br', 'sifcas-layout')),
  external_id text not null check (length(external_id) between 1 and 160),
  period text not null check (length(period) between 1 and 160),
  label text not null,
  updated_at timestamptz,
  unique(instance,external_id,period)
);
-- Somente operadores de homologação podem cadastrar estes mapas. Arquivo nunca cria autorização.
create table public.academic_import_student_links (
  diary_id uuid not null references public.academic_import_diaries(id),
  external_id text not null,
  enrollment_id uuid not null references public.enrollments(id),
  primary key(diary_id,external_id), unique(diary_id,enrollment_id)
);
create table public.academic_import_operator_scopes (
  user_id uuid not null references public.profiles(id),
  class_subject_id uuid not null references public.class_subjects(id),
  primary key(user_id,class_subject_id)
);
create table public.academic_import_batches (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references public.academic_import_diaries(id),
  owner_id uuid not null references public.profiles(id),
  payload_hash text not null,
  filename text not null check(length(filename) <= 255),
  status text not null default 'preview' check(status in ('preview','applied','cancelled','expired')),
  payload jsonb,
  total_rows int not null,
  inserted_rows int not null default 0,
  unchanged_rows int not null default 0,
  conflicts jsonb not null default '[]',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  applied_at timestamptz
);
create unique index academic_import_batch_idempotency on public.academic_import_batches(owner_id,diary_id,payload_hash) where status in ('preview','applied');
create table public.academic_import_records (
  diary_id uuid not null references public.academic_import_diaries(id),
  kind text not null check(kind in ('diary','enrollment','session','attendance','assessment','grade','schedule','event')),
  external_id text not null,
  student_user_id uuid references public.profiles(id),
  student_external_id text,
  payload jsonb not null,
  content_hash text not null,
  batch_id uuid not null references public.academic_import_batches(id),
  collected_at timestamptz not null default now(),
  primary key(diary_id,kind,external_id)
);
create table public.academic_import_audit (
  id bigint generated always as identity primary key,
  batch_id uuid not null references public.academic_import_batches(id),
  actor_id uuid not null,
  action text not null check(action in ('preview','applied','cancelled','expired')),
  record_count int not null,
  created_at timestamptz not null default now()
);
create unique index imported_enrollment_unique on public.academic_import_records(diary_id,student_user_id) where kind='enrollment';
create unique index imported_grade_unique on public.academic_import_records(diary_id,student_user_id,(payload->>'assessment_id')) where kind='grade';
create unique index imported_attendance_unique on public.academic_import_records(diary_id,student_user_id,(payload->>'session_id')) where kind='attendance';

create function public.academic_import_can_access(p_class_subject_id uuid,p_write boolean default false)
returns boolean language sql stable security definer set search_path = pg_catalog,public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_status='active') and (
    exists(select 1 from public.teaching_assignments t join public.user_roles r on r.user_id=t.teacher_user_id
      where t.teacher_user_id=auth.uid() and t.class_subject_id=p_class_subject_id and r.role='teacher')
    or exists(select 1 from public.academic_import_operator_scopes s join public.user_roles r on r.user_id=s.user_id
      where s.user_id=auth.uid() and s.class_subject_id=p_class_subject_id and r.role in ('manager','admin'))
    or (not p_write and exists(select 1 from public.enrollments e join public.class_subjects cs on cs.class_id=e.class_id
      where e.student_user_id=auth.uid() and e.status='active' and cs.id=p_class_subject_id))
  )
$$;

alter table public.academic_import_diaries enable row level security;
alter table public.academic_import_student_links enable row level security;
alter table public.academic_import_operator_scopes enable row level security;
alter table public.academic_import_batches enable row level security;
alter table public.academic_import_records enable row level security;
alter table public.academic_import_audit enable row level security;
create policy diary_read on public.academic_import_diaries for select to authenticated using(public.academic_import_can_access(class_subject_id));
create policy batch_owner on public.academic_import_batches for select to authenticated using(owner_id=auth.uid() and exists(select 1 from public.academic_import_diaries d where d.id=diary_id and public.academic_import_can_access(d.class_subject_id,true)));
create policy imported_record_read on public.academic_import_records for select to authenticated using(
  exists(select 1 from public.academic_import_diaries d where d.id=diary_id and public.academic_import_can_access(d.class_subject_id))
  and (student_user_id is null or student_user_id=auth.uid() or exists(select 1 from public.academic_import_diaries d where d.id=diary_id and public.academic_import_can_access(d.class_subject_id,true)))
);
create policy import_audit_owner on public.academic_import_audit for select to authenticated using(
  actor_id=auth.uid() and exists(select 1 from public.academic_import_batches b where b.id=batch_id)
);
revoke all on public.academic_import_diaries,public.academic_import_student_links,public.academic_import_operator_scopes,public.academic_import_batches,public.academic_import_records,public.academic_import_audit from anon,authenticated;
-- Payload de prévia só é exposto ao dono. Nenhuma escrita direta via API.
grant select on public.academic_import_diaries,public.academic_import_batches,public.academic_import_records,public.academic_import_audit to authenticated;

create function public.academic_import_validate(p_diary_id uuid,p_records jsonb)
returns void language plpgsql security definer set search_path = pg_catalog,public as $$
declare r jsonb; p jsonb; k text; student uuid; grade_max numeric; cs uuid; classid uuid; allowed text[];
begin
  select d.class_subject_id,c.class_id into cs,classid from public.academic_import_diaries d join public.class_subjects c on c.id=d.class_subject_id where d.id=p_diary_id;
  if cs is null or not public.academic_import_can_access(cs,true) then raise exception 'Sem permissão para este diário.' using errcode='42501'; end if;
  if jsonb_typeof(p_records)<>'array' or jsonb_array_length(p_records) not between 1 and 10000 or octet_length(p_records::text)>2000000 then raise exception 'Lote inválido ou excede os limites.'; end if;
  if (select count(*) from jsonb_array_elements(p_records) x where x->>'kind'='diary')<>1 then raise exception 'Um único diário é obrigatório.'; end if;
  if exists(select 1 from jsonb_array_elements(p_records) x group by x->>'kind',x->>'external_id' having count(*)>1) then raise exception 'Identificadores duplicados.'; end if;
  if exists(select 1 from jsonb_array_elements(p_records) x where x->>'kind'='enrollment' group by x->>'student_external_id' having count(*)>1)
    or exists(select 1 from jsonb_array_elements(p_records) x where x->>'kind'='grade' group by x->>'student_external_id',x->'payload'->>'assessment_id' having count(*)>1)
    or exists(select 1 from jsonb_array_elements(p_records) x where x->>'kind'='attendance' group by x->>'student_external_id',x->'payload'->>'session_id' having count(*)>1) then raise exception 'Registros acadêmicos duplicados para a mesma matrícula/aula/avaliação.'; end if;
  for r in select value from jsonb_array_elements(p_records) loop
    k:=r->>'kind'; p:=r->'payload';
    if k is null or k not in ('diary','enrollment','session','attendance','assessment','grade','schedule','event') or coalesce(jsonb_typeof(p),'')<>'object' or coalesce(jsonb_typeof(r->'external_id'),'')<>'string' or length(coalesce(r->>'external_id','')) not between 1 and 160 or (r->>'external_id') ~ '[[:cntrl:]]|^[=+@-]' or length(p::text)>10000 then raise exception 'Registro inválido.'; end if;
    if exists(select 1 from jsonb_each(p) v where jsonb_typeof(v.value) not in ('string','number','null')) then raise exception 'Valor não escalar no payload.'; end if;
    if exists(select 1 from jsonb_object_keys(r) key where key not in ('kind','external_id','student_external_id','payload','source_row')) then raise exception 'Campo de registro não permitido.'; end if;
    allowed:=case k when 'diary' then array['title'] when 'enrollment' then array['status'] when 'session' then array['date','starts_at','ends_at','content'] when 'attendance' then array['status','session_id'] when 'assessment' then array['title','date','max_score','weight'] when 'grade' then array['assessment_id','status','score'] when 'schedule' then array['starts_at','ends_at','weekday','room'] when 'event' then array['title','date','starts_at','ends_at','content','url'] end;
    if exists(select 1 from jsonb_object_keys(p) key where not (key=any(allowed))) then raise exception 'Campo sensível ou desconhecido no payload.'; end if;
    if k in ('enrollment','attendance','grade') then
      if coalesce(jsonb_typeof(r->'student_external_id'),'')<>'string' then raise exception 'Identificador de estudante precisa ser texto.'; end if;
      select e.student_user_id into student from public.academic_import_student_links l join public.enrollments e on e.id=l.enrollment_id
        where l.diary_id=p_diary_id and l.external_id=r->>'student_external_id' and e.class_id=classid and e.status='active';
      if student is null then raise exception 'Vínculo de estudante ausente ou fora da turma.' using errcode='23514'; end if;
    elsif r->>'student_external_id' is not null then raise exception 'Estudante indevido no registro.'; end if;
    if k in ('diary','assessment','event') and length(coalesce(p->>'title','')) not between 1 and 160 then raise exception 'Título inválido.'; end if;
    if k in ('session','assessment','event') then
      if coalesce(p->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.'; end if;
      perform (p->>'date')::date;
    end if;
    if k in ('session','schedule','event') then
      if ((p->>'starts_at') is not null and (p->>'starts_at') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') or ((p->>'ends_at') is not null and (p->>'ends_at') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') or ((p->>'starts_at') >= (p->>'ends_at')) then raise exception 'Horário inválido.'; end if;
    end if;
    if k='session' and length(coalesce(p->>'content','')) not between 1 and 5000 then raise exception 'Conteúdo inválido.'; end if;
    if k='enrollment' and coalesce(p->>'status','') not in ('active','inactive') then raise exception 'Matrícula inválida.'; end if;
    if k='attendance' then
      if coalesce(p->>'status','') not in ('present','absent','late','justified') or not exists(select 1 from jsonb_array_elements(p_records) x where x->>'kind'='session' and x->>'external_id'=p->>'session_id') then raise exception 'Chamada inválida ou sem aula.'; end if;
    end if;
    if k in ('grade','attendance') and not exists(select 1 from jsonb_array_elements(p_records) x where x->>'kind'='enrollment' and x->>'student_external_id'=r->>'student_external_id') then raise exception 'Registro sem matrícula no lote.'; end if;
    if k='assessment' then
      if coalesce(jsonb_typeof(p->'max_score'),'')<>'number' or (p->>'max_score')::numeric not between 0.0001 and 1000 or coalesce(jsonb_typeof(p->'weight'),'')<>'number' or (p->>'weight')::numeric not between 0.0001 and 1000 then raise exception 'Escala inválida.'; end if;
    end if;
    if k='grade' then
      select (x->'payload'->>'max_score')::numeric into grade_max from jsonb_array_elements(p_records) x where x->>'kind'='assessment' and x->>'external_id'=p->>'assessment_id';
      if grade_max is null or coalesce(p->>'status','') not in ('graded','missing','exempt','unreported') then raise exception 'Nota sem avaliação ou estado válido.'; end if;
      if p->>'status'='graded' then
        if coalesce(jsonb_typeof(p->'score'),'')<>'number' or (p->>'score')::numeric not between 0 and grade_max then raise exception 'Nota excede escala persistida no lote.'; end if;
      elsif p->>'score' is not null then raise exception 'Estado sem nota contém valor.'; end if;
    end if;
    if k='schedule' and (coalesce(p->>'weekday','') !~ '^[0-6]$' or p->>'starts_at' is null or p->>'ends_at' is null) then raise exception 'Grade horária inválida.'; end if;
    if k='event' and p->>'url' is not null and p->>'url' !~ '^https://(online|suap)\.ifmt\.edu\.br/[^?#]*$' then raise exception 'Link não permitido.'; end if;
  end loop;
end $$;

create function public.academic_import_conflicts(p_diary_id uuid,p_records jsonb)
returns jsonb language sql stable security definer set search_path=pg_catalog,public as $$
  with incoming as (
    select x, e.student_user_id student from jsonb_array_elements(p_records) x
      left join public.academic_import_student_links l on l.diary_id=p_diary_id and l.external_id=x->>'student_external_id'
      left join public.enrollments e on e.id=l.enrollment_id
  ) select coalesce(jsonb_agg(jsonb_build_object('kind',i.x->>'kind','external_id',i.x->>'external_id','reason','Registro existente divergente ou identidade duplicada; preservado.')),'[]')
    from incoming i join public.academic_import_records a on a.diary_id=p_diary_id and a.kind=i.x->>'kind' and (
      a.external_id=i.x->>'external_id'
      or (a.student_user_id=i.student and (a.kind='enrollment'
        or (a.kind='grade' and a.payload->>'assessment_id'=i.x->'payload'->>'assessment_id')
        or (a.kind='attendance' and a.payload->>'session_id'=i.x->'payload'->>'session_id')))
    ) where a.external_id<>i.x->>'external_id' or a.payload<>i.x->'payload' or a.student_user_id is distinct from i.student
$$;

create function public.preview_academic_import(p_diary_id uuid,p_external_id text,p_period text,p_filename text,p_records jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog,public as $$
declare batchid uuid; fingerprint text; conflicts jsonb; d public.academic_import_diaries;
begin
  select * into d from public.academic_import_diaries where id=p_diary_id;
  if d.id is null or not public.academic_import_can_access(d.class_subject_id,true) then raise exception 'Sem permissão para este diário.' using errcode='42501'; end if;
  if d.external_id is distinct from p_external_id or d.period is distinct from p_period then raise exception 'Diário/período do arquivo diverge do vínculo verificado.'; end if;
  perform public.academic_import_validate(p_diary_id,p_records);
  perform pg_advisory_xact_lock(hashtext(p_diary_id::text));
  update public.academic_import_batches set status='expired',payload=null where owner_id=auth.uid() and status='preview' and expires_at<now();
  fingerprint:=encode(sha256(convert_to(p_records::text,'UTF8')),'hex');
  select id into batchid from public.academic_import_batches where owner_id=auth.uid() and diary_id=p_diary_id and payload_hash=fingerprint and status in ('preview','applied');
  if batchid is not null then return batchid; end if;
  conflicts:=public.academic_import_conflicts(p_diary_id,p_records);
  insert into public.academic_import_batches(diary_id,owner_id,payload_hash,filename,payload,total_rows,conflicts) values(p_diary_id,auth.uid(),fingerprint,left(p_filename,255),p_records,jsonb_array_length(p_records),conflicts) returning id into batchid;
  insert into public.academic_import_audit(batch_id,actor_id,action,record_count) values(batchid,auth.uid(),'preview',jsonb_array_length(p_records));
  return batchid;
end $$;

create function public.apply_academic_import(p_batch_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog,public as $$
declare b public.academic_import_batches; d public.academic_import_diaries; inserted int; unchanged int;
begin
  select * into b from public.academic_import_batches where id=p_batch_id and owner_id=auth.uid();
  if b.id is null then raise exception 'Lote não encontrado.' using errcode='42501'; end if;
  -- Mesma ordem da prévia: diário antes do bloqueio da linha do lote.
  perform pg_advisory_xact_lock(hashtext(b.diary_id::text));
  select * into b from public.academic_import_batches where id=p_batch_id and owner_id=auth.uid() for update;
  select * into d from public.academic_import_diaries where id=b.diary_id;
  if not public.academic_import_can_access(d.class_subject_id,true) then raise exception 'Permissão revogada.' using errcode='42501'; end if;
  if b.status='applied' then return jsonb_build_object('id',b.id,'status','applied','inserted',b.inserted_rows,'unchanged',b.unchanged_rows); end if;
  if b.status<>'preview' or b.expires_at<=now() then raise exception 'Lote cancelado ou expirado; gere nova prévia.'; end if;
  perform public.academic_import_validate(b.diary_id,b.payload);
  if jsonb_array_length(public.academic_import_conflicts(b.diary_id,b.payload))>0 then raise exception 'Conflito: nenhum registro foi alterado. Revise o arquivo.'; end if;
  insert into public.academic_import_records(diary_id,kind,external_id,student_user_id,student_external_id,payload,content_hash,batch_id)
    select b.diary_id,x->>'kind',x->>'external_id',e.student_user_id,x->>'student_external_id',x->'payload',encode(sha256(convert_to((x->'payload')::text,'UTF8')),'hex'),b.id
    from jsonb_array_elements(b.payload) x left join public.academic_import_student_links l on l.diary_id=b.diary_id and l.external_id=x->>'student_external_id' left join public.enrollments e on e.id=l.enrollment_id
    on conflict(diary_id,kind,external_id) do nothing;
  get diagnostics inserted = row_count;
  unchanged:=b.total_rows-inserted;
  update public.academic_import_batches set status='applied',payload=null,inserted_rows=inserted,unchanged_rows=unchanged,applied_at=now() where id=b.id;
  update public.academic_import_diaries set updated_at=now() where id=b.diary_id;
  insert into public.academic_import_audit(batch_id,actor_id,action,record_count) values(b.id,auth.uid(),'applied',inserted);
  return jsonb_build_object('id',b.id,'status','applied','inserted',inserted,'unchanged',unchanged);
end $$;

create function public.cancel_academic_import(p_batch_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog,public as $$
declare b public.academic_import_batches;
begin
  select * into b from public.academic_import_batches where id=p_batch_id and owner_id=auth.uid() for update;
  if b.id is null or not exists(select 1 from public.academic_import_diaries d where d.id=b.diary_id and public.academic_import_can_access(d.class_subject_id,true)) then raise exception 'Sem permissão.' using errcode='42501'; end if;
  if b.status='applied' then raise exception 'Lote já aplicado não pode ser cancelado.'; end if;
  update public.academic_import_batches set status='cancelled',payload=null where id=b.id;
  insert into public.academic_import_audit(batch_id,actor_id,action,record_count) values(b.id,auth.uid(),'cancelled',0);
end $$;

-- Executar pelo operador em agendamento no ambiente homologado; descarta payloads vencidos.
create function public.purge_expired_academic_imports() returns bigint language plpgsql security definer set search_path = pg_catalog,public as $$
declare removed bigint;
begin
  update public.academic_import_batches set status='expired',payload=null where status='preview' and expires_at<=now();
  get diagnostics removed=row_count;
  return removed;
end $$;

revoke all on function public.academic_import_validate(uuid,jsonb),public.academic_import_conflicts(uuid,jsonb),public.purge_expired_academic_imports() from public,anon,authenticated;
revoke all on function public.academic_import_can_access(uuid,boolean),public.preview_academic_import(uuid,text,text,text,jsonb),public.apply_academic_import(uuid),public.cancel_academic_import(uuid) from public,anon,authenticated;
grant execute on function public.academic_import_can_access(uuid,boolean),public.preview_academic_import(uuid,text,text,text,jsonb),public.apply_academic_import(uuid),public.cancel_academic_import(uuid) to authenticated;
commit;
