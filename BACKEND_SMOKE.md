# Backend Smoke Tests

Ready-to-run curl commands to test all backend flows end-to-end.

## Prerequisites

```bash
# Set your base URL
export BASE_URL="http://localhost:5000"
# For production: export BASE_URL="https://your-domain.com"
```

## 1. Create a Category

```bash
curl -X POST "${BASE_URL}/api/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wedding Photography",
    "slug": "wedding",
    "description": "Complete wedding photography package",
    "basePrice": 5000000,
    "isActive": true,
    "sortOrder": 1
  }'
```

Expected: `201 Created` with category ID

## 2. Create a Price Tier

```bash
# Replace {CATEGORY_ID} with the ID from step 1
curl -X POST "${BASE_URL}/api/price-tiers" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "{CATEGORY_ID}",
    "name": "Premium Package",
    "price": 8000000,
    "description": "Premium wedding package with 2 photographers",
    "isActive": true,
    "sortOrder": 1
  }'
```

Expected: `201 Created` with tier ID

## 3. Create Offline Order (Auto-creates Project)

```bash
# Replace {CATEGORY_ID} with your category ID
curl -X POST "${BASE_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "{CATEGORY_ID}",
    "customerName": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "notes": "Prefer outdoor venue",
    "channel": "OFFLINE",
    "paymentProvider": "cash"
  }'
```

Expected: `201 Created` with both `orderId` and `projectId` (auto-created)

## 4. Add Manual Payment

```bash
# Replace {ORDER_ID} with the ID from step 3
curl -X POST "${BASE_URL}/api/orders/{ORDER_ID}/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "cash",
    "status": "settlement",
    "type": "DOWN_PAYMENT",
    "grossAmount": 2400000,
    "paidAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

Expected: `201 Created`, order status may auto-advance from PENDING → CONSULTATION

## 5. Create a Photographer

```bash
curl -X POST "${BASE_URL}/api/photographers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Martinez",
    "contact": "alex@photostudio.com",
    "isActive": true
  }'
```

Expected: `201 Created` with photographer ID

## 6. Create a Session

```bash
# Replace {PROJECT_ID} with the project ID from step 3
# Replace {ORDER_ID} with the order ID from step 3
curl -X POST "${BASE_URL}/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{PROJECT_ID}",
    "orderId": "{ORDER_ID}",
    "startAt": "'$(date -u -d '+3 days 14:00' +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "endAt": "'$(date -u -d '+3 days 18:00' +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "location": "Garden Park Venue",
    "notes": "Bring extra lighting equipment",
    "status": "PLANNED"
  }'
```

Expected: `201 Created` with session ID

## 7. Assign Photographer to Session

```bash
# Replace {SESSION_ID} with the ID from step 6
# Replace {PHOTOGRAPHER_ID} with the ID from step 5
curl -X POST "${BASE_URL}/api/sessions/{SESSION_ID}/assign" \
  -H "Content-Type: application/json" \
  -d '{
    "photographerId": "{PHOTOGRAPHER_ID}"
  }'
```

Expected: `201 Created` with assignment ID

## 8. Assign Same Photographer Again (Should Conflict)

```bash
# Use the same SESSION_ID and PHOTOGRAPHER_ID
curl -X POST "${BASE_URL}/api/sessions/{SESSION_ID}/assign" \
  -H "Content-Type: application/json" \
  -d '{
    "photographerId": "{PHOTOGRAPHER_ID}"
  }'
```

Expected: `409 Conflict` with message:
```json
{
  "code": "PHOTOGRAPHER_BUSY",
  "message": "Photographer is busy during this time",
  "conflict": true
}
```

## 9. Create Overlapping Session and Try to Assign

```bash
# Create another session with overlapping time
curl -X POST "${BASE_URL}/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{PROJECT_ID}",
    "startAt": "'$(date -u -d '+3 days 16:00' +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "endAt": "'$(date -u -d '+3 days 20:00' +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "location": "Different Venue",
    "status": "PLANNED"
  }'

# Then try to assign the same photographer
# Replace {NEW_SESSION_ID} with the ID from above
curl -X POST "${BASE_URL}/api/sessions/{NEW_SESSION_ID}/assign" \
  -H "Content-Type: application/json" \
  -d '{
    "photographerId": "{PHOTOGRAPHER_ID}"
  }'
```

Expected: Second request returns `409 Conflict` due to time overlap

## 10. Get All Sessions

```bash
curl "${BASE_URL}/api/sessions"
```

Expected: `200 OK` with array of sessions

## 11. Get All Session Assignments

```bash
curl "${BASE_URL}/api/session-assignments"
```

Expected: `200 OK` with array of all photographer assignments

## 12. Get Project by Order ID

```bash
# Replace {ORDER_ID} with your order ID
curl "${BASE_URL}/api/projects/by-order/{ORDER_ID}"
```

Expected: `200 OK` with the auto-created project linked to this order

## Cleanup (Optional)

```bash
# Delete photographer
curl -X DELETE "${BASE_URL}/api/photographers/{PHOTOGRAPHER_ID}"

# Delete session
curl -X DELETE "${BASE_URL}/api/sessions/{SESSION_ID}"

# Delete project
curl -X DELETE "${BASE_URL}/api/projects/{PROJECT_ID}"

# Delete order (use with caution - may cascade)
curl -X DELETE "${BASE_URL}/api/orders/{ORDER_ID}"
```

## Success Criteria

All tests should pass with:
- ✅ Offline orders auto-create projects (1:1 relationship)
- ✅ Manual payments can be added and order status advances
- ✅ Session assignment returns 409 on conflicts
- ✅ Database exclusion constraint prevents double-booking
- ✅ All GET endpoints return proper data structures
