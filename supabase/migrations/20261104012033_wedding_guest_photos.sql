-- El bucket no concede acceso público: las subidas utilizan permisos firmados.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-guest-photos', 'wedding-guest-photos', false, 20971520,
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'])
on conflict (id) do nothing;

create table public.wedding_guest_photos (
  id uuid primary key,
  object_path text not null unique,
  guest_name text,
  original_name text not null,
  content_type text not null,
  file_size bigint not null,
  request_hash text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.wedding_guest_photos enable row level security;
revoke all on public.wedding_guest_photos from anon, authenticated;
create index wedding_guest_photos_request_created_idx on public.wedding_guest_photos (request_hash, created_at desc);
create index wedding_guest_photos_created_idx on public.wedding_guest_photos (created_at desc);

-- Reserva atómica: protege también frente a solicitudes simultáneas entre instancias.
create function public.reserve_wedding_guest_photo(
  p_id uuid, p_path text, p_guest_name text, p_original_name text,
  p_content_type text, p_file_size bigint, p_request_hash text
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('wedding-guest-photos'));
  if (select count(*) from public.wedding_guest_photos where request_hash = p_request_hash and created_at > now() - interval '1 hour') >= 60
    or (select count(*) from public.wedding_guest_photos where created_at > now() - interval '1 day') >= 1200 then
    return false;
  end if;
  insert into public.wedding_guest_photos (id, object_path, guest_name, original_name, content_type, file_size, request_hash)
  values (p_id, p_path, p_guest_name, p_original_name, p_content_type, p_file_size, p_request_hash);
  return true;
end;
$$;
revoke all on function public.reserve_wedding_guest_photo(uuid,text,text,text,text,bigint,text) from public, anon, authenticated;
grant execute on function public.reserve_wedding_guest_photo(uuid,text,text,text,text,bigint,text) to service_role;
