# Admin Dashboard + Midtrans Integration - Implementation Plan

## Project Goal
Build a production-ready admin dashboard at `/dashboard-admin` (no nav links) with backend support for:
- Project Gallery management
- Category-based pricing with tiers
- Orders with down payment via Midtrans Snap + webhook
- Status pipeline: PENDING → CONSULTATION → SESSION → FINISHING → DRIVE_LINK → DONE (+ CANCELLED)

## Current Status: PHASE 2 - Backend Implementation (In Progress)

---

## PHASE 1: Audit & Plan ✅ COMPLETED

### Audit Results

#### ✅ ALREADY IMPLEMENTED

**1. Database Schema (shared/schema.ts)**
- ✅ `categories` table with all required fields (id, name, slug, description, basePrice, isActive, sortOrder, timestamps)
- ✅ `price_tiers` table with FK to categories
- ✅ `projects` table with FK to categories, slug, mainImageUrl, isPublished, driveLink
- ✅ `project_images` table with FK to projects, sortOrder
- ✅ `orders` table with all fields including Midtrans integration fields (midtransOrderId, snapToken, snapRedirectUrl, paymentStatus)
- ✅ `payments` table with orderId FK, status, grossAmount, paidAt, rawNotifJson
- ✅ Proper enums for order_status, payment_status, payment_type
- ✅ TypeScript types and Zod schemas for all entities
- ✅ Legacy tables maintained: `portfolio_images`, `contact_submissions`

**2. Database Connection (server/db.ts)**
- ✅ Neon PostgreSQL connection with WebSocket support
- ✅ Drizzle ORM configured
- ✅ Environment check for DATABASE_URL

**3. Backend API Routes (server/routes.ts)**
- ✅ Categories CRUD: GET (with active filter), GET/:id, POST, PATCH, DELETE
- ✅ Price Tiers CRUD: GET by category, POST, PATCH, DELETE
- ✅ Projects CRUD: GET (with published/categoryId/search filters), GET/:idOrSlug, POST, PATCH, DELETE
- ✅ Project Images CRUD: GET by project, POST, PATCH, DELETE
- ✅ Orders READ: GET (with status filter), GET/:id, PATCH/:id, GET/:id/payments
- ✅ Legacy routes maintained for portfolio and contact (backward compatibility)

**4. Storage Layer (server/storage.ts)**
- ✅ Complete DatabaseStorage implementation for all entities
- ✅ Interface-based design (IStorage)
- ✅ All CRUD operations with proper Drizzle queries
- ✅ Search/filter support in getProjects() and getOrders()

**5. Infrastructure**
- ✅ Drizzle config (drizzle.config.ts) pointing to PostgreSQL
- ✅ Netlify serverless function wrapper (netlify/functions/api.ts)
- ✅ Single entry point for all API routes (no duplication)

#### ❌ MISSING / TODO

**1. Dependencies**
- ❌ `cuid` package not installed → **LSP ERROR in shared/schema.ts**
- ❌ `midtrans-client` package likely not installed

**2. Database**
- ❌ No migrations created (migrations/ directory doesn't exist)
- ❌ No seed script (scripts/seed.ts doesn't exist)

**3. Midtrans Integration**
- ❌ POST /api/orders endpoint (missing Snap token creation logic)
- ❌ POST /api/midtrans/webhook endpoint (missing entirely)
- ❌ Signature verification helper (SHA512: order_id + status_code + gross_amount + SERVER_KEY)
- ❌ DP amount calculation helper
- ❌ Snap client wrapper/helper functions
- ❌ Idempotent payment upsert logic in webhook
- ❌ Auto-status update (PENDING → CONSULTATION on settlement)

**4. Validation & Enforcement**
- ❌ Project images limit enforcement (≤7 images per project)
- ❌ Order PATCH field restrictions (should not allow arbitrary field updates)
- ❌ Payment upsert/update methods in storage (currently only create)

**5. Configuration**
- ❌ Environment variables documentation (MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION)
- ❌ No fallback for missing DATABASE_URL in development (db.ts throws immediately)

### Duplication Assessment

**Portfolio vs Projects:**
- Legacy `portfolioImages` table is kept for backward compatibility
- New `projects` + `project_images` tables serve similar purpose but with richer features
- **Decision:** Keep both systems running in parallel for now
- Frontend still uses legacy portfolio data
- Future: Migrate frontend to use projects, then deprecate portfolio

**Routes Consolidation:**
- ✅ All routes properly organized in single server/routes.ts
- ✅ Netlify function wraps Express app correctly (single entry point)
- ✅ No duplicate endpoint implementations found

**Storage Implementation:**
- ✅ Single DatabaseStorage class handles all entities
- ✅ Interface-based design allows for future extensions
- ⚠️ No fallback MemStorage for development without DATABASE_URL

---

## PHASE 2: Backend Implementation (CURRENT PHASE)

### 2.1 Platform Stabilization

#### Task 2: Install Missing Dependencies ⏳ IN PROGRESS
- [ ] Install `cuid` package
- [ ] Install `midtrans-client` package
- [ ] Verify no LSP errors
- **Acceptance:** `npm install` succeeds, LSP diagnostics clean

#### Task 3: Create Database Migrations
- [ ] Run `drizzle-kit generate` to create migrations for all new tables
- [ ] Review generated SQL for safety
- [ ] Document how to apply migrations (`drizzle-kit migrate` or `push`)
- **Acceptance:** migrations/ directory exists with SQL files, migrations apply cleanly

#### Task 4: Create Seed Script
- [ ] Create `scripts/seed.ts` with:
  - 2-3 demo categories (e.g., "Wedding", "Portrait", "Commercial") with basePrice and slugs
  - 2-3 price tiers per category (e.g., "Basic", "Premium", "Elite")
  - 1-2 demo projects with mainImageUrl and ≤7 project images
  - 1 demo PENDING order linked to a category
- [ ] Make script idempotent (check if data exists before inserting)
- [ ] Run with: `npx tsx scripts/seed.ts` (no package.json modification)
- **Acceptance:** Running `npx tsx scripts/seed.ts` populates database with demo data

### 2.2 Midtrans Integration

#### Task 8: Implement Midtrans Helper Functions
- [ ] Create `server/midtrans/` directory
- [ ] `server/midtrans/helpers.ts`:
  - `verifySignature(orderId, statusCode, grossAmount, serverKey)` → SHA512 hash verification
  - `computeDpAmount(totalPrice, dpPercent)` → Math.round(totalPrice * dpPercent / 100)
  - `generateOrderId(orderId)` → "order_" + orderId or similar stable format
- [ ] `server/midtrans/client.ts`:
  - Initialize Midtrans Snap client with SERVER_KEY and IS_PRODUCTION
  - `createSnapTransaction(params)` → returns { token, redirect_url }
- [ ] Write unit tests for signature verification and DP calculation
- **Acceptance:** Helper functions tested and working

#### Task 9: Implement POST /api/orders with Snap
- [ ] Validate request body with Zod:
  - Required: categoryId, customerName, email, phone
  - Optional: priceTierId, notes
- [ ] Load pricing:
  - If priceTierId provided → totalPrice = tier.price
  - Else → totalPrice = category.basePrice
- [ ] Compute DP: dpAmount = computeDpAmount(totalPrice, 30)
- [ ] Create order in database (status = PENDING)
- [ ] Call Midtrans Snap API:
  - transaction_details: { order_id: generateOrderId(order.id), gross_amount: dpAmount }
  - customer_details: { first_name, email, phone }
  - item_details: [{ name: "Down Payment for {Category/Tier}", price: dpAmount, quantity: 1 }]
- [ ] Update order with midtransOrderId, snapToken, snapRedirectUrl
- [ ] Return 201 with { orderId, snapToken, redirect_url }
- **Acceptance:** POST /api/orders returns Snap token, order stored with Midtrans fields populated

#### Task 12: Implement Midtrans Webhook
- [ ] Add POST /api/midtrans/webhook route
- [ ] Extract notification payload from req.body
- [ ] Verify signature using verifySignature() - **CRITICAL for security**
- [ ] If signature invalid → return 401
- [ ] Parse: order_id, transaction_id, transaction_status, gross_amount
- [ ] Extract actual orderId from order_id (strip "order_" prefix)
- [ ] Idempotent payment upsert logic:
  - Check if payment exists for this orderId + transaction_id
  - If exists: update status, rawNotifJson, paidAt (if settlement)
  - If not exists: create new payment record
- [ ] Update order.paymentStatus = transaction_status
- [ ] Optional: If transaction_status === 'settlement' AND order.status === 'PENDING' → update order.status = 'CONSULTATION'
- [ ] Always return 200 OK (even on repeats)
- **Acceptance:** Webhook handles duplicate notifications idempotently, signature verification works, payment and order updated correctly

#### Task 13: Update Storage Layer
- [ ] Add to IStorage interface:
  - `upsertPayment(orderId: string, transactionId: string, payment: Partial<InsertPayment>)`
  - `getPaymentByTransaction(orderId: string, transactionId: string)`
- [ ] Implement in DatabaseStorage using Drizzle's `.onConflictDoUpdate()` or manual check-then-insert
- **Acceptance:** Payment upsert works correctly, no duplicate payments created

### 2.3 Validation & Enforcement

#### Task 7: Add Project Image Limit Enforcement
- [ ] In POST /api/projects/:projectId/images route:
  - Before creating image, count existing images for project
  - If count >= 7, return 400 with error message
- [ ] Add validation in storage layer as secondary check
- **Acceptance:** Cannot add 8th image to a project

#### Task 11: Restrict Order PATCH Fields
- [ ] Create specific Zod schema for order updates (not full insertOrderSchema.partial())
- [ ] Allow only: status, notes, driveLink (admin-controlled fields)
- [ ] paymentStatus should only be updated via webhook, not manual PATCH
- [ ] Reject updates to: totalPrice, dpAmount, midtransOrderId, snapToken, etc.
- **Acceptance:** PATCH /api/orders/:id rejects unauthorized field updates, security hardened

### 2.4 Configuration & Documentation

#### Task 14: Environment Variables
- [ ] Document required env vars in README or .env.example:
  - DATABASE_URL (Neon PostgreSQL)
  - MIDTRANS_SERVER_KEY (from Midtrans dashboard)
  - MIDTRANS_CLIENT_KEY (from Midtrans dashboard)
  - MIDTRANS_IS_PRODUCTION=false (for sandbox)
  - APP_BASE_URL (for frontend URL reference if needed)
- [ ] Add check for Midtrans keys on server startup
- **Acceptance:** Clear documentation exists, app fails gracefully if keys missing

#### Task 2 (Part 2): Database Environment Strategy
- [ ] **Decision Required:** Either:
  - Option A: Ensure DATABASE_URL is provisioned for Replit environment (use `create_postgresql_database_tool`)
  - Option B: Add MemStorage fallback in server/storage.ts when DATABASE_URL missing (per guidelines)
- [ ] Document chosen strategy in this plan
- **Acceptance:** App starts reliably in development environment
- **Status:** Will provision DATABASE_URL for Replit before running migrations

### 2.5 Testing

#### Task 15: End-to-End Testing
- [ ] Run migrations: `npm run db:push` or equivalent
- [ ] Seed database: `npm run seed`
- [ ] Test order creation:
  - POST /api/orders with valid categoryId/tierId
  - Verify Snap token returned
  - Check order in database has Midtrans fields
- [ ] Test webhook:
  - Send sample Midtrans notification (sandbox)
  - Verify signature validation works
  - Confirm payment record created/updated
  - Confirm order.paymentStatus updated
  - Test duplicate webhook → should not create duplicate payment
- [ ] Test image limit: Try adding 8 images to a project → should fail
- [ ] Verify all CRUD endpoints still work for categories, tiers, projects
- **Acceptance:** All Phase 2 functionality works end-to-end

---

## PHASE 3: Client UI (NOT IN SCOPE YET)

This phase will implement:
- Landing page consuming published projects and active categories/tiers
- Public order flow with Snap popup integration
- Admin dashboard at `/dashboard-admin` (no nav links)
- Projects CRUD UI
- Pricing manager UI
- Orders Kanban UI

**Status:** Deferred until Phase 2 complete

---

## Implementation Notes

### API Route Consistency
- All routes use consistent error handling
- All POST/PATCH routes validate with Zod schemas from @shared/schema
- All responses follow JSON format
- Proper HTTP status codes (200, 201, 204, 400, 404, 500)

### Database Strategy
- Using Drizzle ORM with PostgreSQL (Neon)
- Migrations managed by drizzle-kit
- Schema defined in shared/schema.ts (single source of truth)
- Storage interface allows future backend swaps

### Midtrans Integration Strategy
- Sandbox mode for development (MIDTRANS_IS_PRODUCTION=false)
- Signature verification is **mandatory** for webhook security
- Idempotent webhook handling prevents duplicate charges
- Down payment flow: 30% default, configurable via dpPercent

### Backward Compatibility
- Legacy portfolio and contact endpoints maintained
- Frontend still uses legacy data
- Gradual migration path available

---

## Next Steps

1. ✅ Complete Phase 1 Audit (THIS DOCUMENT)
2. ⏳ Install cuid package (Task 2) - NEXT
3. Create migrations and seed script (Tasks 3-4)
4. Implement Midtrans integration (Tasks 8-13)
5. Add validation and documentation (Tasks 7, 11, 14)
6. End-to-end testing (Task 15)
7. Begin Phase 3 (Client UI) after Phase 2 complete

---

## Risk Assessment

### High Priority Issues
1. **LSP Error:** cuid package missing blocks development
2. **No Migrations:** Database schema not applied, will cause runtime errors
3. **Missing Webhook Security:** Signature verification must be implemented
4. **No Idempotency:** Risk of duplicate payments without proper upsert logic

### Medium Priority Issues
1. Image count enforcement missing (can be added to UI later)
2. Order PATCH field restrictions could allow unintended updates
3. No development fallback if DATABASE_URL missing

### Low Priority Issues
1. Unit test coverage for helpers
2. Frontend still using legacy portfolio (planned migration)

---

*Last Updated: October 1, 2025*
*Status: Phase 1 Complete, Phase 2 In Progress*
