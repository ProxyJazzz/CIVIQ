# BUG REPORT — CIVIQ PLATFORM (RC-1 & RC-2 AUDIT)

This document registers all audited bugs, diagnostic details, recommended resolutions, estimated efforts, and their current resolution status.

---

### BUG-001: Missing Redirect on Successful Report Submission
* **Severity**: High (P1)
* **Affected Files**:
  * [report-form.tsx](file:///a:/Project/Vibe2Ship/CIVIQ/components/report/report-form.tsx)
* **Root Cause**:
  The form submission process only set the success state and kept the user on the submission page. It did not redirect the user to the newly generated report detail view (`/report/${id}`), breaking the user experience.
* **Recommended Fix**:
  Import `useRouter` from `next/navigation` and call `router.push('/report/' + report.id)` after a 1.5-second delay upon successful submission.
* **Estimated Effort**: 0.5 hours
* **Status**: **Resolved**

---

### BUG-002: Missing Real-Time Verifications Updates
* **Severity**: High (P1)
* **Affected Files**:
  * [report-detail-client.tsx](file:///a:/Project/Vibe2Ship/CIVIQ/components/report/report-detail-client.tsx)
  * [useRealtimeVerifications.ts](file:///a:/Project/Vibe2Ship/CIVIQ/hooks/useRealtimeVerifications.ts) (New File)
* **Root Cause**:
  While votes, comments, and reports feed updates were synchronized in real-time using Supabase Realtime Postgres change channels, verifications had no such sync mechanism. Other users viewing the page would not see the verification count update dynamically.
* **Recommended Fix**:
  Create a `useRealtimeVerifications` hook modeled after `useRealtimeVotes` to subscribe to the `report_verifications` table changes for the given `reportId` and update the local query client cache. Invoke this hook on the report details page.
* **Estimated Effort**: 1 hour
* **Status**: **Resolved**

---

### BUG-003: Missing Replication Table for Verifications
* **Severity**: High (P1)
* **Affected Files**:
  * [20260623150000_civiq_realtime.sql](file:///a:/Project/Vibe2Ship/CIVIQ/supabase/migrations/20260623150000_civiq_realtime.sql)
* **Root Cause**:
  The database publication configuration script did not include `public.report_verifications` in the `supabase_realtime` replication publication. Thus, the database would not broadcast changes on the verifications table, rendering real-time UI subscriptions non-functional.
* **Recommended Fix**:
  Add an alter publication command block for `public.report_verifications` check and inclusion in the migration SQL script.
* **Estimated Effort**: 0.5 hours
* **Status**: **Resolved**

---

### BUG-004: Redundant Query Select Call in Hotspot Detection
* **Severity**: Low (P3)
* **Affected Files**:
  * [detect-hotspots.ts](file:///a:/Project/Vibe2Ship/CIVIQ/lib/realtime/detect-hotspots.ts)
* **Root Cause**:
  The select query chained two `.select()` calls: `.select('id', { head: false })` followed by a custom column selector select call. This is redundant.
* **Recommended Fix**:
  Remove the duplicate select call and keep only the column selection query.
* **Estimated Effort**: 0.2 hours
* **Status**: **Resolved**

---

### BUG-005: Empty Mapbox Access Token
* **Severity**: Medium (P2)
* **Affected Files**:
  * `.env.local`
* **Root Cause**:
  The token `NEXT_PUBLIC_MAPBOX_TOKEN` is blank in default environments, which prevents Mapbox gl from loading style sheets and maps, prompting an instructional block.
* **Recommended Fix**:
  Provide a valid Mapbox Public Access token in environment configuration.
* **Estimated Effort**: 0.1 hours
* **Status**: **Pending Environment Config**

---

### BUG-006: User Presence Foreign Key Constraint Violation
* **Severity**: Critical (P1 Server/Client Crash)
* **Affected Files**:
  * [update-presence.ts](file:///a:/Project/Vibe2Ship/CIVIQ/lib/realtime/update-presence.ts)
* **Root Cause**:
  The `user_presence` table references `public.profiles(id)` via a foreign key constraint. When an authenticated user's presence was updated, if their record in `public.profiles` did not exist (due to signup delay, trigger delay, or manual creation in `auth.users`), the update failed with a foreign key constraint violation and crashed the server action response.
* **Recommended Fix**:
  Add a self-healing check inside `updatePresence` that queries `public.profiles`. If the user profile is missing, insert a default profile record dynamically before upserting the user presence state. Additionally, handle database errors gracefully and return status indicators instead of throwing raw exceptions.
* **Estimated Effort**: 1 hour
* **Status**: **Resolved**
