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
