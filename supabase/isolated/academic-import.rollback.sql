-- Desfaz SOMENTE a extensão isolada; snapshots importados serão descartados.
-- Exige backup e confirmação institucional se houver dados reais.
begin;
drop function if exists public.preview_academic_import(uuid,text,text,text,jsonb);
drop function if exists public.apply_academic_import(uuid);
drop function if exists public.cancel_academic_import(uuid);
drop function if exists public.purge_expired_academic_imports();
drop function if exists public.academic_import_validate(uuid,jsonb);
drop function if exists public.academic_import_conflicts(uuid,jsonb);
drop table if exists public.academic_import_audit,public.academic_import_records,public.academic_import_batches;
drop policy if exists diary_read on public.academic_import_diaries;
drop function if exists public.academic_import_can_access(uuid,boolean) cascade;
drop table if exists public.academic_import_student_links,public.academic_import_operator_scopes,public.academic_import_diaries;
commit;
