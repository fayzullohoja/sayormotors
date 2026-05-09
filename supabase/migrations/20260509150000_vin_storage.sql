-- Storage bucket for VIN-request photos.
-- Private bucket; reads are mediated by signed URLs from the app.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vin-photos',
  'vin-photos',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
