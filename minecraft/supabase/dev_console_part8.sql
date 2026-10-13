-- Teil 8: Admin-Teleport zu Offline-Spielern (/tp <name>, nur Admin „Anton“ im Admin-Modus).
-- Im Supabase-SQL-Editor einmalig ausführen. Voraussetzung: das Spiel speichert die Spielerzustände bereits in public.vc_states (Grundschema).
-- Liefert nur Position, Dimension und Blickrichtung – KEIN Inventar.

create or replace function public.vc_admin_player_pos(p_room text, p_name text, p_token text, p_target text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v record;
begin
  if p_name is null or lower(p_name) <> 'anton' or not public.vc_check(p_name, p_token) then return jsonb_build_object('ok', false, 'error', 'unauthorized'); end if;
  select s.name, s.data, s.updated_at into v from public.vc_states s where s.room = p_room and lower(s.name) = lower(p_target) limit 1;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown_player'); end if;
  return jsonb_build_object('ok', true, 'name', v.name, 'pos', v.data->'pos', 'dim', coalesce(v.data->'dim', '0'::jsonb), 'yaw', v.data->'yaw', 'pitch', v.data->'pitch', 'updated', v.updated_at);
end $$;
revoke all on function public.vc_admin_player_pos(text, text, text, text) from public;
grant execute on function public.vc_admin_player_pos(text, text, text, text) to anon, authenticated;

create or replace function public.vc_admin_room_players(p_room text, p_name text, p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if p_name is null or lower(p_name) <> 'anton' or not public.vc_check(p_name, p_token) then return jsonb_build_object('ok', false, 'error', 'unauthorized'); end if;
  return jsonb_build_object('ok', true, 'names', coalesce((select jsonb_agg(s.name order by s.name) from public.vc_states s where s.room = p_room), '[]'::jsonb));
end $$;
revoke all on function public.vc_admin_room_players(text, text, text) from public;
grant execute on function public.vc_admin_room_players(text, text, text) to anon, authenticated;
