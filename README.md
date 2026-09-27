# CTF Certificate Portal

A Vercel-ready Next.js App Router application for issuing, storing, verifying, and downloading CTF certificates. It uses Supabase Postgres for metadata and private Supabase Storage buckets for templates and PDFs.

## What it does

- Admin passkey-protected `/admin` dashboard with signed, HttpOnly sessions.
- Participation and Top 5 `.docx` template uploads. The supported `docxtemplater` tags are `{fullName}`, `{email}`, `{rank}`, and `{date}`.
- CSV/XLS/XLSX import, explicit column mapping, email/rank validation, duplicate detection, and Top 5 auto-detection.
- Browser-driven batches of **10** records. Each request stays short enough for Vercel's serverless limits; the dashboard drives the next batch and displays progress.
- `docxtemplater`/`pizzip` renders each uploaded DOCX to validate its tags; `@react-pdf/renderer` creates the final server-side PDF. This avoids native LibreOffice/Chromium binaries and is dependable on Vercel.
- Private PDF storage and 30-minute signed URLs for both the participant portal and admin exports.

## Setup

1. Create a Supabase project and run [the migration](./supabase/migrations/001_certificates.sql) in its SQL Editor.
2. Copy `.env.example` to `.env.local`, fill in the Supabase URL/service-role key, and generate strong `ADMIN_PASSKEY` and `ADMIN_SESSION_SECRET` values.
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Visit `/admin`, upload both `.docx` templates, then upload the participant spreadsheet. Visit `/` to verify a certificate by email.

## Deploy to Vercel

Import the GitHub repository in Vercel, add every variable from `.env.example` in **Project Settings → Environment Variables**, and deploy. The generation route is configured for the 60-second Vercel function maximum, but browser batching keeps each call to at most ten PDFs.

## Important implementation note

Vercel serverless functions do not support the usual local LibreOffice DOCX-to-PDF executable. This project deliberately uses a server-side React PDF certificate design for the deliverable while still rendering uploaded DOCX templates through `docxtemplater` so placeholder syntax is enforced. If visual fidelity to an existing Word design is required, replace `generateCertificatePdf` in `lib/certificate-pdf.tsx` with an external DOCX/PDF conversion provider; the upload, queue, storage, and metadata contract remains unchanged.

## Security model

The browser never receives the Supabase service-role key. The database has RLS enabled with no client policies, storage buckets are private, and documents are provided only through expiring signed URLs. The admin passkey is compared server-side using a timing-safe comparison and a signed HttpOnly cookie limits access to 12 hours.
