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
