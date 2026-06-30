# CIVIQ Release Candidate RC-2 Checklist

This checklist documents the verification of the CIVIQ hyperlocal community intelligence platform for the national hackathon demo. All checks are fully verified.

---

## 1. Phase 1 & 2: Route & Layout Verification
Verified all routes for correct rendering of loading skeletons, zero-states, error boundaries, authentication redirections, and client-server separation.

- [x] **`/` (Landing Page)**: Verified background radial gradients render without layout shifts.
- [x] **`/auth` (Authentication)**: Verified redirection of authenticated users to `/feed`. Verification of OAuth callbacks.
- [x] **`/feed` (Community Feed)**: Verified loading skeleton displays. Tested infinite scroll, hybrid semantic search, category, status, and severity filters.
- [x] **`/report` (Report Submission)**: Verified redirection of unauthenticated users to `/auth`. Verified multi-step form (Upload → Fill Details → AI analysis → Submit).
- [x] **`/report/[id]` (Report Detail)**: Verified params promise resolution (Next.js 15 App Router spec). Verified loading skeletons and error boundaries for non-existent IDs.
- [x] **`/profile` (User Profile)**: Verified personal history metrics and loading states.
- [x] **`/map` (Interactive Maps)**: Verified coordinates load. Verified emergency hotspot radar pulses.
- [x] **`/analytics` (Metrics Dashboard)**: Verified charts rendering of averages, totals, and statuses.
- [x] **`/leaderboard` (Trophy Leaderboard)**: Verified leaderboard calculations and listing ranking.
- [x] **`/admin` (Civic Ops Panel)**: Verified strict admin verification. Verified dropdown actions and internal notes.
- [x] **`/notifications` (Inbox)**: Verified read/unread statuses and mark-all-read action.
- [x] **`/trending` (Trending Feed)**: Verified hot issues view and activity charts.

---

## 2. Phase 3 & 4: API & Realtime Layer Verification
- [x] **Database Optimization**: Verified that index is created on `reports(embedding)` using HNSW cosine distance for fast semantic lookup. Verified indices on `votes(report_id)`, `comments(report_id)`, `report_verifications(report_id)`.
- [x] **Redundant Await Cleanup**: Cleaned up the redundant asynchronous await wrapper around synchronous `createClient()` client-side queries in `lib/reports/get-report.ts`.
- [x] **Realtime Socket Churn Elimination**: Refactored `hooks/useRealtimeFeed.ts` to keep a single socket channel open on mounting. Updates are broadcast to all matching cached filter queries dynamically using the React Query Cache API.
- [x] **Presence Sync**: Verified visibility change listeners correctly track `online` / `away` / `offline` states in the `user_presence` table.
- [x] **Interaction Synchronization**: Verified real-time updates of votes, comments, and verifications propagate instantly without latency or race conditions.

---

## 3. Phase 6 & 8: Security & Code Quality Validation
- [x] **Profile Table RLS Update**: Created migration script `20260629000000_fix_profile_rls.sql` to modify RLS policies, allowing public read (`using (true)`) on the `profiles` table to render commenter avatars and names.
- [x] **Server Action Security**: Verified role validation on all operational actions (assigning departments, updating status, creating internal notes, managing announcements).
- [x] **TypeScript Compliance**: Verified strict compilation with zero TypeScript errors or warnings.
- [x] **Linting Enforced**: Verified ESLint rules run with zero warnings.
- [x] **Bundle Check**: Verified Next.js production builds output successfully.

---

## 4. Phase 9: Seeding & Demo Readiness
- [x] **New Delhi Hotspot Clustering**: Seeded reports around Delhi coordinates `[77.209, 28.6139]`.
- [x] **Clustered High-Severity Pothole/Garbage/Leakage**: Placed 3 high-severity pending issues within 100 meters in Connaught Place Block A to trigger and verify the emergency pulsing hotspot detector.
- [x] **Interactions Seeding**: Populated 24 comments, votes, and verification histories across the issues to populate the dashboard metrics.
