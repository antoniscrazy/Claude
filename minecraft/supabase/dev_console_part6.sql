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
