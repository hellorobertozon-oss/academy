-- Academy project only: aslzogstpyppmbdhvuss.
-- Return a map-safe store directory without exposing employee profile or email rows.

create or replace function public.read_academy_store_directory()
returns table (
  store_id bigint,
  store_name text,
  street_address text,
  city text,
  postal_code text,
  country_code text,
  latitude double precision,
  longitude double precision,
  is_active boolean,
  employee_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  viewer_id uuid := (select auth.uid());
  viewer_is_admin boolean := (select private.is_admin());
  viewer_store_id bigint;
begin
  if viewer_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if not viewer_is_admin then
    select profile.store_id
    into viewer_store_id
    from public.profiles as profile
    where profile.id = viewer_id
      and profile.role = 'employee';

    if viewer_store_id is null then
      raise exception 'Employee store access is required' using errcode = '42501';
    end if;
  end if;

  return query
  select
    store.id,
    store.name,
    store.street_address,
    store.city,
    store.postal_code,
    store.country_code,
    store.latitude,
    store.longitude,
    store.is_active,
    nullif(btrim(
      coalesce(nullif(btrim(employee.first_name), ''), '') || ' ' ||
      coalesce(nullif(btrim(employee.last_name), ''), '')
    ), '')
  from public.stores as store
  left join public.profiles as employee
    on employee.store_id = store.id
   and employee.role = 'employee'
  where viewer_is_admin or store.id = viewer_store_id
  order by store.country_code, store.city, store.name, employee.first_name, employee.last_name;
end;
$$;

revoke all on function public.read_academy_store_directory() from public, anon, authenticated;
grant execute on function public.read_academy_store_directory() to authenticated;
