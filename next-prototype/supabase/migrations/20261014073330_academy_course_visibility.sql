alter table public.courses
  add column is_active boolean not null default true;

comment on column public.courses.is_active is
  'Controls whether an already published course is visible to assigned employees.';

create or replace function private.can_read_assigned_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    join public.courses as course on course.id = p_course_id
    where profile.id = (select auth.uid())
      and profile.role = 'employee'
      and course.is_active
      and course.published_version_id is not null
      and (
        exists (
          select 1 from public.course_assignments as assignment
          where assignment.course_id = course.id and assignment.profile_id = profile.id
        )
        or exists (
          select 1 from public.course_assignments as assignment
          where assignment.course_id = course.id and assignment.store_id = profile.store_id
        )
      )
      and exists (
        select 1 from public.course_translations as translation
        where translation.course_version_id = course.published_version_id
          and translation.language_code = profile.preferred_language
      )
  );
$$;

revoke all on function private.can_read_assigned_course(bigint) from public, anon;
grant execute on function private.can_read_assigned_course(bigint) to authenticated;

create or replace function public.set_academy_course_active(
  p_course_id bigint,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select coalesce(private.is_admin(), false)) is not true then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_course_id is null or p_is_active is null then
    raise exception 'Course ID and visibility are required' using errcode = '22023';
  end if;

  update public.courses
  set is_active = p_is_active,
      updated_at = now()
  where id = p_course_id
    and published_version_id is not null;

  if not found then
    raise exception 'Course must be published before visibility can be changed' using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.set_academy_course_active(bigint, boolean) from public, anon;
grant execute on function public.set_academy_course_active(bigint, boolean) to authenticated;
