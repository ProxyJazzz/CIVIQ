# CIVIQ Performance Audit — RC-2 Optimizations

This document reports the performance optimizations implemented for CIVIQ, database index status, network metrics, and code bundle analysis.

---

## 1. Network & Realtime Optimization (Socket Churn Resolved)

* **Audit Finding**: Changing filters on the Feed page (category, severity, sorting, or typing in search) was forcing a complete teardown and rebuild of the Supabase Realtime WebSocket connection.
* **Impact**:
  * Severe server-side strain (re-connections every time the user types or filters).
  * High UI latency while waiting for the socket connection handshake (100–300ms).
  * Potential race conditions and stale cache updates.
* **Optimization**:
  * Removed the filter state from the `useRealtimeFeed` effect dependency array.
  * Refactored cache updates to query React Query Cache dynamically for all matching queries and update them in place.
* **Outcome**: Single connection remains open throughout the feed lifecycle. **Zero socket re-connections** during filter/search queries, saving network overhead.

---

## 2. Database Indexes & Query Optimizations

We verified the index design in migrations:
* **HNSW (Hierarchical Navigable Small World) Index on Embeddings**:
  An index on `reports(embedding)` using HNSW cosine distance (`reports_embedding_idx`) provides sub-millisecond semantic query speeds for hybrid search and duplicate matching, avoiding sequential scan degradation.
* **Foreign Key Indexing**:
  * Indexes are established on `votes(report_id)`, `comments(report_id)`, and `report_verifications(report_id)`.
  * Indexes are established on `user_presence(last_seen_at)` to support background heartbeat cleanups.
  * Indexes on `reports` for `department_id` and `user_id` are in place.

---

## 3. Bundle Size & Code-Splitting Audit

* **Next.js Production Build Analysis**:
  * Shared JS bundle size is **102 kB** (within core vitals guidelines).
  * **Mapbox (`/map`)**: Bundled at 493 kB but isolated entirely to the `/map` page and imported dynamically, ensuring other routes (Feed, Auth, Leaderboard) are not burdened by heavy library files.
  * **Next.js 15 App Router**: Server components render layout and markup on the server, sending minified payload to the browser. Client components are kept compact and modular.

---

## 4. Client Caching Strategy

* **API Caching**:
  Queries are wrapped in `React Query` with initial data and optimistic update invalidation paths, eliminating redundant fetch rounds.
* **Dynamic Page Caching**:
  Dynamic routes (`/feed`, `/report`, `/admin`) are marked `force-dynamic` to ensure fresh server-rendered HTML payloads while utilizing client-side state hooks for subsequent real-time changes.
