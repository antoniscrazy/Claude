-- Dev-Konsole, Teil 4: Server-Erstellung sperren (Ausnahmen für bestimmte Spielernamen).
-- Im Supabase-SQL-Editor (Projekt voxelcraft) einfügen und "Run" klicken. Danach in dev.html unter „Einstellungen“ bedienen.

create table if not exists public.vc_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);
alter table public.vc_settings enable row level security;
revoke all on public.vc_settings from anon, authenticated;
insert into public.vc_settings (key, value) values ('create_servers', '{"locked": false, "allowed": []}'::jsonb) on conflict do nothing;

-- Darf dieser Spielername Server erstellen? (intern)
create or replace function public.vc_can_create(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select not coalesce((value->>'locked')::boolean, false)
            or exists (select 1 from jsonb_array_elements_text(coalesce(value->'allowed', '[]'::jsonb)) a(n) where lower(a.n) = lower(p_name))
     from public.vc_settings where key = 'create_servers'), true);
$$;
revoke all on function public.vc_can_create(text) from public, anon, authenticated;

-- Spiel: vor dem Erstellen abfragbar (nur für den eigenen Namen/Token)
create or replace function public.vc_create_policy(p_name text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  return jsonb_build_object('ok', true, 'allowed', public.vc_can_create(p_name));
end $$;
revoke all on function public.vc_create_policy(text, text) from public;
grant execute on function public.vc_create_policy(text, text) to anon, authenticated;

-- Server erstellen: wie bisher, aber mit Sperre
create or replace function public.vc_create_room(p_room text, p_seed text, p_mode text, p_name text, p_token text, p_public boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_pname text; v_row public.vc_rooms;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  if not public.vc_can_create(p_name) then return jsonb_build_object('ok', false, 'error', 'create_locked'); end if;
  if p_room is null or p_room !~ '^[a-z0-9_-]{2,24}$' then raise exception 'bad_room'; end if;
  if p_mode not in ('survival', 'creative') then raise exception 'bad_mode'; end if;
  if p_seed is null or char_length(p_seed) not between 1 and 40 then raise exception 'bad_seed'; end if;
  select name into v_pname from public.vc_players where name_lower = lower(p_name);
  if exists (select 1 from public.vc_rooms where id = p_room) then return jsonb_build_object('ok', false, 'error', 'exists'); end if;
  insert into public.vc_rooms (id, seed, mode, owner, is_public) values (p_room, p_seed, p_mode, v_pname, coalesce(p_public, true)) returning * into v_row;
  return public.vc_room_info(v_row);
end $$;

-- Dev-Konsole: Einstellung lesen / setzen
create or replace function public.vc_dev_get_settings(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; v jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  select value into v from public.vc_settings where key = 'create_servers';
  return jsonb_build_object('ok', true, 'locked', coalesce((v->>'locked')::boolean, false), 'allowed', coalesce(v->'allowed', '[]'::jsonb));
end $$;

create or replace function public.vc_dev_set_settings(p_pin text, p_locked boolean, p_allowed text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; n text; v_n text; clean text[] := '{}';
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  foreach n in array coalesce(p_allowed, '{}'::text[]) loop
    v_n := btrim(n);
    if v_n !~ '^[A-Za-z0-9_]{3,16}$' then return jsonb_build_object('ok', false, 'error', 'bad_name'); end if;
    if not (v_n = any (clean)) then clean := clean || v_n; end if;
  end loop;
  if array_length(clean, 1) > 50 then return jsonb_build_object('ok', false, 'error', 'too_many'); end if;
  insert into public.vc_settings (key, value) values ('create_servers', jsonb_build_object('locked', coalesce(p_locked, false), 'allowed', to_jsonb(clean)))
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.vc_dev_get_settings(text) from public;
revoke all on function public.vc_dev_set_settings(text, boolean, text[]) from public;
grant execute on function public.vc_dev_get_settings(text) to anon, authenticated;
grant execute on function public.vc_dev_set_settings(text, boolean, text[]) to anon, authenticated;
