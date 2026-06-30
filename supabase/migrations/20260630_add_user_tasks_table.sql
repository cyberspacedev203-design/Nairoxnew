-- Add user_tasks table for strict task timer tracking
CREATE TABLE IF NOT EXISTS public.user_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id integer NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone,
  status text NOT NULL DEFAULT 'verifying',
  reward_amount integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_tasks_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON public.user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON public.user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_started_at ON public.user_tasks(started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tasks_unique_start ON public.user_tasks(user_id, task_id, started_at);
