create table public.guest_payment_dismissals (
  guest_id uuid primary key references public.guest_directory(id) on delete cascade,
  guest_name text not null,
  reason text not null check (reason in ('paid', 'other')),
  updated_at timestamptz not null default now()
);

alter table public.guest_payment_dismissals enable row level security;
revoke all on public.guest_payment_dismissals from anon, authenticated;
grant select, insert, update, delete on public.guest_payment_dismissals to service_role;
