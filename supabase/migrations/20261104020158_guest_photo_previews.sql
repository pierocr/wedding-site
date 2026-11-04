insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-guest-previews', 'wedding-guest-previews', false, 3145728, array['image/webp'])
on conflict (id) do nothing;

alter table public.wedding_guest_photos
  add column preview_status text not null default 'pending'
    check (preview_status in ('pending', 'processing', 'ready', 'failed')),
  add column preview_attempted_at timestamptz;
