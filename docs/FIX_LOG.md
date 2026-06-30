# CIVIQ — Engineering Fix Log

This document records the exact fixes applied to stabilize the CIVIQ platform for production release.

---

### FIX-001: Redundant `await` in API queries
* **Issue ID**: FIX-RC2-001
* **Severity**: Low
* **Root Cause**:
  `createClient` in `@/lib/supabase/client` was incorrectly awaited inside `getReport`.
* **Affected Files**:
  * `lib/reports/get-report.ts`
* **Solution**:
  Invoked client instantiation synchronously.
* **Verification Performed**:
  TypeScript check and Next.js build compilation passed.
* **Status**: **Complete**

---

### FIX-002: Realtime Feed Socket Churn
* **Issue ID**: FIX-RC2-002
* **Severity**: High
* **Root Cause**:
  Filters listed as dependencies in `useRealtimeFeed.ts` caused constant socket reconnection on keypress.
* **Affected Files**:
  * `hooks/useRealtimeFeed.ts`
* **Solution**:
  Removed filters dependency. Implemented React Query Cache invalidation using `queryClient.getQueryCache().findAll()` to process INSERT, UPDATE, and DELETE changes in-memory.
* **Verification Performed**:
  Tested switching categories and filtering search query parameters. Socket does not disconnect or reconnect.
* **Status**: **Complete**

---

### FIX-003: Restrictive Profile RLS Policies
* **Issue ID**: FIX-RC2-003
* **Severity**: Critical
* **Root Cause**:
  Profile read select policy restricted reads to own profile (`auth.uid() = id`), causing username/avatar resolution to fail for other users.
* **Affected Files**:
  * `supabase/migrations/20260629000000_fix_profile_rls.sql`
* **Solution**:
  Dropped restrictive profile select policy. Replaced with `create policy "Anyone can read profiles" on public.profiles for select using (true);` to allow reading metadata like names and avatars while preserving update write locks.
* **Verification Performed**:
  Verified commenter and author details now render usernames and avatars in feed cards, detail panels, and leaderboards.
* **Status**: **Complete**

---

### FIX-004: User Presence FK Constraint Violation
* **Issue ID**: FIX-RC2-004
* **Severity**: Critical
* **Root Cause**:
  Presence updates on `user_presence` failed with foreign key errors if the user profile was missing in `public.profiles`.
* **Affected Files**:
  * `lib/realtime/update-presence.ts`
* **Solution**:
  Implemented a profile self-healing query on client update: check if profile exists, and if not, insert a default profile using user auth metadata. Handled database constraints gracefully by returning `{ success: false, error }` instead of throwing raw server exceptions.
* **Verification Performed**:
  TypeScript verification passed. The presence updates no longer trigger Next.js development error screens.
* **Status**: **Complete**

---

### FIX-005: Next.js 15 Dynamic Route Params Warning
* **Issue ID**: FIX-RC2-005
* **Severity**: Low
* **Root Cause**:
  Directly accessing dynamic parameters (`params.id`) on layouts/pages without awaiting caused console warnings under Next.js 15 specifications.
* **Affected Files**:
  * `app/report/[id]/page.tsx`
* **Solution**:
  Destructured dynamic parameters using an asynchronous `await params` syntax.
* **Verification Performed**:
  Ran build checks to verify metadata and dynamic pages render warning-free.
* **Status**: **Complete**

---

### FIX-006: Design System v2 Layout Stabilization
* **Issue ID**: FIX-RC2-006
* **Severity**: Medium
* **Root Cause**:
  Visual structures were not unified with the premium dark theme specified by the Design System v2 principles.
* **Affected Files**:
  * `app/globals.css`
  * `components/layout/navbar.tsx`
  * `app/page.tsx`
  * `app/auth/page.tsx`
  * `components/feed/report-card.tsx`
  * `components/report/report-detail-client.tsx`
  * `components/map/map-client.tsx`
  * `components/analytics/analytics-client.tsx`
  * `components/trending/trending-client.tsx`
  * `app/leaderboard/page.tsx`
  * `components/notifications/notifications-client.tsx`
  * `components/admin/admin-dashboard-client.tsx`
* **Solution**:
  Overrode standard Tailwind colors with HSL colors corresponding to permanent dark mode. Applied glass card primitives (`.glass-card`), rounded panels (`rounded-3xl`), and custom animations.
* **Verification Performed**:
  Next.js compiler completed production page generation with zero styling errors.
* **Status**: **Complete**
