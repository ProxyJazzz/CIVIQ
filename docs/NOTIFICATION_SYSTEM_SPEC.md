# CIVIQ Enhanced Real-Time Notifications & Alerts System
## Technical Specification Document

---

## 1. Executive Summary

This document specifies the architecture and implementation of an enhanced real-time notifications and alerts system for the CIVIQ civic engagement platform. The system extends the existing basic notification infrastructure to support multi-channel delivery, rich interactive notifications, intelligent grouping/batching, admin broadcasting, comprehensive history/search, and robust offline/cross-tab synchronization.

### Current State
- Basic in-app notifications via Supabase Realtime
- 3 notification types: comment, status_change, department_assignment
- Simple toast + notification center UI
- No user preferences, grouping, or multi-channel delivery

### Target State
- **17+ notification types** across 4 categories (Emergency, Transactional, Community, System)
- **5 delivery channels**: In-app (Realtime), Push (Web Push API), Email, SMS, Webhook
- **Granular user preferences** per category/channel with quiet hours
- **Smart grouping/batching** with configurable windows
- **Rich notifications** with inline actions (verify, vote, dismiss, navigate)
- **Admin announcement system** with targeting (role, geography, segment, users)
- **Full history/search/archive** with export capabilities
- **Cross-tab sync** via BroadcastChannel + **offline support** via Service Worker

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  Browser    │  │  Browser    │  │  Browser    │  │  Service Worker │   │
│  │  Tab 1      │  │  Tab 2      │  │  Tab N      │  │  (Push/Offline) │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
│         │                │                │                   │            │
│         └────────────────┼────────────────┼───────────────────┘            │
│                          ▼                                                │
│              ┌───────────────────────┐                                   │
│              │   BroadcastChannel    │  ← Cross-tab sync                 │
│              │   (civiq:notifications)│                                   │
│              └───────────┬───────────┘                                   │
└──────────────────────────┼────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REAL-TIME LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Supabase Realtime (Primary)                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │notifications│  │ announcements│  │user_presence│  │  reports  │  │   │
│  │  │   table     │  │   table     │  │   table     │  │   table   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  │         │                │                │                │         │   │
│  │         └────────────────┼────────────────┼────────────────┘         │   │
│  │                          ▼                                            │   │
│  │              ┌───────────────────────┐                               │   │
│  │              │   Postgres Changes    │                               │   │
│  │              │   WebSocket Stream    │                               │   │
│  │              └───────────┬───────────┘                               │   │
│  └──────────────────────────┼───────────────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────┐ ┌─────────────┐
│   DELIVERY          │ │  FALLBACK   │ │  OFFLINE    │
│   CHANNELS          │ │  LAYER      │ │  QUEUE      │
│                     │ │             │ │             │
│ • In-App (WS)       │ │ • Polling   │ │ • IndexedDB │
│ • Push (Web Push)   │ │   (10s)     │ │ • Background│
│ • Email (Resend)    │ │ • REST API  │ │   Sync API  │
│ • SMS (Twilio)      │ │             │ │ • Service   │
│ • Webhook           │ │             │ │   Worker    │
└─────────────────────┘ └─────────────┘ └─────────────┘
```

### 2.2 Data Flow

```
Event Trigger (DB Trigger / Admin Action / Scheduled Job)
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│              NOTIFICATION SERVICE (Server)                    │
│  1. Create notification record(s)                            │
│  2. Check user preferences                                   │
│  3. Determine delivery channels                              │
│  4. Apply grouping/batching rules                            │
│  5. Queue for delivery                                       │
└──────────────────────────────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         ▼                  ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐
   │ In-App  │        │  Push   │        │  Email  │        │   SMS   │
   │ (Realtime)       │ (Web Push)      │ (Resend)        │ (Twilio)│
   └────┬────┘        └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                  │                  │
        └──────────────────┼──────────────────┼──────────────────┘
                           ▼
              ┌─────────────────────────┐
              │   CLIENT RECEIVES       │
              │   • Updates query cache │
              │   • Shows toast         │
              │   • Updates badge       │
              │   • Broadcasts to tabs  │
              └─────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Core Tables

#### `notifications` (Extended)
```sql
CREATE TABLE public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id       uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  title           text NOT NULL,
  message         text NOT NULL,
  type            text NOT NULL,  -- 17+ types
  category        text NOT NULL CHECK (category IN ('emergency','transactional','community','system')),
  priority        text NOT NULL CHECK (priority IN ('critical','high','medium','low')) DEFAULT 'medium',
  read            boolean NOT NULL DEFAULT false,
  action_data     jsonb,           -- Rich action payload
  channels        text[] DEFAULT ARRAY['in_app'],  -- Requested channels
  sent_channels   text[] DEFAULT ARRAY[]::text[],  -- Actually sent
  grouping_key    text,            -- For batching
  batch_id        uuid REFERENCES public.notification_batches(id),
  scheduled_for   timestamptz,     -- For scheduled delivery
  expires_at      timestamptz,     -- Auto-dismiss
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX notifications_user_category_idx ON public.notifications(user_id, category);
CREATE INDEX notifications_grouping_key_idx ON public.notifications(grouping_key);
CREATE INDEX notifications_batch_id_idx ON public.notifications(batch_id);
CREATE INDEX notifications_scheduled_idx ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
```

#### `notification_preferences`
```sql
CREATE TABLE public.notification_preferences (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  enabled               boolean NOT NULL DEFAULT true,
  quiet_hours_start     time,
  quiet_hours_end       time,
  timezone              text NOT NULL DEFAULT 'UTC',
  category_preferences  jsonb NOT NULL DEFAULT '{
    "emergency": {"in_app": true, "push": true, "email": true, "sms": true},
    "transactional": {"in_app": true, "push": true, "email": false, "sms": false},
    "community": {"in_app": true, "push": false, "email": false, "sms": false},
    "system": {"in_app": true, "push": false, "email": true, "sms": false}
  }'::jsonb,
  type_overrides        jsonb NOT NULL DEFAULT '{}'::jsonb,
  digest_frequency      text CHECK (digest_frequency IN ('realtime','hourly','daily','weekly','never')) DEFAULT 'realtime',
  location_preferences  jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
```

#### `push_subscriptions`
```sql
CREATE TABLE public.push_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint      text NOT NULL,
  p256dh        text NOT NULL,
  auth          text NOT NULL,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  UNIQUE (user_id, endpoint)
);
CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions(user_id);
```

#### `notification_batches`
```sql
CREATE TABLE public.notification_batches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grouping_key      text NOT NULL,
  category          text NOT NULL,
  notification_ids  uuid[] NOT NULL DEFAULT '{}',
  summary_title     text NOT NULL,
  summary_message   text NOT NULL,
  total_count       int NOT NULL DEFAULT 0,
  delivered_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
```

#### `announcements` (Extended)
```sql
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_type text 
  CHECK (target_type IN ('all','role','geography','segment','users')) DEFAULT 'all';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_config jsonb DEFAULT '{}';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS channels text[] DEFAULT ARRAY['in_app'];
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS status text 
  CHECK (status IN ('draft','scheduled','sending','sent','failed')) DEFAULT 'draft';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS delivery_stats jsonb DEFAULT '{}';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS recurring_config jsonb;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS action_url text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS action_label text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS image_url text;
```

#### `announcement_reads`
```sql
CREATE TABLE public.announcement_reads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id   uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);
```

#### `notification_archive` (Partitioned)
```sql
CREATE TABLE public.notification_archive (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id       uuid NOT NULL,
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id         uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  title             text NOT NULL,
  message           text NOT NULL,
  type              text NOT NULL,
  category          text NOT NULL,
  priority          text NOT NULL,
  read              boolean NOT NULL DEFAULT false,
  action_data       jsonb,
  channels          text[],
  sent_channels     text[],
  batch_id          uuid,
  created_at        timestamptz NOT NULL,
  archived_at       timestamptz NOT NULL DEFAULT now(),
  search_vector     tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(message, ''))
  ) STORED
) PARTITION BY RANGE (archived_at);
```

---

## 4. Notification Types & Categories

### 4.1 Category Definitions

| Category | Color | Priority Range | Default Channels | Use Case |
|----------|-------|----------------|------------------|----------|
| **Emergency** | 🔴 Red | Critical only | In-app, Push, Email, SMS | Immediate safety alerts |
| **Transactional** | 🟠 Blue | High/Medium | In-app, Push, Email | User-specific events |
| **Community** | 🟢 Green | Medium/Low | In-app | Social engagement |
| **System** | 🔵 Purple | Medium/Low | In-app, Email | Platform updates |

### 4.2 Complete Type Registry

| Type ID | Category | Trigger | Default Channels | Grouping Key | Actions |
|---------|----------|---------|------------------|--------------|---------|
| `emergency_alert` | Emergency | Admin broadcast | All | `emergency:{area_id}` | View, Directions |
| `severe_weather` | Emergency | Weather API | Push, SMS, In-app | `weather:{area_id}` | View, Safety Tips |
| `infrastructure_failure` | Emergency | Sensor detection | Push, SMS, In-app | `infra:{type}:{area_id}` | View, Report |
| `report_status_changed` | Transactional | Admin updates status | In-app, Push, Email | `report:{id}:status` | View, Track |
| `report_assigned` | Transactional | Dept assigned | In-app, Push, Email | `report:{id}:assignment` | View, Contact |
| `report_resolved` | Transactional | Status → resolved | In-app, Push, Email | `report:{id}:resolved` | View, Rate |
| `comment_on_report` | Transactional | New comment | In-app, Push | `report:{id}:comments` | View, Reply, Verify, Vote |
| `verification_requested` | Transactional | Community asks verify | In-app, Push | `report:{id}:verify` | **Verify**, View |
| `vote_received` | Community | User votes | In-app | `report:{id}:votes` | View, See Voters |
| `verification_received` | Community | User verifies | In-app | `report:{id}:verifications` | View |
| `nearby_report_created` | Community | New report in area | In-app, Push (opt-in) | `area:{geohash}:new` | View, Verify, Vote |
| `trending_in_area` | Community | Report trending | In-app (daily batch) | `area:{geohash}:trending` | View, Explore |
| `weekly_digest` | Community | Scheduled weekly | Email, In-app | `digest:weekly:{user_id}` | View Full, Unsubscribe |
| `admin_announcement` | System | Admin creates | In-app, Push, Email | `announcement:{id}` | Read More, Acknowledge |
| `maintenance_window` | System | Scheduled maintenance | In-app, Email | `maintenance:{window_id}` | View Details |
| `feature_release` | System | New feature | In-app, Email | `release:{version}` | View Changelog |
| `policy_update` | System | Terms updated | Email, In-app | `policy:{version}` | Review, Accept |
| `security_alert` | System | Suspicious activity | Email, Push, In-app | `security:{user_id}` | Secure Account |

---

## 5. Delivery Channels

### 5.1 Channel Specifications

| Channel | Technology | Latency | Reliability | Cost | Scope |
|---------|------------|---------|-------------|------|-------|
| **In-App** | Supabase Realtime (Postgres Changes) | <100ms | High | Free* | All notifications |
| **Push** | Web Push API (VAPID) + Service Worker | <5s | Medium | Free | Emergency, High-priority, Re-engagement |
| **Email** | Resend (React Email templates) | <30s | High | $0.10/1k | Digests, Transactional, System |
| **SMS** | Twilio Verify/Messaging | <10s | High | $0.0075/msg | Emergency only (opt-in) |
| **Webhook** | HTTP POST with retry/backoff | <1s | Configurable | Free | Admin integrations |

### 5.2 Channel Routing Logic

```typescript
function decideChannels(notification, preferences, context): DeliveryDecision {
  const { category, priority, type } = notification;
  const effectivePrefs = mergePreferences(preferences, category, type);
  
  const channels = [];
  
  // In-app: always if globally enabled
  if (preferences.enabled && effectivePrefs.in_app) channels.push('in_app');
  
  // Push: respect quiet hours, online status
  if (effectivePrefs.push && !isInQuietHours(preferences)) {
    if (context.isEmergency || !context.isOnline || priority === 'critical') {
      channels.push('push');
    }
  }
  
  // Email: for digests, high-priority, system
  if (effectivePrefs.email && (priority === 'high' || category === 'system' || preferences.digest_frequency !== 'realtime')) {
    channels.push('email');
  }
  
  // SMS: emergency only, explicit opt-in
  if (effectivePrefs.sms && context.isEmergency) {
    channels.push('sms');
  }
  
  return { channels, reason: `category=${category}, priority=${priority}` };
}
```

---

## 6. User Preferences & Subscription Management

### 6.1 Preference Model

```typescript
interface NotificationPreferences {
  user_id: string;
  enabled: boolean;
  quiet_hours: { enabled: boolean; start: string; end: string; timezone: string };
  categories: {
    emergency: ChannelPreferences;
    transactional: ChannelPreferences;
    community: ChannelPreferences;
    system: ChannelPreferences;
  };
  type_overrides: Record<string, Partial<ChannelPreferences>>;
  digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'never';
  location_preferences?: { enabled: boolean; radius_km: number; home_location?: Location; work_location?: Location };
}

interface ChannelPreferences {
  in_app: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
}
```

### 6.2 UI Features
- **Global enable/disable** toggle
- **Quiet hours** with timezone support
- **Per-category channel matrix** (4 categories × 4 channels)
- **Per-type overrides** for granular control
- **Digest frequency** selector (realtime → weekly)
- **Location-based preferences** with radius and saved locations
- **Push subscription** management (VAPID)
- **Export/import** preferences

---

## 7. Real-Time Infrastructure

### 7.1 Primary: Supabase Realtime
- WebSocket connection per user
- Subscriptions: `notifications`, `announcements`, `user_presence`, `reports`
- Auto-reconnect with exponential backoff (max 5 attempts)
- Presence tracking for online indicators

### 7.2 Fallback: Polling
- 10-second interval when WebSocket fails
- REST API: `GET /api/notifications/badge`
- Lightweight: only fetches `id, read` for badge count

### 7.3 Connection Management
```typescript
// Connection states: connecting → connected → error → reconnecting → connected
// Max 5 reconnect attempts with exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
// After max attempts: switch to polling fallback
```

### 7.4 Cross-Tab Synchronization
- **BroadcastChannel API** (`civiq:notifications:{userId}`)
- Message types: `NOTIFICATION_RECEIVED`, `NOTIFICATION_READ`, `NOTIFICATION_DELETED`, `BADGE_UPDATE`, `PREFERENCES_CHANGED`, `FORCE_REFRESH`
- Tab lifecycle: `TAB_JOINED`, `TAB_LEFT`, `HEARTBEAT`
- Deduplication via timestamp tracking

---

## 8. Grouping, Batching & Deduplication

### 8.1 Grouping Rules

| Notification Type | Grouping Key | Max Window | Summary Template |
|-------------------|--------------|------------|------------------|
| `comment_on_report` | `report:{id}:comments` | 5 min | "{count} new comments on your report" |
| `vote_received` | `report:{id}:votes` | 15 min | "{count} new votes on your report" |
| `verification_received` | `report:{id}:verifications` | 15 min | "{count} community verifications" |
| `nearby_report_created` | `area:{geohash}:new` | 1 hour | "{count} new reports near you" |
| `trending_in_area` | `area:{geohash}:trending` | 24 hours | "Trending in your area: {top_report}" |
| `weekly_digest` | `digest:weekly:{user_id}` | 7 days | "Your weekly CIVIQ summary" |

### 8.2 Batch Processing
- **Cron job** runs every 5 minutes (`processNotificationBatches()`)
- Finds undelivered batches older than their window
- Creates summary notification with `action_data: { batch: true, count, notification_ids, expandable: true }`
- Marks individual notifications as `batch_id` (hidden from main list)
- UI shows expandable batch summary with "View all" action

### 8.3 Deduplication
- Prevents duplicate notifications for same event within time window
- `checkDuplicate(userId, type, reportId, windowMinutes=60)`
- Applied at notification creation time

---

## 9. Rich Notifications with Actions

### 9.1 Action Types
| Action Type | Description | Payload |
|-------------|-------------|---------|
| `navigate` | Open URL | `{ url }` |
| `mark_read` | Mark as read | `{ notificationId }` |
| `dismiss` | Dismiss permanently | `{ notificationId }` |
| `verify_report` | Verify a report | `{ reportId, userId }` |
| `vote_report` | Vote on a report | `{ reportId, userId }` |
| `comment_report` | Quick comment | `{ reportId }` |
| `subscribe` | Subscribe to updates | `{ type, reportId }` |
| `unsubscribe` | Unsubscribe | `{ type }` |
| `open_settings` | Open settings | `{}` |
| `snooze` | Snooze for X time | `{ duration }` |
| `report_issue` | Report notification issue | `{ notificationId }` |
| `custom` | Custom handler | `{ ... }` |

### 9.2 Default Actions by Type

| Notification Type | Primary Actions | Secondary Actions |
|-------------------|-----------------|-------------------|
| `comment_on_report` | View & Reply, Verify | Vote, Snooze 1h |
| `verification_requested` | **Verify Now**, View | Dismiss, Settings |
| `report_status_changed` | View Report, Track | Snooze 1h, Settings |
| `nearby_report_created` | View, **Verify**, Vote | Not Interested |
| `emergency_alert` | **View Details**, Get Directions | Safety Tips, Dismiss |
| `admin_announcement` | Read More, Acknowledge | Settings |
| `weekly_digest` | View Full Report, Explore | Unsubscribe, Settings |

### 9.3 Push Notification Actions
- Max 2 actions per push notification
- Actions: `navigate`, `verify_report`, `vote_report`, `dismiss`, `mark_read`
- Handled in Service Worker `notificationclick` event

---

## 10. Admin Announcement & Broadcast System

### 10.1 Targeting Strategies

| Strategy | Configuration | Example |
|----------|---------------|---------|
| **All Users** | `target_type: 'all'` | Platform-wide announcement |
| **By Role** | `target_type: 'role', target_config: { roles: ['admin', 'reporter'] }` | Admin-only maintenance notice |
| **By Geography** | `target_type: 'geography', target_config: { geography: { type: 'radius', coordinates: {lat, lng}, radius_km: 10 } }` | Local emergency alert |
| **By Segment** | `target_type: 'segment', target_config: { segment: { type: 'high_trust', criteria: { min_score: 80 } } }` | Beta feature invite |
| **Specific Users** | `target_type: 'users', target_config: { user_ids: ['uuid1', 'uuid2'] }` | Direct message |

### 10.2 Delivery Channels
- Configurable per announcement: `in_app`, `push`, `email`, `sms`, `webhook`
- SMS only for `severity: 'Emergency'`
- Batch processing (100 users at a time)

### 10.3 Scheduling & Recurring
- **One-time**: `scheduled_for` timestamp
- **Recurring**: `recurring_config: { frequency: 'daily'|'weekly'|'monthly'|'custom_cron', cron_expression?, end_date?, max_occurrences?, timezone }`
- Managed via `pg_cron` or application scheduler

### 10.4 Analytics
- Delivery stats: `total_targeted`, `in_app_sent`, `push_sent`, `email_sent`, `sms_sent`, `failed`
- Engagement: `read_count`, `click_count`
- Real-time dashboard in admin panel

---

## 11. Notification History, Search & Archive

### 11.1 Active vs Archived
- **Active** (90 days): `notifications` table, full-text search, real-time updates
- **Archived** (>90 days, read): `notification_archive` table (monthly partitions), full-text search
- Auto-archive via `pg_cron` monthly job

### 11.2 Search Capabilities
- **Full-text search** on title + message (PostgreSQL `tsvector`)
- **Filters**: category, type, priority, read status, date range, report ID, has actions
- **Sorting**: created_at, title, category, priority (asc/desc)
- **Pagination**: 20 per page

### 11.3 Bulk Actions
- Mark read/unread
- Archive (move to archive table)
- Delete (permanent)
- Select all / deselect all

### 11.4 Export
- **JSON**: Full notification objects
- **CSV**: Flattened with headers (ID, Title, Message, Type, Category, Priority, Read, Created At, Report ID, Action Data)

### 11.5 Statistics Dashboard
- Total notifications
- Unread count
- By category (emergency, transactional, community, system)
- By type
- By priority

---

## 12. Offline Support & Cross-Tab Sync

### 12.1 Service Worker Features
- **Push notifications** when app closed
- **Background sync** for offline actions
- **Offline page** fallback for navigation
- **Cache-first** for static assets
- **Network-first** for API with cache fallback
- **Periodic background sync** for badge updates

### 12.2 Offline Action Queue
- **IndexedDB** store: `offline-action-queue`
- Action types: `mark_read`, `mark_unread`, `delete`, `verify`, `vote`, `comment`, `preferences_update`
- Max 3 retries with exponential backoff
- Auto-process on `online` event
- Background Sync API registration

### 12.3 Cross-Tab Synchronization
- **BroadcastChannel** for instant multi-tab updates
- Message types: notification received/read/deleted, badge update, preferences changed, force refresh
- Tab presence tracking with heartbeats
- Automatic cleanup of stale tabs

### 12.4 UI Indicators
- Connection status: `connecting` | `connected` | `disconnected` | `error`
- Pending actions count badge
- Manual "Sync Now" button
- Last synced timestamp

---

## 13. API Endpoints

### 13.1 Server Actions (Next.js)

| Action | File | Description |
|--------|------|-------------|
| `getNotifications()` | `lib/notifications/get-notifications.ts` | Fetch user notifications |
| `markNotificationAsRead(id)` | `lib/notifications/mark-read.ts` | Mark single as read |
| `markAllNotificationsAsRead()` | `lib/notifications/mark-all-read.ts` | Mark all as read |
| `getNotificationPreferences()` | `lib/notifications/preferences.ts` | Get user preferences |
| `updateNotificationPreferences(updates)` | `lib/notifications/preferences.ts` | Update preferences |
| `subscribeToPush(subscription)` | `lib/notifications/preferences.ts` | Register push subscription |
| `unsubscribeFromPush(endpoint)` | `lib/notifications/preferences.ts` | Remove push subscription |
| `searchNotifications(filters, page, pageSize)` | `lib/notifications/history.ts` | Search active notifications |
| `searchArchivedNotifications(filters, page, pageSize)` | `lib/notifications/history.ts` | Search archived notifications |
| `getNotificationStats()` | `lib/notifications/history.ts` | Get statistics |
| `exportNotifications(format, filters)` | `lib/notifications/history.ts` | Export as JSON/CSV |
| `bulkAction(ids, action)` | `lib/notifications/history.ts` | Bulk mark read/archive/delete |
| `createAnnouncement(data)` | `lib/announcements/service.ts` | Create announcement |
| `sendAnnouncement(id)` | `lib/announcements/service.ts` | Send announcement |
| `processNotificationBatches()` | `lib/notifications/batching.ts` | Process batched notifications |

### 13.2 REST API (for Service Worker)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/badge` | GET | Get unread count |
| `/api/notifications/offline-action` | POST | Process queued offline action |
| `/api/push/subscribe` | POST | Register push subscription |
| `/api/push/unsubscribe` | POST | Remove push subscription |

---

## 14. Client-Side Hooks & Components

### 14.1 Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useRealtimeNotifications()` | `hooks/useRealtimeNotifications.ts` | Main realtime listener with fallback |
| `useCrossTabSync()` | `hooks/useCrossTabSync.ts` | BroadcastChannel synchronization |
| `useOfflineQueue()` | `lib/offline/queue.ts` | Offline action queue management |
| `useRealtimeComments()` | `hooks/useRealtimeComments.ts` | Comments realtime (existing) |
| `useRealtimeFeed()` | `hooks/useRealtimeFeed.ts` | Feed realtime (existing) |
| `useRealtimeVotes()` | `hooks/useRealtimeVotes.ts` | Votes realtime (existing) |
| `useRealtimeVerifications()` | `hooks/useRealtimeVerifications.ts` | Verifications realtime (existing) |

### 14.2 Components

| Component | File | Purpose |
|-----------|------|---------|
| `NotificationsClient` | `components/notifications/notifications-client.tsx` | Notification center (enhanced) |
| `RealtimeListener` | `components/notifications/realtime-listener.tsx` | Background toast listener (enhanced) |
| `RichNotification` | `components/notifications/rich-notification.tsx` | Rich notification with actions |
| `BatchNotification` | `components/notifications/batch-notification.tsx` | Expandable batch summary |
| `NotificationHistory` | `components/notifications/notification-history.tsx` | History/search/archive UI |
| `NotificationPreferences` | `components/settings/notification-preferences.tsx` | Preferences management UI |
| `AnnouncementComposer` | `components/admin/announcement-composer.tsx` | Admin announcement creator |
| `ConnectionStatus` | `components/notifications/connection-status.tsx` | Realtime connection indicator |
| `SyncStatus` | `components/notifications/sync-status.tsx` | Offline/sync indicator |

---

## 15. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database migrations (extended tables, indexes, partitions)
- [ ] Core notification service (create, send, channel routing)
- [ ] User preferences API + UI
- [ ] Push subscription (VAPID keys, Service Worker registration)

### Phase 2: Real-time & Delivery (Week 2-3)
- [ ] Enhanced `useRealtimeNotifications` hook with fallback
- [ ] Cross-tab sync via BroadcastChannel
- [ ] Email templates (React Email) + Resend integration
- [ ] SMS integration (Twilio) for emergency
- [ ] Webhook delivery with retry

### Phase 3: Rich Features (Week 3-4)
- [ ] Notification types & categorization (17 types)
- [ ] Grouping/batching service + cron job
- [ ] Rich notification components with actions
- [ ] Action handlers (verify, vote, navigate, dismiss)
- [ ] Push notification actions

### Phase 4: Admin & History (Week 4-5)
- [ ] Announcement system (targeting, scheduling, recurring)
- [ ] Admin composer UI
- [ ] Notification history with search/filters
- [ ] Archive system + pg_cron job
- [ ] Export (JSON/CSV) + bulk actions
- [ ] Statistics dashboard

### Phase 5: Offline & Polish (Week 5-6)
- [ ] Service Worker (push, background sync, offline queue)
- [ ] Offline action queue + IndexedDB
- [ ] Connection status + sync indicators
- [ ] Cross-tab sync integration
- [ ] Performance optimization
- [ ] Testing (unit, integration, E2E)
- [ ] Documentation

---

## 16. Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **End-to-end latency** (event → toast) | < 500ms | P95 |
| **Push delivery** | < 5s | P95 |
| **Email delivery** | < 30s | P95 |
| **System availability** | 99.9% | Monthly |
| **Concurrent users** | 10,000+ | Load test |
| **Notification retention** | 90 days active, 1 year archived | Policy |
| **GDPR compliance** | Full user control, right to delete | Audit |
| **Accessibility** | WCAG 2.1 AA | Audit |

---

## 17. Security Considerations

1. **Authentication**: All server actions verify `auth.uid()`
2. **Authorization**: RLS policies on all tables
3. **Rate Limiting**: API endpoints protected (100 req/min per user)
4. **Data Encryption**: TLS in transit, encrypted at rest (Supabase)
5. **Push Security**: VAPID keys, endpoint validation
6. **Webhook Security**: HMAC signatures, IP allowlisting
7. **PII Protection**: No sensitive data in notification content
8. **Audit Logging**: Admin actions logged to `admin_notes`

---

## 18. Monitoring & Observability

### 18.1 Key Metrics
- Notification delivery rate by channel
- Push subscription/opt-out rates
- Email open/click rates (Resend webhooks)
- SMS delivery success rate
- Batch processing latency
- Offline queue size / processing time
- Cross-tab sync message latency

### 18.2 Alerting
- Delivery failure rate > 5%
- Realtime connection drop rate > 10%
- Offline queue growing > 1000 actions
- Archive job failures

---

## 19. Future Enhancements

1. **AI-Powered Prioritization**: ML model to predict notification importance
2. **Smart Digest**: Personalized weekly summary based on user interests
3. **In-App Inbox**: Persistent notification center with threading
4. **Webhook Marketplace**: Pre-built integrations (Slack, Discord, Teams, PagerDuty)
5. **Geofencing**: Automatic location-based subscriptions
6. **Notification Templates**: Admin-configurable templates with variables
7. **A/B Testing**: Experiment with timing, copy, channels
8. **Multi-language**: i18n for notification content

---

## 20. Appendix

### 20.1 Environment Variables
```env
# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@civiq.app

# Email (Resend)
RESEND_API_KEY=...
EMAIL_FROM=noreply@civiq.app

# SMS (Twilio)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=...

# Webhook
WEBHOOK_SECRET=...
WEBHOOK_URL=https://civiq.app/api/webhooks/notifications
```

### 20.2 Database Functions
```sql
-- Archive old notifications (run monthly via pg_cron)
SELECT archive_old_notifications();

-- Get users in radius (PostGIS)
SELECT * FROM get_users_in_radius(center_lat, center_lng, radius_km);

-- Update notification badge count
SELECT update_notification_badge(user_id);
```

### 20.3 TypeScript Types
See `types/notifications.ts` and `types/announcements.ts` for complete type definitions.

---

*Document Version: 1.0*  
*Last Updated: 2026-06-30*  
*Author: CIVIQ Architecture Team*