-- Academy project only: aslzogstpyppmbdhvuss.
-- Reordering is atomic and can only affect draft content.

create or replace function public.reorder_academy_modules(
  p_course_version_id bigint,
  p_module_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  module_count integer;
  order_offset bigint;
  item_index integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.course_versions as version
    where version.id = p_course_version_id and version.status = 'draft'
  ) then
    raise exception 'Modules can only be reordered in a draft' using errcode = '22023';
  end if;

  p_module_ids := coalesce(p_module_ids, array[]::bigint[]);
  select count(*) into module_count
  from public.course_modules as module
  where module.course_version_id = p_course_version_id;

  if cardinality(p_module_ids) <> module_count
     or (select count(distinct requested.item_id) from unnest(p_module_ids) as requested(item_id)) <> module_count
     or exists (
       select 1
       from unnest(p_module_ids) as requested(item_id)
       where not exists (
         select 1 from public.course_modules as module
         where module.id = requested.item_id
           and module.course_version_id = p_course_version_id
       )
     ) then
    raise exception 'The new order must contain every module exactly once' using errcode = '22023';
  end if;

  select coalesce(max(module.sort_order), 0) + module_count + 1
    into order_offset
  from public.course_modules as module
  where module.course_version_id = p_course_version_id;

  update public.course_modules as module
  set sort_order = module.sort_order + order_offset
  where module.course_version_id = p_course_version_id;

  if module_count > 0 then
    for item_index in 1..module_count loop
      update public.course_modules
      set sort_order = item_index - 1
      where id = p_module_ids[item_index]
        and course_version_id = p_course_version_id;
    end loop;
  end if;
end;
$$;

create or replace function public.reorder_academy_lessons(
  p_module_id bigint,
  p_lesson_ids bigint[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  lesson_count integer;
  order_offset bigint;
  item_index integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = p_module_id and version.status = 'draft'
  ) then
    raise exception 'Lessons can only be reordered in a draft' using errcode = '22023';
  end if;

  p_lesson_ids := coalesce(p_lesson_ids, array[]::bigint[]);
  select count(*) into lesson_count
  from public.course_lessons as lesson
  where lesson.module_id = p_module_id;

  if cardinality(p_lesson_ids) <> lesson_count
     or (select count(distinct requested.item_id) from unnest(p_lesson_ids) as requested(item_id)) <> lesson_count
     or exists (
       select 1
       from unnest(p_lesson_ids) as requested(item_id)
       where not exists (
         select 1 from public.course_lessons as lesson
         where lesson.id = requested.item_id and lesson.module_id = p_module_id
       )
     ) then
    raise exception 'The new order must contain every lesson exactly once' using errcode = '22023';
  end if;

  select coalesce(max(lesson.sort_order), 0) + lesson_count + 1
    into order_offset
  from public.course_lessons as lesson
  where lesson.module_id = p_module_id;

  update public.course_lessons as lesson
  set sort_order = lesson.sort_order + order_offset
  where lesson.module_id = p_module_id;

  if lesson_count > 0 then
    for item_index in 1..lesson_count loop
      update public.course_lessons
      set sort_order = item_index - 1
      where id = p_lesson_ids[item_index] and module_id = p_module_id;
    end loop;
  end if;
end;
$$;

revoke all on function public.reorder_academy_modules(bigint, bigint[]) from public, anon;
revoke all on function public.reorder_academy_lessons(bigint, bigint[]) from public, anon;
grant execute on function public.reorder_academy_modules(bigint, bigint[]) to authenticated;
grant execute on function public.reorder_academy_lessons(bigint, bigint[]) to authenticated;
