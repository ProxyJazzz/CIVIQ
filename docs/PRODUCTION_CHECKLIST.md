# CIVIQ — Production Readiness Checklist

This checklist lists the configurations required to deploy CIVIQ securely to production hosting (e.g., Vercel, Supabase Cloud).

---

## 1. Environment Variable Specifications

Ensure the following variables are configured in the hosting provider dashboard:

```bash
# Supabase Connectivity
NEXT_PUBLIC_SUPABASE_URL=your-production-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Mapbox GIS Styling
NEXT_PUBLIC_MAPBOX_TOKEN=your-production-mapbox-token

# Gemini LLM Classification
GEMINI_API_KEY=your-production-gemini-api-key
```

---

## 2. Supabase Authentication Setup

* **Google OAuth**:
  * Set up Google Cloud Console credentials.
  * Enable the Google provider under **Supabase Authentication > Providers**.
  * Enter Google Client ID and Google Client Secret.
  * Configure redirect URI to point to:
    `https://your-production-domain.supabase.co/auth/v1/callback`
  * Add production login callback paths to **Authentication > URL Configuration > Redirect URLs**:
    `https://your-production-domain.vercel.app/auth/callback`

---

## 3. Database Schema & RLS Audit

Verify that all tables have Row Level Security enabled and active policies:

| Table | RLS Status | Select Policy | Write Policy |
| :--- | :--- | :--- | :--- |
| `profiles` | ENABLED | Public read (`using (true)`) | Owner write (`auth.uid() = id`) |
| `reports` | ENABLED | Public read (`using (true)`) | Authenticated write |
| `comments` | ENABLED | Public read (`using (true)`) | Owner write |
| `votes` | ENABLED | Public read (`using (true)`) | Owner write |
| `report_verifications` | ENABLED | Public read (`using (true)`) | Owner write |
| `user_presence` | ENABLED | Public read (`using (true)`) | Owner write |
| `announcements` | ENABLED | Active only (`expires_at > now()`) | Admin only |

---

## 4. Supabase Storage Configuration

* **`reports` Bucket**:
  * Create a public storage bucket named `reports`.
  * Ensure RLS is enabled on the storage bucket.
  * **Select Policy**: Allow anyone to read files:
    `using (true)`
  * **Insert/Update Policy**: Allow authenticated users to upload files to their corresponding directory paths:
    `using (bucket_id = 'reports' and auth.role() = 'authenticated')`
  * Set up proper CORS policies to allow uploads from your production domain.

---

## 5. Supabase Realtime Publication

Confirm tables are linked to the replication publication so that client subscriptions function:

```sql
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.report_verifications;
alter publication supabase_realtime add table public.user_presence;
alter publication supabase_realtime add table public.announcements;
```

---

## 6. Build & Bundler Optimization

* **Hydration Warnings**: Suppressed `suppressHydrationWarning` on `<html>` since theme injections can create slight initial differences.
* **Force Dynamic**: Routes referencing server cookies/headers (like `/feed`, `/map`, `/admin`, `/profile`) use `export const dynamic = 'force-dynamic'` to prevent incorrect build-time static page caching.
