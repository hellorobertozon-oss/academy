-- Academy project only: aslzogstpyppmbdhvuss.
-- Employees can read only published courses assigned to them/their store and translated into their preferred language.

create table public.course_assignments (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.courses (id) on delete cascade,
  store_id bigint references public.stores (id) on delete restrict,
  profile_id uuid references public.profiles (id) on delete cascade,
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  check ((store_id is not null) <> (profile_id is not null))
);

create unique index course_assignments_course_store_idx
  on public.course_assignments (course_id, store_id)
  where store_id is not null;
create unique index course_assignments_course_profile_idx
  on public.course_assignments (course_id, profile_id)
  where profile_id is not null;
create index course_assignments_store_id_idx
  on public.course_assignments (store_id)
  where store_id is not null;
create index course_assignments_profile_id_idx
  on public.course_assignments (profile_id)
  where profile_id is not null;
create index course_assignments_assigned_by_idx on public.course_assignments (assigned_by);

create or replace function private.validate_academy_course_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
  target_store_active boolean;
begin
  if new.assigned_by is distinct from (select auth.uid()) then
    raise exception 'Assignment actor must match the authenticated user' using errcode = '42501';
  end if;

  if new.profile_id is not null then
    select profile.role
      into target_role
    from public.profiles as profile
    where profile.id = new.profile_id;

    if target_role is distinct from 'employee' then
      raise exception 'Course assignments can only target employees' using errcode = '23514';
    end if;
  else
    select store.is_active
      into target_store_active
    from public.stores as store
    where store.id = new.store_id;

    if target_store_active is distinct from true then
      raise exception 'Course assignments can only target active stores' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_academy_course_assignment() from public, anon, authenticated;

create trigger course_assignments_validate_target
before insert or update on public.course_assignments
for each row execute function private.validate_academy_course_assignment();

create or replace function private.current_academy_language()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select profile.preferred_language
  from public.profiles as profile
  where profile.id = (select auth.uid()) and profile.role = 'employee'
  limit 1;
$$;

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

create or replace function private.employee_can_read_course_version(p_version_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_versions as version
    where version.id = p_version_id
      and version.status = 'published'
      and (select private.can_read_assigned_course(version.course_id))
  );
$$;

create or replace function private.employee_can_read_module(p_module_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = p_module_id
      and version.status = 'published'
      and (select private.can_read_assigned_course(version.course_id))
      and exists (
        select 1 from public.module_translations as translation
        where translation.module_id = module.id
          and translation.language_code = (select private.current_academy_language())
      )
  );
$$;

create or replace function private.employee_can_read_lesson(p_lesson_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_lessons as lesson
    join public.course_modules as module on module.id = lesson.module_id
    join public.course_versions as version on version.id = module.course_version_id
    where lesson.id = p_lesson_id
      and version.status = 'published'
      and (select private.can_read_assigned_course(version.course_id))
      and exists (
        select 1 from public.module_translations as module_translation
        where module_translation.module_id = module.id
          and module_translation.language_code = (select private.current_academy_language())
      )
      and exists (
        select 1 from public.lesson_translations as lesson_translation
        where lesson_translation.lesson_id = lesson.id
          and lesson_translation.language_code = (select private.current_academy_language())
      )
  );
$$;

revoke all on function private.current_academy_language() from public, anon;
revoke all on function private.can_read_assigned_course(bigint) from public, anon;
revoke all on function private.employee_can_read_course_version(bigint) from public, anon;
revoke all on function private.employee_can_read_module(bigint) from public, anon;
revoke all on function private.employee_can_read_lesson(bigint) from public, anon;
grant execute on function private.current_academy_language() to authenticated;
grant execute on function private.can_read_assigned_course(bigint) to authenticated;
grant execute on function private.employee_can_read_course_version(bigint) to authenticated;
grant execute on function private.employee_can_read_module(bigint) to authenticated;
grant execute on function private.employee_can_read_lesson(bigint) to authenticated;

alter table public.course_assignments enable row level security;

create policy course_assignments_admin_manage
on public.course_assignments for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy courses_employee_assigned_read
on public.courses for select to authenticated
using ((select private.can_read_assigned_course(id)));

create policy course_versions_employee_published_read
on public.course_versions for select to authenticated
using ((select private.employee_can_read_course_version(id)));

create policy course_translations_employee_language_read
on public.course_translations for select to authenticated
using (
  language_code = (select private.current_academy_language())
  and (select private.employee_can_read_course_version(course_version_id))
);

create policy course_modules_employee_language_read
on public.course_modules for select to authenticated
using ((select private.employee_can_read_module(id)));

create policy module_translations_employee_language_read
on public.module_translations for select to authenticated
using (
  language_code = (select private.current_academy_language())
  and (select private.employee_can_read_module(module_id))
);

create policy course_lessons_employee_language_read
on public.course_lessons for select to authenticated
using ((select private.employee_can_read_lesson(id)));

create policy lesson_translations_employee_language_read
on public.lesson_translations for select to authenticated
using (
  language_code = (select private.current_academy_language())
  and (select private.employee_can_read_lesson(lesson_id))
);

revoke all on table public.course_assignments from public, anon, authenticated;
grant select, insert, delete on table public.course_assignments to authenticated;
grant usage, select on sequence public.course_assignments_id_seq to authenticated;
