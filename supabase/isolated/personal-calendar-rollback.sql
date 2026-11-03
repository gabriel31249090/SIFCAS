-- Descartar cópias pessoais apenas em ambiente isolado, após avaliar retenção.
begin;
drop function if exists public.clear_personal_calendar();
drop function if exists public.import_personal_calendar(jsonb);
drop table if exists public.personal_calendar_events;
commit;
