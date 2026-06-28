# RELEASE CHECKLIST — CIVIQ PLATFORM (RC-1)

Release verification checklist for the production shipment of CIVIQ.

---

## 1. Authentication
- [x] Verify Google OAuth flow functions and correctly sets Supabase user session.
- [x] Verify client state synchronization via `AuthProvider`.
- [x] Verify secure route protection inside `middleware.ts` for routes `/feed`, `/report`, `/profile`, `/admin`, `/analytics`, `/leaderboard`, `/notifications`.
- [x] Verify dynamic navbar adaptations depending on the active user session.

## 2. Report Flow
- [x] Verify image files validate against size limit (8MB) and accepted types (JPEG, PNG, WebP).
- [x] Verify image uploads successfully to Supabase `report-images` storage bucket.
- [x] Verify image analysis generates correct category, severity, department, summary, and tags via Google Gemini.
- [x] Verify coordinates and address detection works (Geolocation API and Nominatim OpenStreetMap fallback).
- [x] Verify duplication scan checks and warns user of existing issues within 150 meters.
- [x] Verify report details persist in the `reports` database table.
- [x] Verify automatic redirection to `/report/${id}` upon successful report submission.

## 3. Feed
- [x] Verify skeleton loading animation screens show while fetching records.
- [x] Verify empty feed matches show an appropriate zero-state illustration and text.
- [x] Verify error state displays with refresh action triggers.
- [x] Verify infinite scrolling page pagination works as the sentinel comes into view.
- [x] Verify category, severity, and status filtration parameters filter reports database query.
- [x] Verify search queries trigger hybrid semantic searches (or fallback keyword matches).
- [x] Verify realtime insertion, updates, and deletions reflect dynamically.

## 4. Map
- [x] Verify map loads correctly when a valid `NEXT_PUBLIC_MAPBOX_TOKEN` is supplied.
- [x] Verify pins render on coordinates retrieved dynamically from `reports_with_stats`.
- [x] Verify pins color-code properly depending on severity level (Red = High, Amber = Medium, Green = Low).
- [x] Verify hovering/clicking pins opens an informative details popup card.
- [x] Verify emergency hotspot clusters display pulsing radar effects for clusters of unresolved high-severity issues.

## 5. Realtime Layer
- [x] Verify user presence tracks online/away statuses and updates the navigation user count.
- [x] Verify realtime notifications push via `RealtimeListener` toast notifications and increment unread counts.
- [x] Verify realtime comment submissions, edits, and deletions sync instantly.
- [x] Verify realtime voting and verification toggles update statistics views without latency.
- [x] Verify all realtime channels are cleaned up on unmount to prevent leaks and duplication.

## 6. Analytics & Leaderboard
- [x] Verify `getAnalyticsSummary` queries databases directly to aggregate metrics.
- [x] Verify department resolution rates and status metrics compute without errors.
- [x] Verify leaderboard computes scoring rules (Reports filed × 10, Verifications × 5, Votes × 2) accurately from view.

## 7. Performance & Security
- [x] Run `npm run lint` and `npm run type-check` to enforce zero static errors.
- [x] Confirm page routing configuration and server-side headers are secured.
- [x] Verify Row Level Security (RLS) is enabled and enforces auth policies for all tables.
- [x] Verify API environment keys (`GOOGLE_API_KEY`, Supabase URL/Key) are loaded from `.env.local` securely.
