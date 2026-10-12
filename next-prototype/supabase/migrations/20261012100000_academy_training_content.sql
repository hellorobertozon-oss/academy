-- Academy project only: aslzogstpyppmbdhvuss.
-- Course content is versioned so draft edits never change the employee-facing release.

create table public.academy_languages (
  code text primary key check (code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  name text not null check (length(btrim(name)) > 0),
  native_name text not null check (length(btrim(native_name)) > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.academy_languages (code, name, native_name, sort_order)
values
  ('pl', 'Polish', 'Polski', 0),
  ('en', 'English', 'English', 1),
  ('de', 'German', 'Deutsch', 2),
  ('cs', 'Czech', 'Čeština', 3);

alter table public.profiles
  drop constraint profiles_preferred_language_check;
alter table public.profiles
  add constraint profiles_preferred_language_fkey
  foreign key (preferred_language) references public.academy_languages (code) on delete restrict;
create index profiles_preferred_language_idx on public.profiles (preferred_language);

create or replace function private.handle_new_academy_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.user_invites%rowtype;
  requested_language text;
begin
  if new.email is null then
    raise exception 'An email address is required for Academy accounts';
  end if;

  select invite.*
    into invitation
  from public.user_invites as invite
  where invite.email = lower(btrim(new.email))
    and invite.accepted_at is null
    and invite.revoked_at is null
  for update;

  if not found then
    raise exception 'An active Academy invitation is required';
  end if;

  requested_language := new.raw_user_meta_data ->> 'preferred_language';
  if not exists (
    select 1 from public.academy_languages as language
    where language.code = requested_language and language.is_active
  ) then
    requested_language := 'pl';
  end if;

  update public.user_invites
  set accepted_at = now()
  where id = invitation.id;

  insert into public.profiles (
    id, email, first_name, last_name, role, store_id, preferred_language
  ) values (
    new.id,
    lower(btrim(new.email)),
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    invitation.role,
    invitation.store_id,
    coalesce(requested_language, 'pl')
  );

  return new;
end;
$$;

create table public.courses (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  default_language_code text not null references public.academy_languages (code) on delete restrict,
  published_version_id bigint,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courses_default_language_code_idx on public.courses (default_language_code);
create index courses_published_version_id_idx on public.courses (published_version_id);
create index courses_created_by_idx on public.courses (created_by);

create table public.course_versions (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.courses (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (course_id, version_number),
  unique (id, course_id),
  check (
    (status = 'draft' and published_at is null)
    or (status in ('published', 'archived') and published_at is not null)
  )
);

create unique index course_versions_one_draft_idx
  on public.course_versions (course_id)
  where status = 'draft';
create unique index course_versions_one_published_idx
  on public.course_versions (course_id)
  where status = 'published';
create index course_versions_created_by_idx on public.course_versions (created_by);

alter table public.courses
  add constraint courses_published_version_id_fkey
  foreign key (published_version_id) references public.course_versions (id) on delete restrict;

create table public.course_translations (
  course_version_id bigint not null references public.course_versions (id) on delete cascade,
  language_code text not null references public.academy_languages (code) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 160),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (course_version_id, language_code)
);
create index course_translations_language_idx on public.course_translations (language_code);

create table public.course_modules (
  id bigint generated always as identity primary key,
  course_version_id bigint not null references public.course_versions (id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_version_id, sort_order)
);

create table public.module_translations (
  module_id bigint not null references public.course_modules (id) on delete cascade,
  language_code text not null references public.academy_languages (code) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 160),
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (module_id, language_code)
);
create index module_translations_language_idx on public.module_translations (language_code);

create table public.course_lessons (
  id bigint generated always as identity primary key,
  module_id bigint not null references public.course_modules (id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, sort_order)
);

create table public.lesson_translations (
  lesson_id bigint not null references public.course_lessons (id) on delete cascade,
  language_code text not null references public.academy_languages (code) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 160),
  summary text not null default '',
  youtube_video_id text check (youtube_video_id is null or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb
    check (jsonb_typeof(content) = 'object' and content ->> 'type' = 'doc'),
  product_bullets jsonb not null default '[]'::jsonb
    check (jsonb_typeof(product_bullets) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (lesson_id, language_code)
);
create index lesson_translations_language_idx on public.lesson_translations (language_code);

create trigger academy_languages_set_updated_at
before update on public.academy_languages
for each row execute function private.set_updated_at();
create trigger courses_set_updated_at
before update on public.courses
for each row execute function private.set_updated_at();
create trigger course_versions_set_updated_at
before update on public.course_versions
for each row execute function private.set_updated_at();
create trigger course_translations_set_updated_at
before update on public.course_translations
for each row execute function private.set_updated_at();
create trigger course_modules_set_updated_at
before update on public.course_modules
for each row execute function private.set_updated_at();
create trigger module_translations_set_updated_at
before update on public.module_translations
for each row execute function private.set_updated_at();
create trigger course_lessons_set_updated_at
before update on public.course_lessons
for each row execute function private.set_updated_at();
create trigger lesson_translations_set_updated_at
before update on public.lesson_translations
for each row execute function private.set_updated_at();

create or replace function public.create_academy_course(
  p_slug text,
  p_language_code text,
  p_title text,
  p_description text default ''
)
returns table (course_id bigint, version_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_course_id bigint;
  new_version_id bigint;
  actor_id uuid := (select auth.uid());
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug) > 100 then
    raise exception 'Course slug is invalid' using errcode = '22023';
  end if;
  if p_title is null or length(btrim(p_title)) not between 1 and 160 then
    raise exception 'Course title must contain between 1 and 160 characters' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.academy_languages as language
    where language.code = p_language_code and language.is_active
  ) then
    raise exception 'An active course language is required' using errcode = '22023';
  end if;

  insert into public.courses (slug, default_language_code, created_by)
  values (p_slug, p_language_code, actor_id)
  returning id into new_course_id;

  insert into public.course_versions (course_id, version_number, created_by)
  values (new_course_id, 1, actor_id)
  returning id into new_version_id;

  insert into public.course_translations (course_version_id, language_code, title, description)
  values (new_version_id, p_language_code, btrim(p_title), coalesce(p_description, ''));

  return query select new_course_id, new_version_id;
end;
$$;

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
  new_module_id bigint;
  new_lesson_id bigint;
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
    end loop;
  end loop;

  return new_version_id;
end;
$$;

create or replace function public.publish_academy_course(p_course_id bigint, p_version_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_language text;
  previous_version_id bigint;
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  select course.default_language_code, course.published_version_id
    into course_language, previous_version_id
  from public.courses as course
  where course.id = p_course_id
  for update;

  if not found then
    raise exception 'Course was not found' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.course_versions as version
    where version.id = p_version_id
      and version.course_id = p_course_id
      and version.status = 'draft'
  ) then
    raise exception 'Only a draft version of this course can be published' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.course_translations as translation
    where translation.course_version_id = p_version_id
      and translation.language_code = course_language
      and length(btrim(translation.title)) > 0
  ) then
    raise exception 'The default course translation is required' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.course_modules as module
    where module.course_version_id = p_version_id
  ) then
    raise exception 'Add at least one module before publishing' using errcode = '23514';
  end if;
  if exists (
    select 1
    from public.course_modules as module
    left join public.module_translations as translation
      on translation.module_id = module.id and translation.language_code = course_language
    where module.course_version_id = p_version_id and translation.title is null
  ) then
    raise exception 'Every module needs a title in the default language' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.course_modules as module
    join public.course_lessons as lesson on lesson.module_id = module.id
    where module.course_version_id = p_version_id
  ) then
    raise exception 'Add at least one lesson before publishing' using errcode = '23514';
  end if;
  if exists (
    select 1
    from public.course_modules as module
    join public.course_lessons as lesson on lesson.module_id = module.id
    left join public.lesson_translations as translation
      on translation.lesson_id = lesson.id and translation.language_code = course_language
    where module.course_version_id = p_version_id and translation.title is null
  ) then
    raise exception 'Every lesson needs a title in the default language' using errcode = '23514';
  end if;

  if previous_version_id is not null then
    update public.course_versions
    set status = 'archived'
    where id = previous_version_id and status = 'published';
  end if;

  update public.course_versions
  set status = 'published', published_at = now()
  where id = p_version_id;

  update public.courses
  set published_version_id = p_version_id
  where id = p_course_id;
end;
$$;

revoke all on function public.create_academy_course(text, text, text, text) from public, anon;
revoke all on function public.create_academy_course_draft(bigint) from public, anon;
revoke all on function public.publish_academy_course(bigint, bigint) from public, anon;
grant execute on function public.create_academy_course(text, text, text, text) to authenticated;
grant execute on function public.create_academy_course_draft(bigint) to authenticated;
grant execute on function public.publish_academy_course(bigint, bigint) to authenticated;

alter table public.academy_languages enable row level security;
alter table public.courses enable row level security;
alter table public.course_versions enable row level security;
alter table public.course_translations enable row level security;
alter table public.course_modules enable row level security;
alter table public.module_translations enable row level security;
alter table public.course_lessons enable row level security;
alter table public.lesson_translations enable row level security;

create policy academy_languages_read
on public.academy_languages for select to authenticated
using (is_active or (select private.is_admin()));
create policy academy_languages_admin_manage
on public.academy_languages for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy courses_admin_read
on public.courses for select to authenticated
using ((select private.is_admin()));

create policy course_versions_admin_read
on public.course_versions for select to authenticated
using ((select private.is_admin()));

create policy course_translations_admin_read
on public.course_translations for select to authenticated
using ((select private.is_admin()));
create policy course_translations_admin_insert_draft
on public.course_translations for insert to authenticated
with check (
  (select private.is_admin())
  and exists (
    select 1 from public.course_versions as version
    where version.id = course_version_id and version.status = 'draft'
  )
);
create policy course_translations_admin_update_draft
on public.course_translations for update to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.course_versions as version
    where version.id = course_version_id and version.status = 'draft'
  )
)
with check (
  (select private.is_admin())
  and exists (
    select 1 from public.course_versions as version
    where version.id = course_version_id and version.status = 'draft'
  )
);
create policy course_translations_admin_delete_draft
on public.course_translations for delete to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.course_versions as version
    where version.id = course_version_id and version.status = 'draft'
  )
);

create policy course_modules_admin_read
on public.course_modules for select to authenticated
using ((select private.is_admin()));
create policy course_modules_admin_insert_draft
on public.course_modules for insert to authenticated
with check (
  (select private.is_admin())
  and exists (
    select 1 from public.course_versions as version
    where version.id = course_version_id and version.status = 'draft'
  )
);
create policy course_modules_admin_update_draft
on public.course_modules for update to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.course_versions as version
    where version.id = course_version_id and version.status = 'draft'
  )
)
with check (
  (select private.is_admin())
  and exists (
    select 1 from public.course_versions as version
    where version.id = course_version_id and version.status = 'draft'
  )
);
create policy course_modules_admin_delete_draft
on public.course_modules for delete to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.course_versions as version
    where version.id = course_version_id and version.status = 'draft'
  )
);

create policy module_translations_admin_read
on public.module_translations for select to authenticated
using ((select private.is_admin()));
create policy module_translations_admin_insert_draft
on public.module_translations for insert to authenticated
with check (
  (select private.is_admin())
  and exists (
    select 1 from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = module_id and version.status = 'draft'
  )
);
create policy module_translations_admin_update_draft
on public.module_translations for update to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = module_id and version.status = 'draft'
  )
)
with check (
  (select private.is_admin())
  and exists (
    select 1 from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = module_id and version.status = 'draft'
  )
);
create policy module_translations_admin_delete_draft
on public.module_translations for delete to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = module_id and version.status = 'draft'
  )
);

create policy course_lessons_admin_read
on public.course_lessons for select to authenticated
using ((select private.is_admin()));
create policy course_lessons_admin_insert_draft
on public.course_lessons for insert to authenticated
with check (
  (select private.is_admin())
  and exists (
    select 1 from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = module_id and version.status = 'draft'
  )
);
create policy course_lessons_admin_update_draft
on public.course_lessons for update to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = module_id and version.status = 'draft'
  )
)
with check (
  (select private.is_admin())
  and exists (
    select 1 from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = module_id and version.status = 'draft'
  )
);
create policy course_lessons_admin_delete_draft
on public.course_lessons for delete to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1 from public.course_modules as module
    join public.course_versions as version on version.id = module.course_version_id
    where module.id = module_id and version.status = 'draft'
  )
);

create policy lesson_translations_admin_read
on public.lesson_translations for select to authenticated
using ((select private.is_admin()));
create policy lesson_translations_admin_insert_draft
on public.lesson_translations for insert to authenticated
with check (
  (select private.is_admin())
  and exists (
    select 1
    from public.course_lessons as lesson
    join public.course_modules as module on module.id = lesson.module_id
    join public.course_versions as version on version.id = module.course_version_id
    where lesson.id = lesson_id and version.status = 'draft'
  )
);
create policy lesson_translations_admin_update_draft
on public.lesson_translations for update to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.course_lessons as lesson
    join public.course_modules as module on module.id = lesson.module_id
    join public.course_versions as version on version.id = module.course_version_id
    where lesson.id = lesson_id and version.status = 'draft'
  )
)
with check (
  (select private.is_admin())
  and exists (
    select 1
    from public.course_lessons as lesson
    join public.course_modules as module on module.id = lesson.module_id
    join public.course_versions as version on version.id = module.course_version_id
    where lesson.id = lesson_id and version.status = 'draft'
  )
);
create policy lesson_translations_admin_delete_draft
on public.lesson_translations for delete to authenticated
using (
  (select private.is_admin())
  and exists (
    select 1
    from public.course_lessons as lesson
    join public.course_modules as module on module.id = lesson.module_id
    join public.course_versions as version on version.id = module.course_version_id
    where lesson.id = lesson_id and version.status = 'draft'
  )
);

revoke all on table public.academy_languages from public, anon, authenticated;
revoke all on table public.courses from public, anon, authenticated;
revoke all on table public.course_versions from public, anon, authenticated;
revoke all on table public.course_translations from public, anon, authenticated;
revoke all on table public.course_modules from public, anon, authenticated;
revoke all on table public.module_translations from public, anon, authenticated;
revoke all on table public.course_lessons from public, anon, authenticated;
revoke all on table public.lesson_translations from public, anon, authenticated;

grant select, insert, update, delete on table public.academy_languages to authenticated;
grant select on table public.courses to authenticated;
grant select on table public.course_versions to authenticated;
grant select, insert, update, delete on table public.course_translations to authenticated;
grant select, insert, update, delete on table public.course_modules to authenticated;
grant select, insert, update, delete on table public.module_translations to authenticated;
grant select, insert, update, delete on table public.course_lessons to authenticated;
grant select, insert, update, delete on table public.lesson_translations to authenticated;

grant usage, select on sequence public.course_modules_id_seq to authenticated;
grant usage, select on sequence public.course_lessons_id_seq to authenticated;
