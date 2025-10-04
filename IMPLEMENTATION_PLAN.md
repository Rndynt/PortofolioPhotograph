# Implementation Plan - Phase 4: Scheduling & Offline Orders

## Status Board

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Database Schema & Migrations |
| Phase 2 | ✅ Complete | Backend API Endpoints & Payment Integration |
| Phase 3 | ⚠️ Partial | UI Implementation (Admin features missing) |
| Phase 4 | 🔄 In Progress | Scheduling System & Offline Orders UI |

Last Updated: October 4, 2025

---

## 🔍 QUICK AUDIT SNAPSHOT (STEP 0)

### BACKEND (Schema + Services)

| Feature | Status | File Path | Notes |
|---------|--------|-----------|-------|
| **Schema: orders** (channel, paymentProvider, source) | ✅ Implemented | `shared/schema.ts:89-91` | Fields added |
| **Schema: projects.orderId** (unique FK, set null) | ✅ Implemented | `shared/schema.ts:46` | 1:1 relationship |
| **Schema: photographers** table | ✅ Implemented | `shared/schema.ts:146-152` | Full table with isActive |
| **Schema: sessions** table (with time_range) | ✅ Implemented | `shared/schema.ts:154-165` | All fields present |
| **Schema: session_assignments** (exclusion) | ✅ Implemented | `shared/schema.ts:167-172` | Table created |
| **Migration: btree_gist + exclusion** | ✅ Implemented | `migrations/001_scheduling_constraints.sql` | Applied to DB |
| **Auto-create project with order** | ✅ Implemented | `server/routes.ts:442-534` | Transaction-based |
| **Offline orders support** | ✅ Implemented | `server/routes.ts:479-481` | Reuses POST /api/orders |
| **Manual payments endpoint** | ✅ Implemented | `server/routes.ts:571-609` | POST /api/orders/:id/payments |
| **Photographers CRUD** | ✅ Implemented | `server/routes.ts:612-676`, `server/storage.ts:412-440` | All 5 endpoints |
| **Sessions CRUD** | ✅ Implemented | `server/routes.ts:679-790`, `server/storage.ts:443-510` | All 5 endpoints with filters |
| **Session assignment + 409 conflicts** | ✅ Implemented | `server/routes.ts:793-858`, `server/storage.ts:513-534` | Error code 23P01 → 409 |
| **Zod validators** | ✅ Implemented | `server/routes.ts:25-70`, `shared/schema.ts:218-265` | All schemas present |

### DASHBOARD UI (Admin at `/dashboard-admin`)

| Feature | Status | File Path | Notes |
|---------|--------|-----------|-------|
| **Photographer management page** | ❌ Missing | NEW: `client/src/pages/admin/photographers.tsx` | Needs creation |
| **Schedule drawer for orders** | ❌ Missing | `client/src/pages/admin/orders.tsx` | Add to existing file |
| **Session creation/assignment** | ❌ Missing | `client/src/pages/admin/orders.tsx` | Add forms & 409 handling |
| **Calendar view page** | ❌ Missing | NEW: `client/src/pages/admin/calendar.tsx` | Complex: drag/resize + 409 |
| **Order link badge on projects** | ❌ Missing | `client/src/pages/admin/projects.tsx` | Add badge component |
| **Offline order form** | ❌ Missing | `client/src/pages/admin/orders.tsx` | Add dialog form |
| **Manual payment form** | ❌ Missing | `client/src/pages/admin/orders.tsx` | Add dialog form |
| **Admin layout tab for photographers** | ❌ Missing | `client/src/pages/admin/layout.tsx` | Add to existing tabs |
| **Admin layout tab for calendar** | ❌ Missing | `client/src/pages/admin/layout.tsx` | Add to existing tabs |
| **Route: /dashboard-admin/photographers** | ❌ Missing | `client/src/App.tsx` | Add route |
| **Route: /dashboard-admin/calendar** | ❌ Missing | `client/src/App.tsx` | Add route |

### DOCS & QA

| Feature | Status | File Path | Notes |
|---------|--------|-----------|-------|
| **BACKEND_SMOKE.md** | ❌ Missing | NEW: `BACKEND_SMOKE.md` | curl tests for all flows |
| **FEATURES_OVERVIEW.md** | ❌ Missing | NEW: `FEATURES_OVERVIEW.md` | ERD + diagrams |
| **README.md updates** | ❌ Missing | `README.md` | Migration & setup instructions |
| **UI_QA_CHECKLIST.md** | ❌ Missing | NEW: `UI_QA_CHECKLIST.md` | Console-clean verification |
| **Seed: photographers data** | ❌ Missing | `scripts/seed.ts` | Add 2-3 photographers |

---

## IMPLEMENTATION PRIORITIES

### ✅ COMPLETE - No Action Needed
- All backend API endpoints functioning
- Database schema and migrations applied
- Conflict detection (409) working at DB level

### 🔨 TODO - Frontend Implementation (STEP 2)
1. **Photographers Management Page** (new file, CRUD UI)
2. **Orders Page Enhancements**:
   - Schedule Drawer (create/assign sessions)
   - Offline Order Form (dialog)
   - Manual Payment Form (dialog)
3. **Projects Page**: Add Order Badge
4. **Calendar View Page** (new file, complex drag/drop)
5. **Admin Layout**: Add tabs for Photographers & Calendar
6. **App Routes**: Register new admin routes

### 📝 TODO - Documentation (STEP 3)
1. BACKEND_SMOKE.md with curl examples
2. FEATURES_OVERVIEW.md with ERD & flows
3. README.md migration instructions
4. UI_QA_CHECKLIST.md for final testing
5. Seed data for photographers

---

## NOTES

### No Duplications
- Single API entry point: `client/src/lib/queryClient.ts`
- Single schema source: `shared/schema.ts`
- Single routes file: `server/routes.ts`
- Single storage interface: `server/storage.ts`

### Console Cleanliness Target
- Zero errors in browser console
- Zero React warnings
- Proper 409 handling with user feedback (toasts)
- No unhandled promise rejections

### Public Access
- `/dashboard-admin` has NO public navigation links
- Direct URL access only (paste in browser)
- Maintains separation between public portfolio and admin
