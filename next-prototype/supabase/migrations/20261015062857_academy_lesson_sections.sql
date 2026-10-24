alter table public.lesson_translations
  add column key_points_title text not null default 'Warto zapamiętać'
    check (length(btrim(key_points_title)) between 1 and 120),
  add column conversation_title text not null default 'Rozmowa z klientem'
    check (length(btrim(conversation_title)) between 1 and 120),
  add column conversation jsonb not null default '[]'::jsonb
    check (jsonb_typeof(conversation) = 'array');

create or replace function public.create_academy_course_draft(p_course_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_version_id bigint;
  new_version_id bigint;
  next_version_number integer;
  old_module record;
  old_lesson record;
  old_quiz record;
  new_module_id bigint;
  new_lesson_id bigint;
  new_quiz_id bigint;
  actor_id uuid := (select auth.uid());
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  select course.published_version_id
    into source_version_id
  from public.courses as course
  where course.id = p_course_id
  for update;

  if not found or source_version_id is null then
    raise exception 'A published course is required before creating another draft' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.course_versions as version
    where version.course_id = p_course_id and version.status = 'draft'
  ) then
    raise exception 'A draft already exists for this course' using errcode = '23505';
  end if;

  select coalesce(max(version.version_number), 0) + 1
    into next_version_number
  from public.course_versions as version
  where version.course_id = p_course_id;

  insert into public.course_versions (course_id, version_number, created_by)
  values (p_course_id, next_version_number, actor_id)
  returning id into new_version_id;

  insert into public.course_translations (
    course_version_id, language_code, title, description, image_path
  )
  select new_version_id, translation.language_code, translation.title, translation.description, translation.image_path
  from public.course_translations as translation
  where translation.course_version_id = source_version_id;

  for old_module in
    select module.id, module.sort_order
    from public.course_modules as module
    where module.course_version_id = source_version_id
    order by module.sort_order
  loop
    insert into public.course_modules (course_version_id, sort_order)
    values (new_version_id, old_module.sort_order)
    returning id into new_module_id;

    insert into public.module_translations (module_id, language_code, title, summary, image_path)
    select new_module_id, translation.language_code, translation.title, translation.summary, translation.image_path
    from public.module_translations as translation
    where translation.module_id = old_module.id;

    for old_lesson in
      select lesson.id, lesson.sort_order
      from public.course_lessons as lesson
      where lesson.module_id = old_module.id
      order by lesson.sort_order
    loop
      insert into public.course_lessons (module_id, sort_order)
      values (new_module_id, old_lesson.sort_order)
      returning id into new_lesson_id;

      insert into public.lesson_translations (
        lesson_id,
        language_code,
        title,
        summary,
        youtube_video_id,
        content,
        product_bullets,
        key_points_title,
        conversation_title,
        conversation,
        image_path
      )
      select
        new_lesson_id,
        translation.language_code,
        translation.title,
        translation.summary,
        translation.youtube_video_id,
        translation.content,
        translation.product_bullets,
        translation.key_points_title,
        translation.conversation_title,
        translation.conversation,
        translation.image_path
      from public.lesson_translations as translation
      where translation.lesson_id = old_lesson.id;

      for old_quiz in
        select quiz.id, quiz.pass_percentage
        from public.quizzes as quiz
        where quiz.lesson_id = old_lesson.id
      loop
        insert into public.quizzes (course_version_id, lesson_id, pass_percentage)
        values (new_version_id, new_lesson_id, old_quiz.pass_percentage)
        returning id into new_quiz_id;
        perform private.clone_quiz_content(old_quiz.id, new_quiz_id);
      end loop;
    end loop;

    for old_quiz in
      select quiz.id, quiz.pass_percentage
      from public.quizzes as quiz
      where quiz.module_id = old_module.id
    loop
      insert into public.quizzes (course_version_id, module_id, pass_percentage)
      values (new_version_id, new_module_id, old_quiz.pass_percentage)
      returning id into new_quiz_id;
      perform private.clone_quiz_content(old_quiz.id, new_quiz_id);
    end loop;
  end loop;

  return new_version_id;
end;
$$;
