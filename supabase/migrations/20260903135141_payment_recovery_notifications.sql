-- Seguimiento independiente de recordatorios de pago. No modifica ni elimina
-- registros históricos de payments ni email_logs.
create table if not exists public.payment_recoveries (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'sent', 'skipped_paid_later', 'skipped_paid', 'failed', 'unknown')
  ),
  notification_type text check (notification_type in ('pending', 'rejected', 'cancelled')),
  retry_token_hash text unique,
  retry_token_expires_at timestamptz,
  retry_link_opened_at timestamptz,
  customer_email_sent_at timestamptz,
  internal_email_sent_at timestamptz,
  last_evaluated_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_recoveries_status_created_at_idx
  on public.payment_recoveries (status, created_at);

alter table public.payment_recoveries enable row level security;

-- La aplicación usa exclusivamente la service role para pagos y correos.
-- Revocar estos permisos no altera filas existentes y evita exponer datos de pago.
revoke all on table public.payments, public.email_logs, public.webhook_logs, public.payment_recoveries
  from anon, authenticated;
