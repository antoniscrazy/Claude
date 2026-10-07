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
