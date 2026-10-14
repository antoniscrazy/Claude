-- Teil 9: Geräte-Sperren pro Server (/ban, /unban, /banlist) – nur Server-Besitzer und Admin „Anton“.
-- Im Supabase-SQL-Editor des HAUPT-Projekts einmalig ausführen (Voraussetzung: Grundschema + Teile 2–8).
-- Ein Gerät wird über eine zufällige Geräte-Kennung (mehrfach im Browser abgelegt) und einen Browser-Fingerabdruck erkannt.
-- Gespeichert werden nur Hashes; gesperrt wird pro Server (Raum), bis /unban kommt.

create table if not exists public.vc_room_devices (
  room text not null references public.vc_rooms (id) on delete cascade,
  name_lower text not null,
  name text not null,
  device text not null,
  fp text,
  last_seen timestamptz not null default now(),
  primary key (room, name_lower, device)
);
create index if not exists vc_room_devices_device on public.vc_room_devices (room, device);

create table if not exists public.vc_room_bans (
  id bigserial primary key,
  room text not null references public.vc_rooms (id) on delete cascade,
  device text,
  fp text,
  name_lower text,
  names text[] not null default '{}',
  reason text,
  by_name text,
  created_at timestamptz not null default now()
);
create index if not exists vc_room_bans_room on public.vc_room_bans (room);
alter table public.vc_room_devices enable row level security;
alter table public.vc_room_bans enable row level security;
revoke all on table public.vc_room_devices from anon, authenticated;
revoke all on table public.vc_room_bans from anon, authenticated;

-- Beim Beitreten: ist dieses Gerät / dieser Name auf diesem Server gesperrt? Sonst Gerät dem Konto zuordnen.
create or replace function public.vc_device_join(p_room text, p_name text, p_token text, p_device text, p_fp text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room public.vc_rooms; v_ban public.vc_room_bans; v_pname text;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select * into v_room from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  if p_device is null or char_length(p_device) not between 16 and 128 then raise exception 'bad_device'; end if;
  select name into v_pname from public.vc_players where name_lower = lower(p_name);
  if not (lower(coalesce(v_room.owner, '')) = lower(p_name) or lower(p_name) = 'anton') then   -- Besitzer und Admin sind nie gesperrt
    select * into v_ban from public.vc_room_bans b
      where b.room = p_room and (b.device = p_device or (b.fp is not null and p_fp is not null and b.fp = p_fp) or b.name_lower = lower(p_name))
      order by b.id limit 1;
    if found then
      if v_ban.device is distinct from p_device then      -- gesperrter Name/Fingerabdruck auf neuem Gerät: die Sperre folgt
        insert into public.vc_room_bans (room, device, fp, names, reason, by_name)
          select p_room, p_device, p_fp, array[v_pname], v_ban.reason, v_ban.by_name
          where not exists (select 1 from public.vc_room_bans x where x.room = p_room and x.device = p_device);
      end if;
      update public.vc_room_bans set names = (select coalesce(array_agg(distinct n), '{}') from unnest(names || v_pname) n)
        where room = p_room and device = p_device;
      return jsonb_build_object('ok', true, 'banned', true, 'msg', coalesce(nullif(btrim(v_ban.reason), ''), 'Du wurdest von diesem Server gebannt.'));
    end if;
  end if;
  insert into public.vc_room_devices (room, name_lower, name, device, fp) values (p_room, lower(p_name), v_pname, p_device, p_fp)
    on conflict (room, name_lower, device) do update set last_seen = now(), fp = excluded.fp, name = excluded.name;
  return jsonb_build_object('ok', true, 'banned', false);
end $$;
revoke all on function public.vc_device_join(text, text, text, text, text) from public;
grant execute on function public.vc_device_join(text, text, text, text, text) to anon, authenticated;

-- /ban: alle bekannten Geräte des Spielers auf diesem Server sperren (und das Konto, falls noch kein Gerät bekannt ist)
create or replace function public.vc_room_ban(p_room text, p_name text, p_token text, p_target text, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room public.vc_rooms; v_t text; v_n integer := 0; r record; v_names text[];
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select * into v_room from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  if not (lower(coalesce(v_room.owner, '')) = lower(p_name) or lower(p_name) = 'anton') then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  select name into v_t from public.vc_players where name_lower = lower(p_target);
  if v_t is null then return jsonb_build_object('ok', false, 'error', 'no_player'); end if;
  if lower(v_t) = lower(coalesce(v_room.owner, '')) or lower(v_t) = 'anton' then return jsonb_build_object('ok', false, 'error', 'protected'); end if;
  for r in select d.device, d.fp from public.vc_room_devices d where d.room = p_room and d.name_lower = lower(v_t) loop
    if not exists (select 1 from public.vc_room_bans b where b.room = p_room and b.device = r.device) then
      insert into public.vc_room_bans (room, device, fp, names, reason, by_name)
        values (p_room, r.device, r.fp, (select coalesce(array_agg(distinct d2.name), '{}') from public.vc_room_devices d2 where d2.room = p_room and d2.device = r.device),
                nullif(btrim(coalesce(p_reason, '')), ''), p_name);
      v_n := v_n + 1;
    end if;
  end loop;
  if not exists (select 1 from public.vc_room_bans b where b.room = p_room and b.name_lower = lower(v_t)) then
    insert into public.vc_room_bans (room, name_lower, names, reason, by_name) values (p_room, lower(v_t), array[v_t], nullif(btrim(coalesce(p_reason, '')), ''), p_name);
  end if;
  select coalesce(array_agg(distinct n), '{}') into v_names from (
    select unnest(names) n from public.vc_room_bans where room = p_room and (name_lower = lower(v_t) or device in (select device from public.vc_room_devices where room = p_room and name_lower = lower(v_t)))) q;
  return jsonb_build_object('ok', true, 'name', v_t, 'devices', v_n, 'names', to_jsonb(v_names));
end $$;
revoke all on function public.vc_room_ban(text, text, text, text, text) from public;
grant execute on function public.vc_room_ban(text, text, text, text, text) to anon, authenticated;

-- /unban <name>: hebt alle Sperren auf, in denen dieser Name vorkommt (Gerät und Konto)
create or replace function public.vc_room_unban(p_room text, p_name text, p_token text, p_target text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room public.vc_rooms; v_n integer;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select * into v_room from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  if not (lower(coalesce(v_room.owner, '')) = lower(p_name) or lower(p_name) = 'anton') then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  delete from public.vc_room_bans b where b.room = p_room
    and (b.name_lower = lower(p_target) or lower(p_target) in (select lower(x) from unnest(b.names) x));
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'error', 'not_banned'); end if;
  return jsonb_build_object('ok', true, 'removed', v_n);
end $$;
revoke all on function public.vc_room_unban(text, text, text, text) from public;
grant execute on function public.vc_room_unban(text, text, text, text) to anon, authenticated;

-- /banlist: Namen, Grund, wer gesperrt hat (keine Geräte-Kennungen)
create or replace function public.vc_room_banlist(p_room text, p_name text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_room public.vc_rooms;
begin
  if not public.vc_check(p_name, p_token) then raise exception 'unauthorized'; end if;
  select * into v_room from public.vc_rooms where id = p_room;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_server'); end if;
  if not (lower(coalesce(v_room.owner, '')) = lower(p_name) or lower(p_name) = 'anton') then return jsonb_build_object('ok', false, 'error', 'not_allowed'); end if;
  return jsonb_build_object('ok', true, 'bans', coalesce((select jsonb_agg(jsonb_build_object('names', b.names, 'reason', b.reason, 'by', b.by_name, 'at', b.created_at, 'device', b.device is not null) order by b.id)
    from public.vc_room_bans b where b.room = p_room), '[]'::jsonb));
end $$;
revoke all on function public.vc_room_banlist(text, text, text) from public;
grant execute on function public.vc_room_banlist(text, text, text) to anon, authenticated;
