-- Academy project only: aslzogstpyppmbdhvuss.
-- Trade fair memory game configuration and participant registrations.

alter table public.academy_settings
  add column trade_fair_memory_enabled boolean not null default false,
  add column trade_fair_memory_time_limit_seconds integer not null default 120
    check (trade_fair_memory_time_limit_seconds between 30 and 600),
  add column trade_fair_prize_type text not null default 'gel'
    check (trade_fair_prize_type in ('gel', 'sticker')),
  add column trade_fair_prize_name text not null default 'Xzone Helmet Cleaning Gel'
    check (length(btrim(trade_fair_prize_name)) between 1 and 100),
  add column trade_fair_prize_image_url text not null default '/assets/xzone-products/Helmet_Cleaning_Gel_01.webp'
    check (length(btrim(trade_fair_prize_image_url)) between 1 and 1000),
  add column trade_fair_privacy_notice_url text not null default 'https://xzone24.com/privacy-policy-and-cookies/'
    check (length(btrim(trade_fair_privacy_notice_url)) between 1 and 1000);

grant select (
  trade_fair_memory_enabled,
  trade_fair_memory_time_limit_seconds,
  trade_fair_prize_type,
  trade_fair_prize_name,
  trade_fair_prize_image_url,
  trade_fair_privacy_notice_url
) on table public.academy_settings to anon;

create policy academy_settings_trade_fair_public_read
on public.academy_settings
for select
to anon
using (true);

grant update (
  trade_fair_memory_enabled,
  trade_fair_memory_time_limit_seconds,
  trade_fair_prize_type,
  trade_fair_prize_name,
  trade_fair_prize_image_url,
  trade_fair_privacy_notice_url
) on table public.academy_settings to authenticated;

create table public.trade_fair_memory_entries (
  id uuid primary key default gen_random_uuid(),
  email text not null
    check (
      email = lower(btrim(email))
      and length(email) between 3 and 254
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
  language text not null check (language in ('en', 'it')),
  privacy_acknowledged boolean not null default false check (privacy_acknowledged),
  privacy_notice_version text not null default 'xzone-privacy-2026-10',
  created_at timestamptz not null default now()
);

create index trade_fair_memory_entries_created_at_idx
  on public.trade_fair_memory_entries (created_at desc);

alter table public.trade_fair_memory_entries enable row level security;

create policy trade_fair_memory_entries_public_submit
on public.trade_fair_memory_entries
for insert
to anon, authenticated
with check (
  privacy_acknowledged
  and language in ('en', 'it')
  and email = lower(btrim(email))
);

create policy trade_fair_memory_entries_admin_read
on public.trade_fair_memory_entries
for select
to authenticated
using ((select private.is_admin()));

revoke all on table public.trade_fair_memory_entries from public, anon, authenticated;
grant insert (email, language, privacy_acknowledged) on table public.trade_fair_memory_entries to anon, authenticated;
grant select on table public.trade_fair_memory_entries to authenticated;
