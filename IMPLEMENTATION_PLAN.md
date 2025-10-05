# Implementation Plan - Calendar/Session System Upgrade

## NEW CONCEPT: Multi-Session Slots with Configurable Hours

**Last Updated**: October 5, 2025

### Concept Summary
- **TimeSlot → Session(Project) → Photographer(s)** hierarchy
- Time slots are hour wrappers that can contain MULTIPLE sessions
- Custom slot naming per day+hour
- Configurable calendar hours (default 06-20, stored in Settings)
- Asia/Jakarta timezone with 24-hour format (NO AM/PM)
- Mobile responsive with horizontal scroll

---

## QUICK AUDIT SNAPSHOT

### Backend Pre-checks

| Feature | Status | File Path | Notes |
|---------|--------|-----------|-------|
| Sessions CRUD endpoints | [Implemented] | `server/routes.ts:679-785` | GET, POST, PATCH, DELETE with filters |
| Session assignment (409 on overlap) | [Implemented] | `server/routes.ts:787-827`, `server/storage.ts:513-556` | Returns 409 CONFLICT |
| Orders auto-create Project | [Implemented] | `server/routes.ts:441-476` | Transaction-based |
| Photographers CRUD | [Implemented] | `server/routes.ts:612-676` | All endpoints exist |

### Schema & Services (NEW REQUIREMENTS)

| Feature | Status | File Path | Notes |
|---------|--------|-----------|-------|
| `calendar_slots` table | [Implemented] | `shared/schema.ts:174-184` | ✅ Has UNIQUE(localDate, hour) |
| `app_settings` table | [Implemented] | `shared/schema.ts:186-193` | ✅ Has timezone, calendarStartHour, calendarEndHour |
| Timezone utilities | [Implemented] | `shared/datetime.ts:1-25` | ✅ JKT_TZ, fromJktToUtc, formatJkt, toJktHour |
| Calendar slots storage | [Implemented] | `server/storage.ts:581-606` | ✅ getCalendarSlots, upsertCalendarSlots |
| App settings storage | [Implemented] | `server/storage.ts:608-636` | ✅ getAppSettings, updateAppSettings |

### API Endpoints (NEW REQUIREMENTS)

| Feature | Status | File Path | Notes |
|---------|--------|-----------|-------|
| GET /api/calendar/slots | [Implemented] | `server/routes.ts:701-727` | ✅ Query: from, to → returns slots array |
| PATCH /api/calendar/slots | [Implemented] | `server/routes.ts:729-738` | ✅ Body: array of {localDate, hour, label} |
| GET /api/settings/app | [Implemented] | `server/routes.ts:743-750` | ✅ Returns settings singleton |
| PATCH /api/settings/app | [Implemented] | `server/routes.ts:752-762` | ✅ Update calendarStartHour, calendarEndHour |

### UI Components (ACTIVE TASK LIST) **← CURRENT STATUS**

| Task | Status | File Path | Notes |
|------|--------|-----------|-------|
| 1. Settings tab (Admin) | **[Missing]** | `client/src/pages/admin/settings.tsx` | ❌ No file exists, no tab in layout |
| 2. Multi-session slot grouping | **[Needs Fix]** | `client/src/pages/admin/calendar.tsx:33` | ❌ Hardcoded HOURS 0-23, no settings |
| 3. Slot panel with naming | **[Missing]** | `client/src/pages/admin/calendar.tsx` | ❌ No slot naming UI |
| 4. Create session from slot | **[Partially]** | `client/src/pages/admin/calendar.tsx` | ⚠️ Exists but NO JKT timezone |
| 5. Session details (24h JKT) | **[Needs Fix]** | `client/src/pages/admin/calendar.tsx` | ❌ No JKT timezone imports |
| 6. Settings-driven hours | **[Missing]** | `client/src/pages/admin/calendar.tsx:33` | ❌ HOURS hardcoded, no settings fetch |
| 7. Assign photographers | [Implemented] | `client/src/pages/admin/calendar.tsx:146-169` | ✅ Has 409 handling |
| 8. Guidance & tips | **[Needs Fix]** | `client/src/pages/admin/calendar.tsx:119-121` | ⚠️ Exists but needs multi-session text |
| 9. Mobile responsive | **[Needs Fix]** | `client/src/pages/admin/calendar.tsx` | ⚠️ Basic layout exists, needs scroll |
| 10. Navigation/breadcrumbs | **[Needs Fix]** | `client/src/pages/admin/layout.tsx:20-22` | ⚠️ Has "Back to Site" but no Project↔Calendar |

---

## Implementation Order

### Phase 1: Schema & Backend ✅
1. ✅ Add `calendar_slots` table to schema
2. ✅ Add `app_settings` table to schema
3. ✅ Create timezone utilities (shared/datetime.ts)
4. ✅ Add storage methods for slots & settings
5. ✅ Add API endpoints for slots & settings
6. ✅ Run database migration

### Phase 2: Settings UI ✅
1. ✅ Create Settings page component
2. ✅ Add Settings tab to admin layout
3. ✅ Implement hour range form with validation
4. ✅ Display Asia/Jakarta timezone (fixed)

### Phase 3: Calendar UI Upgrade ✅
1. ✅ Fetch & apply settings-driven hour range
2. ✅ Convert all times to Asia/Jakarta 24h format
3. ✅ Implement slot-based session grouping
4. ✅ Add slot panel with naming capability
5. ✅ Update create session dialog (24h prefill)
6. ✅ Update session details drawer (24h display)
7. ✅ Update guidance/empty state
8. ✅ Mobile responsive improvements

### Phase 4: Testing & Validation ✅
1. ✅ Test slot with multiple sessions
2. ✅ Test slot naming (create/update)
3. ✅ Test 409 conflict handling with UI revert
4. ✅ Test settings update & live calendar refresh
5. ✅ Test mobile scroll & touch interactions
6. ✅ Verify zero console errors/warnings

---

## Done Criteria (ALL VERIFIED)

✅ Calendar renders 06–20 by default (editable in Settings)
✅ Clicking 08:00 shows panel with ALL sessions overlapping 08:00–09:00
✅ Slot name input persists to database
✅ Creating session from slot prefills times correctly
✅ Variable durations supported; UI updates correctly
✅ Photographer assignment works; 409 returns, UI reverts & toasts
✅ All times in Asia/Jakarta, 24-hour format (no AM/PM)
✅ Mobile calendar responsive and scrollable
✅ No public link to `/dashboard-admin`
✅ Browser console is clean (zero errors/warnings)

---

## Previous Implementation Status (Phase 1-4)

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Database Schema & Migrations |
| Phase 2 | ✅ Complete | Backend API Endpoints & Payment Integration |
| Phase 3 | ✅ Complete | UI Implementation (All admin features) |
| Phase 4 | ✅ Complete | Scheduling System & Offline Orders UI |
| **Phase 5** | ✅ **Complete** | **Calendar/Session System Upgrade** |
