# Implementation Plan - Phase 4: Scheduling & Offline Orders

## Status Board

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Database Schema & Migrations |
| Phase 2 | ✅ Complete | Backend API Endpoints & Payment Integration |
| Phase 3 | ✅ Complete | UI Implementation & Wiring |
| Phase 4 | 🔄 In Progress | Scheduling System & Offline Orders |

Last Updated: October 3, 2025

## Duplication Log

**✅ NO DUPLICATIONS FOUND**

The codebase maintains clean architecture with no duplication:

| Category | Status | Details |
|----------|--------|---------|
| API Entry Point | ✅ Clean | Single `fetch` wrapper in `client/src/lib/queryClient.ts` |
| Schema Module | ✅ Clean | Shared module at `shared/schema.ts` used by both frontend and backend |
| Routes | ✅ Clean | Single `registerRoutes` function in `server/routes.ts` |
| Validators | ✅ Clean | Zod schemas defined once in shared/schema.ts, reused everywhere |
| UI State Management | ✅ Clean | Consistent TanStack Query usage across all components |
| Netlify Functions | ✅ Clean | Single entry point at `netlify/functions/api.ts` |

**Consolidation Decisions:**
- All new scheduling and offline order endpoints will be added to existing `server/routes.ts` (no parallel routers)
- New schemas will extend `shared/schema.ts` (single source of truth)
- Storage interface will be extended in existing `server/storage.ts` (no duplicate abstractions)

---

## Phase A - Audit & Plan ✅ COMPLETE

### Configuration Verification
- [x] **Netlify Redirect** - VERIFIED: `netlify.toml` lines 23-26 redirect `/api/*` to `/.netlify/functions/api/:splat`
- [x] **Admin Dashboard Access** - VERIFIED: No links to `/dashboard-admin` in `client/src/components/navigation.tsx` or any public components
- [x] **Route Structure** - VERIFIED: Admin routes defined in `client/src/App.tsx` lines 20-25, separate from public routes

### Existing Architecture Analysis
- [x] **Backend**: Express.js with TypeScript, single route registration in `server/routes.ts`
- [x] **Database**: PostgreSQL with Drizzle ORM, schema in `shared/schema.ts`
- [x] **Storage Layer**: Interface-based abstraction in `server/storage.ts`
- [x] **Frontend**: React + TanStack Query + Wouter routing
- [x] **Payment**: Midtrans Snap integration (online orders only)
- [x] **Current Tables**: categories, price_tiers, projects, project_images, orders, payments, portfolio_images, contact_submissions

---

## Phase B - Data Model Extensions 🔄 IN PROGRESS

### Task List

#### B.1: Orders & Projects Linkage ❌ NOT STARTED
**File**: `shared/schema.ts`

- [ ] Add to `orders` table:
  - `channel`: enum("channel", ["ONLINE", "OFFLINE"]).default("ONLINE")
  - `paymentProvider`: text("payment_provider").default("midtrans") // "midtrans" | "cash" | "bank_transfer"
  - `source`: text("source") // nullable: "walk_in" | "whatsapp" | "instagram" | "referral"

- [ ] Add to `projects` table:
  - `orderId`: text("order_id").unique().references(() => orders.id, { onDelete: "set null" })
  - This allows auto-project on every order, but manual projects can have orderId = NULL

- [ ] Update insert schemas and types for both tables

**Status**: [Missing]

#### B.2: Photographers Table ❌ NOT STARTED
**File**: `shared/schema.ts`

- [ ] Create `photographers` table:
  ```typescript
  export const photographers = pgTable("photographers", {
    id: text("id").primaryKey().$defaultFn(() => cuid()),
    name: text("name").notNull(),
    contact: text("contact"), // phone or email
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });
  ```

- [ ] Create insert schema: `insertPhotographerSchema`
- [ ] Create types: `InsertPhotographer`, `Photographer`

**Status**: [Missing]

#### B.3: Sessions Table with Time Range ❌ NOT STARTED
**File**: `shared/schema.ts`

- [ ] Create `sessionStatus` enum: "PLANNED" | "CONFIRMED" | "DONE" | "CANCELLED"

- [ ] Create `sessions` table:
  ```typescript
  export const sessions = pgTable("sessions", {
    id: text("id").primaryKey().$defaultFn(() => cuid()),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }), // nullable
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    location: text("location"),
    notes: text("notes"),
    status: sessionStatusEnum("status").notNull().default("PLANNED"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });
  ```

- [ ] Note: `time_range` tstzrange column will be added via raw SQL migration (see B.5)

- [ ] Create insert schema and types

**Status**: [Missing]

#### B.4: Session Assignments Table ❌ NOT STARTED
**File**: `shared/schema.ts`

- [ ] Create `session_assignments` table:
  ```typescript
  export const sessionAssignments = pgTable("session_assignments", {
    id: text("id").primaryKey().$defaultFn(() => cuid()),
    sessionId: text("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    photographerId: text("photographer_id").notNull().references(() => photographers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });
  ```

- [ ] Create insert schema and types

**Status**: [Missing]

#### B.5: Raw SQL Migration for Double-Booking Prevention ❌ NOT STARTED
**File**: `migrations/001_scheduling_constraints.sql` (new file)

- [ ] Create migration file with:
  1. Enable btree_gist extension
  2. Add time_range generated column to sessions
  3. Add exclusion constraint to session_assignments

- [ ] Migration content:
  ```sql
  -- Enable btree_gist extension for exclusion constraints
  CREATE EXTENSION IF NOT EXISTS btree_gist;

  -- Add time_range column to sessions (tstzrange generated from start_at and end_at)
  ALTER TABLE sessions 
    ADD COLUMN time_range tstzrange 
    GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED;

  -- Create exclusion constraint on session_assignments
  -- Prevents same photographer from having overlapping time ranges
  ALTER TABLE session_assignments
    ADD CONSTRAINT no_overlap_per_photographer
    EXCLUDE USING gist (
      photographer_id WITH =,
      (SELECT s.time_range FROM sessions s WHERE s.id = session_assignments.session_id) WITH &&
    );
  ```

- [ ] Document rollback:
  ```sql
  -- Down migration
  ALTER TABLE session_assignments DROP CONSTRAINT IF EXISTS no_overlap_per_photographer;
  ALTER TABLE sessions DROP COLUMN IF EXISTS time_range;
  -- Note: btree_gist extension not dropped as it might be used elsewhere
  ```

- [ ] Run migration manually: `psql $DATABASE_URL -f migrations/001_scheduling_constraints.sql`

**Status**: [Missing]

#### B.6: Push Schema Changes ❌ NOT STARTED
- [ ] Run `npm run db:push --force` after adding all Drizzle schema changes
- [ ] Verify tables created successfully
- [ ] Run raw SQL migration separately

**Status**: [Missing]

---

## Phase C - Service Logic (Transactions & Hooks) 🔄 IN PROGRESS

### Task List

#### C.1: Auto-Create Project for Every Order ❌ NOT STARTED
**File**: `server/routes.ts` (modify existing POST /api/orders)

Current logic:
1. Validates request
2. Gets price from tier or category
3. Creates order
4. Creates Midtrans Snap transaction
5. Updates order with Snap token

New logic (within transaction):
1. Validates request
2. Gets price from tier or category
3. **Transaction start:**
   - Create order with channel/payment_provider/source
   - Create minimal project:
     ```typescript
     {
       orderId: order.id,
       title: `${categoryName} - ${customerName}`,
       slug: slugify(`${categoryName}-${customerName}-${Date.now()}`),
       categoryId: order.categoryId,
       clientName: order.customerName,
       mainImageUrl: "https://via.placeholder.com/800x600", // temporary placeholder
       isPublished: false
     }
     ```
   - Commit transaction
4. Create Midtrans Snap transaction (outside transaction)
5. Update order with Snap token

**Response format** (updated):
```typescript
{
  orderId: string,
  projectId: string, // NEW
  snapToken: string,
  redirect_url: string
}
```

**Implementation Notes**:
- Use `db.transaction()` for atomic order + project creation
- If Midtrans fails, transaction is already committed (order + project exist)
- Use slugify helper (may need to install or create)
- Delete orphaned order AND project if Midtrans fails

**Status**: [Missing] - Requires modification of existing endpoint

#### C.2: Offline Orders Endpoint ❌ NOT STARTED
**File**: `server/routes.ts` (new endpoint)

**Option 1**: Reuse POST /api/orders with `channel='OFFLINE'`
- Pros: Single endpoint, less code duplication
- Cons: Conditional logic for Midtrans vs manual payment

**Option 2**: Create dedicated POST /api/orders/offline
- Pros: Clear separation, simpler validation
- Cons: Some code duplication

**Recommended**: Option 1 (reuse with channel parameter)

**Implementation**:
- [ ] Add `channel` to createOrderSchema (default "ONLINE")
- [ ] Add `paymentProvider` to createOrderSchema (default "midtrans")
- [ ] Add `source` to createOrderSchema (optional)
- [ ] Modify POST /api/orders logic:
  ```typescript
  if (channel === "OFFLINE") {
    // Skip Midtrans, create order + project, return directly
    return res.status(201).json({ orderId, projectId });
  } else {
    // Existing Midtrans flow
  }
  ```

**Status**: [Missing]

#### C.3: Manual Payment Records ❌ NOT STARTED
**File**: `server/routes.ts` (new endpoint)

**Endpoint**: POST /api/orders/:id/payments

**Request Body**:
```typescript
{
  provider: "cash" | "bank_transfer",
  amount: number, // in IDR
  notes?: string
}
```

**Logic**:
1. Validate order exists
2. Create payment record:
   ```typescript
   {
     orderId: order.id,
     transactionId: `manual_${Date.now()}`,
     provider,
     type: "DOWN_PAYMENT", // or determine from amount
     status: "settlement",
     grossAmount: amount,
     paidAt: new Date(),
     rawNotifJson: { manual: true, notes }
   }
   ```
3. Update order status: PENDING → CONSULTATION (if first payment)
4. Update order paymentStatus: "settlement"

**Status**: [Missing]

#### C.4: Photographers CRUD ❌ NOT STARTED
**File**: `server/routes.ts` + `server/storage.ts`

**Endpoints**:
- GET /api/photographers (list all)
- GET /api/photographers/:id (get one)
- POST /api/photographers (create)
- PATCH /api/photographers/:id (update)
- DELETE /api/photographers/:id (delete)

**Storage Interface Additions**:
```typescript
getPhotographers(): Promise<Photographer[]>;
getPhotographerById(id: string): Promise<Photographer | undefined>;
createPhotographer(photographer: InsertPhotographer): Promise<Photographer>;
updatePhotographer(id: string, photographer: Partial<InsertPhotographer>): Promise<Photographer | undefined>;
deletePhotographer(id: string): Promise<void>;
```

**Status**: [Missing]

#### C.5: Sessions CRUD ❌ NOT STARTED
**File**: `server/routes.ts` + `server/storage.ts`

**Endpoints**:
- GET /api/sessions?photographerId=&from=&to= (list with filters)
- GET /api/sessions/:id (get one)
- POST /api/sessions (create)
- PATCH /api/sessions/:id (update time/status/location/notes)
- DELETE /api/sessions/:id (delete)

**Storage Interface Additions**:
```typescript
getSessions(filters?: { photographerId?: string; from?: Date; to?: Date }): Promise<Session[]>;
getSessionById(id: string): Promise<Session | undefined>;
createSession(session: InsertSession): Promise<Session>;
updateSession(id: string, session: Partial<InsertSession>): Promise<Session | undefined>;
deleteSession(id: string): Promise<void>;
```

**Status**: [Missing]

#### C.6: Session Assignment with Conflict Handling ❌ NOT STARTED
**File**: `server/routes.ts` + `server/storage.ts`

**Endpoint**: POST /api/sessions/:id/assign

**Request Body**:
```typescript
{
  photographerId: string
}
```

**Logic**:
1. Validate session and photographer exist
2. Inside transaction:
   - Check if assignment already exists
   - Try to insert into session_assignments
   - Catch exclusion constraint violation (23P01)
   - Return 409 Conflict with message: "Photographer is busy during this time"
3. Return 201 Created on success

**Error Handling**:
```typescript
try {
  // insert
} catch (error) {
  if (error.code === '23P01') { // exclusion_violation
    return res.status(409).json({ 
      message: "Photographer is busy during this time",
      conflict: true
    });
  }
  throw error;
}
```

**Additional Endpoints**:
- GET /api/sessions/:id/assignments (list photographers assigned to session)
- DELETE /api/session-assignments/:id (remove assignment)

**Storage Interface Additions**:
```typescript
assignPhotographerToSession(sessionId: string, photographerId: string): Promise<SessionAssignment>;
getSessionAssignments(sessionId: string): Promise<SessionAssignment[]>;
removeSessionAssignment(assignmentId: string): Promise<void>;
```

**Status**: [Missing]

#### C.7: Optional Auto-Session on Settlement ❌ NOT STARTED
**File**: `server/routes.ts` (modify POST /api/midtrans/webhook)

**Logic** (after settlement):
1. Check if order has a linked project
2. Check if project already has sessions
3. If no sessions and tier has duration info:
   - Create draft session (status: "PLANNED")
   - No photographer assigned yet

**Status**: [Optional - Low Priority]

---

## Phase D - UI (Admin Dashboard) 🔄 IN PROGRESS

### Task List

#### D.1: Update Admin Orders Page - Schedule Drawer ❌ NOT STARTED
**File**: `client/src/pages/admin/orders.tsx`

**Current Features**:
- Kanban board with drag-and-drop
- Order detail sheet/drawer
- Payment timeline
- Drive link setting

**New Features to Add**:

**1. Schedule Session Section in Order Detail Drawer**
- [ ] Add "Schedule" accordion/section in drawer
- [ ] Show existing sessions for the order's project:
  - Session date/time
  - Duration (calculated from startAt/endAt)
  - Location
  - Status badge
  - Assigned photographers (names)
- [ ] "Create Session" button → opens session form dialog
- [ ] Session form fields:
  - Date picker (startAt date)
  - Start time (HH:mm)
  - Duration (select: 1h, 2h, 4h, 8h, or custom)
  - End time (auto-calculated or manual)
  - Location (text input)
  - Notes (textarea)
- [ ] "Assign Photographer" button for each session
  - Dropdown of active photographers
  - On selection: POST /api/sessions/:id/assign
  - Handle 409 conflict: show error toast "Photographer is busy at this time"
- [ ] Show linked project badge with click → open project in new tab or side panel

**Status**: [Missing]

#### D.2: Calendar View for Scheduling ❌ NOT STARTED
**File**: `client/src/pages/admin/calendar.tsx` (new file)

**Features**:
- [ ] Add new route: `/dashboard-admin/calendar` in `App.tsx`
- [ ] Add "Calendar" tab to admin layout
- [ ] View modes:
  - Per photographer (select dropdown)
  - All photographers (combined view)
  - Day view
  - Week view
- [ ] Display sessions as blocks on calendar
  - Color-coded by status (PLANNED, CONFIRMED, DONE, CANCELLED)
  - Show session time, location, project name, photographer names
- [ ] Drag to move session (update startAt/endAt)
  - PATCH /api/sessions/:id
  - Handle 409 conflict if photographer becomes busy
- [ ] Drag to resize session (update endAt)
  - Same conflict handling
- [ ] Click session → opens detail popover:
  - Session info
  - Link to project
  - Link to order
  - Edit button → opens session form
  - Delete button → confirmation dialog

**Libraries to Consider**:
- `@fullcalendar/react` or `react-big-calendar` or build custom with date-fns
- Integrate with existing DnD library (@dnd-kit)

**Status**: [Missing - Significant Work]

#### D.3: Projects Admin - Show Order Badge ❌ NOT STARTED
**File**: `client/src/pages/admin/projects.tsx`

**Changes**:
- [ ] Fetch projects with orderId field
- [ ] In project list table, add "Order" column:
  - If orderId exists: Show badge with order ID
  - Badge click → navigate to orders page and open that order's drawer
- [ ] In project detail/edit dialog:
  - Show "Linked Order" badge at top
  - Badge click → same navigation

**Status**: [Missing - Small Change]

#### D.4: Offline Order Form ❌ NOT STARTED
**File**: `client/src/pages/admin/orders.tsx` or new component

**Options**:
1. Add "Create Offline Order" button in admin orders page
2. Create dedicated admin form (similar to public /order but with more fields)

**Form Fields**:
- [ ] All fields from public order form (category, tier, customer info)
- [ ] Additional fields:
  - Channel: "OFFLINE" (fixed)
  - Payment Provider: select (cash, bank_transfer, etc.)
  - Source: text input (walk_in, whatsapp, instagram, referral)
- [ ] Submit → POST /api/orders with channel="OFFLINE"
- [ ] After creation:
  - Show success message with orderId and projectId
  - Option to immediately add manual payment
  - Navigate to order detail

**Status**: [Missing]

#### D.5: Manual Payment Form ❌ NOT STARTED
**File**: Component in admin orders page

**Features**:
- [ ] "Add Manual Payment" button in order detail drawer
- [ ] Form fields:
  - Provider: select (cash, bank_transfer, etc.)
  - Amount: number input (IDR)
  - Notes: textarea
- [ ] Submit → POST /api/orders/:id/payments
- [ ] Refresh payment timeline after success

**Status**: [Missing]

#### D.6: Photographers Management Page ❌ NOT STARTED
**File**: `client/src/pages/admin/photographers.tsx` (new file)

**Features**:
- [ ] Add route: `/dashboard-admin/photographers` in `App.tsx`
- [ ] Add "Photographers" tab to admin layout
- [ ] List table with columns:
  - Name
  - Contact
  - Active status (toggle)
  - Actions (edit, delete)
- [ ] Create/Edit dialog with form
- [ ] Delete confirmation dialog

**Status**: [Missing]

---

## Phase E - Documentation & Tests 🔄 IN PROGRESS

### Task List

#### E.1: Update FEATURES_OVERVIEW.md ❌ NOT STARTED
**File**: `FEATURES_OVERVIEW.md` (create new)

**Required Content**:
- [ ] **Updated ER Diagram**:
  - Orders (channel, paymentProvider, source)
  - Projects (orderId)
  - Photographers
  - Sessions (time_range)
  - SessionAssignments (with exclusion constraint notation)
- [ ] **New Endpoint Documentation**:
  - Photographers CRUD
  - Sessions CRUD
  - Session assignment with conflict handling
  - Manual payments
  - Offline orders
- [ ] **Flow Diagrams**:
  - Online order flow (with auto-project creation)
  - Offline order flow (with manual payment)
  - Scheduling flow (create session → assign photographer → handle conflict)
  - Conflict resolution (exclusion constraint explanation)
- [ ] **UI Route Map Update**:
  - Add `/dashboard-admin/calendar`
  - Add `/dashboard-admin/photographers`

**Status**: [Missing]

#### E.2: Update README.md ❌ NOT STARTED
**File**: `README.md`

**Required Additions**:
- [ ] **Migration Instructions**:
  - How to run Drizzle schema push
  - How to run raw SQL migration for btree_gist + exclusion constraint
  - Order of operations (schema first, then SQL migration)
- [ ] **Testing Offline Orders**:
  - Navigate to `/dashboard-admin/orders`
  - Click "Create Offline Order"
  - Fill form with channel="OFFLINE"
  - Add manual payment
  - Verify order status pipeline
- [ ] **Testing Scheduling Conflicts**:
  - Create session for Project A (e.g., 2pm-4pm)
  - Assign Photographer John
  - Create overlapping session for Project B (e.g., 3pm-5pm)
  - Try to assign Photographer John → expect 409 error
  - Verify error message displays in UI
- [ ] **Seed Data for Photographers**:
  - Document how to create test photographers
  - Example queries or seed script

**Status**: [Missing]

#### E.3: Create UI_QA_CHECKLIST.md ❌ NOT STARTED
**File**: `UI_QA_CHECKLIST.md` (create new)

**Required Test Cases**:

**Phase 3 Tests** (already working):
- [ ] Home shows dynamic packages & projects
- [ ] /project/:slug shows up to 7 images
- [ ] /order creates order and opens Snap (sandbox)
- [ ] Webhook settlement advances status; admin sees movement to CONSULTATION
- [ ] Admin Projects: image cap enforced; all CRUD works
- [ ] Admin Pricing: categories + tiers management works
- [ ] Admin Orders: Kanban to DONE; driveLink setting works
- [ ] No public link to /dashboard-admin

**Phase 4 New Tests**:
- [ ] **Order + Project Linkage**:
  - Create online order → verify project auto-created
  - Check project has orderId field populated
  - Verify 1:1 uniqueness (one project per order)
- [ ] **Offline Orders**:
  - Create offline order from admin
  - Verify no Midtrans interaction
  - Add manual cash payment
  - Verify status advances to CONSULTATION
  - Verify payment appears in timeline
- [ ] **Photographers Management**:
  - Create photographer via admin
  - Edit photographer details
  - Toggle active status
  - Delete photographer
- [ ] **Session Creation**:
  - Create session for a project
  - Set start/end time, location, notes
  - Verify session appears in order drawer
- [ ] **Photographer Assignment**:
  - Assign photographer to session
  - Verify success toast
- [ ] **Conflict Handling**:
  - Create two overlapping sessions
  - Assign same photographer to both
  - Second assignment → verify 409 error
  - Verify error message: "Photographer is busy at this time"
- [ ] **Calendar View**:
  - View calendar with sessions displayed
  - Switch between photographers
  - Drag session to new time
  - Verify update persists
  - Drag to create conflict → verify error
- [ ] **Project-Order Badge**:
  - Open admin projects
  - Find project with orderId
  - Verify order badge displays
  - Click badge → navigate to order

**Status**: [Missing]

#### E.4: Create Seed Script for Photographers ❌ NOT STARTED
**File**: `scripts/seed-photographers.ts` (new file)

**Content**:
```typescript
import { db } from "../server/db";
import { photographers } from "../shared/schema";

async function seedPhotographers() {
  const testPhotographers = [
    { name: "John Doe", contact: "+62812345678", isActive: true },
    { name: "Jane Smith", contact: "+62823456789", isActive: true },
    { name: "Bob Wilson", contact: "+62834567890", isActive: false },
  ];
  
  for (const photographer of testPhotographers) {
    await db.insert(photographers).values(photographer);
  }
  
  console.log("✅ Seeded photographers");
}

seedPhotographers().catch(console.error);
```

**Status**: [Missing]

---

## Environment Variables

### Backend (Already Configured)
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `MIDTRANS_SERVER_KEY` - For order creation (required by user)
- ✅ `MIDTRANS_CLIENT_KEY` - For Snap integration (required by user)

### No New Environment Variables Required for Phase 4

---

## Acceptance Criteria (Definition of Done)

### Phase 4 Specific:
- [ ] Any newly created Order (online or offline) results in a linked minimal Project (projects.orderId = order.id), with one-to-one uniqueness enforced
- [ ] Manual Projects without orders continue to work (orderId NULL)
- [ ] Offline Order can be created from Admin
- [ ] Manual payment can be recorded for any order
- [ ] Status pipeline functions exactly as online for offline orders
- [ ] Scheduling: sessions + assignments exist in database
- [ ] Assigning the same photographer to overlapping sessions fails at DB level (exclusion constraint) and returns 409
- [ ] Admin can create/update sessions via Schedule Drawer
- [ ] Admin can assign photographers with conflict handling UI
- [ ] Calendar view displays sessions and allows drag-to-update
- [ ] No duplication of routes/validators/types
- [ ] Single /api entry preserved
- [ ] /dashboard-admin remains unlinked in public nav
- [ ] Docs updated (FEATURES_OVERVIEW, README, UI_QA_CHECKLIST)
- [ ] Implementation Plan checked off
- [ ] Clean, well-labeled commits

### General Requirements:
- [ ] TypeScript strict mode maintained
- [ ] Zod validation on all inputs
- [ ] Consistent error model
- [ ] No mock/placeholder data in production paths
- [ ] Never expose server secrets to client

---

## Implementation Order

1. **Phase B.1-B.4**: Schema extensions (orders, projects, photographers, sessions, session_assignments)
2. **Phase B.5**: Raw SQL migration for btree_gist + exclusion constraint
3. **Phase B.6**: Push schema changes to database
4. **Phase C.1**: Modify POST /api/orders for auto-project creation
5. **Phase C.2**: Add offline order support
6. **Phase C.3**: Manual payment endpoint
7. **Phase C.4**: Photographers CRUD (backend + storage)
8. **Phase C.5**: Sessions CRUD (backend + storage)
9. **Phase C.6**: Session assignment with conflict handling
10. **Phase D.6**: Photographers management UI
11. **Phase D.4**: Offline order form UI
12. **Phase D.5**: Manual payment form UI
13. **Phase D.3**: Project-order badge UI
14. **Phase D.1**: Schedule drawer in orders page
15. **Phase D.2**: Calendar view (most complex UI)
16. **Phase E**: Documentation and testing

---

## Progress Tracking

**Overall: 0% Complete**

| Component | Progress | Status | Priority |
|-----------|----------|--------|----------|
| Schema Extensions | 0% | ❌ Not Started | High |
| Raw SQL Migration | 0% | ❌ Not Started | High |
| Auto-Project Creation | 0% | ❌ Not Started | High |
| Offline Orders Backend | 0% | ❌ Not Started | High |
| Manual Payments Backend | 0% | ❌ Not Started | High |
| Photographers CRUD Backend | 0% | ❌ Not Started | High |
| Sessions CRUD Backend | 0% | ❌ Not Started | High |
| Session Assignment Backend | 0% | ❌ Not Started | High |
| Photographers Management UI | 0% | ❌ Not Started | Medium |
| Offline Orders UI | 0% | ❌ Not Started | Medium |
| Manual Payments UI | 0% | ❌ Not Started | Medium |
| Project-Order Badge UI | 0% | ❌ Not Started | Low |
| Schedule Drawer UI | 0% | ❌ Not Started | Medium |
| Calendar View UI | 0% | ❌ Not Started | Low |
| Documentation | 0% | ❌ Not Started | Medium |

---

*Last Updated: October 3, 2025*
*Current Status: Phase 4 - Planning Complete, Ready for Implementation*
