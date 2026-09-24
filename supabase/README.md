# Supabase setup

Run the migration in `migrations/` using the Supabase CLI or SQL Editor. Create the first user in Authentication, then promote it manually in SQL: `update public.profiles set role='admin' where id='<auth-user-uuid>';`. Never expose an interface that lets users modify `profiles.role`.

The gallery and members buckets are public for image delivery. Upload, modification, and deletion are limited by storage RLS to authenticated admins. Browser code uses only the anon key; Edge Functions alone use server secrets.
