-- El Wi-Fi del matrimonio puede ser compartido por muchos invitados.
create or replace function public.reserve_wedding_guest_photo(
  p_id uuid, p_path text, p_guest_name text, p_original_name text,
  p_content_type text, p_file_size bigint, p_request_hash text
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('wedding-guest-photos'));
  if (select count(*) from public.wedding_guest_photos where request_hash = p_request_hash and created_at > now() - interval '1 hour') >= 600
    or (select count(*) from public.wedding_guest_photos where created_at > now() - interval '1 day') >= 3000 then
    return false;
  end if;
  insert into public.wedding_guest_photos (id, object_path, guest_name, original_name, content_type, file_size, request_hash)
  values (p_id, p_path, p_guest_name, p_original_name, p_content_type, p_file_size, p_request_hash);
  return true;
end;
$$;
