BEGIN;
DO $nucleo$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'users','sessions','accounts','verifications','auth_rate_limits',
    'courses','lesson_revisions','lesson_progress','learning_events',
    'activity_sessions','assessment_attempts','lab_drafts','execution_jobs','artifacts'
  ] LOOP
    IF to_regclass(format('public.%I', relation_name)) IS NULL THEN
      RAISE EXCEPTION 'Execute as migrations do Núcleo antes da proteção RLS: %', relation_name;
    END IF;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', relation_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_name);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=relation_name AND policyname='nucleo_backend_access') THEN
      EXECUTE format('CREATE POLICY nucleo_backend_access ON public.%I FOR ALL TO nucleo_app USING (true) WITH CHECK (true)', relation_name);
    END IF;
  END LOOP;
  FOREACH relation_name IN ARRAY ARRAY['execution_jobs','artifacts'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=relation_name AND policyname='nucleo_runner_access') THEN
      EXECUTE format('CREATE POLICY nucleo_runner_access ON public.%I FOR ALL TO nucleo_runner USING (true) WITH CHECK (true)', relation_name);
    END IF;
  END LOOP;
END $nucleo$;
COMMIT;
