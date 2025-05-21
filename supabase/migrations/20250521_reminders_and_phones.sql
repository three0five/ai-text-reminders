
-- verified phone numbers
CREATE TABLE public.phone_numbers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users ON DELETE CASCADE,
  e164_number  VARCHAR(15) NOT NULL,
  verified     BOOLEAN DEFAULT FALSE,
  verify_code  VARCHAR(6),
  code_expires TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner phones" ON public.phone_numbers
  FOR ALL USING (auth.uid() = user_id);

-- server-side reminders
CREATE TABLE public.reminders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users ON DELETE CASCADE,
  phone_id     UUID REFERENCES public.phone_numbers ON DELETE CASCADE,
  body         TEXT        NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','sent','failed')),
  sent_at      TIMESTAMPTZ,
  error_code   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reminders to verified phones" ON public.reminders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (SELECT verified FROM public.phone_numbers p WHERE p.id = phone_id)
  )
  USING (auth.uid() = user_id);
CREATE INDEX ON public.reminders (status, scheduled_at);
