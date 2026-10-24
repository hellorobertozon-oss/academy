-- Academy project only: aslzogstpyppmbdhvuss.
insert into public.academy_languages (code, name, native_name, sort_order)
values ('fr', 'French', 'Français', 4)
on conflict (code) do update
set name = excluded.name,
    native_name = excluded.native_name,
    is_active = true,
    sort_order = excluded.sort_order;
