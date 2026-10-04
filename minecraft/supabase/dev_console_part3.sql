-- Dev-Konsole, Teil 3: Spielerdaten auf einen Server schreiben (auch für Spieler, die dort noch keine Daten haben) – für den
-- Spielerdaten-Transfer zwischen Servern. Im Supabase-SQL-Editor (Projekt voxelcraft) einfügen und "Run" klicken.

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
