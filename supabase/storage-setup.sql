-- Run once in the Supabase SQL Editor to create the private tutor document bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutor-documents',
  'tutor-documents',
  false,
  15728640,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students can read their tutor documents" on storage.objects;
create policy "Students can read their tutor documents"
on storage.objects for select to authenticated
using (bucket_id = 'tutor-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Students can upload their tutor documents" on storage.objects;
create policy "Students can upload their tutor documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'tutor-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Students can delete their tutor documents" on storage.objects;
create policy "Students can delete their tutor documents"
on storage.objects for delete to authenticated
using (bucket_id = 'tutor-documents' and (storage.foldername(name))[1] = auth.uid()::text);
