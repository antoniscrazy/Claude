-- Dev-Konsole, Teil 2: Lösch- und Änderungsfunktionen. Im Supabase-SQL-Editor (Projekt voxelcraft) einfügen und "Run" klicken.
-- (Teil 1 mit PIN-Prüfung, Übersicht und Server-Ansicht ist bereits aktiv.)

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

revoke all on function public.vc_dev_delete_room(text, text), public.vc_dev_reset_world(text, text), public.vc_dev_delete_container(text, text, integer, integer, integer),
  public.vc_dev_set_state(text, text, text, jsonb), public.vc_dev_delete_player(text, text, boolean), public.vc_dev_update_room(text, text, text, text[], boolean, text) from public;
grant execute on function public.vc_dev_delete_room(text, text), public.vc_dev_reset_world(text, text), public.vc_dev_delete_container(text, text, integer, integer, integer),
  public.vc_dev_set_state(text, text, text, jsonb), public.vc_dev_delete_player(text, text, boolean), public.vc_dev_update_room(text, text, text, text[], boolean, text) to anon, authenticated;
