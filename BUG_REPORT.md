# CIVIQ Bug Report — RC-2 Audit

This document records all bugs found during the RC-2 hardening phase, diagnostic details, implemented fixes, and verification outcomes.

---

### BUG-RC2-001: Redundant `await` on Synchronous `createClient`
* **Severity**: Low (Code Quality / Performance)
* **Affected Files**:
  * [get-report.ts](file:///a:/Project/Vibe2Ship/CIVIQ/lib/reports/get-report.ts)
* **Root Cause**:
  The file imported `createClient` from `@/lib/supabase/client` (which is synchronous and instantiates the browser client), but invoked it as `const supabase = await createClient()`. While Javascript wraps non-promises in resolved promises, this is an unnecessary overhead and an anti-pattern.
* **Fix Implemented**:
  Modified line 5 in `lib/reports/get-report.ts` to execute synchronously:
  ```typescript
  const supabase = createClient()
  ```
* **Verification Performed**:
  Ran `npm run type-check` and successfully built the project. Details view fetched reports perfectly.

---

### BUG-RC2-002: Realtime Feed Socket Connection Churn on Filter Changes
* **Severity**: High (Resource Leak / Performance)
* **Affected Files**:
  * [useRealtimeFeed.ts](file:///a:/Project/Vibe2Ship/CIVIQ/hooks/useRealtimeFeed.ts)
* **Root Cause**:
  The `useEffect` hook in `useRealtimeFeed.ts` included `filters` in its dependency array. Whenever a user typed a search term, clicked a category, or changed sorting, the hook unsubscribed from the Supabase Realtime reports channel and created a new one. This created massive socket connection churn, high database server overhead, and potential race conditions in cache updates.
* **Fix Implemented**:
  * Removed `filters` from the `useEffect` dependency array so the subscription remains persistent for the lifecycle of the component.
  * Refactored event handlers (INSERT, UPDATE, DELETE) to query all active cache entries starting with the prefix `[REPORTS_QUERY_KEY]` using `queryClient.getQueryCache().findAll()`.
  * For `INSERT` events, dynamically checked the query's filter values (category, severity, status) and only prepended the new report if it matched the filter parameters.
  * For `UPDATE` and `DELETE` events, mapped over all queries to update or filter out the changed report.
* **Verification Performed**:
  Built the project. Verified that changing categories or typing in search does not reconnect the WebSocket channel. Real-time updates still propagate correctly to filtered feeds.

---

### BUG-RC2-003: Restrictive Profile Select Policy Blocking Platform Avatars & Names
* **Severity**: Critical (P1 User Experience Block)
* **Affected Files**:
  * [20260629000000_fix_profile_rls.sql](file:///a:/Project/Vibe2Ship/CIVIQ/supabase/migrations/20260629000000_fix_profile_rls.sql)
* **Root Cause**:
  The RLS policy on the `profiles` table only permitted select operations where `auth.uid() = id`. This prevented users from reading profiles of *other* users, making comment authors, report creators, and leaderboard scores resolve as empty or fallback to "Citizen" / "User".
* **Fix Implemented**:
  Created a SQL migration to drop `"Users can read their own profile"` select policy and replace it with:
  ```sql
  create policy "Anyone can read profiles" on public.profiles for select using (true);
  ```
  This securely opens read access to user profile metadata (names, avatars, roles) required for community interactions while keeping update/delete permissions restricted to the profile owner.
* **Verification Performed**:
  Ran the SQL script via Supabase Management API using the CLI. Verified that profiles are now readable, allowing usernames and avatars to load on comments, report details, and leaderboards.
