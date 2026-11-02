create table public.manual_guest_confirmation_events (
  id bigint generated always as identity primary key,
  guest_id uuid not null references public.guest_directory(id),
  guest_name text not null,
  scope text not null check (scope in ('guest', 'companion')),
  confirmed boolean not null,
  created_at timestamptz not null default now()
);

create index manual_guest_confirmation_events_guest_idx
  on public.manual_guest_confirmation_events (guest_id, id desc);

alter table public.manual_guest_confirmation_events enable row level security;
revoke all on public.manual_guest_confirmation_events from anon, authenticated;
grant select, insert on public.manual_guest_confirmation_events to service_role;
grant usage, select on sequence public.manual_guest_confirmation_events_id_seq to service_role;
