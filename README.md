# Photography Portfolio Website

Full-stack photography portfolio application with online/offline order management, photographer scheduling, and payment integration.

## Features

- 📸 **Portfolio Gallery**: Showcase photography projects with dynamic image galleries
- 💰 **Order Management**: Handle online (Midtrans) and offline (cash/bank transfer) orders
- 🧑‍🎨 **Photographer Scheduling**: Assign photographers to sessions with conflict detection
- 📅 **Calendar View**: Visual week-based schedule with photographer workload tracking
- 💳 **Payment Integration**: Midtrans for online payments, manual entry for offline payments
- 🔗 **Order-Project Linking**: Every order automatically creates a linked project (1:1 relationship)
- ⚠️ **Conflict Prevention**: Database-level exclusion constraints prevent double-booking

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Wouter, TanStack Query, shadcn/ui, Tailwind CSS
- **Backend**: Express.js, TypeScript, Node.js
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Payments**: Midtrans integration
- **DnD**: @dnd-kit for Kanban drag-and-drop

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database (or use Replit's built-in database)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   The following secrets are automatically configured in Replit:
   - `DATABASE_URL` - PostgreSQL connection string
   - `MIDTRANS_SERVER_KEY` - Midtrans server key (optional for offline-only)
   - `MIDTRANS_CLIENT_KEY` - Midtrans client key (optional for offline-only)
   - `MIDTRANS_IS_PRODUCTION` - Set to `true` for production, `false` for sandbox

3. **Run database migrations:**
   ```bash
   npm run db:push
   ```

   This will:
   - Create all tables (categories, orders, projects, photographers, sessions, etc.)
   - Apply the scheduling constraints (see below)

4. **Apply scheduling constraints (IMPORTANT):**

   The photographer scheduling system requires PostgreSQL's `btree_gist` extension and an exclusion constraint. These are applied via the migration file:

   ```sql
   -- migrations/001_scheduling_constraints.sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;

   ALTER TABLE sessions 
   ADD COLUMN IF NOT EXISTS time_range tstzrange 
   GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED;

   ALTER TABLE session_assignments 
   ADD CONSTRAINT IF NOT EXISTS photographer_no_overlap 
   EXCLUDE USING gist (
     photographer_id WITH =,
     (SELECT time_range FROM sessions WHERE id = session_id) WITH &&
   );
   ```

   **To apply manually if needed:**
   ```bash
   # Connect to your database
   psql $DATABASE_URL

   # Run the migration
   \i migrations/001_scheduling_constraints.sql
   ```

5. **Seed data (optional):**
   ```bash
   npx tsx scripts/seed.ts
   ```

   This creates:
   - Sample categories (Wedding, Portrait, etc.)
   - Sample photographers
   - Sample projects

### Development

```bash
npm run dev
```

Starts the application on `http://localhost:5000`

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   │   ├── admin/     # Admin dashboard pages
│   │   │   └── ...        # Public pages
│   │   ├── lib/          # Utilities & configuration
│   │   └── App.tsx       # Main application router
├── server/                # Backend Express application
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database abstraction layer
│   ├── db.ts            # Database connection
│   ├── vite.ts          # Vite integration
│   └── midtrans/        # Payment integration
├── shared/               # Shared types & schemas
│   └── schema.ts        # Drizzle ORM schemas + Zod validators
├── migrations/          # Database migrations
└── scripts/             # Utility scripts
```

## Admin Dashboard

Access the admin dashboard at `/dashboard-admin` (no public links, direct URL access only).

### Admin Features

1. **Projects Management** (`/dashboard-admin/projects`)
   - Create, edit, publish projects
   - Manage project images (max 7)
   - View order badge for linked orders

2. **Pricing Management** (`/dashboard-admin/pricing`)
   - Manage categories and price tiers
   - Set base prices and custom packages

3. **Orders Kanban** (`/dashboard-admin/orders`)
   - Drag-and-drop order status management
   - Create offline orders
   - Add manual payments
   - Create sessions and assign photographers
   - Track payment timeline

4. **Photographers** (`/dashboard-admin/photographers`)
   - CRUD operations for photographer profiles
   - Activate/deactivate photographers

5. **Calendar** (`/dashboard-admin/calendar`)
   - **Interactive week view**: Click any time slot to create a session
   - **Session management**: Click sessions to view details, edit, delete, or assign photographers
   - **Visual indicators**: Status-based colors (blue=planned, green=confirmed, gray=done, red=cancelled)
   - **Conflict detection**: Real-time photographer availability checking with 409 conflict handling
   - **Now line**: Red line showing current time when viewing current week
   - **Weekend shading**: Subtle background for Saturday/Sunday columns
   - **Starting soon pulse**: Animated sessions beginning within 15 minutes
   - **Photographer filter**: View specific photographer schedules
   - **Workload statistics**: Session counts and hours per photographer
   - **Navigation**: Direct links to related projects and orders

## API Documentation

See [BACKEND_SMOKE.md](./BACKEND_SMOKE.md) for curl examples testing all flows.

See [FEATURES_OVERVIEW.md](./FEATURES_OVERVIEW.md) for:
- Complete ERD
- API endpoint matrix
- Flow diagrams
- Conflict handling details

## Key Workflows

### Online Order Flow
1. Customer fills order form → Midtrans payment
2. Order + Project auto-created in database
3. Webhook updates payment status
4. Order advances: PENDING → CONSULTATION → SESSION → FINISHING → DRIVE_LINK → DONE

### Offline Order Flow
1. Admin creates order (channel=OFFLINE, provider=cash/bank_transfer)
2. Order + Project auto-created
3. Admin adds manual payment when received
4. Order advances through same stages

### Scheduling Flow
1. Admin opens Calendar view
2. Clicks empty time slot → Create session dialog opens (prefilled with clicked date/time)
3. Fills in project, location, notes, status → Submit
4. Session appears on calendar with status-based color
5. Clicks session block → Details drawer opens
6. Assigns photographer from dropdown → POST /api/sessions/:id/assign
7. If conflict detected → **409 Conflict** response
8. UI shows toast "Photographer busy for this time range", reverts assignment
9. Calendar updates in real-time showing all sessions with photographer badges

### Calendar Quick Start
```bash
# Create a session via API
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "startAt": "2025-10-05T14:00:00Z",
    "endAt": "2025-10-05T16:00:00Z",
    "location": "Studio A",
    "notes": "Wedding shoot",
    "status": "CONFIRMED"
  }'

# Assign photographer
curl -X POST http://localhost:5000/api/sessions/SESSION_ID/assign \
  -H "Content-Type: application/json" \
  -d '{"photographerId": "PHOTOGRAPHER_ID"}'
# Success: 201 Created
# Conflict: 409 {"code":"PHOTOGRAPHER_BUSY","message":"Photographer is busy during this time"}

# Unassign photographer
curl -X DELETE http://localhost:5000/api/session-assignments/ASSIGNMENT_ID
```

**UI Workflow:**
1. Navigate to `/dashboard-admin/calendar`
2. Click any time slot (e.g., Thursday 2:00 PM)
3. Dialog opens with date/time prefilled
4. Select project from dropdown → Order auto-fills if linked
5. Adjust end time if needed (default +2 hours)
6. Click "Create Session" → Session appears on calendar
7. Click session block → Details drawer opens
8. Select photographer from "Assign Photographer" dropdown
9. If busy → Toast appears, assignment reverted
10. If available → Photographer badge shows on session

## Conflict Detection

The system prevents photographer double-booking using a **database-level exclusion constraint**:

```sql
EXCLUDE USING gist (
  photographer_id WITH =,
  time_range WITH &&
)
```

This ensures:
- A photographer cannot be assigned to overlapping sessions
- Constraint enforced at database level (not just application logic)
- PostgreSQL error code `23P01` → mapped to HTTP 409
- UI handles 409 gracefully with toast notifications

### How to Reproduce a 409 Conflict

```bash
# 1. Create a photographer
curl -X POST "${BASE_URL}/api/photographers" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","contact":"john@example.com","isActive":true}'

# 2. Create a session (tomorrow 14:00-18:00)
curl -X POST "${BASE_URL}/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId":"<PROJECT_ID>",
    "startAt":"2025-01-05T14:00:00Z",
    "endAt":"2025-01-05T18:00:00Z",
    "location":"Studio A"
  }'

# 3. Assign photographer to session
curl -X POST "${BASE_URL}/api/sessions/<SESSION_ID>/assign" \
  -H "Content-Type: application/json" \
  -d '{"photographerId":"<PHOTOGRAPHER_ID>"}'
# Returns: 201 Created

# 4. Try to assign same photographer to overlapping session (tomorrow 16:00-20:00)
curl -X POST "${BASE_URL}/api/sessions/<SESSION_ID_2>/assign" \
  -H "Content-Type: application/json" \
  -d '{"photographerId":"<PHOTOGRAPHER_ID>"}'
# Returns: 409 Conflict
```

## Testing

See [UI_QA_CHECKLIST.md](./UI_QA_CHECKLIST.md) for comprehensive UI testing checklist covering:
- All admin pages
- Conflict handling (409)
- Console cleanliness verification
- Order-project linking
- Session scheduling

## Deployment

The application is configured for Replit deployment with:
- Autoscale deployment target
- Port 5000 (required)
- Environment variables managed via Replit Secrets

To deploy:
1. Click the "Publish" button in Replit
2. Configure environment variables
3. Deploy to production

## Troubleshooting

### Migration Issues

If you encounter migration errors:

```bash
# Force push schema (WARNING: may lose data in development)
npm run db:push --force
```

### Scheduling Constraints Not Applied

Manually apply the exclusion constraint:

```bash
psql $DATABASE_URL < migrations/001_scheduling_constraints.sql
```

### Midtrans Integration Issues

For offline-only setups, you can skip Midtrans configuration:
- Online orders will fail without keys
- Offline orders work without Midtrans
- Manual payments work without Midtrans

## License

MIT

## Support

For issues or questions, please refer to:
- [BACKEND_SMOKE.md](./BACKEND_SMOKE.md) - API testing
- [FEATURES_OVERVIEW.md](./FEATURES_OVERVIEW.md) - Architecture details
- [UI_QA_CHECKLIST.md](./UI_QA_CHECKLIST.md) - UI testing
