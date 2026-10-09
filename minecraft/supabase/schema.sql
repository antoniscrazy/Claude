-- VoxelCraft Mehrspieler: Datenbankschema für Supabase (Postgres).
-- Im SQL-Editor des Supabase-Projekts ausführen (oder als Migration anwenden).
--
-- Sicherheitsmodell: Alle Tabellen sind per Row Level Security für die Rollen anon/authenticated gesperrt
-- (außer öffentlich lesbaren Feldern von Welten und Spielerprofilen). Gelesen und geschrieben wird über
-- SECURITY DEFINER-Funktionen, die Spielername + geheimes Token prüfen. Das Token liegt nur im Browser des
-- Spielers; in der Datenbank steht ausschließlich sein SHA-256-Hash.

create extension if not exists pgcrypto with schema extensions;

create table public.vc_rooms (
  id text primary key check (id ~ '^[a-z0-9_-]{2,24}$'),
  seed text not null check (char_length(seed) between 1 and 40),
  mode text not null check (mode in ('survival', 'creative')),
  epoch_ms bigint not null default (extract(epoch from now()) * 1000)::bigint,
  created_at timestamptz not null default now()
);

create table public.vc_players (
  name text primary key check (name ~ '^[A-Za-z0-9_]{3,16}$'),
  name_lower text generated always as (lower(name)) stored unique,
  token_hash text not null,
  skin text check (skin is null or (char_length(skin) < 40000 and (skin like 'data:image/png;base64,%' or skin like 'preset:%'))),
  slim boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table public.vc_edits (
  room text not null references public.vc_rooms (id) on delete cascade,
  x integer not null,
  y smallint not null check (y between 0 and 255),
  z integer not null,
  block integer not null check (block between 0 and 65535),
  by_name text,
  updated_at timestamptz not null default now(),
  primary key (room, x, y, z)
);
create index vc_edits_room_updated_idx on public.vc_edits (room, updated_at);

create table public.vc_states (
  room text not null references public.vc_rooms (id) on delete cascade,
  name text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (room, name)
);

create table public.vc_containers (
  room text not null references public.vc_rooms (id) on delete cascade,
  x integer not null,
  y smallint not null,
  z integer not null,
  items jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (room, x, y, z)
);

alter table public.vc_rooms enable row level security;
alter table public.vc_players enable row level security;
alter table public.vc_edits enable row level security;
alter table public.vc_states enable row level security;
alter table public.vc_containers enable row level security;

-- Öffentlich lesbar: Welten und die öffentlichen Profilfelder (Name, Skin) – niemals der Token-Hash.
revoke all on public.vc_rooms, public.vc_players, public.vc_edits, public.vc_states, public.vc_containers from anon, authenticated;
grant select on public.vc_rooms to anon, authenticated;
grant select (name, skin, slim, last_seen) on public.vc_players to anon, authenticated;
create policy vc_rooms_read on public.vc_rooms for select to anon, authenticated using (true);
create policy vc_players_read on public.vc_players for select to anon, authenticated using (true);

create or replace function public.vc_check(p_name text, p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.vc_players
    where name_lower = lower(p_name)
      and token_hash = encode(extensions.digest(convert_to(coalesce(p_token, ''), 'utf8'), 'sha256'), 'hex')
  );
$$;

create or replace function public.vc_register(p_name text, p_token text, p_skin text, p_slim boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_hash text;
  v_row public.vc_players;
begin
  if p_token is null or char_length(p_token) < 16 then raise exception 'bad_token'; end if;
  if p_name is null or p_name !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'bad_name'; end if;
  v_hash := encode(extensions.digest(convert_to(p_token, 'utf8'), 'sha256'), 'hex');
  select * into v_row from public.vc_players where name_lower = lower(p_name);
  if not found then
    insert into public.vc_players (name, token_hash, skin, slim) values (p_name, v_hash, p_skin, coalesce(p_slim, false));
    return jsonb_build_object('ok', true, 'created', true);
  elsif v_row.token_hash = v_hash then
    update public.vc_players set skin = p_skin, slim = coalesce(p_slim, false), last_seen = now() where name_lower = lower(p_name);
    return jsonb_build_object('ok', true, 'created', false);
  end if;
  return jsonb_build_object('ok', false, 'error', 'name_taken');
end $$;

create or replace function public.vc_ensure_room(p_room text, p_seed text, p_mode text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.vc_rooms;
begin
  if p_room is null or p_room !~ '^[a-z0-9_-]{2,24}$' then raise exception 'bad_room'; end if;
  insert into public.vc_rooms (id, seed, mode) values (p_room, p_seed, p_mode) on conflict (id) do nothing;
  select * into v_row from public.vc_rooms where id = p_room;
  return jsonb_build_object('id', v_row.id, 'seed', v_row.seed, 'mode', v_row.mode, 'epoch_ms', v_row.epoch_ms,
                            'now_ms', (extract(epoch from now()) * 1000)::bigint);
end $$;

create or replace function public.vc_list_rooms()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'mode', mode) order by created_at desc), '[]'::jsonb)
  from (select id, mode, created_at from public.vc_rooms order by created_at desc limit 12) r;
$$;

create or replace function public.vc_get_edits(p_room text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_array(x, y, z, block)), '[]'::jsonb)
  from (select x, y, z, block from public.vc_edits where room = p_room order by updated_at limit 250000) e;
$$;

create or replace function public.vc_set_blocks(p_room text, p_name text, p_token text, p_edits jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_n integer;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  if jsonb_typeof(p_edits) <> 'array' then raise exception 'bad_edits'; end if;
  v_n := jsonb_array_length(p_edits);
  if v_n > 1000 then raise exception 'too_many'; end if;
  -- Mehrfach vorkommende Positionen: der letzte Eintrag gewinnt
  insert into public.vc_edits (room, x, y, z, block, by_name)
  select distinct on (px, py, pz) p_room, px, py, pz, pb, p_name
  from (
    select (e.value ->> 0)::integer as px, (e.value ->> 1)::smallint as py, (e.value ->> 2)::integer as pz,
           (e.value ->> 3)::integer as pb, e.ordinality as ord
    from jsonb_array_elements(p_edits) with ordinality as e(value, ordinality)
  ) s
  order by px, py, pz, ord desc
  on conflict (room, x, y, z) do update set block = excluded.block, by_name = excluded.by_name, updated_at = now();
  return v_n;
end $$;

create or replace function public.vc_save_state(p_room text, p_name text, p_token text, p_data jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  if char_length(p_data::text) > 100000 then raise exception 'too_large'; end if;
  insert into public.vc_states (room, name, data) values (p_room, p_name, p_data)
  on conflict (room, name) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.vc_load_state(p_room text, p_name text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select data into v from public.vc_states where room = p_room and name = p_name;
  return v;
end $$;

create or replace function public.vc_get_containers(p_room text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_array(x, y, z, items)), '[]'::jsonb) from public.vc_containers where room = p_room;
$$;

create or replace function public.vc_set_container(p_room text, p_name text, p_token text, p_x integer, p_y integer, p_z integer, p_items jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  if char_length(p_items::text) > 20000 then raise exception 'too_large'; end if;
  if p_items is null or p_items = '[]'::jsonb or p_items = 'null'::jsonb then
    delete from public.vc_containers where room = p_room and x = p_x and y = p_y and z = p_z;
  else
    insert into public.vc_containers (room, x, y, z, items) values (p_room, p_x, p_y, p_z, p_items)
    on conflict (room, x, y, z) do update set items = excluded.items, updated_at = now();
  end if;
end $$;

-- Nur die freigegebenen Funktionen sind für Browser-Clients aufrufbar
revoke all on function public.vc_check(text, text) from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array[
    'vc_register(text,text,text,boolean)', 'vc_ensure_room(text,text,text)', 'vc_list_rooms()', 'vc_get_edits(text)',
    'vc_set_blocks(text,text,text,jsonb)', 'vc_save_state(text,text,text,jsonb)', 'vc_load_state(text,text,text)',
    'vc_get_containers(text)', 'vc_set_container(text,text,text,integer,integer,integer,jsonb)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;


-- ===================== Server & Operatoren (Migration voxelcraft_servers_and_ops) =====================
alter table public.vc_rooms add column if not exists owner text, add column if not exists ops text[] not null default '{}', add column if not exists is_public boolean not null default true;

create or replace function public.vc_room_info(r public.vc_rooms)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', true, 'id', r.id, 'seed', r.seed, 'mode', r.mode, 'epoch_ms', r.epoch_ms,
    'now_ms', (extract(epoch from now()) * 1000)::bigint, 'owner', r.owner, 'ops', to_jsonb(r.ops), 'public', r.is_public);
$$;

create or replace function public.vc_create_room(p_room text, p_seed text, p_mode text, p_name text, p_token text, p_public boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_pname text; v_row public.vc_rooms;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  if p_room is null or p_room !~ '^[a-z0-9_-]{2,24}$' then raise exception 'bad_room'; end if;
  if p_mode not in ('survival', 'creative') then raise exception 'bad_mode'; end if;
  if p_seed is null or char_length(p_seed) not between 1 and 40 then raise exception 'bad_seed'; end if;
  select name into v_pname from public.vc_players where name_lower = lower(p_name);
  if exists (select 1 from public.vc_rooms where id = p_room) then return jsonb_build_object('ok', false, 'error', 'exists'); end if;
  insert into public.vc_rooms (id, seed, mode, owner, is_public) values (p_room, p_seed, p_mode, v_pname, coalesce(p_public, true)) returning * into v_row;
  return public.vc_room_info(v_row);
end $$;

create or replace function public.vc_join_room(p_room text, p_name text, p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.vc_rooms;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select * into v_row from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  return public.vc_room_info(v_row);
end $$;

-- Nur der Besitzer darf Operatoren ernennen/entfernen; der Besitzer selbst bleibt immer OP und kann nicht entfernt werden.
create or replace function public.vc_set_op(p_room text, p_name text, p_token text, p_target text, p_op boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.vc_rooms; v_t text;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select * into v_row from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  if v_row.owner is null or lower(v_row.owner) <> lower(p_name) then return jsonb_build_object('ok', false, 'error', 'not_owner'); end if;
  select name into v_t from public.vc_players where name_lower = lower(p_target);
  if v_t is null then return jsonb_build_object('ok', false, 'error', 'no_player'); end if;
  if lower(v_t) = lower(v_row.owner) then return jsonb_build_object('ok', false, 'error', 'owner'); end if;
  if p_op then
    update public.vc_rooms set ops = (select coalesce(array_agg(distinct x), '{}') from unnest(ops || v_t) x) where id = p_room;
  else
    update public.vc_rooms set ops = array_remove(ops, v_t) where id = p_room;
  end if;
  select * into v_row from public.vc_rooms where id = p_room;
  return public.vc_room_info(v_row);
end $$;

create or replace function public.vc_delete_room(p_room text, p_name text, p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.vc_rooms;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select * into v_row from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  if v_row.owner is null or lower(v_row.owner) <> lower(p_name) then return jsonb_build_object('ok', false, 'error', 'not_owner'); end if;
  delete from public.vc_rooms where id = p_room;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.vc_list_rooms()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'mode', mode, 'owner', owner) order by created_at desc), '[]'::jsonb)
  from (select id, mode, owner, created_at from public.vc_rooms where is_public order by created_at desc limit 20) r;
$$;

create or replace function public.vc_ensure_room(p_room text, p_seed text, p_mode text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.vc_rooms;
begin
  select * into v_row from public.vc_rooms where id = p_room;
  if not found then raise exception 'use_vc_create_room'; end if;
  return jsonb_build_object('id', v_row.id, 'seed', v_row.seed, 'mode', v_row.mode, 'epoch_ms', v_row.epoch_ms, 'now_ms', (extract(epoch from now()) * 1000)::bigint);
end $$;

revoke all on function public.vc_room_info(public.vc_rooms) from public, anon, authenticated;


-- ===================== Dev-Konsole (Migration voxelcraft_dev_console) =====================
-- Gehört zu dev.html. Alles läuft über PIN-geprüfte Funktionen; der PIN wird nur als Hash gespeichert und NICHT im Repo.
-- Setzen (einmalig, im SQL-Editor – "DEIN_PIN" ersetzen):
--   update public.vc_dev_cfg set pin_hash = encode(extensions.digest(convert_to('vc-dev:' || 'DEIN_PIN', 'utf8'), 'sha256'), 'hex') where id = 1;
-- Brute-Force-Schutz: 5 falsche Eingaben in Folge sperren die Konsole für 15 Minuten.
create table if not exists public.vc_dev_cfg (
  id int primary key default 1 check (id = 1),
  pin_hash text,
  fails int not null default 0,
  locked_until timestamptz
);
alter table public.vc_dev_cfg enable row level security;
revoke all on public.vc_dev_cfg from anon, authenticated;
insert into public.vc_dev_cfg (id) values (1) on conflict do nothing;

-- Gibt NULL zurück, wenn der PIN stimmt, sonst ein Fehlerobjekt (kein RAISE, damit der Fehlversuch-Zähler gespeichert bleibt)
create or replace function public.vc_dev_auth(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.vc_dev_cfg; h text;
begin
  select * into c from public.vc_dev_cfg where id = 1 for update;
  if c.pin_hash is null then return jsonb_build_object('ok', false, 'error', 'not_configured'); end if;
  if c.locked_until is not null and c.locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'locked', 'retry_s', ceil(extract(epoch from (c.locked_until - now())))::int);
  end if;
  h := encode(extensions.digest(convert_to('vc-dev:' || coalesce(p_pin, ''), 'utf8'), 'sha256'), 'hex');
  if h = c.pin_hash then
    update public.vc_dev_cfg set fails = 0, locked_until = null where id = 1;
    return null;
  end if;
  update public.vc_dev_cfg set fails = case when c.fails + 1 >= 5 then 0 else c.fails + 1 end,
    locked_until = case when c.fails + 1 >= 5 then now() + interval '15 minutes' else null end where id = 1;
  return jsonb_build_object('ok', false, 'error', 'bad_pin', 'left', greatest(0, 4 - c.fails));
end $$;

create or replace function public.vc_dev_login(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.vc_dev_overview(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  return jsonb_build_object('ok', true,
    'now_ms', (extract(epoch from now()) * 1000)::bigint,
    'rooms', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'mode', r.mode, 'seed', r.seed, 'owner', r.owner, 'ops', to_jsonb(r.ops), 'public', r.is_public,
        'created_at', r.created_at, 'epoch_ms', r.epoch_ms,
        'edits', (select count(*) from public.vc_edits x where x.room = r.id),
        'containers', (select count(*) from public.vc_containers c where c.room = r.id),
        'states', (select count(*) from public.vc_states s where s.room = r.id)
      ) order by r.created_at desc), '[]'::jsonb) from public.vc_rooms r),
    'players', (select coalesce(jsonb_agg(jsonb_build_object(
        'name', p.name, 'created_at', p.created_at, 'last_seen', p.last_seen, 'slim', p.slim, 'has_skin', p.skin is not null,
        'rooms', (select coalesce(jsonb_agg(s.room), '[]'::jsonb) from public.vc_states s where s.name = p.name)
      ) order by p.last_seen desc), '[]'::jsonb) from public.vc_players p));
end $$;

create or replace function public.vc_dev_room(p_pin text, p_room text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; r public.vc_rooms;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  select * into r from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  return jsonb_build_object('ok', true,
    'room', jsonb_build_object('id', r.id, 'mode', r.mode, 'seed', r.seed, 'owner', r.owner, 'ops', to_jsonb(r.ops), 'public', r.is_public, 'created_at', r.created_at, 'epoch_ms', r.epoch_ms),
    'states', (select coalesce(jsonb_agg(jsonb_build_object('name', s.name, 'data', s.data, 'updated_at', s.updated_at) order by s.updated_at desc), '[]'::jsonb) from public.vc_states s where s.room = p_room),
    'containers', (select coalesce(jsonb_agg(jsonb_build_object('x', c.x, 'y', c.y, 'z', c.z, 'items', c.items, 'updated_at', c.updated_at) order by c.updated_at desc), '[]'::jsonb) from public.vc_containers c where c.room = p_room),
    'builders', (select coalesce(jsonb_agg(jsonb_build_object('name', b.by_name, 'edits', b.n) order by b.n desc), '[]'::jsonb)
                 from (select by_name, count(*) as n from public.vc_edits where room = p_room group by by_name order by count(*) desc limit 20) b));
end $$;

create or replace function public.vc_dev_delete_room(p_pin text, p_room text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  delete from public.vc_rooms where id = p_room;
  return jsonb_build_object('ok', true);
end $$;

-- Welt zurücksetzen: alle Block-Änderungen und Container des Servers löschen (Server, Besitzer und Spielerdaten bleiben)
create or replace function public.vc_dev_reset_world(p_pin text, p_room text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; n1 int; n2 int;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  delete from public.vc_edits where room = p_room; get diagnostics n1 = row_count;
  delete from public.vc_containers where room = p_room; get diagnostics n2 = row_count;
  return jsonb_build_object('ok', true, 'edits', n1, 'containers', n2);
end $$;

create or replace function public.vc_dev_delete_container(p_pin text, p_room text, p_x integer, p_y integer, p_z integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  delete from public.vc_containers where room = p_room and x = p_x and y = p_y and z = p_z;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.vc_dev_set_state(p_pin text, p_room text, p_name text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  if p_data is null then
    delete from public.vc_states where room = p_room and name = p_name;
  else
    update public.vc_states set data = p_data, updated_at = now() where room = p_room and name = p_name;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- Konto löschen: Spielerprofil + alle Spielerdaten; Server des Spielers behalten (Besitzer wird leer) oder werden mitgelöscht
create or replace function public.vc_dev_delete_player(p_pin text, p_name text, p_delete_rooms boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; v_name text; n_rooms int := 0;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  select name into v_name from public.vc_players where name_lower = lower(p_name);
  if v_name is null then return jsonb_build_object('ok', false, 'error', 'no_player'); end if;
  if coalesce(p_delete_rooms, false) then
    delete from public.vc_rooms where lower(owner) = lower(v_name); get diagnostics n_rooms = row_count;
  else
    update public.vc_rooms set owner = null where lower(owner) = lower(v_name);
  end if;
  update public.vc_rooms set ops = array_remove(ops, v_name);
  delete from public.vc_states where name = v_name;
  delete from public.vc_players where name = v_name;
  return jsonb_build_object('ok', true, 'rooms_deleted', n_rooms);
end $$;

-- Server-Einstellungen ändern (Besitzer, Operatoren, öffentlich, Modus); NULL = unverändert, Besitzer '' = leeren
create or replace function public.vc_dev_update_room(p_pin text, p_room text, p_owner text, p_ops text[], p_public boolean, p_mode text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; v_owner text;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  if p_mode is not null and p_mode not in ('survival', 'creative') then return jsonb_build_object('ok', false, 'error', 'bad_mode'); end if;
  if p_owner is not null and p_owner <> '' then
    select name into v_owner from public.vc_players where name_lower = lower(p_owner);
    if v_owner is null then return jsonb_build_object('ok', false, 'error', 'no_player'); end if;
  end if;
  update public.vc_rooms set
    owner = case when p_owner is null then owner when p_owner = '' then null else v_owner end,
    ops = coalesce(p_ops, ops), is_public = coalesce(p_public, is_public), mode = coalesce(p_mode, mode)
  where id = p_room;
  return jsonb_build_object('ok', found);
end $$;

revoke all on function public.vc_dev_auth(text) from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array[
    'vc_dev_login(text)', 'vc_dev_overview(text)', 'vc_dev_room(text,text)', 'vc_dev_delete_room(text,text)', 'vc_dev_reset_world(text,text)',
    'vc_dev_delete_container(text,text,integer,integer,integer)', 'vc_dev_set_state(text,text,text,jsonb)', 'vc_dev_delete_player(text,text,boolean)',
    'vc_dev_update_room(text,text,text,text[],boolean,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

-- Dev-Konsole: Spielerdaten auf einen Server schreiben (Transfer zwischen Servern); auch einzeln als dev_console_part3.sql
create or replace function public.vc_dev_put_state(p_pin text, p_room text, p_name text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  if not exists (select 1 from public.vc_rooms where id = p_room) then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  if p_name is null or char_length(p_name) < 1 or char_length(p_name) > 40 then return jsonb_build_object('ok', false, 'error', 'bad_name'); end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or char_length(p_data::text) > 100000 then return jsonb_build_object('ok', false, 'error', 'bad_data'); end if;
  insert into public.vc_states (room, name, data) values (p_room, p_name, p_data)
  on conflict (room, name) do update set data = excluded.data, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.vc_dev_put_state(text, text, text, jsonb) from public;
grant execute on function public.vc_dev_put_state(text, text, text, jsonb) to anon, authenticated;

-- ===================== Dev-Konsole Teil 4: Server-Erstellung sperren =====================
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

-- ===================== Dev-Konsole Teil 5: Konten sperren =====================
-- Dev-Konsole, Teil 5: Konten sperren / entsperren (mit einstellbarer Nachricht). Gesperrte Konten können auf KEINEN Server mehr beitreten,
-- behalten aber alles (Konto, Spielerdaten, Server). Im Supabase-SQL-Editor (Projekt voxelcraft) einfügen und "Run" klicken.
-- Danach in dev.html im Reiter „Konten“ bedienen. Voraussetzung: Teil 4 (supabase/dev_console_part4.sql) wurde schon ausgeführt.

alter table public.vc_players add column if not exists banned boolean not null default false, add column if not exists ban_msg text, add column if not exists banned_at timestamptz;

-- Gesperrte Konten gelten für alle schreibenden Funktionen als nicht angemeldet (Daten bleiben unangetastet)
create or replace function public.vc_check(p_name text, p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.vc_players
    where name_lower = lower(p_name) and not banned
      and token_hash = encode(extensions.digest(convert_to(coalesce(p_token, ''), 'utf8'), 'sha256'), 'hex')
  );
$$;

-- Sperr-Nachricht, falls das Konto (mit richtigem Token) gesperrt ist, sonst NULL (intern)
create or replace function public.vc_ban_info(p_name text, p_token text)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(btrim(ban_msg), ''), 'Dein Konto wurde gesperrt.') from public.vc_players
  where name_lower = lower(p_name) and banned
    and token_hash = encode(extensions.digest(convert_to(coalesce(p_token, ''), 'utf8'), 'sha256'), 'hex');
$$;
revoke all on function public.vc_ban_info(text, text) from public, anon, authenticated;

-- Spiel: Status des eigenen Kontos (z. B. während des Spielens prüfen)
create or replace function public.vc_account_status(p_name text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m text;
begin
  m := public.vc_ban_info(p_name, p_token);
  if m is not null then return jsonb_build_object('ok', true, 'banned', true, 'msg', m); end if;
  return jsonb_build_object('ok', true, 'banned', false);
end $$;
revoke all on function public.vc_account_status(text, text) from public;
grant execute on function public.vc_account_status(text, text) to anon, authenticated;

create or replace function public.vc_register(p_name text, p_token text, p_skin text, p_slim boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_hash text;
  v_row public.vc_players;
begin
  if p_token is null or char_length(p_token) < 16 then raise exception 'bad_token'; end if;
  if p_name is null or p_name !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'bad_name'; end if;
  v_hash := encode(extensions.digest(convert_to(p_token, 'utf8'), 'sha256'), 'hex');
  select * into v_row from public.vc_players where name_lower = lower(p_name);
  if not found then
    insert into public.vc_players (name, token_hash, skin, slim) values (p_name, v_hash, p_skin, coalesce(p_slim, false));
    return jsonb_build_object('ok', true, 'created', true);
  elsif v_row.token_hash = v_hash then
    if v_row.banned then return jsonb_build_object('ok', false, 'error', 'banned', 'msg', coalesce(nullif(btrim(v_row.ban_msg), ''), 'Dein Konto wurde gesperrt.')); end if;
    update public.vc_players set skin = p_skin, slim = coalesce(p_slim, false), last_seen = now() where name_lower = lower(p_name);
    return jsonb_build_object('ok', true, 'created', false);
  end if;
  return jsonb_build_object('ok', false, 'error', 'name_taken');
end $$;

create or replace function public.vc_join_room(p_room text, p_name text, p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.vc_rooms; m text;
begin
  m := public.vc_ban_info(p_name, p_token);
  if m is not null then return jsonb_build_object('ok', false, 'error', 'banned', 'msg', m); end if;
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select * into v_row from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  return public.vc_room_info(v_row);
end $$;

create or replace function public.vc_create_room(p_room text, p_seed text, p_mode text, p_name text, p_token text, p_public boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_pname text; v_row public.vc_rooms; m text;
begin
  m := public.vc_ban_info(p_name, p_token);
  if m is not null then return jsonb_build_object('ok', false, 'error', 'banned', 'msg', m); end if;
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

-- Dev-Konsole: Übersicht mit Sperr-Status der Konten
create or replace function public.vc_dev_overview(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  return jsonb_build_object('ok', true,
    'now_ms', (extract(epoch from now()) * 1000)::bigint,
    'rooms', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'mode', r.mode, 'seed', r.seed, 'owner', r.owner, 'ops', to_jsonb(r.ops), 'public', r.is_public,
        'created_at', r.created_at, 'epoch_ms', r.epoch_ms,
        'edits', (select count(*) from public.vc_edits x where x.room = r.id),
        'containers', (select count(*) from public.vc_containers c where c.room = r.id),
        'states', (select count(*) from public.vc_states s where s.room = r.id)
      ) order by r.created_at desc), '[]'::jsonb) from public.vc_rooms r),
    'players', (select coalesce(jsonb_agg(jsonb_build_object(
        'name', p.name, 'created_at', p.created_at, 'last_seen', p.last_seen, 'slim', p.slim, 'has_skin', p.skin is not null,
        'banned', p.banned, 'ban_msg', p.ban_msg, 'banned_at', p.banned_at,
        'rooms', (select coalesce(jsonb_agg(s.room), '[]'::jsonb) from public.vc_states s where s.name = p.name)
      ) order by p.last_seen desc), '[]'::jsonb) from public.vc_players p));
end $$;

-- Dev-Konsole: Konto sperren / entsperren / Nachricht ändern
create or replace function public.vc_dev_set_ban(p_pin text, p_name text, p_banned boolean, p_msg text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; v_name text;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  select name into v_name from public.vc_players where name_lower = lower(p_name);
  if v_name is null then return jsonb_build_object('ok', false, 'error', 'no_player'); end if;
  if p_msg is not null and char_length(p_msg) > 300 then return jsonb_build_object('ok', false, 'error', 'msg_too_long'); end if;
  if coalesce(p_banned, false) then
    update public.vc_players set banned = true, ban_msg = nullif(btrim(coalesce(p_msg, '')), ''),
      banned_at = case when banned then banned_at else now() end where name = v_name;
  else
    update public.vc_players set banned = false, ban_msg = null, banned_at = null where name = v_name;
  end if;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.vc_dev_set_ban(text, text, boolean, text) from public;
revoke all on function public.vc_dev_overview(text) from public;
grant execute on function public.vc_dev_set_ban(text, text, boolean, text) to anon, authenticated;
grant execute on function public.vc_dev_overview(text) to anon, authenticated;

-- ===================== Dev-Konsole Teil 6: Befehls-Limits =====================
-- Dev-Konsole, Teil 6: Befehls-Limits aufheben (unbegrenztes /fill, /sphere, /summon … für freigegebene Spieler) mit einstellbarer Warnschwelle.
-- Im Supabase-SQL-Editor (Projekt voxelcraft) einfügen und "Run" klicken. Voraussetzung: Teil 4 (Tabelle vc_settings).

insert into public.vc_settings (key, value) values ('command_limits', '{"all": false, "allowed": [], "warn": 100000}'::jsonb) on conflict do nothing;

-- Spiel: Darf dieser Spieler die Befehls-Limits überschreiten? Und ab welcher Größe wird gewarnt?
create or replace function public.vc_command_policy(p_name text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb; u boolean := false; w int := 100000;
begin
  select value into v from public.vc_settings where key = 'command_limits';
  w := greatest(1000, coalesce((v->>'warn')::int, 100000));
  if public.vc_check(p_name, p_token) and v is not null then
    u := coalesce((v->>'all')::boolean, false)
         or exists (select 1 from jsonb_array_elements_text(coalesce(v->'allowed', '[]'::jsonb)) a(n) where lower(a.n) = lower(p_name));
  end if;
  return jsonb_build_object('ok', true, 'unlimited', u, 'warn', w);
end $$;
revoke all on function public.vc_command_policy(text, text) from public;
grant execute on function public.vc_command_policy(text, text) to anon, authenticated;

create or replace function public.vc_dev_get_limits(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; v jsonb;
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  select value into v from public.vc_settings where key = 'command_limits';
  return jsonb_build_object('ok', true, 'all', coalesce((v->>'all')::boolean, false), 'allowed', coalesce(v->'allowed', '[]'::jsonb), 'warn', coalesce((v->>'warn')::int, 100000));
end $$;

create or replace function public.vc_dev_set_limits(p_pin text, p_all boolean, p_allowed text[], p_warn integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e jsonb; n text; v_n text; clean text[] := '{}';
begin
  e := public.vc_dev_auth(p_pin); if e is not null then return e; end if;
  foreach n in array coalesce(p_allowed, '{}'::text[]) loop
    v_n := btrim(n);
    if v_n !~ '^[A-Za-z0-9_]{3,16}$' then return jsonb_build_object('ok', false, 'error', 'bad_name'); end if;
    if not (v_n = any (clean)) then clean := clean || v_n; end if;
  end loop;
  if array_length(clean, 1) > 100 then return jsonb_build_object('ok', false, 'error', 'too_many'); end if;
  if p_warn is null or p_warn < 1000 or p_warn > 2000000000 then return jsonb_build_object('ok', false, 'error', 'bad_warn'); end if;
  insert into public.vc_settings (key, value) values ('command_limits', jsonb_build_object('all', coalesce(p_all, false), 'allowed', to_jsonb(clean), 'warn', p_warn))
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.vc_dev_get_limits(text) from public;
revoke all on function public.vc_dev_set_limits(text, boolean, text[], integer) from public;
grant execute on function public.vc_dev_get_limits(text) to anon, authenticated;
grant execute on function public.vc_dev_set_limits(text, boolean, text[], integer) to anon, authenticated;


-- ===== Teil 7: Globale Events (Halloween) =====
-- Teil 7: Globale Events (Halloween). Im Supabase-SQL-Editor einmalig ausführen. Voraussetzung: Teil 4 (Tabelle vc_settings).
-- /event halloween bzw. /event off (nur Admin „Anton“) schaltet das Event damit für ALLE Server, Welten und auch Einzelspieler-Welten.

insert into public.vc_settings (key, value) values ('events', '{"halloween": false}'::jsonb) on conflict do nothing;

create or replace function public.vc_event_get()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', true, 'halloween', coalesce((select (value->>'halloween')::boolean from public.vc_settings where key = 'events'), false));
$$;
revoke all on function public.vc_event_get() from public;
grant execute on function public.vc_event_get() to anon, authenticated;

create or replace function public.vc_event_set(p_name text, p_token text, p_key text, p_on boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_name is null or lower(p_name) <> 'anton' or not public.vc_check(p_name, p_token) then return jsonb_build_object('ok', false, 'error', 'unauthorized'); end if;
  if p_key <> 'halloween' then return jsonb_build_object('ok', false, 'error', 'bad_key'); end if;
  insert into public.vc_settings (key, value) values ('events', jsonb_build_object('halloween', coalesce(p_on, false)))
  on conflict (key) do update set value = coalesce(public.vc_settings.value, '{}'::jsonb) || jsonb_build_object('halloween', coalesce(p_on, false));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.vc_event_set(text, text, text, boolean) from public;
grant execute on function public.vc_event_set(text, text, text, boolean) to anon, authenticated;
