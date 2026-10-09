create table public.guest_directory (
  id uuid primary key default gen_random_uuid(),
  source_file_id text not null,
  source_row integer not null check (source_row > 0),
  source_fingerprint text not null,
  first_name text,
  last_name text,
  companion_name text,
  email text,
  phone text,
  mobile_phone text,
  group_name text,
  invitation_status text,
  attendance_status text,
  menu_preference text,
  address text,
  table_assignment text,
  sex text,
  food_notes text,
  party_size smallint check (party_size between 1 and 10),
  is_active boolean not null default true,
  source_data jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_file_id, source_row)
);

create index guest_directory_active_idx
  on public.guest_directory (is_active)
  where is_active = true;

create table public.guest_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_file_id text not null,
  source_modified_at timestamptz,
  status text not null check (status in ('running', 'completed', 'failed')),
  rows_seen integer not null default 0 check (rows_seen >= 0),
  rows_created integer not null default 0 check (rows_created >= 0),
  rows_updated integer not null default 0 check (rows_updated >= 0),
  rows_deactivated integer not null default 0 check (rows_deactivated >= 0),
  guest_count integer not null default 0 check (guest_count >= 0),
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index guest_sync_runs_started_at_idx
  on public.guest_sync_runs (started_at desc);

-- These tables are internal to the authenticated dashboard server. The Data API
-- must not expose the personal contact details in the imported guest list.
alter table public.guest_directory enable row level security;
alter table public.guest_sync_runs enable row level security;

revoke all on table public.guest_directory from anon, authenticated;
revoke all on table public.guest_sync_runs from anon, authenticated;
