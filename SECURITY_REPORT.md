# CIVIQ Security Audit — RC-2 Hardening

This document reports on the security controls, Row Level Security (RLS) policies, authentication middleware, and env variable isolation verified for CIVIQ.

---

## 1. Authentication Middleware & Route Protection

* **Control**: Next.js App Router Middleware (`middleware.ts`) intercepts routing requests and refreshes Supabase sessions using `@supabase/ssr` cookies.
* **Protected Routes**: `/feed`, `/report`, `/profile`, `/admin`, `/analytics`, `/leaderboard`, `/notifications`.
* **Action**:
  * Unauthenticated users attempting to access protected paths are immediately redirected to `/auth` with the source path appended to `redirectedFrom` search query.
  * Authenticated users attempting to access `/auth` are redirected to `/feed`.

---

## 2. Row Level Security (RLS) Policies Audit

All PostgreSQL tables have RLS enabled and strictly verified:

| Table | Policy Name | Select Policy | Insert Policy | Update Policy | Delete Policy |
|---|---|---|---|---|---|
| **`profiles`** | `Anyone can read profiles` | `true` (Public read) | Trigger Definer | `auth.uid() = id` | System |
| **`reports`** | `Anyone can read reports` / `Admins/Owners update` | `true` | `auth.uid() = user_id` | `auth.uid() = user_id` OR Admin role check | `auth.uid() = user_id` |
| **`comments`** | `Anyone can read comments` | `true` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| **`votes`** | `Anyone can read votes` | `true` | `auth.uid() = user_id` | None | `auth.uid() = user_id` |
| **`report_verifications`** | `Anyone can read verifications` | `true` | `auth.uid() = user_id` | None | `auth.uid() = user_id` |
| **`user_presence`** | `Anyone can read presence` | `true` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| **`announcements`** | `Anyone can read active` | `expires_at > now()` | Admin check | Admin check | Admin check |

* **Audit Update (RC-2)**: Dropped the highly restrictive profiles select policy `auth.uid() = id` which broke cross-user comments rendering and replaced it with a secure public read select policy (`using (true)`). The write operations on profiles remain locked to `auth.uid() = id`.

---

## 3. Storage Bucket Security

* **Bucket**: `report-images` (Public bucket for CDN/image serving).
* **Upload Policy**:
  * Restricts inserts to authenticated users.
  * Enforces path containment: users can only upload files into the folder named after their own UID (`auth.uid()::text = (storage.foldername(name))[1]`).
* **Manage Policy**: Update and delete actions are locked to the folder owner using the same path containment policy.

---

## 4. Server Action Validation

We audited and confirmed that all server actions performing writes enforce:
1. Session validity check (`supabase.auth.getUser()`).
2. Actor/Owner validation (`auth.uid() = user_id` check or admin role confirmation).
3. Input validation using Zod schemas (`schemas/report-schema.ts` and others).

---

## 5. Secret Containment

* **Client/Server Boundaries**: Checked that private API keys (e.g. `GOOGLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are kept strictly private on the server. They do not carry the `NEXT_PUBLIC_` prefix and are never exposed to client-side bundles.
