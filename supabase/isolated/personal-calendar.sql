-- Extensão independente, somente para banco isolado; compatibilidade remota pendente.
begin;
create table public.personal_calendar_events (
  owner_id uuid not null references public.profiles(id),
  uid text not null check(length(uid) between 1 and 200),
  title text not null check(length(title) between 1 and 300),
  event_date date not null,
  event_time time,
  timezone text check(timezone in ('UTC','America/Cuiaba')),
  cancelled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(owner_id,uid),
  check((event_time is null) = (timezone is null))
);
alter table public.personal_calendar_events enable row level security;
revoke all on public.personal_calendar_events from anon,authenticated;
grant select on public.personal_calendar_events to authenticated;
create policy personal_calendar_owner on public.personal_calendar_events for select to authenticated using(
  owner_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.account_status='active')
);

create function public.import_personal_calendar(p_events jsonb)
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare item jsonb; actor uuid:=auth.uid(); event_count integer;
begin
  if actor is null or not exists(select 1 from public.profiles where id=actor and account_status='active') then
    raise exception 'Conta ativa obrigatória.' using errcode='42501';
  end if;
  if jsonb_typeof(p_events) is distinct from 'array' then raise exception 'Calendário inválido.'; end if;
  event_count:=jsonb_array_length(p_events);
  if event_count not between 1 and 500 or octet_length(p_events::text)>768000 then raise exception 'Calendário excede os limites.'; end if;
  if exists(select 1 from jsonb_array_elements(p_events) e group by e->>'uid' having count(*)>1) then raise exception 'UID duplicado.'; end if;
  -- Serializa reimportações da mesma conta sem aceitar proprietário do formulário.
  perform pg_advisory_xact_lock(hashtextextended(actor::text,918));
  for item in select value from jsonb_array_elements(p_events) loop
    if jsonb_typeof(item) is distinct from 'object'
      or jsonb_typeof(item->'uid') is distinct from 'string'
      or jsonb_typeof(item->'title') is distinct from 'string'
      or jsonb_typeof(item->'date') is distinct from 'string'
      or jsonb_typeof(item->'cancelled') is distinct from 'boolean'
      or not (item ?& array['time','timezone'])
      or exists(select 1 from jsonb_object_keys(item) k where k not in ('uid','title','date','time','timezone','cancelled'))
      or length(item->>'uid') not between 1 and 200 or length(item->>'title') not between 1 and 300
      or (item->>'uid') ~ '[[:cntrl:]]' or (item->>'title') ~ '[[:cntrl:]]'
      or ((item->>'uid')||(item->>'title')) ~* 'https?:|token[=:]|auth[=:]'
      or (item->>'date') !~ '^\d{4}-\d{2}-\d{2}$'
    then raise exception 'Evento inválido.'; end if;
    perform (item->>'date')::date;
    if item->>'time' is null then
      if item->>'timezone' is not null then raise exception 'Data sem horário não tem fuso.'; end if;
    elsif coalesce(item->>'timezone','') not in ('UTC','America/Cuiaba') or (item->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$' then raise exception 'Horário ou fuso inválido.';
    end if;
    insert into public.personal_calendar_events(owner_id,uid,title,event_date,event_time,timezone,cancelled)
      values(actor,item->>'uid',item->>'title',(item->>'date')::date,(item->>'time')::time,item->>'timezone',(item->>'cancelled')::boolean)
      on conflict(owner_id,uid) do update set title=excluded.title,event_date=excluded.event_date,event_time=excluded.event_time,
        timezone=excluded.timezone,cancelled=excluded.cancelled,updated_at=now();
  end loop;
  return event_count;
end $$;
revoke all on function public.import_personal_calendar(jsonb) from public,anon;
grant execute on function public.import_personal_calendar(jsonb) to authenticated;

create function public.clear_personal_calendar() returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if auth.uid() is null then raise exception 'Conta obrigatória.' using errcode='42501'; end if;
  delete from public.personal_calendar_events where owner_id=auth.uid();
end $$;
revoke all on function public.clear_personal_calendar() from public,anon;
grant execute on function public.clear_personal_calendar() to authenticated;
commit;
