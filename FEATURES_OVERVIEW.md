# Photography Portfolio Features Overview

## Entity Relationship Diagram (ERD)

```
┌──────────────┐
│  Categories  │
│──────────────│
│ id (PK)      │
│ name         │
│ slug         │
│ basePrice    │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼───────┐         ┌──────────────┐
│ Price Tiers  │         │ Photographers│
│──────────────│         │──────────────│
│ id (PK)      │         │ id (PK)      │
│ categoryId FK│         │ name         │
│ name         │         │ contact      │
│ price        │         │ isActive     │
└──────────────┘         └──────┬───────┘
                                │
                                │ N:M via
┌──────────────┐                │ session_assignments
│   Orders     │                │
│──────────────│         ┌──────▼───────────┐
│ id (PK)      │◄────┐   │    Sessions      │
│ categoryId FK│     │   │──────────────────│
│ priceTierId FK│    │   │ id (PK)          │
│ customerName │     │   │ projectId FK     │
│ email        │     │   │ orderId FK (opt) │
│ phone        │     │   │ startAt          │
│ totalPrice   │     │   │ endAt            │
│ status       │     │   │ location         │
│ channel      │     │   │ status           │
│ paymentProv. │     │   └──────┬───────────┘
│ source       │     │          │
└──────┬───────┘     │          │ 1:N
       │             │          │
       │ 1:N         │   ┌──────▼──────────────────┐
       │             │   │ Session Assignments     │
┌──────▼───────┐    │   │─────────────────────────│
│  Payments    │    │   │ id (PK)                 │
│──────────────│    │   │ sessionId FK            │
│ id (PK)      │    │   │ photographerId FK       │
│ orderId FK   │    │   │ EXCL: photographer +    │
│ provider     │    │   │       time_range        │
│ status       │    │   └─────────────────────────┘
│ type         │    │
│ grossAmount  │    │
└──────────────┘    │
                    │
       ┌────────────┘ 1:1 (optional)
       │
┌──────▼───────┐
│   Projects   │
│──────────────│
│ id (PK)      │
│ orderId FK   │──► UNIQUE, SET NULL
│ title        │    (1:1 relationship)
│ slug         │
│ categoryId FK│
│ clientName   │
│ isPublished  │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼────────┐
│Project Images │
│───────────────│
│ id (PK)       │
│ projectId FK  │
│ url           │
│ caption       │
│ sortOrder     │
└───────────────┘
```

## Key Relationships

1. **Orders ↔ Projects**: Optional 1:1 relationship via `projects.orderId`
   - When an order is created (online or offline), a project is **auto-created**
   - Projects can also exist independently (no order)
   - Deleting an order sets `orderId = NULL` in project (preserves project)

2. **Photographers ↔ Sessions**: Many-to-Many via `session_assignments`
   - Database exclusion constraint prevents double-booking
   - Constraint: `EXCLUDE USING gist (photographer_id WITH =, time_range WITH &&)`
   - Returns HTTP 409 on conflict

## API Endpoints Matrix

### Categories & Pricing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category |
| PATCH | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| GET | `/api/price-tiers` | List all price tiers |
| POST | `/api/price-tiers` | Create price tier |
| PATCH | `/api/price-tiers/:id` | Update price tier |
| DELETE | `/api/price-tiers/:id` | Delete price tier |

### Orders & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders |
| POST | `/api/orders` | Create order (auto-creates project) |
| PATCH | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Delete order |
| POST | `/api/orders/:id/payments` | Add manual payment |
| GET | `/api/orders/:id/payments` | Get order payment timeline |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get project by ID |
| GET | `/api/projects/by-order/:orderId` | Get project by order ID |
| POST | `/api/projects` | Create project manually |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/images` | Get project images |
| POST | `/api/projects/:id/images` | Add project image |
| DELETE | `/api/project-images/:id` | Delete project image |

### Photographers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/photographers` | List photographers |
| POST | `/api/photographers` | Create photographer |
| PATCH | `/api/photographers/:id` | Update photographer |
| DELETE | `/api/photographers/:id` | Delete photographer |

### Sessions & Assignments
| Method | Endpoint | Description | Conflict Handling |
|--------|----------|-------------|-------------------|
| GET | `/api/sessions` | List all sessions | - |
| POST | `/api/sessions` | Create session | - |
| PATCH | `/api/sessions/:id` | Update session | - |
| DELETE | `/api/sessions/:id` | Delete session | - |
| POST | `/api/sessions/:id/assign` | Assign photographer | **409 on overlap** |
| GET | `/api/sessions/:id/assignments` | Get session photographers | - |
| GET | `/api/session-assignments` | Get all assignments | - |
| DELETE | `/api/session-assignments/:id` | Remove assignment | - |

### Payment Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/midtrans/webhook` | Handle Midtrans payment notifications |

## Flow Diagrams

### Flow 1: Online Order

```
┌─────────────┐
│ Customer    │
│ Fills Form  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ POST /api/orders            │
│ channel = 'ONLINE'          │
│ paymentProvider = 'midtrans'│
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────┐
│ DB Transaction:        │
│ 1. Insert Order        │
│ 2. Auto-create Project │
│ 3. Call Midtrans Snap  │
│ 4. Save snapToken      │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Return:                │
│ { orderId, projectId,  │
│   snapToken,           │
│   redirect_url }       │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Customer redirected to │
│ Midtrans payment page  │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Midtrans sends webhook │
│ to /api/midtrans/webhook│
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ If status=settlement:  │
│ - Insert Payment       │
│ - Update Order status  │
│   PENDING → CONSULTATION│
└────────────────────────┘
```

### Flow 2: Offline Order + Manual Payment

```
┌─────────────────┐
│ Admin Dashboard │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────────┐
│ POST /api/orders            │
│ channel = 'OFFLINE'         │
│ paymentProvider = 'cash' or │
│                'bank_transfer'│
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────┐
│ DB Transaction:        │
│ 1. Insert Order        │
│ 2. Auto-create Project │
│ (No Midtrans call)     │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Return:                │
│ { orderId, projectId } │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Admin navigates to     │
│ Orders page, opens     │
│ order detail drawer    │
└──────┬─────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ POST /api/orders/:id/payments│
│ {                            │
│   provider: 'cash',          │
│   status: 'settlement',      │
│   type: 'DOWN_PAYMENT',      │
│   grossAmount: 2400000       │
│ }                            │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────┐
│ Insert Payment record  │
│ If settlement & PENDING│
│ → Auto-advance to      │
│   CONSULTATION         │
└────────────────────────┘
```

### Flow 3: Scheduling with Conflict Detection

```
┌─────────────────┐
│ Admin Dashboard │
│ Orders page     │
└──────┬──────────┘
       │
       ▼
┌────────────────────────┐
│ Click order card       │
│ → Opens detail drawer  │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Create Session button  │
│ Fill: start, end,      │
│       location, notes  │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ POST /api/sessions     │
│ { projectId, orderId,  │
│   startAt, endAt, ...} │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Session created        │
│ Drawer shows session   │
│ with "Assign" button   │
└──────┬─────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ POST /api/sessions/:id/assign│
│ { photographerId }          │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────┐
│ DB: INSERT INTO        │
│ session_assignments    │
│ Check EXCLUSION        │
│ constraint             │
└──────┬─────────────────┘
       │
       ├─► Success (201)
       │   Assignment created
       │
       └─► Conflict (409)
           { code: 'PHOTOGRAPHER_BUSY',
             message: 'Photographer is busy...',
             conflict: true }
           
           ↓
       ┌────────────────────────┐
       │ UI shows toast:        │
       │ "Photographer is busy  │
       │  during this time"     │
       │ Assignment reverted    │
       └────────────────────────┘
```

### Flow 4: Calendar Drag & Resize (409 Handling)

```
┌─────────────────┐
│ Admin Calendar  │
│ View            │
└──────┬──────────┘
       │
       ▼
┌────────────────────────┐
│ Drag session block to  │
│ new time or resize     │
└──────┬─────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ PATCH /api/sessions/:id     │
│ { startAt, endAt }          │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────┐
│ DB: Update session     │
│ Check if photographer  │
│ has conflicts via      │
│ exclusion constraint   │
└──────┬─────────────────┘
       │
       ├─► Success (200)
       │   Session updated
       │   Calendar refreshes
       │
       └─► Conflict (409)
           { message: 'conflict' }
           
           ↓
       ┌────────────────────────┐
       │ UI shows toast:        │
       │ "Scheduling conflict"  │
       │ "Photographer has      │
       │  another session"      │
       │ Reverts drag/resize    │
       └────────────────────────┘
```

## Database Exclusion Constraint

Implemented via PostgreSQL extension `btree_gist` and exclusion constraint:

```sql
-- Enable btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create time range type for sessions
ALTER TABLE sessions 
ADD COLUMN time_range tstzrange 
GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED;

-- Exclusion constraint on session_assignments
ALTER TABLE session_assignments 
ADD CONSTRAINT photographer_no_overlap 
EXCLUDE USING gist (
  photographer_id WITH =,
  (SELECT time_range FROM sessions WHERE id = session_id) WITH &&
);
```

This ensures that:
- A photographer cannot be assigned to overlapping sessions
- Database enforces the constraint (not just app logic)
- Returns PostgreSQL error code `23P01` → mapped to HTTP 409
