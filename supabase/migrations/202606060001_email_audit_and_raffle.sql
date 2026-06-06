alter table public.payments
  add column if not exists raffle_number integer;

update public.payments
set raffle_number = nullif(meta->>'raffle_number', '')::integer
where raffle_number is null
  and meta ? 'raffle_number'
  and nullif(meta->>'raffle_number', '') is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_raffle_number_range'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_raffle_number_range
      check (raffle_number is null or raffle_number between 100000 and 999999);
  end if;
end $$;

create unique index if not exists payments_raffle_number_unique
  on public.payments (raffle_number)
  where raffle_number is not null;

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  source text not null,
  status text not null default 'sending',
  provider text not null default 'resend',
  provider_message_id text,
  payment_id uuid references public.payments(id) on delete set null,
  external_reference text,
  flow_order text,
  flow_token text,
  raffle_number integer,
  donor_name text,
  donor_email text not null,
  amount integer,
  subject text not null,
  from_email text not null,
  to_email text not null,
  bcc text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  provider_response jsonb,
  error_message text,
  error_details text,
  attempt_count integer not null default 1,
  constraint email_logs_status_check check (status in ('sending', 'sent', 'failed')),
  constraint email_logs_raffle_number_range check (
    raffle_number is null or raffle_number between 100000 and 999999
  )
);

create index if not exists email_logs_payment_id_idx
  on public.email_logs (payment_id);

create index if not exists email_logs_provider_message_id_idx
  on public.email_logs (provider_message_id);

create index if not exists email_logs_donor_email_created_at_idx
  on public.email_logs (donor_email, created_at desc);

create index if not exists email_logs_raffle_number_idx
  on public.email_logs (raffle_number)
  where raffle_number is not null;

alter table public.email_logs enable row level security;
