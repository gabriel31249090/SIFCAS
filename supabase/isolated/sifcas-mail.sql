-- SIFCAS Mail: extensão isolada para homologação. NÃO aplicar diretamente na produção
-- sem validar a baseline real, as referências e os grants do projeto SIFCAS.
begin;

create table public.sifcas_mail_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email text not null check (length(email) between 5 and 254 and email !~ '[[:cntrl:]]'),
  refresh_token_ciphertext text not null check (length(refresh_token_ciphertext) between 40 and 4096),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sifcas_mail_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  sender_user_id uuid not null references public.profiles(id),
  class_subject_id uuid references public.class_subjects(id) on delete set null,
  category text not null check (category in ('manual','assessment')),
  event_key text unique check (event_key is null or length(event_key) between 10 and 200),
  subject_template text not null check (length(subject_template) between 3 and 150),
  body_template text not null check (length(body_template) between 10 and 5000),
  scheduled_for timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.sifcas_mail_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sifcas_mail_campaigns(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id),
  recipient_user_id uuid not null references public.profiles(id),
  to_email text not null check (length(to_email) between 5 and 254 and to_email !~ '[[:cntrl:]]'),
  subject text not null check (length(subject) between 3 and 200 and subject !~ '[[:cntrl:]]'),
  body text not null check (length(body) between 10 and 10000),
  status text not null default 'queued' check (status in ('queued','sending','sent','failed')),
  attempts integer not null default 0 check (attempts between 0 and 3),
  next_attempt_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  gmail_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  unique(campaign_id,recipient_user_id)
);

create index sifcas_mail_deliveries_queue_idx on public.sifcas_mail_deliveries(status,next_attempt_at);
create index sifcas_mail_deliveries_sender_idx on public.sifcas_mail_deliveries(sender_user_id,status,sent_at);
create index sifcas_mail_campaigns_creator_idx on public.sifcas_mail_campaigns(created_by,created_at desc);

alter table public.sifcas_mail_connections enable row level security;
alter table public.sifcas_mail_campaigns enable row level security;
alter table public.sifcas_mail_deliveries enable row level security;

-- Exclusivamente backend com chave service_role. O navegador não lê tokens,
-- listas de destinatários ou histórico de mensagens de outras contas.
revoke all on public.sifcas_mail_connections, public.sifcas_mail_campaigns, public.sifcas_mail_deliveries from public, anon, authenticated;
grant select,insert,update,delete on public.sifcas_mail_connections, public.sifcas_mail_campaigns, public.sifcas_mail_deliveries to service_role;

commit;
