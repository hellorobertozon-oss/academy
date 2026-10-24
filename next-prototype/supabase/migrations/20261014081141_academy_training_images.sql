-- Academy project only: aslzogstpyppmbdhvuss.
-- Training images are private; admins manage uploads and assigned employees
-- can read only images referenced by the course version currently published.

alter table public.course_translations
  add column image_path text
  check (
    image_path is null or image_path ~
      '^courses/[0-9]+/versions/[0-9]+/translations/(course|module|lesson)/[A-Za-z0-9-]+/[A-Za-z0-9-]+/[0-9a-f-]{36}\.(jpg|png|webp)$'
  );

alter table public.module_translations
  add column image_path text
  check (
    image_path is null or image_path ~
      '^courses/[0-9]+/versions/[0-9]+/translations/(course|module|lesson)/[A-Za-z0-9-]+/[A-Za-z0-9-]+/[0-9a-f-]{36}\.(jpg|png|webp)$'
  );

alter table public.lesson_translations
  add column image_path text
  check (
    image_path is null or image_path ~
      '^courses/[0-9]+/versions/[0-9]+/translations/(course|module|lesson)/[A-Za-z0-9-]+/[A-Za-z0-9-]+/[0-9a-f-]{36}\.(jpg|png|webp)$'
  );

create index course_translations_image_path_idx on public.course_translations (image_path) where image_path is not null;
create index module_translations_image_path_idx on public.module_translations (image_path) where image_path is not null;
create index lesson_translations_image_path_idx on public.lesson_translations (image_path) where image_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'academy-content-images',
  'academy-content-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.employee_can_read_academy_image(
  p_course_id bigint,
  p_object_path text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_read_assigned_course(p_course_id))
    and exists (
      select 1
      from public.courses as course
      where course.id = p_course_id
        and course.published_version_id is not null
        and (
          exists (
            select 1
            from public.course_translations as translation
            where translation.course_version_id = course.published_version_id
              and translation.image_path = p_object_path
          )
          or exists (
            select 1
            from public.course_modules as module
            join public.module_translations as translation on translation.module_id = module.id
            where module.course_version_id = course.published_version_id
              and translation.image_path = p_object_path
          )
          or exists (
            select 1
            from public.course_modules as module
            join public.course_lessons as lesson on lesson.module_id = module.id
            join public.lesson_translations as translation on translation.lesson_id = lesson.id
            where module.course_version_id = course.published_version_id
              and translation.image_path = p_object_path
          )
        )
    );
$$;

revoke all on function private.employee_can_read_academy_image(bigint, text) from public, anon;
grant execute on function private.employee_can_read_academy_image(bigint, text) to authenticated;

create policy academy_content_images_read_assigned
on storage.objects for select to authenticated
using (
  bucket_id = 'academy-content-images'
  and (
    (select private.is_admin())
    or case
      when name ~ '^courses/[0-9]+/versions/[0-9]+/translations/(course|module|lesson)/[A-Za-z0-9-]+/[A-Za-z0-9-]+/[0-9a-f-]{36}\.(jpg|png|webp)$'
      then (select private.employee_can_read_academy_image(split_part(name, '/', 2)::bigint, name))
      else false
    end
  )
);

create policy academy_content_images_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'academy-content-images'
  and (select private.is_admin())
  and name ~ '^courses/[0-9]+/versions/[0-9]+/translations/(course|module|lesson)/[A-Za-z0-9-]+/[A-Za-z0-9-]+/[0-9a-f-]{36}\.(jpg|png|webp)$'
);

create policy academy_content_images_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'academy-content-images' and (select private.is_admin()))
with check (
  bucket_id = 'academy-content-images'
  and (select private.is_admin())
  and name ~ '^courses/[0-9]+/versions/[0-9]+/translations/(course|module|lesson)/[A-Za-z0-9-]+/[A-Za-z0-9-]+/[0-9a-f-]{36}\.(jpg|png|webp)$'
);

create policy academy_content_images_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'academy-content-images' and (select private.is_admin()));

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
        lesson_id, language_code, title, summary, youtube_video_id, content, product_bullets, image_path
      )
      select
        new_lesson_id,
        translation.language_code,
        translation.title,
        translation.summary,
        translation.youtube_video_id,
        translation.content,
        translation.product_bullets,
        translation.image_path
      from public.lesson_translations as translation
      where translation.lesson_id = old_lesson.id;
    end loop;
  end loop;

  return new_version_id;
end;
$$;
