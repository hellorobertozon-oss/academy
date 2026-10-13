-- Academy project only: aslzogstpyppmbdhvuss.
-- This source migration has not been applied to any remote Supabase project.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.stores (
  id bigint generated always as identity primary key,
  name text not null check (length(btrim(name)) > 0),
  street_address text not null check (length(btrim(street_address)) > 0),
  city text not null check (length(btrim(city)) > 0),
  postal_code text not null check (length(btrim(postal_code)) > 0),
  country_code text not null default 'PL' check (country_code ~ '^[A-Z]{2}$'),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (email = lower(btrim(email))),
  first_name text,
  last_name text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  store_id bigint references public.stores (id) on delete restrict,
  preferred_language text not null default 'pl' check (preferred_language in ('pl', 'en', 'de', 'cs')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (role = 'admin' and store_id is null)
    or (role = 'employee' and store_id is not null)
  )
);

create index profiles_store_id_idx on public.profiles (store_id);

create table public.user_invites (
  id bigint generated always as identity primary key,
  email text not null check (email = lower(btrim(email))),
  role text not null check (role in ('admin', 'employee')),
  store_id bigint references public.stores (id) on delete restrict,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  check (
    (role = 'admin' and store_id is null)
    or (role = 'employee' and store_id is not null)
  )
);

create unique index user_invites_active_email_idx
  on public.user_invites (email)
  where accepted_at is null and revoked_at is null;
create index user_invites_store_id_idx on public.user_invites (store_id);
create index user_invites_created_by_idx on public.user_invites (created_by);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'admin'
  );
$$;

create or replace function private.current_store_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select profile.store_id
  from public.profiles as profile
  where profile.id = (select auth.uid())
    and profile.role = 'employee'
  limit 1;
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  if requested_language not in ('pl', 'en', 'de', 'cs') then
    requested_language := 'pl';
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    store_id,
    preferred_language
  ) values (
    new.id,
    lower(btrim(new.email)),
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    invitation.role,
    invitation.store_id,
    coalesce(requested_language, 'pl')
  );

  if new.email_confirmed_at is not null then
    update public.user_invites
    set accepted_at = now()
    where id = invitation.id;
  end if;

  return new;
end;
$$;

create or replace function private.mark_academy_invite_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_invite_id bigint;
begin
  update public.user_invites
  set accepted_at = now()
  where email = lower(btrim(new.email))
    and accepted_at is null
    and revoked_at is null
  returning id into accepted_invite_id;

  if accepted_invite_id is null then
    raise exception 'An active Academy invitation is required';
  end if;

  return new;
end;
$$;

revoke all on function private.is_admin() from public, anon;
revoke all on function private.current_store_id() from public, anon;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_academy_user() from public, anon, authenticated;
revoke all on function private.mark_academy_invite_accepted() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_store_id() to authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_academy_user() to supabase_auth_admin;
grant execute on function private.mark_academy_invite_accepted() to supabase_auth_admin;

create trigger stores_set_updated_at
before update on public.stores
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger on_academy_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_academy_user();

create trigger on_academy_auth_user_confirmed
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function private.mark_academy_invite_accepted();

alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.user_invites enable row level security;

create policy stores_admin_manage
on public.stores
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy stores_employee_read_own
on public.stores
for select
to authenticated
using (id = (select private.current_store_id()));

create policy profiles_read_self_or_admin
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy user_invites_admin_manage
on public.user_invites
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

revoke all on table public.stores from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.user_invites from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.stores to authenticated;
grant select on table public.profiles to authenticated;
grant update (first_name, last_name, preferred_language) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_invites to authenticated;
grant usage, select on sequence public.stores_id_seq to authenticated;
grant usage, select on sequence public.user_invites_id_seq to authenticated;

