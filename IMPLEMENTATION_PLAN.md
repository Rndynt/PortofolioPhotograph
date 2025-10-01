# Implementation Plan - Phase 3: UI & Wiring

## Status Board

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Database Schema & Migrations |
| Phase 2 | ✅ Complete | Backend API Endpoints & Payment Integration |
| Phase 3 | 🟡 85% Complete | UI Implementation & Wiring |

Last Updated: October 1, 2025

## Duplication Log

**✅ NO DUPLICATIONS FOUND**

The codebase maintains clean architecture with no duplication:

| Category | Status | Details |
|----------|--------|---------|
| API Entry Point | ✅ Clean | Single `fetch` wrapper in `client/src/lib/queryClient.ts` |
| Schema Module | ✅ Clean | Shared module at `shared/schema.ts` used by both frontend and backend |
| Routes | ✅ Clean | No duplicate route implementations detected |
| Validators | ✅ Clean | Zod schemas defined once in shared/schema.ts, reused everywhere |
| UI State Management | ✅ Clean | Consistent TanStack Query usage across all components |

---

## Task List - Phase 3 UI Implementation

### HOME PAGE (public `/`) - Dynamic Data Integration

#### ✅ Show project details on home page [Partially Implemented - Needs Minor Fix]
- **Files**: 
  - `client/src/components/portfolio-gallery.tsx` (lines 17-47)
  - `client/src/pages/home.tsx` (imports static data)
- **Status**: Gallery component correctly fetches from API with `published=true` filter
- **Issue**: Home page still imports unused `portfolio-data.ts` file
- **Solution**: Remove the import statement (non-functional issue, visual cleanup)
- **Features Working**:
  - ✅ Fetches published projects from `/api/projects?published=true`
  - ✅ Filters by category (via getCategorySlug mapping)
  - ✅ Displays project grid with mainImageUrl as thumbnail
  - ✅ Navigation to `/project/:slug` on click (via lightbox)
  - ✅ Loading states and error handling
  - ✅ All test-ids in place (`skeleton-project-${i}`, `error-loading-projects`)

#### ❌ Show package prices on home page [Missing - Implementation Required]
- **Required Component**: New pricing/packages section
- **Data Source**: GET `/api/categories?active=true` + nested tiers
- **Requirements**:
  - Display active categories with their basePrice
  - Show price tiers if available for each category
  - Each card/button routes to `/order?category=<id>&tier=<id?>`
  - IDR currency formatting
  - Responsive card grid layout matching design
- **Suggested Location**: Between `<PortfolioGallery>` and `<AboutSection>` in home.tsx
- **Test IDs Required**: `card-package-${categoryId}`, `button-book-${categoryId}`

---

### PROJECT DETAIL PAGE (public `/project/:slug`)

#### ✅ Create page for project with images [Fully Implemented]
- **File**: `client/src/pages/project-detail.tsx` (207 lines)
- **Status**: Complete and production-ready
- **Features**:
  - ✅ Fetches project by slug via `/api/projects/${slug}`
  - ✅ Fetches category and images with proper loading states
  - ✅ Displays mainImageUrl prominently
  - ✅ Shows up to 7 additional images in grid (sorted by sortOrder)
  - ✅ Metadata display: category name, clientName, happenedAt (Indonesian locale)
  - ✅ Lightbox integration for fullscreen image viewing
  - ✅ 404 handling with user-friendly alert
  - ✅ Back navigation to gallery
  - ✅ All test-ids in place:
    - `error-loading-project`, `project-not-found`
    - `link-back-home`, `text-project-title`
    - `text-category`, `text-client`, `text-date`
    - `image-main`, `image-additional-${index}`

---

### ORDER FLOW (public `/order`)

#### ✅ Create order form and payment page [Fully Implemented]
- **File**: `client/src/pages/order.tsx` (400 lines)
- **Status**: Complete with full Midtrans Snap integration
- **Form Fields** (all validated with Zod):
  - ✅ categoryId (required) - Dropdown with active categories
  - ✅ priceTierId (optional) - Dynamic dropdown based on selected category
  - ✅ customerName (required)
  - ✅ email (required, email validation)
  - ✅ phone (required)
  - ✅ notes (optional, textarea)
- **Payment Flow**:
  - ✅ POST `/api/orders` creates order and receives `{ orderId, snapToken, redirect_url }`
  - ✅ Loads Snap JS from `https://app.sandbox.midtrans.com/snap/snap.js`
  - ✅ Uses `import.meta.env.VITE_MIDTRANS_CLIENT_KEY` for data-client-key
  - ✅ Opens Snap popup with callbacks: onSuccess, onPending, onError, onClose
  - ✅ Fallback to redirect_url if Snap not loaded
- **Price Display**:
  - ✅ Shows total price (tier or base price)
  - ✅ Shows 30% down payment amount
  - ✅ IDR currency formatting
- **Result Pages**:
  - ✅ Success page with confirmation message
  - ✅ Pending page with instructions
  - ✅ Error toast notifications
- **Test IDs**:
  - `select-category`, `option-category-${slug}`
  - `select-tier`, `option-tier-${id}`, `option-tier-base`
  - `input-name`, `input-email`, `input-phone`, `input-notes`
  - `alert-price-summary`, `text-total-price`, `text-dp-amount`
  - `button-submit-order`
  - `card-payment-success`, `card-payment-pending`, `button-back-home`

---

### ADMIN DASHBOARD (private `/dashboard-admin`)

#### ✅ Create admin dashboard without navigation exposure [Fully Implemented]
- **Files**: 
  - `client/src/App.tsx` (lines 20-26) - Route configuration
  - `client/src/pages/admin/layout.tsx` - Admin layout with sidebar
- **Navigation Check**: 
  - ✅ Verified NO link in `client/src/components/navigation.tsx`
  - ✅ No sitemap or footer links found
  - ✅ Routes accessible only via direct URL entry
- **Layout Features**:
  - Sidebar navigation between admin sections
  - TooltipProvider integration
  - Consistent styling with shadcn/ui

#### ✅ Build admin tool for project management [Fully Implemented]
- **File**: `client/src/pages/admin/projects.tsx` (600 lines)
- **Status**: Full CRUD with advanced features
- **List View**:
  - ✅ Search filter (title, clientName)
  - ✅ Category filter dropdown
  - ✅ Published status filter (all/published/unpublished)
  - ✅ Table display with all project details
- **Form Features**:
  - ✅ Title field with auto-slug generation
  - ✅ Slug field (editable, auto-generated from title)
  - ✅ Category dropdown (linked to categories API)
  - ✅ Client name (optional)
  - ✅ Happened at date picker
  - ✅ Main image URL input
  - ✅ Is Published toggle switch
  - ✅ Drive link field
- **Image Manager**:
  - ✅ Shows current project images with sortOrder
  - ✅ Add new image with URL and caption
  - ✅ **7 image limit enforced in UI** - displays remaining slots
  - ✅ Delete images with confirmation
  - ✅ Reorder images (sortOrder control)
- **Actions**:
  - ✅ Create new project
  - ✅ Edit existing project
  - ✅ Delete with confirmation dialog
  - ✅ Publish/unpublish toggle
- **Preview**:
  - ✅ Live preview card showing mainImageUrl
- **All test-ids in place**

#### ✅ Build admin tool for pricing management [Fully Implemented]
- **File**: `client/src/pages/admin/pricing.tsx` (725 lines)
- **Status**: Full CRUD for categories and tiers
- **Categories Management**:
  - ✅ Table with name, slug, basePrice (IDR format), isActive, sortOrder
  - ✅ Create/Edit dialog with form validation
  - ✅ Auto-slug generation from name (editable)
  - ✅ Base price input with IDR formatting
  - ✅ Is Active toggle
  - ✅ Sort order numeric input
  - ✅ Description textarea (optional)
  - ✅ Delete with confirmation
- **Price Tiers Management**:
  - ✅ Drill-down view per category
  - ✅ Table showing tier name, price (IDR), description, status
  - ✅ Create/Edit tier dialog
  - ✅ Category association (FK validation)
  - ✅ Tier name, price, description fields
  - ✅ Is Active toggle
  - ✅ Sort order control
  - ✅ Delete with confirmation
- **Features**:
  - ✅ IDR currency formatting helper (formatIDR)
  - ✅ Proper form validation with Zod
  - ✅ Toast notifications for all actions
  - ✅ All test-ids in place

#### ✅ Build admin order tracking board [Fully Implemented]
- **File**: `client/src/pages/admin/orders.tsx` (456 lines)
- **Status**: Full Kanban with drag-and-drop
- **Kanban Board**:
  - ✅ 7 status columns: PENDING, CONSULTATION, SESSION, FINISHING, DRIVE_LINK, DONE, CANCELLED
  - ✅ @dnd-kit/core for drag-and-drop functionality
  - ✅ @dnd-kit/sortable for sortable items
  - ✅ Drag order card to new column → PATCH `/api/orders/:id` with `{ status }`
  - ✅ Visual feedback during drag (opacity, transitions)
- **Order Cards**:
  - ✅ Customer name
  - ✅ Email
  - ✅ Down payment amount (IDR formatted)
  - ✅ Category and tier name
  - ✅ Payment status badge (color-coded)
  - ✅ Created date
  - ✅ Test ID: `order-card-${orderId}`
- **Detail Sheet/Drawer**:
  - ✅ Opens on card click
  - ✅ Customer info section with mailto/tel links
  - ✅ Package summary (category, tier if selected)
  - ✅ Price breakdown (total, DP %, DP amount)
  - ✅ Payment timeline: Fetches from `/api/orders/:id/payments`
    - Shows transaction ID, status, amount, paid date
    - Color-coded status badges
  - ✅ Quick actions:
    - Copy order ID
    - Copy customer email
    - Copy payment link (if available)
  - ✅ Set Drive Link action (enabled at DRIVE_LINK stage)
    - Input field + Save button
    - Updates via PATCH `/api/orders/:id` with `{ driveLink }`
  - ✅ Manual status change dropdown (for edge cases)
- **Features**:
  - ✅ Real-time updates via TanStack Query invalidation
  - ✅ Optimistic UI updates
  - ✅ Error handling with toast notifications
  - ✅ All test-ids in place

---

### DOCUMENTATION

#### ❌ Update FEATURES_OVERVIEW.md [Missing - To Be Created]
- **Required Content**:
  - UI route map (`/`, `/project/:slug`, `/order`, `/dashboard-admin/*`)
  - Data flow diagrams (API → UI component → render)
  - How UI consumes backend endpoints
  - Component hierarchy
  - State management strategy (TanStack Query)
  - File structure explanation

#### ❌ Update README.md [Missing - To Be Updated]
- **Required Additions**:
  - Environment variables section:
    - `VITE_MIDTRANS_CLIENT_KEY` for client-side Snap integration
    - `MIDTRANS_SERVER_KEY` for backend (already exists, needs documentation)
    - `DATABASE_URL` for PostgreSQL
  - Local development setup instructions:
    1. Clone repository
    2. Install dependencies: `npm install`
    3. Create `.env` file with required variables
    4. Push database schema: `npm run db:push`
    5. (Optional) Seed database: `npx tsx scripts/seed.ts`
    6. Start dev server: `npm run dev`
  - E2E testing steps (see UI_QA_CHECKLIST.md)
  - Deployment instructions for Netlify and Replit

#### ❌ Create UI_QA_CHECKLIST.md [Missing - To Be Created]
- **Required Manual Test Steps**:
  1. Home page shows dynamic projects from DB (check with seed data)
  2. Home page shows dynamic packages with prices
  3. Click project card → navigates to detail page
  4. Detail page shows up to 7 images
  5. `/order` form validation works
  6. `/order` creates order and opens Midtrans Snap popup
  7. Simulate sandbox payment → verify webhook updates order/payment
  8. Admin Projects: create/edit/delete/publish workflows
  9. Admin Projects: image manager blocks 8th image
  10. Admin Pricing: create category + tier → appears on home packages
  11. Admin Orders: drag order across all statuses
  12. Admin Orders: set driveLink at DRIVE_LINK stage
  13. Verify NO header/nav link to `/dashboard-admin`
  14. Test responsive layouts (mobile, tablet, desktop)
  15. Test error states (network failures, 404s)

---

## Environment Variables

### Backend (Already Configured)
- ✅ `DATABASE_URL` - PostgreSQL connection string (Replit provisioned)
- ⚠️ `MIDTRANS_SERVER_KEY` - Required for order creation (user must provide)
- ⚠️ `MIDTRANS_CLIENT_KEY` - Required for Snap (user must provide)

### Frontend (Required Setup)
- ❌ `VITE_MIDTRANS_CLIENT_KEY` - Must be added to `.env` for Snap JS
  - **Current Implementation**: `import.meta.env.VITE_MIDTRANS_CLIENT_KEY` in order.tsx line 93
  - **Action Required**: Create `.env.example` file documenting this variable

---

## Netlify Configuration

✅ **VERIFIED**: `netlify.toml` has correct `/api/*` redirect
- **File**: `netlify.toml` (lines 14-17)
- **Redirect**: `/api/*` → `/.netlify/functions/api/:splat` with status 200
- **SPA Fallback**: All other routes → `/index.html` for client-side routing

---

## Remaining Implementation Tasks

### High Priority
1. ✅ ~~Audit complete codebase~~ - DONE
2. ✅ ~~Create IMPLEMENTATION_PLAN.md~~ - DONE (this file)
3. 🔄 Add pricing/packages section to home page - **REQUIRED**
4. 🔄 Create `.env.example` file - **REQUIRED**
5. 🔄 Create FEATURES_OVERVIEW.md - **REQUIRED**
6. 🔄 Create UI_QA_CHECKLIST.md - **REQUIRED**
7. 🔄 Update README.md with env vars and setup instructions - **REQUIRED**

### Low Priority (Nice to Have)
8. ⭕ Remove unused `client/src/lib/portfolio-data.ts` import from home.tsx - CLEANUP
9. ⭕ Create seed script documentation if not exists
10. ⭕ Add TypeScript strict mode enforcement
11. ⭕ Add error boundaries to admin pages

---

## Implementation Progress

**Overall: 85% Complete**

| Component | Progress | Status |
|-----------|----------|--------|
| Backend API (Phase 2) | 100% | ✅ Complete |
| Project Detail Page | 100% | ✅ Complete |
| Order Flow + Midtrans | 100% | ✅ Complete |
| Admin Dashboard Structure | 100% | ✅ Complete |
| Admin Projects Management | 100% | ✅ Complete |
| Admin Pricing Management | 100% | ✅ Complete |
| Admin Orders Kanban | 100% | ✅ Complete |
| Home Page - Projects | 95% | 🟡 Minor cleanup |
| Home Page - Pricing Section | 0% | ❌ Not started |
| Documentation | 0% | ❌ Not started |
| Environment Setup | 50% | 🟡 Partial |

---

## Definition of Done (Phase 3)

- [x] IMPLEMENTATION_PLAN.md accurately reflects verification results
- [x] Home page (`/`) uses dynamic data for projects
- [ ] Home page shows packages/pricing section with links to `/order`
- [x] `/project/:slug` works with up to 7 images
- [x] `/order` form opens Midtrans Snap and handles all payment states
- [x] `/dashboard-admin` exists and is functional (Projects, Pricing, Orders)
- [x] Admin dashboard remains unlinked from public navigation
- [x] No duplicated schemas/routes/validators/UI modules
- [x] Single `/api` entry point retained
- [ ] FEATURES_OVERVIEW.md created
- [ ] README.md updated
- [ ] UI_QA_CHECKLIST.md created
- [ ] `.env.example` created
- [x] All test-ids in place for E2E testing

---

*Last Updated: October 1, 2025*
*Current Status: Phase 3 - 85% Complete, Ready for Final Implementation*
