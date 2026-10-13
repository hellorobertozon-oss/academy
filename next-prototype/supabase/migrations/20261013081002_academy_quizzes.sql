-- Academy project only: aslzogstpyppmbdhvuss.
-- Quiz content follows course versions. Correct answers stay in an admin-only table.

create table public.quizzes (
  id bigint generated always as identity primary key,
  course_version_id bigint not null references public.course_versions (id) on delete cascade,
  module_id bigint references public.course_modules (id) on delete cascade,
  lesson_id bigint references public.course_lessons (id) on delete cascade,
  pass_percentage smallint not null default 80 check (pass_percentage = 80),
  created_at timestamptz not null default now(),
  check ((module_id is not null) <> (lesson_id is not null))
);

create index quizzes_course_version_id_idx on public.quizzes (course_version_id);
create unique index quizzes_module_target_idx on public.quizzes (module_id) where module_id is not null;
create unique index quizzes_lesson_target_idx on public.quizzes (lesson_id) where lesson_id is not null;

create table public.quiz_translations (
  quiz_id bigint not null references public.quizzes (id) on delete cascade,
  language_code text not null references public.academy_languages (code) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 160),
  instructions text not null default '',
  primary key (quiz_id, language_code)
);

create table public.quiz_questions (
  id bigint generated always as identity primary key,
  quiz_id bigint not null references public.quizzes (id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  unique (quiz_id, sort_order),
  unique (quiz_id, id)
);

create table public.quiz_question_translations (
  question_id bigint not null references public.quiz_questions (id) on delete cascade,
  language_code text not null references public.academy_languages (code) on delete restrict,
  prompt text not null check (length(btrim(prompt)) between 1 and 1000),
  primary key (question_id, language_code)
);

create table public.quiz_options (
  id bigint generated always as identity primary key,
  question_id bigint not null references public.quiz_questions (id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  unique (question_id, sort_order),
  unique (question_id, id)
);

create table public.quiz_option_translations (
  option_id bigint not null references public.quiz_options (id) on delete cascade,
  language_code text not null references public.academy_languages (code) on delete restrict,
  label text not null check (length(btrim(label)) between 1 and 500),
  primary key (option_id, language_code)
);

create table public.quiz_correct_answers (
  question_id bigint primary key references public.quiz_questions (id) on delete cascade,
  option_id bigint not null,
  foreign key (question_id, option_id)
    references public.quiz_options (question_id, id)
    on delete cascade
);

create index quiz_correct_answers_option_id_idx on public.quiz_correct_answers (option_id);

create table public.quiz_attempts (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  quiz_id bigint not null references public.quizzes (id) on delete cascade,
  submitted_answers jsonb not null check (jsonb_typeof(submitted_answers) = 'array'),
  correct_count integer not null check (correct_count >= 0),
  question_count integer not null check (question_count > 0),
  score_percentage smallint not null check (score_percentage between 0 and 100),
  passed boolean not null,
  points_awarded smallint not null check (points_awarded in (0, 20)),
  submitted_at timestamptz not null default now(),
  check (correct_count <= question_count),
  check (passed = (correct_count * 100 >= question_count * 80)),
  check ((passed and points_awarded in (0, 20)) or (not passed and points_awarded = 0))
);

create index quiz_attempts_profile_quiz_idx on public.quiz_attempts (profile_id, quiz_id, submitted_at desc);
create index quiz_attempts_quiz_id_idx on public.quiz_attempts (quiz_id);

create or replace function private.validate_academy_quiz_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_version_id bigint;
begin
  if new.module_id is not null then
    select module.course_version_id
      into target_version_id
    from public.course_modules as module
    where module.id = new.module_id;
  else
    select module.course_version_id
      into target_version_id
    from public.course_lessons as lesson
    join public.course_modules as module on module.id = lesson.module_id
    where lesson.id = new.lesson_id;
  end if;

  if target_version_id is distinct from new.course_version_id then
    raise exception 'Quiz target must belong to its course version' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_academy_quiz_target() from public, anon, authenticated;

create trigger quizzes_validate_target
before insert or update on public.quizzes
for each row execute function private.validate_academy_quiz_target();

create or replace function private.employee_can_read_quiz(p_quiz_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quizzes as quiz
    join public.course_versions as version on version.id = quiz.course_version_id
    where quiz.id = p_quiz_id
      and version.status = 'published'
      and (select private.can_read_assigned_course(version.course_id))
      and (
        (quiz.module_id is not null and (select private.employee_can_read_module(quiz.module_id)))
        or (quiz.lesson_id is not null and (select private.employee_can_read_lesson(quiz.lesson_id)))
      )
      and exists (
        select 1 from public.quiz_translations as translation
        where translation.quiz_id = quiz.id
          and translation.language_code = (select private.current_academy_language())
      )
      and exists (
        select 1 from public.quiz_questions as question
        where question.quiz_id = quiz.id
      )
      and not exists (
        select 1
        from public.quiz_questions as question
        where question.quiz_id = quiz.id
          and (
            not exists (
              select 1 from public.quiz_question_translations as question_translation
              where question_translation.question_id = question.id
                and question_translation.language_code = (select private.current_academy_language())
            )
            or not exists (
              select 1 from public.quiz_correct_answers as answer
              where answer.question_id = question.id
            )
            or (select count(*) from public.quiz_options as option where option.question_id = question.id) < 2
            or exists (
              select 1
              from public.quiz_options as option
              where option.question_id = question.id
                and not exists (
                  select 1 from public.quiz_option_translations as option_translation
                  where option_translation.option_id = option.id
                    and option_translation.language_code = (select private.current_academy_language())
                )
            )
          )
      )
  );
$$;

create or replace function private.admin_can_manage_quiz_version(p_course_version_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_admin()) and exists (
    select 1 from public.course_versions as version
    where version.id = p_course_version_id and version.status = 'draft'
  );
$$;

create or replace function private.admin_can_manage_quiz(p_quiz_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_admin()) and exists (
    select 1 from public.quizzes as quiz
    join public.course_versions as version on version.id = quiz.course_version_id
    where quiz.id = p_quiz_id and version.status = 'draft'
  );
$$;

create or replace function private.employee_can_read_quiz_question(p_question_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.quiz_questions as question
    where question.id = p_question_id
      and (select private.employee_can_read_quiz(question.quiz_id))
  );
$$;

create or replace function private.admin_can_manage_quiz_question(p_question_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.quiz_questions as question
    where question.id = p_question_id
      and (select private.admin_can_manage_quiz(question.quiz_id))
  );
$$;

create or replace function private.employee_can_read_quiz_option(p_option_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quiz_options as option
    where option.id = p_option_id
      and (select private.employee_can_read_quiz_question(option.question_id))
  );
$$;

create or replace function private.admin_can_manage_quiz_option(p_option_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quiz_options as option
    where option.id = p_option_id
      and (select private.admin_can_manage_quiz_question(option.question_id))
  );
$$;

revoke all on function private.employee_can_read_quiz(bigint) from public, anon;
revoke all on function private.admin_can_manage_quiz_version(bigint) from public, anon;
revoke all on function private.admin_can_manage_quiz(bigint) from public, anon;
revoke all on function private.employee_can_read_quiz_question(bigint) from public, anon;
revoke all on function private.admin_can_manage_quiz_question(bigint) from public, anon;
revoke all on function private.employee_can_read_quiz_option(bigint) from public, anon;
revoke all on function private.admin_can_manage_quiz_option(bigint) from public, anon;
grant execute on function private.employee_can_read_quiz(bigint) to authenticated;
grant execute on function private.admin_can_manage_quiz_version(bigint) to authenticated;
grant execute on function private.admin_can_manage_quiz(bigint) to authenticated;
grant execute on function private.employee_can_read_quiz_question(bigint) to authenticated;
grant execute on function private.admin_can_manage_quiz_question(bigint) to authenticated;
grant execute on function private.employee_can_read_quiz_option(bigint) to authenticated;
grant execute on function private.admin_can_manage_quiz_option(bigint) to authenticated;

alter table public.quizzes enable row level security;
alter table public.quiz_translations enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_question_translations enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_option_translations enable row level security;
alter table public.quiz_correct_answers enable row level security;
alter table public.quiz_attempts enable row level security;

create policy quizzes_read_admin_or_employee
on public.quizzes for select to authenticated
using ((select private.is_admin()) or (select private.employee_can_read_quiz(id)));
create policy quizzes_admin_insert_draft
on public.quizzes for insert to authenticated
with check ((select private.admin_can_manage_quiz_version(course_version_id)));
create policy quizzes_admin_update_draft
on public.quizzes for update to authenticated
using ((select private.admin_can_manage_quiz(id)))
with check ((select private.admin_can_manage_quiz_version(course_version_id)));
create policy quizzes_admin_delete_draft
on public.quizzes for delete to authenticated
using ((select private.admin_can_manage_quiz(id)));

create policy quiz_translations_read_admin_or_employee
on public.quiz_translations for select to authenticated
using (
  (select private.is_admin())
  or (
    language_code = (select private.current_academy_language())
    and (select private.employee_can_read_quiz(quiz_id))
  )
);
create policy quiz_translations_admin_insert_draft
on public.quiz_translations for insert to authenticated
with check ((select private.admin_can_manage_quiz(quiz_id)));
create policy quiz_translations_admin_update_draft
on public.quiz_translations for update to authenticated
using ((select private.admin_can_manage_quiz(quiz_id)))
with check ((select private.admin_can_manage_quiz(quiz_id)));
create policy quiz_translations_admin_delete_draft
on public.quiz_translations for delete to authenticated
using ((select private.admin_can_manage_quiz(quiz_id)));

create policy quiz_questions_read_admin_or_employee
on public.quiz_questions for select to authenticated
using ((select private.is_admin()) or (select private.employee_can_read_quiz(quiz_id)));
create policy quiz_questions_admin_insert_draft
on public.quiz_questions for insert to authenticated
with check ((select private.admin_can_manage_quiz(quiz_id)));
create policy quiz_questions_admin_update_draft
on public.quiz_questions for update to authenticated
using ((select private.admin_can_manage_quiz(quiz_id)))
with check ((select private.admin_can_manage_quiz(quiz_id)));
create policy quiz_questions_admin_delete_draft
on public.quiz_questions for delete to authenticated
using ((select private.admin_can_manage_quiz(quiz_id)));

create policy quiz_question_translations_read_admin_or_employee
on public.quiz_question_translations for select to authenticated
using (
  (select private.is_admin())
  or (
    language_code = (select private.current_academy_language())
    and (select private.employee_can_read_quiz_question(question_id))
  )
);
create policy quiz_question_translations_admin_insert_draft
on public.quiz_question_translations for insert to authenticated
with check ((select private.admin_can_manage_quiz_question(question_id)));
create policy quiz_question_translations_admin_update_draft
on public.quiz_question_translations for update to authenticated
using ((select private.admin_can_manage_quiz_question(question_id)))
with check ((select private.admin_can_manage_quiz_question(question_id)));
create policy quiz_question_translations_admin_delete_draft
on public.quiz_question_translations for delete to authenticated
using ((select private.admin_can_manage_quiz_question(question_id)));

create policy quiz_options_read_admin_or_employee
on public.quiz_options for select to authenticated
using (
  (select private.is_admin())
  or (select private.employee_can_read_quiz_question(question_id))
);
create policy quiz_options_admin_insert_draft
on public.quiz_options for insert to authenticated
with check ((select private.admin_can_manage_quiz_question(question_id)));
create policy quiz_options_admin_update_draft
on public.quiz_options for update to authenticated
using ((select private.admin_can_manage_quiz_question(question_id)))
with check ((select private.admin_can_manage_quiz_question(question_id)));
create policy quiz_options_admin_delete_draft
on public.quiz_options for delete to authenticated
using ((select private.admin_can_manage_quiz_question(question_id)));

create policy quiz_option_translations_read_admin_or_employee
on public.quiz_option_translations for select to authenticated
using (
  (select private.is_admin())
  or (
    language_code = (select private.current_academy_language())
    and (select private.employee_can_read_quiz_option(option_id))
  )
);
create policy quiz_option_translations_admin_insert_draft
on public.quiz_option_translations for insert to authenticated
with check ((select private.admin_can_manage_quiz_option(option_id)));
create policy quiz_option_translations_admin_update_draft
on public.quiz_option_translations for update to authenticated
using ((select private.admin_can_manage_quiz_option(option_id)))
with check ((select private.admin_can_manage_quiz_option(option_id)));
create policy quiz_option_translations_admin_delete_draft
on public.quiz_option_translations for delete to authenticated
using ((select private.admin_can_manage_quiz_option(option_id)));

create policy quiz_correct_answers_read_admin
on public.quiz_correct_answers for select to authenticated
using ((select private.is_admin()));
create policy quiz_correct_answers_admin_insert_draft
on public.quiz_correct_answers for insert to authenticated
with check ((select private.admin_can_manage_quiz_question(question_id)));
create policy quiz_correct_answers_admin_update_draft
on public.quiz_correct_answers for update to authenticated
using ((select private.admin_can_manage_quiz_question(question_id)))
with check ((select private.admin_can_manage_quiz_question(question_id)));
create policy quiz_correct_answers_admin_delete_draft
on public.quiz_correct_answers for delete to authenticated
using ((select private.admin_can_manage_quiz_question(question_id)));

create policy quiz_attempts_employee_and_admin_read
on public.quiz_attempts for select to authenticated
using (profile_id = (select auth.uid()) or (select private.is_admin()));

revoke all on table public.quizzes, public.quiz_translations, public.quiz_questions,
  public.quiz_question_translations, public.quiz_options, public.quiz_option_translations,
  public.quiz_correct_answers, public.quiz_attempts from public, anon, authenticated;
grant select, insert, update, delete on table public.quizzes, public.quiz_translations,
  public.quiz_questions, public.quiz_question_translations, public.quiz_options,
  public.quiz_option_translations, public.quiz_correct_answers to authenticated;
grant select on table public.quiz_attempts to authenticated;
grant usage, select on sequence public.quizzes_id_seq, public.quiz_questions_id_seq,
  public.quiz_options_id_seq to authenticated;

create or replace function public.save_academy_quiz_content(
  p_quiz_id bigint,
  p_language_code text,
  p_title text,
  p_instructions text,
  p_questions jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := (select auth.uid());
  v_course_version_id bigint;
  v_default_language text;
  v_version_status text;
  v_default_translation boolean;
  v_question jsonb;
  v_option jsonb;
  v_question_id bigint;
  v_option_id bigint;
  v_correct_option_id bigint;
  v_next_order integer;
  v_correct_count integer;
  v_kept_question_ids bigint[] := array[]::bigint[];
  v_kept_option_ids bigint[];
begin
  if v_profile_id is null or not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  if p_quiz_id is null or p_quiz_id <= 0 then
    raise exception 'A valid quiz ID is required' using errcode = '22023';
  end if;
  if p_title is null or length(btrim(p_title)) not between 1 and 160 then
    raise exception 'Quiz title must contain between 1 and 160 characters' using errcode = '22023';
  end if;
  if p_questions is null or jsonb_typeof(p_questions) <> 'array'
     or jsonb_array_length(p_questions) not between 1 and 100 then
    raise exception 'A quiz must contain between 1 and 100 questions' using errcode = '22023';
  end if;

  select quiz.course_version_id, course.default_language_code, version.status
    into v_course_version_id, v_default_language, v_version_status
  from public.quizzes as quiz
  join public.course_versions as version on version.id = quiz.course_version_id
  join public.courses as course on course.id = version.course_id
  where quiz.id = p_quiz_id
  for update of quiz;

  if not found then
    raise exception 'Quiz was not found' using errcode = '22023';
  end if;
  if v_version_status <> 'draft' then
    raise exception 'Only draft quizzes can be changed' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.academy_languages as language
    where language.code = p_language_code and language.is_active
  ) then
    raise exception 'An active quiz language is required' using errcode = '22023';
  end if;
  v_default_translation := p_language_code = v_default_language;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) as submitted(question)
    where jsonb_typeof(submitted.question) is distinct from 'object'
       or submitted.question - 'question_id' - 'prompt' - 'options' <> '{}'::jsonb
       or jsonb_typeof(submitted.question -> 'prompt') is distinct from 'string'
       or length(btrim(submitted.question ->> 'prompt')) not between 1 and 1000
       or jsonb_typeof(submitted.question -> 'options') is distinct from 'array'
       or jsonb_array_length(submitted.question -> 'options') not between 2 and 6
  ) then
    raise exception 'Each question needs a prompt and between 2 and 6 options' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_questions) as submitted(question)
    where jsonb_typeof(submitted.question -> 'question_id') is distinct from 'number'
      and jsonb_typeof(submitted.question -> 'question_id') is distinct from 'null'
  ) then
    raise exception 'Question IDs must be numbers or null' using errcode = '22023';
  end if;
  if (
    select count(*)::integer
    from jsonb_array_elements(p_questions) as submitted(question)
    where jsonb_typeof(submitted.question -> 'question_id') = 'number'
  ) <> (
    select count(distinct (submitted.question ->> 'question_id')::bigint)::integer
    from jsonb_array_elements(p_questions) as submitted(question)
    where jsonb_typeof(submitted.question -> 'question_id') = 'number'
  ) then
    raise exception 'A question can only appear once' using errcode = '22023';
  end if;

  insert into public.quiz_translations (quiz_id, language_code, title, instructions)
  values (p_quiz_id, p_language_code, btrim(p_title), coalesce(p_instructions, ''))
  on conflict (quiz_id, language_code) do update
  set title = excluded.title, instructions = excluded.instructions;

  for v_question in select submitted.question from jsonb_array_elements(p_questions) as submitted(question)
  loop
    v_question_id := null;
    if jsonb_typeof(v_question -> 'question_id') = 'number' then
      v_question_id := (v_question ->> 'question_id')::bigint;
      if v_question_id <= 0 or not exists (
        select 1 from public.quiz_questions as question
        where question.id = v_question_id and question.quiz_id = p_quiz_id
      ) then
        raise exception 'A question belongs to another quiz' using errcode = '22023';
      end if;
    elsif not v_default_translation then
      raise exception 'Only the default language can add questions' using errcode = '22023';
    end if;

    if v_question_id is null then
      select coalesce(max(question.sort_order), -1) + 1 into v_next_order
      from public.quiz_questions as question where question.quiz_id = p_quiz_id;
      insert into public.quiz_questions (quiz_id, sort_order)
      values (p_quiz_id, v_next_order)
      returning id into v_question_id;
    end if;
    v_kept_question_ids := array_append(v_kept_question_ids, v_question_id);

    insert into public.quiz_question_translations (question_id, language_code, prompt)
    values (v_question_id, p_language_code, btrim(v_question ->> 'prompt'))
    on conflict (question_id, language_code) do update set prompt = excluded.prompt;

    if exists (
      select 1
      from jsonb_array_elements(v_question -> 'options') as submitted(option)
      where jsonb_typeof(submitted.option) is distinct from 'object'
         or submitted.option - 'option_id' - 'label' - 'is_correct' <> '{}'::jsonb
         or jsonb_typeof(submitted.option -> 'label') is distinct from 'string'
         or length(btrim(submitted.option ->> 'label')) not between 1 and 500
         or jsonb_typeof(submitted.option -> 'is_correct') is distinct from 'boolean'
    ) then
      raise exception 'Each option needs a label and a correct-answer flag' using errcode = '22023';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(v_question -> 'options') as submitted(option)
      where jsonb_typeof(submitted.option -> 'option_id') is distinct from 'number'
        and jsonb_typeof(submitted.option -> 'option_id') is distinct from 'null'
    ) then
      raise exception 'Option IDs must be numbers or null' using errcode = '22023';
    end if;
    if (
      select count(*)::integer
      from jsonb_array_elements(v_question -> 'options') as submitted(option)
      where jsonb_typeof(submitted.option -> 'option_id') = 'number'
    ) <> (
      select count(distinct (submitted.option ->> 'option_id')::bigint)::integer
      from jsonb_array_elements(v_question -> 'options') as submitted(option)
      where jsonb_typeof(submitted.option -> 'option_id') = 'number'
    ) then
      raise exception 'An option can only appear once per question' using errcode = '22023';
    end if;

    select count(*)::integer into v_correct_count
    from jsonb_array_elements(v_question -> 'options') as submitted(option)
    where (submitted.option ->> 'is_correct')::boolean;
    if v_default_translation and v_correct_count <> 1 then
      raise exception 'Each question needs exactly one correct answer' using errcode = '22023';
    end if;
    if not v_default_translation and exists (
      select 1 from jsonb_array_elements(v_question -> 'options') as submitted(option)
      where jsonb_typeof(submitted.option -> 'option_id') <> 'number'
    ) then
      raise exception 'Only the default language can add answer options' using errcode = '22023';
    end if;

    v_kept_option_ids := array[]::bigint[];
    v_correct_option_id := null;
    for v_option in select submitted.option from jsonb_array_elements(v_question -> 'options') as submitted(option)
    loop
      v_option_id := null;
      if jsonb_typeof(v_option -> 'option_id') = 'number' then
        v_option_id := (v_option ->> 'option_id')::bigint;
        if v_option_id <= 0 or not exists (
          select 1 from public.quiz_options as option
          where option.id = v_option_id and option.question_id = v_question_id
        ) then
          raise exception 'An option belongs to another question' using errcode = '22023';
        end if;
      else
        select coalesce(max(option.sort_order), -1) + 1 into v_next_order
        from public.quiz_options as option where option.question_id = v_question_id;
        insert into public.quiz_options (question_id, sort_order)
        values (v_question_id, v_next_order)
        returning id into v_option_id;
      end if;
      v_kept_option_ids := array_append(v_kept_option_ids, v_option_id);

      insert into public.quiz_option_translations (option_id, language_code, label)
      values (v_option_id, p_language_code, btrim(v_option ->> 'label'))
      on conflict (option_id, language_code) do update set label = excluded.label;

      if v_default_translation and (v_option ->> 'is_correct')::boolean then
        v_correct_option_id := v_option_id;
      end if;
    end loop;

    if v_default_translation then
      delete from public.quiz_options as option
      where option.question_id = v_question_id
        and not (option.id = any(v_kept_option_ids));
      insert into public.quiz_correct_answers (question_id, option_id)
      values (v_question_id, v_correct_option_id)
      on conflict (question_id) do update set option_id = excluded.option_id;
    else
      if exists (
        select 1 from public.quiz_options as option
        where option.question_id = v_question_id
          and not (option.id = any(v_kept_option_ids))
      ) then
        raise exception 'Every option must be translated' using errcode = '22023';
      end if;
    end if;
  end loop;

  if v_default_translation then
    delete from public.quiz_questions as question
    where question.quiz_id = p_quiz_id
      and not (question.id = any(v_kept_question_ids));
  elsif exists (
    select 1 from public.quiz_questions as question
    where question.quiz_id = p_quiz_id
      and not (question.id = any(v_kept_question_ids))
  ) then
    raise exception 'Every question must be translated' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.save_academy_quiz_content(bigint, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.save_academy_quiz_content(bigint, text, text, text, jsonb) to authenticated;

create or replace function private.validate_academy_quiz_before_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_language text;
begin
  if new.status <> 'published' or old.status = 'published' then
    return new;
  end if;

  select course.default_language_code into default_language
  from public.courses as course
  where course.id = new.course_id;

  if exists (
    select 1
    from public.quizzes as quiz
    where quiz.course_version_id = new.id
      and (
        not exists (
          select 1 from public.quiz_translations as translation
          where translation.quiz_id = quiz.id
            and translation.language_code = default_language
        )
        or not exists (
          select 1 from public.quiz_questions as question
          where question.quiz_id = quiz.id
        )
        or exists (
          select 1
          from public.quiz_questions as question
          where question.quiz_id = quiz.id
            and (
              not exists (
                select 1 from public.quiz_question_translations as translation
                where translation.question_id = question.id
                  and translation.language_code = default_language
              )
              or not exists (
                select 1 from public.quiz_correct_answers as answer
                where answer.question_id = question.id
              )
              or (select count(*) from public.quiz_options as option where option.question_id = question.id) < 2
              or exists (
                select 1
                from public.quiz_options as option
                where option.question_id = question.id
                  and not exists (
                    select 1 from public.quiz_option_translations as translation
                    where translation.option_id = option.id
                      and translation.language_code = default_language
                  )
              )
            )
        )
      )
  ) then
    raise exception 'Every quiz needs a default-language title, translated questions, two translated options and one correct answer per question'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_academy_quiz_before_publish() from public, anon, authenticated;

create trigger course_versions_validate_quizzes_before_publish
before update of status on public.course_versions
for each row execute function private.validate_academy_quiz_before_publish();

create or replace function private.clone_quiz_content(p_source_quiz_id bigint, p_target_quiz_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.quiz_translations (quiz_id, language_code, title, instructions)
  select p_target_quiz_id, translation.language_code, translation.title, translation.instructions
  from public.quiz_translations as translation
  where translation.quiz_id = p_source_quiz_id;

  insert into public.quiz_questions (quiz_id, sort_order)
  select p_target_quiz_id, question.sort_order
  from public.quiz_questions as question
  where question.quiz_id = p_source_quiz_id;

  insert into public.quiz_question_translations (question_id, language_code, prompt)
  select target_question.id, translation.language_code, translation.prompt
  from public.quiz_questions as source_question
  join public.quiz_questions as target_question
    on target_question.quiz_id = p_target_quiz_id
   and target_question.sort_order = source_question.sort_order
  join public.quiz_question_translations as translation on translation.question_id = source_question.id
  where source_question.quiz_id = p_source_quiz_id;

  insert into public.quiz_options (question_id, sort_order)
  select target_question.id, source_option.sort_order
  from public.quiz_questions as source_question
  join public.quiz_questions as target_question
    on target_question.quiz_id = p_target_quiz_id
   and target_question.sort_order = source_question.sort_order
  join public.quiz_options as source_option on source_option.question_id = source_question.id
  where source_question.quiz_id = p_source_quiz_id;

  insert into public.quiz_option_translations (option_id, language_code, label)
  select target_option.id, translation.language_code, translation.label
  from public.quiz_questions as source_question
  join public.quiz_questions as target_question
    on target_question.quiz_id = p_target_quiz_id
   and target_question.sort_order = source_question.sort_order
  join public.quiz_options as source_option on source_option.question_id = source_question.id
  join public.quiz_options as target_option
    on target_option.question_id = target_question.id
   and target_option.sort_order = source_option.sort_order
  join public.quiz_option_translations as translation on translation.option_id = source_option.id
  where source_question.quiz_id = p_source_quiz_id;

  insert into public.quiz_correct_answers (question_id, option_id)
  select target_question.id, target_option.id
  from public.quiz_questions as source_question
  join public.quiz_questions as target_question
    on target_question.quiz_id = p_target_quiz_id
   and target_question.sort_order = source_question.sort_order
  join public.quiz_correct_answers as answer on answer.question_id = source_question.id
  join public.quiz_options as source_option
    on source_option.question_id = source_question.id and source_option.id = answer.option_id
  join public.quiz_options as target_option
    on target_option.question_id = target_question.id
   and target_option.sort_order = source_option.sort_order
  where source_question.quiz_id = p_source_quiz_id;
end;
$$;

revoke all on function private.clone_quiz_content(bigint, bigint) from public, anon, authenticated;

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

  insert into public.course_translations (course_version_id, language_code, title, description)
  select new_version_id, translation.language_code, translation.title, translation.description
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

    insert into public.module_translations (module_id, language_code, title, summary)
    select new_module_id, translation.language_code, translation.title, translation.summary
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
        lesson_id, language_code, title, summary, youtube_video_id, content, product_bullets
      )
      select
        new_lesson_id,
        translation.language_code,
        translation.title,
        translation.summary,
        translation.youtube_video_id,
        translation.content,
        translation.product_bullets
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

create or replace function public.submit_academy_quiz(p_quiz_id bigint, p_answers jsonb)
returns table (
  attempt_id bigint,
  attempt_number integer,
  correct_count integer,
  question_count integer,
  score_percentage smallint,
  passed boolean,
  points_awarded smallint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := (select auth.uid());
  v_question_count integer;
  v_correct_count integer;
  v_score_percentage smallint;
  v_passed boolean;
  v_points_awarded smallint := 0;
  v_attempt_id bigint;
  v_attempt_number integer;
begin
  if v_profile_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if p_quiz_id is null or p_quiz_id <= 0 then
    raise exception 'A valid quiz ID is required' using errcode = '22023';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 1000 then
    raise exception 'Quiz answers must be a JSON array' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles as profile
    where profile.id = v_profile_id and profile.role = 'employee'
  ) then
    raise exception 'Employee access is required' using errcode = '42501';
  end if;
  if not (select private.employee_can_read_quiz(p_quiz_id)) then
    raise exception 'Quiz is not available to this employee' using errcode = '42501';
  end if;

  perform 1 from public.profiles as profile where profile.id = v_profile_id for update;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as submitted(answer)
    where jsonb_typeof(submitted.answer) is distinct from 'object'
  ) then
    raise exception 'Each answer must be an object' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as submitted(answer)
    where submitted.answer - 'question_id' - 'option_id' <> '{}'::jsonb
       or jsonb_typeof(submitted.answer -> 'question_id') is distinct from 'number'
       or jsonb_typeof(submitted.answer -> 'option_id') is distinct from 'number'
  ) then
    raise exception 'Each answer needs one question ID and one option ID' using errcode = '22023';
  end if;

  if (select count(*) from jsonb_array_elements(p_answers)) <>
     (select count(distinct (submitted.answer ->> 'question_id')::bigint)
      from jsonb_array_elements(p_answers) as submitted(answer)) then
    raise exception 'A question can only have one selected answer' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as submitted(answer)
    where not exists (
      select 1
      from public.quiz_questions as question
      join public.quiz_options as option on option.question_id = question.id
      where question.id = (submitted.answer ->> 'question_id')::bigint
        and question.quiz_id = p_quiz_id
        and option.id = (submitted.answer ->> 'option_id')::bigint
    )
  ) then
    raise exception 'An answer refers to a question or option outside this quiz' using errcode = '22023';
  end if;

  select count(*)::integer into v_question_count
  from public.quiz_questions as question
  where question.quiz_id = p_quiz_id;
  if v_question_count = 0 then
    raise exception 'A quiz needs at least one question' using errcode = '23514';
  end if;

  select count(*)::integer into v_correct_count
  from public.quiz_questions as question
  join public.quiz_correct_answers as correct_answer on correct_answer.question_id = question.id
  join jsonb_array_elements(p_answers) as submitted(answer)
    on (submitted.answer ->> 'question_id')::bigint = question.id
   and (submitted.answer ->> 'option_id')::bigint = correct_answer.option_id
  where question.quiz_id = p_quiz_id;

  v_score_percentage := floor(v_correct_count * 100.0 / v_question_count)::smallint;
  v_passed := v_correct_count * 100 >= v_question_count * 80;

  if v_passed and not exists (
    select 1 from public.quiz_attempts as prior_attempt
    where prior_attempt.profile_id = v_profile_id
      and prior_attempt.quiz_id = p_quiz_id
      and prior_attempt.passed
  ) then
    v_points_awarded := 20;
  end if;

  insert into public.quiz_attempts (
    profile_id, quiz_id, submitted_answers, correct_count, question_count,
    score_percentage, passed, points_awarded
  )
  values (
    v_profile_id, p_quiz_id, p_answers, v_correct_count, v_question_count,
    v_score_percentage, v_passed, v_points_awarded
  )
  returning id into v_attempt_id;

  select count(*)::integer into v_attempt_number
  from public.quiz_attempts as attempt
  where attempt.profile_id = v_profile_id and attempt.quiz_id = p_quiz_id;

  return query
  select v_attempt_id, v_attempt_number, v_correct_count, v_question_count,
    v_score_percentage, v_passed, v_points_awarded;
end;
$$;

revoke all on function public.submit_academy_quiz(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.submit_academy_quiz(bigint, jsonb) to authenticated;
