-- Apply only after confirming the SIFCAS schema and role table in the target project.
-- This narrowly replaces the profiles UPDATE that is commonly blocked by profile RLS.
create or replace function public.admin_set_account_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  target_is_general_admin boolean := false;
  target_exists boolean := false;
begin
  if p_user_id is null then
    raise exception using errcode = '22023', message = 'User ID is required';
  end if;

  if auth.uid() is null or not exists (
    select 1
    from public.profiles actor
    join public.user_roles actor_role on actor_role.user_id = actor.id
    where actor.id = auth.uid()
      and actor.account_status = 'active'
      and actor_role.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Active administrator role required';
  end if;

  if p_status is null or p_status not in ('active', 'pending', 'suspended') then
    raise exception using errcode = '22023', message = 'Invalid account status';
  end if;

  if p_user_id = auth.uid() and p_status = 'suspended' then
    raise exception using errcode = '42501', message = 'Self-suspension is not allowed';
  end if;

  select coalesce(role_row.is_general_admin, false), true
  into target_is_general_admin, target_exists
  from public.user_roles role_row
  where role_row.user_id = p_user_id
  for update;

  if not target_exists then
    raise exception using errcode = 'P0002', message = 'Target account role not found';
  end if;

  if target_is_general_admin and p_status = 'suspended' then
    raise exception using errcode = '42501', message = 'General administrator cannot be suspended here';
  end if;

  perform 1
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Target account profile not found';
  end if;

  update public.profiles
  set account_status = p_status,
      updated_at = clock_timestamp()
  where id = p_user_id;

  if p_status = 'active' then
    update public.user_roles
    set role_source = 'manual',
        updated_at = clock_timestamp()
    where user_id = p_user_id
      and role_source = 'unverified';
  end if;
end;
$$;

revoke all on function public.admin_set_account_status(uuid, text) from public, anon;
grant execute on function public.admin_set_account_status(uuid, text) to authenticated;
