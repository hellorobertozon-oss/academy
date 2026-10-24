-- Academy project only: aslzogstpyppmbdhvuss.
-- Keep the RPC response shape stable; its legacy city column now contains the store name.

create or replace function public.read_academy_leaderboard()
returns table (
  leaderboard_position integer,
  display_name text,
  city text,
  total_points bigint,
  is_current_user boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_profile_id uuid := (select auth.uid());
begin
  if current_profile_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles as profile
    where profile.id = current_profile_id and profile.role = 'employee'
  ) then
    raise exception 'Employee access is required' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.academy_settings as settings
    where settings.id and settings.leaderboard_enabled
  ) then
    return;
  end if;

  return query
  with employee_points as (
    select
      profile.id as profile_id,
      coalesce(nullif(btrim(profile.first_name), ''), 'Pracownik')
        || case
          when nullif(btrim(profile.last_name), '') is null then ''
          else ' ' || upper(left(btrim(profile.last_name), 1)) || '.'
        end as employee_display_name,
      nullif(btrim(store.name), '') as employee_store_name,
      coalesce(lesson_points.points, 0) + coalesce(quiz_points.points, 0) as employee_total_points
    from public.profiles as profile
    left join public.stores as store on store.id = profile.store_id
    left join lateral (
      select coalesce(sum(completion.points_awarded), 0)::bigint as points
      from public.lesson_completions as completion
      where completion.profile_id = profile.id
    ) as lesson_points on true
    left join lateral (
      select coalesce(sum(attempt.points_awarded), 0)::bigint as points
      from public.quiz_attempts as attempt
      where attempt.profile_id = profile.id
    ) as quiz_points on true
    where profile.role = 'employee'
  ), ranked_employees as (
    select
      row_number() over (
        order by employee_total_points desc, employee_display_name asc, profile_id asc
      )::integer as position,
      profile_id,
      employee_display_name,
      employee_store_name,
      employee_total_points
    from employee_points
  )
  select
    ranked_employees.position,
    ranked_employees.employee_display_name,
    ranked_employees.employee_store_name,
    ranked_employees.employee_total_points,
    ranked_employees.profile_id = current_profile_id
  from ranked_employees
  order by ranked_employees.position;
end;
$$;

revoke all on function public.read_academy_leaderboard() from public, anon, authenticated;
grant execute on function public.read_academy_leaderboard() to authenticated;
