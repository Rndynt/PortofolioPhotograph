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
| `calendar_slots` table | [Missing] | `shared/schema.ts` | Need: id, localDate, hour, label, notes, UNIQUE(localDate,hour) |
| `app_settings` table | [Missing] | `shared/schema.ts` | Need: id, timezone, calendarStartHour, calendarEndHour |
| Timezone utilities | [Missing] | `shared/datetime.ts` | Need: JKT_TZ, fromJktToUtc, formatJkt, etc. |
| Calendar slots storage | [Missing] | `server/storage.ts` | Need: getSlots, upsertSlots methods |
| App settings storage | [Missing] | `server/storage.ts` | Need: getSettings, updateSettings methods |

### API Endpoints (NEW REQUIREMENTS)

| Feature | Status | File Path | Notes |
|---------|--------|-----------|-------|
| GET /api/calendar/slots | [Missing] | `server/routes.ts` | Query: from, to → returns slots array |
| PATCH /api/calendar/slots | [Missing] | `server/routes.ts` | Body: array of {localDate, hour, label} |
| GET /api/settings/app | [Missing] | `server/routes.ts` | Returns settings singleton |
| PATCH /api/settings/app | [Missing] | `server/routes.ts` | Update calendarStartHour, calendarEndHour |

### UI Components (ACTIVE TASK LIST)

| Task | Status | File Path | Notes |
|------|--------|-----------|-------|
| 1. Settings tab (Admin) | [Missing] | `client/src/pages/admin/settings.tsx` | Start/end hour inputs, timezone display |
| 2. Multi-session slot grouping | [Needs Fix] | `client/src/pages/admin/calendar.tsx` | Show ALL sessions overlapping hour window |
| 3. Slot panel with naming | [Missing] | `client/src/pages/admin/calendar.tsx` | Modal/drawer with slot name input + session cards |
| 4. Create session from slot | [Needs Fix] | `client/src/pages/admin/calendar.tsx` | Prefill with slot hour, 24h JKT format |
| 5. Session details (24h JKT) | [Needs Fix] | `client/src/pages/admin/calendar.tsx` | Show times in Asia/Jakarta 24h |
| 6. Settings-driven hours | [Missing] | `client/src/pages/admin/calendar.tsx` | Render 06-20 by default, read from settings |
| 7. Assign photographers | [Implemented] | `client/src/pages/admin/calendar.tsx` | Already has 409 handling |
| 8. Guidance & tips | [Needs Fix] | `client/src/pages/admin/calendar.tsx` | Update to reflect multi-session concept |
| 9. Mobile responsive | [Needs Fix] | `client/src/pages/admin/calendar.tsx` | Horizontal scroll for days, touch-friendly |
| 10. Navigation/breadcrumbs | [Missing] | Various | Project ↔ Calendar, no public /dashboard-admin link |

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
