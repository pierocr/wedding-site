-- El mismo bucket conserva las descargas y los originales existentes.
update storage.buckets set file_size_limit = 1073741824,
  allowed_mime_types = array['image/jpeg','image/png','image/heic','image/heif','image/webp','video/mp4','video/quicktime','video/webm','video/3gpp','video/x-m4v']
where id = 'wedding-guest-photos';
