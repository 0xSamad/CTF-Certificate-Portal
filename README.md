# CTF Certificate Portal

A Vercel-ready Next.js App Router application for issuing, storing, verifying, and downloading CTF certificates. It uses Supabase Postgres for metadata and private Supabase Storage buckets for templates and PDFs.

## What it does

- Admin passkey-protected `/admin` dashboard with signed, HttpOnly sessions.
- CSV/XLS/XLSX import with only **Full Name** required and optional **Rank** for Top 5 detection.
- Browser-driven batches of **10** records, each generating a branded JPG named from the participant's full name.
- Built-in Peshawar Pentesters participation and Top 5 artwork, produced from the supplied certificate designs.
- A public home-page gallery where anyone can search by name and download the JPG certificate.

## Setup

1. Create a Supabase project and run [the migration](./supabase/migrations/001_certificates.sql) in its SQL Editor. If you ran an older version of the migration before this JPG-gallery change, run [002_public_jpg_gallery.sql](./supabase/migrations/002_public_jpg_gallery.sql) afterwards.
2. Copy `.env.example` to `.env.local`, fill in the Supabase URL/service-role key, and generate strong `ADMIN_PASSKEY` and `ADMIN_SESSION_SECRET` values.
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Visit `/admin`, upload the participant spreadsheet, and generate JPGs. Visit `/` to browse the public gallery.

## Deploy to Vercel

Import the GitHub repository in Vercel, add every variable from `.env.example` in **Project Settings → Environment Variables**, and deploy. The generation route is configured for the 60-second Vercel function maximum, but browser batching keeps each call to at most ten PDFs.

## Security model

The browser never receives the Supabase service-role key. The database has RLS enabled with no client policies. The `certificate-images` bucket is deliberately public because this version publishes a searchable gallery of names and certificate images. The admin passkey is compared server-side using a timing-safe comparison and a signed HttpOnly cookie limits access to 12 hours.
