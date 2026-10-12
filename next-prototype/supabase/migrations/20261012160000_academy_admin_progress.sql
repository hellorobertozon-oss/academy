-- Academy project only: aslzogstpyppmbdhvuss.
-- Admins can review assigned employees' progress without client-side cross-table reads.

create or replace function public.read_academy_admin_progress()
returns table (
  employee_email text,
  employee_name text,
  store_id bigint,
  store_name text,
  store_city text,
  course_slug text,
  course_title text,
  module_id bigint,
  module_title text,
  completed_lesson_count integer,
  lesson_count integer,
  passed_quiz_count integer,
  quiz_attempt_count integer,
  latest_quiz_score smallint,
  last_activity_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_profile_id uuid := (select auth.uid());
begin
  if current_profile_id is null or not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  return query
  with assigned_courses as (
    select
      employee.id as employee_id,
      employee.email as employee_email,
      coalesce(
        nullif(btrim(employee.first_name), '') || case
          when nullif(btrim(employee.last_name), '') is null then ''
          else ' ' || btrim(employee.last_name)
        end,
        'Nieuzupełniony profil'
      ) as employee_name,
      employee.preferred_language,
      store.id as store_id,
      store.name as store_name,
      store.city as store_city,
      course.id as course_id,
      course.slug as course_slug,
      course.default_language_code,
      course.published_version_id as course_version_id,
      course_translation.title as course_title
    from public.profiles as employee
    join public.stores as store on store.id = employee.store_id
    join public.courses as course on course.published_version_id is not null
    join public.course_translations as course_translation
      on course_translation.course_version_id = course.published_version_id
     and course_translation.language_code = course.default_language_code
    where employee.role = 'employee'
      and exists (
        select 1 from public.course_translations as employee_course_translation
        where employee_course_translation.course_version_id = course.published_version_id
          and employee_course_translation.language_code = employee.preferred_language
      )
      and exists (
        select 1 from public.course_assignments as assignment
        where assignment.course_id = course.id
          and (assignment.profile_id = employee.id or assignment.store_id = employee.store_id)
      )
  ), assigned_modules as (
    select
      assigned_course.*,
      module.id as module_id,
      module.sort_order as module_sort_order,
      module_translation.title as module_title
    from assigned_courses as assigned_course
    join public.course_modules as module
      on module.course_version_id = assigned_course.course_version_id
    join public.module_translations as module_translation
      on module_translation.module_id = module.id
     and module_translation.language_code = assigned_course.default_language_code
    where exists (
      select 1 from public.module_translations as employee_module_translation
      where employee_module_translation.module_id = module.id
        and employee_module_translation.language_code = assigned_course.preferred_language
    )
  ), lesson_progress as (
    select
      assigned_module.employee_id,
      assigned_module.module_id,
      count(lesson.id)::integer as lesson_count,
      count(completion.lesson_id)::integer as completed_lesson_count,
      max(completion.completed_at) as last_lesson_completed_at
    from assigned_modules as assigned_module
    left join public.course_lessons as lesson on lesson.module_id = assigned_module.module_id
    left join public.lesson_translations as lesson_translation
      on lesson_translation.lesson_id = lesson.id
     and lesson_translation.language_code = assigned_module.preferred_language
    left join public.lesson_completions as completion
      on completion.lesson_id = lesson.id
     and completion.profile_id = assigned_module.employee_id
    where lesson.id is null or lesson_translation.lesson_id is not null
    group by assigned_module.employee_id, assigned_module.module_id
  ), quiz_progress as (
    select
      assigned_module.employee_id,
      assigned_module.module_id,
      count(distinct attempt.quiz_id) filter (where attempt.passed)::integer as passed_quiz_count,
      count(attempt.id)::integer as quiz_attempt_count,
      (array_agg(attempt.score_percentage order by attempt.submitted_at desc, attempt.id desc)
        filter (where attempt.id is not null))[1] as latest_quiz_score,
      max(attempt.submitted_at) as last_quiz_attempt_at
    from assigned_modules as assigned_module
    left join public.quizzes as quiz
      on quiz.course_version_id = assigned_module.course_version_id
     and (
       quiz.module_id = assigned_module.module_id
       or exists (
         select 1 from public.course_lessons as quiz_lesson
         where quiz_lesson.id = quiz.lesson_id
           and quiz_lesson.module_id = assigned_module.module_id
       )
     )
    left join public.quiz_attempts as attempt
      on attempt.quiz_id = quiz.id
     and attempt.profile_id = assigned_module.employee_id
    group by assigned_module.employee_id, assigned_module.module_id
  )
  select
    assigned_module.employee_email,
    assigned_module.employee_name,
    assigned_module.store_id,
    assigned_module.store_name,
    assigned_module.store_city,
    assigned_module.course_slug,
    assigned_module.course_title,
    assigned_module.module_id,
    assigned_module.module_title,
    lesson_progress.completed_lesson_count,
    lesson_progress.lesson_count,
    quiz_progress.passed_quiz_count,
    quiz_progress.quiz_attempt_count,
    quiz_progress.latest_quiz_score,
    greatest(lesson_progress.last_lesson_completed_at, quiz_progress.last_quiz_attempt_at)
  from assigned_modules as assigned_module
  join lesson_progress
    on lesson_progress.employee_id = assigned_module.employee_id
   and lesson_progress.module_id = assigned_module.module_id
  join quiz_progress
    on quiz_progress.employee_id = assigned_module.employee_id
   and quiz_progress.module_id = assigned_module.module_id
  order by
    assigned_module.store_name,
    assigned_module.employee_name,
    assigned_module.course_title,
    assigned_module.module_sort_order;
end;
$$;

revoke all on function public.read_academy_admin_progress() from public, anon, authenticated;
grant execute on function public.read_academy_admin_progress() to authenticated;
