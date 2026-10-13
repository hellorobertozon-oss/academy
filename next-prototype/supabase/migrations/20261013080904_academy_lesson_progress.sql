-- Academy project only: aslzogstpyppmbdhvuss.
-- Employee lesson completions are immutable, visible to the employee and admins,
-- and can only be created for a lesson the employee can currently read.

create table public.lesson_completions (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id bigint not null references public.course_lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  points_awarded smallint not null default 10 check (points_awarded = 10),
  primary key (profile_id, lesson_id)
);

create index lesson_completions_lesson_id_idx
  on public.lesson_completions (lesson_id);

alter table public.lesson_completions enable row level security;

create policy lesson_completions_employee_and_admin_read
on public.lesson_completions for select to authenticated
using (
  profile_id = (select auth.uid())
  or (select private.is_admin())
);

revoke all on table public.lesson_completions from public, anon, authenticated;
grant select on table public.lesson_completions to authenticated;

create or replace function public.complete_academy_lesson(p_lesson_id bigint)
returns table (
  lesson_id bigint,
  completed_at timestamptz,
  points_awarded smallint,
  newly_completed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := (select auth.uid());
  v_completed_at timestamptz;
  v_points_awarded smallint;
  v_newly_completed boolean;
begin
  if v_profile_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_lesson_id is null or p_lesson_id <= 0 then
    raise exception 'A valid lesson ID is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = v_profile_id and profile.role = 'employee'
  ) then
    raise exception 'Employee access is required' using errcode = '42501';
  end if;

  if not (select private.employee_can_read_lesson(p_lesson_id)) then
    raise exception 'Lesson is not available to this employee' using errcode = '42501';
  end if;

  insert into public.lesson_completions as completion (profile_id, lesson_id)
  values (v_profile_id, p_lesson_id)
  on conflict on constraint lesson_completions_pkey do nothing
  returning completion.completed_at, completion.points_awarded
  into v_completed_at, v_points_awarded;

  v_newly_completed := found;

  if not v_newly_completed then
    select completion.completed_at, completion.points_awarded
    into v_completed_at, v_points_awarded
    from public.lesson_completions as completion
    where completion.profile_id = v_profile_id
      and completion.lesson_id = p_lesson_id;

    if not found then
      raise exception 'Lesson completion could not be recorded' using errcode = '40001';
    end if;
  end if;

  return query
  select p_lesson_id, v_completed_at, v_points_awarded, v_newly_completed;
end;
$$;

revoke all on function public.complete_academy_lesson(bigint) from public, anon, authenticated;
grant execute on function public.complete_academy_lesson(bigint) to authenticated;
