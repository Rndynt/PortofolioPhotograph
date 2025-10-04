# UI Quality Assurance Checklist

This checklist verifies that all UI features work correctly with **zero console errors/warnings**.

## Test Environment Setup

1. Start the development server: `npm run dev`
2. Open browser developer console (F12)
3. Clear console before each test section
4. Check for errors/warnings after each action

## Public Pages (No Admin Links)

### ✅ Homepage
- [ ] Homepage loads without errors
- [ ] Dynamic project gallery displays
- [ ] Images load correctly
- [ ] Navigation works (WORK, ABOUT, CONTACT)
- [ ] **Console is clean** (zero errors)
- [ ] `/dashboard-admin` has **NO visible link** in public navigation

### ✅ Project Detail Page
- [ ] Navigate to `/project/:slug`
- [ ] Project title and details display
- [ ] Maximum 7 images enforced
- [ ] Images display in correct order
- [ ] Back navigation works
- [ ] **Console is clean** (zero errors)

### ✅ Order Page
- [ ] Navigate to `/order`
- [ ] Order form displays
- [ ] Form validation works
- [ ] Category selection works
- [ ] Price tier selection works
- [ ] Submitting online order:
  - [ ] Midtrans Snap token generated
  - [ ] Redirect URL returned
  - [ ] **Console is clean** (zero errors)

## Admin Dashboard (Access via `/dashboard-admin`)

### Prerequisites
1. Navigate directly to `/dashboard-admin/projects`
2. Verify admin tabs visible: Projects | Pricing | Orders | Photographers | Calendar

### ✅ Projects Page
- [ ] Projects list displays
- [ ] Search filter works
- [ ] Category filter works
- [ ] Published/Unpublished filter works
- [ ] Create project dialog opens
- [ ] Slug auto-generates from title
- [ ] Edit project works
- [ ] Image management (max 7 images enforced)
- [ ] **Order badge displays** when `orderId` is set
  - [ ] Badge shows "Order #[id]" 
  - [ ] Badge is clickable (links to orders)
- [ ] Publish/Unpublish toggle works
- [ ] Delete project works (with confirmation)
- [ ] **Console is clean** (zero errors)

### ✅ Pricing Page
- [ ] Categories list displays
- [ ] Create category works
- [ ] Edit category works
- [ ] Delete category works (with confirmation)
- [ ] Price tiers list displays per category
- [ ] Create price tier works
- [ ] Edit price tier works
- [ ] Delete price tier works
- [ ] **Console is clean** (zero errors)

### ✅ Orders Page (Kanban)
- [ ] Orders kanban displays with 7 columns:
  - PENDING | CONSULTATION | SESSION | FINISHING | DRIVE_LINK | DONE | CANCELLED
- [ ] Order cards show:
  - Customer name
  - Email
  - Down payment amount
  - Category & tier
  - Payment status badge
  - **"Offline" badge** for offline orders
- [ ] Drag and drop between columns works
- [ ] Order status updates on drop
- [ ] **Console is clean** after drag/drop

### ✅ Offline Order Creation
- [ ] Click "Create Offline Order" button
- [ ] Dialog opens with form
- [ ] Form validation works (required fields)
- [ ] Select category (required)
- [ ] Select payment provider (cash | bank_transfer)
- [ ] Submit creates order **AND auto-creates project**
- [ ] Success toast appears
- [ ] Order appears in PENDING column
- [ ] **Console is clean** (zero errors)

### ✅ Order Detail Drawer
- [ ] Click any order card
- [ ] Drawer slides in from right
- [ ] Customer info displays correctly
- [ ] Payment timeline shows
- [ ] Order details complete
- [ ] Drive link field (if applicable)
- [ ] Move to next stage button works
- [ ] **Console is clean** (zero errors)

### ✅ Manual Payment Form
- [ ] In order drawer, click "Add Manual Payment"
- [ ] Dialog opens with form fields:
  - Provider (cash | bank_transfer | midtrans)
  - Status (pending | settlement | deny | expire | cancel)
  - Type (DOWN_PAYMENT | FULL_PAYMENT)
  - Amount (validated positive number)
  - Paid at (optional date)
- [ ] Form validation works
- [ ] Submit adds payment
- [ ] Payment timeline updates
- [ ] If status=settlement & order=PENDING, status advances to CONSULTATION
- [ ] Success toast appears
- [ ] **Console is clean** (zero errors)

### ✅ Session Creation & Scheduling
- [ ] In order drawer, click "Create Session"
- [ ] Session form displays:
  - Start date/time (required)
  - End date/time (required)
  - Location (optional)
  - Notes (optional)
- [ ] Form validation works
- [ ] Submit creates session
- [ ] Session appears in drawer
- [ ] Success toast appears
- [ ] **Console is clean** (zero errors)

### ✅ Photographer Assignment (409 Handling)
- [ ] Session shows "Assign Photographer" button
- [ ] Click button, dropdown shows active photographers
- [ ] Select photographer
- [ ] If NO conflict:
  - [ ] Assignment succeeds
  - [ ] Success toast: "Photographer assigned"
  - [ ] Photographer badge appears on session
- [ ] If CONFLICT (409):
  - [ ] Assignment fails
  - [ ] **Error toast: "Photographer is busy during this time"**
  - [ ] UI reverts (no assignment shown)
  - [ ] **No console errors** (handled gracefully)
- [ ] Reassign same photographer to same session:
  - [ ] Should return 409
  - [ ] Toast shows conflict message
- [ ] **Console is clean** (zero errors/warnings)

### ✅ Photographers Page
- [ ] Navigate to `/dashboard-admin/photographers`
- [ ] Photographers list displays
- [ ] Create photographer dialog opens
- [ ] Name (required) and contact (required) fields work
- [ ] Active toggle works
- [ ] Submit creates photographer
- [ ] Edit photographer works
- [ ] Toggle active/inactive inline works
- [ ] Delete photographer works (with confirmation)
- [ ] **Console is clean** (zero errors)

### ✅ Calendar Page - Navigation & Visual Indicators
- [ ] Navigate to `/dashboard-admin/calendar`
- [ ] Week view displays (Sun-Sat)
- [ ] Current day highlighted (blue circle)
- [ ] Today button returns to current week
- [ ] Previous/Next week buttons work
- [ ] Weekend shading visible (Saturday/Sunday subtle gray background)
- [ ] Now line displays (red horizontal line at current hour when viewing current week)
- [ ] Photographer filter dropdown works:
  - [ ] "All Photographers" shows all sessions
  - [ ] Individual photographer filters correctly
- [ ] Sessions display on correct days/times with status-based colors:
  - [ ] PLANNED = Blue (bg-blue-500)
  - [ ] CONFIRMED = Green (bg-green-500)
  - [ ] DONE = Gray (bg-gray-500)
  - [ ] CANCELLED = Red (bg-red-500)
- [ ] Sessions starting within 15 minutes have pulse animation
- [ ] Session blocks show: Time, Location, Photographer badges, Status
- [ ] **Console is clean** (zero errors)

### ✅ Calendar - Click to Create Session
- [ ] Click any empty time slot
- [ ] Create session dialog opens with prefilled values:
  - [ ] Date = clicked day
  - [ ] Start time = clicked hour
  - [ ] End time = start + 2 hours (editable)
- [ ] All fields available (project*, order, location, notes, status)
- [ ] Order auto-fills when project has linked order
- [ ] Submit creates session → appears on calendar with correct status color
- [ ] Keyboard: Esc closes dialog, Enter submits
- [ ] **Console is clean** (zero errors)

### ✅ Calendar - Session Details Drawer
- [ ] Click existing session block
- [ ] Sheet drawer opens from right
- [ ] Displays complete session info:
  - [ ] Project title with "View Project →" link
  - [ ] Order link "View Order →" (if applicable)
  - [ ] Start/end times
  - [ ] Location, notes, status
  - [ ] List of assigned photographers
- [ ] Navigation links work correctly (to project/order)
- [ ] Keyboard: Esc closes drawer
- [ ] **Console is clean** (zero errors)

### ✅ Calendar - Edit Session
- [ ] From session details drawer, click "Edit"
- [ ] Form opens with all values prefilled
- [ ] Can modify times, location, notes, status
- [ ] Save updates session → calendar refreshes with new data
- [ ] Cancel reverts changes → drawer returns to view mode
- [ ] **Console is clean** (zero errors)

### ✅ Calendar - Delete Session
- [ ] From session details drawer, click "Delete"
- [ ] Confirmation dialog appears
- [ ] Cancel keeps session unchanged
- [ ] Confirm deletes → session disappears from calendar
- [ ] Success toast displays
- [ ] **Console is clean** (zero errors)

### ✅ Calendar - Assign Photographer
- [ ] In session details, "Assign Photographer" dropdown shows active photographers
- [ ] Select photographer → Assignment created
- [ ] If NO conflict (409):
  - [ ] Photographer badge appears on session block
  - [ ] Success toast shows
  - [ ] Calendar refreshes automatically
- [ ] If CONFLICT (409 - photographer has overlapping session):
  - [ ] Toast shows: "Photographer busy for this time range"
  - [ ] Assignment reverted/not created
  - [ ] **No console errors** (handled gracefully)
- [ ] Remove photographer button works (per assigned photographer)
- [ ] **Console is clean** (zero errors)

### ✅ Calendar - Dismissible Helper Tips
- [ ] When no sessions exist, blue tip card displays
- [ ] Tips include click-to-create, view-details, pulse animation, filter usage
- [ ] X button dismisses card
- [ ] Dismissal persists in localStorage
- [ ] After page reload, card stays dismissed
- [ ] **Console is clean** (zero errors)

### ✅ Calendar Statistics
- [ ] "Session Statistics" card displays:
  - [ ] Sessions This Week count
  - [ ] Planned count
  - [ ] Confirmed count
  - [ ] Done count
- [ ] "Photographer Workload" card displays:
  - [ ] Each photographer's session count
  - [ ] Total hours per photographer
  - [ ] Only active photographers shown
- [ ] **Console is clean** (zero errors)

### ✅ Calendar Drag & Resize (Advanced - if implemented)
- [ ] Click and drag session block to new time
- [ ] If NO conflict:
  - [ ] Session moves
  - [ ] Success toast appears
  - [ ] Calendar refreshes
- [ ] If CONFLICT (409):
  - [ ] Move reverts
  - [ ] **Error toast: "Scheduling conflict"**
  - [ ] **Description: "Photographer has another session"**
  - [ ] **No console errors** (handled gracefully)
- [ ] Resize session (change duration):
  - [ ] Same conflict handling as drag
- [ ] **Console is clean** (zero errors/warnings)

## Integration Tests

### ✅ Order → Project Link
- [ ] Create offline order
- [ ] Navigate to Projects page
- [ ] Find auto-created project
- [ ] Verify **"Order #[id]" badge** displays
- [ ] Click badge navigates to Orders page
- [ ] **Console is clean** (zero errors)

### ✅ Order → Session → Assignment
- [ ] Create offline order (gets project)
- [ ] Open order drawer
- [ ] Create session
- [ ] Assign photographer
- [ ] Navigate to Calendar page
- [ ] Verify session appears with photographer
- [ ] **Console is clean** (zero errors)

### ✅ Conflict Reproducibility
**Setup:**
1. Create photographer "John Doe"
2. Create offline order (gets project)
3. Create session: Tomorrow 14:00-18:00
4. Assign "John Doe"

**Test A: Same session, same photographer**
1. Try to assign "John Doe" again
2. **Expected: 409 toast, no error in console**

**Test B: Overlapping session**
1. Create second session: Tomorrow 16:00-20:00 (overlaps 16:00-18:00)
2. Try to assign "John Doe"
3. **Expected: 409 toast, no error in console**

**Test C: Non-overlapping session**
1. Create third session: Tomorrow 19:00-21:00 (no overlap)
2. Assign "John Doe"
3. **Expected: Success, photographer assigned**

- [ ] All three tests pass
- [ ] **Console remains clean** throughout

## Browser Console Cleanliness

At the end of all tests, verify:
- [ ] **Zero red errors** in console
- [ ] **Zero yellow warnings** (except known React DevTools suggestion)
- [ ] All API requests return proper status codes (200, 201, 204, 409, etc.)
- [ ] No unhandled promise rejections
- [ ] No React key warnings
- [ ] No prop-types warnings

## Acceptance Criteria Summary

✅ **Pass**: All checkboxes checked, zero console errors/warnings
❌ **Fail**: Any console errors/warnings present, or features not working

## Known Acceptable Warnings
- React DevTools suggestion: "Download React DevTools" (informational only)

## Test Date & Tester
- Date: _______________
- Tester: _______________
- Result: ☐ PASS ☐ FAIL
- Notes: _______________________________________________
