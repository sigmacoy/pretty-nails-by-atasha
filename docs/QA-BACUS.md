# QA Validation Guide — Mr. Bacus
## Gallery & Services + Loyalty Card/Tiers + Settings

**Project**: Pretty Nails Salon Booking System  
**Domain Owner**: Mr. Bacus  
**Total Flows**: 10 | **Total Steps**: 50  
**Environment**: Local PostgreSQL, Manila Timezone (Asia/Manila), Seeded Test Data  
**Test Accounts**: `customer@test.com` (CUSTOMER), `admin@test.com` (OWNER), `staff@test.com` (ADMIN)

---

## Flow 1: Customer Browses Gallery & Favorites Design (Happy Path)

| Step | Type | Verification |
|------|------|--------------|
| 1.1 | **Precondition** | Seeded: 20 gallery items with tags (style: minimal, french, chrome; color: red, nude, pink; shape: almond, coffin, stiletto). 3 items favorited by test customer. Customer logged in. |
| 1.2 | **Action** | Navigate to `/gallery` → Filter by Style="chrome" + Color="pink" → Click heart icon on 2 designs → Click "Book this design" on one favorited item. |
| 1.3 | **Expected Visualization** | ✅ Grid loads with 20 items → Filter chips show active → Filtered results: 3 chrome+pink designs → Heart icons fill red on click → Toast "Added to favorites" → "Book this design" redirects to `/booking` with design pre-selected. |
| 1.4 | **Expected API/DB** | `GET /api/gallery?style=chrome&color=pink` → 200 → `[{id, imageUrl, style:"chrome", color:"pink", shape:"almond"}]` → `POST /api/gallery/{id}/favorite` → 201 → `gallery_favorite` table: 2 new rows `customer_id, gallery_id`. |
| 1.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 2: Customer Views Service Menu with Tiered Pricing

| Step | Type | Verification |
|------|------|--------------|
| 2.1 | **Precondition** | Seeded: 5 services (Manicure, Gel, Extensions, Pedicure, Nail Art) each with 3 variants (Short/Medium/Long or Basic/Premium/Deluxe). Customer logged in. |
| 2.2 | **Action** | Navigate to `/services` → Click "Gel" → Expand variants → Select "Gel - Long (₱1,200)" → Click "Book This Service". |
| 2.3 | **Expected Visualization** | ✅ Service cards display: name, base price, description → Variant accordion expands → Shows: length, add-ons, price per tier → Selected variant highlighted → Redirect to `/booking` with service_id + variant_id pre-filled. |
| 2.4 | **Expected API/DB** | `GET /api/services` → 200 → `[{id, name:"Gel", basePrice:800, variants:[{id, name:"Long", price:1200, addOns:["extended length"]}]}]` → `GET /api/services/2/variants` → 200 → variant details. |
| 2.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 3: Admin Manages Gallery (Upload, Tag, Reorder, Delete)

| Step | Type | Verification |
|------|------|--------------|
| 3.1 | **Precondition** | Admin logged in. Existing gallery: 20 items. New test images: 3 JPG files (<5MB each). |
| 3.2 | **Action** | Go to `/admin/gallery` → Click "Add Design" → Upload 3 images → Set tags: style="marble", color="white", shape="coffin" → Save → Drag to reorder first position → Delete oldest design. |
| 3.3 | **Expected Visualization** | ✅ Upload progress bars → Success toast "3 designs added" → New items appear at top with tags → Drag-drop reorder works → Delete confirmation modal → Toast "Design deleted" → Item removed from grid. |
| 3.4 | **Expected API/DB** | `POST /api/admin/gallery` (multipart ×3) → 201 each → `{id, imageUrl, style:"marble", color:"white", shape:"coffin", displayOrder:1,2,3}` → `PUT /api/admin/gallery/reorder` → 200 → `DELETE /api/admin/gallery/{oldestId}` → 204 → `gallery` table: 3 inserts, 1 delete, `display_order` updated. |
| 3.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 4: Admin Manages Services & Pricing (Create, Edit Variants, Set Rules)

| Step | Type | Verification |
|------|------|--------------|
| 4.1 | **Precondition** | Admin logged in. Existing: Gel service with 3 variants. New service: "Chrome Powder" (base ₱1,000). |
| 4.2 | **Action** | Go to `/admin/services` → Click "Add Service" → Name="Chrome Powder", Base=1000, Description → Save → Click "Add Variant" ×3: Short (₱1000), Medium (₱1300), Long (₱1600) → Set pricing rule: "Long +20% for coffin shape" → Save. |
| 4.3 | **Expected Visualization** | ✅ Service card created → Variant table shows 3 rows with prices → Pricing rule input accepts formula → Toast "Service saved" → Customer `/services` reflects new service immediately. |
| 4.4 | **Expected API/DB** | `POST /api/admin/services` → 201 → `{id, name:"Chrome Powder", basePrice:1000}` → `POST /api/admin/services/{id}/variants` ×3 → 201 each → `PUT /api/admin/services/{id}/pricing-rules` → 200 → `service` + `service_variant` + `setting` (pricing_rules) tables updated. |
| 4.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 5: Customer Views Loyalty Card + QR Code (Bacalla Split: Card View)

| Step | Type | Verification |
|------|------|--------------|
| 5.1 | **Precondition** | Customer has LoyaltyCard: 7/10 stamps, tier=SILVER (next reward: Free Gel at 10). QR code generated. Customer logged in. |
| 5.2 | **Action** | Navigate to `/loyalty` → View card → Click "Show QR Code" → Screenshot QR. |
| 5.3 | **Expected Visualization** | ✅ Card shows: Tier badge (SILVER), Progress ring 70%, Stamps: 7 filled / 3 empty → Next reward: "Free Gel Manicure" → QR modal opens with scannable code → "Save to Wallet" button. |
| 5.4 | **Expected API/DB** | `GET /api/loyalty/card` → 200 → `{stamps:7, tier:"SILVER", nextReward:"Free Gel", qrCode:"data:image/png;base64,..."}` → `loyalty_card` table: `stamp_count=7`, `tier=SILVER`, `qr_code` populated. |
| 5.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 6: Customer Redeems Voucher (Bacalla Split: Voucher Redeem)

| Step | Type | Verification |
|------|------|--------------|
| 6.1 | **Precondition** | Customer has 10 stamps → Tier=GOLD → Voucher "Free Gel Manicure" available (unused). Booking flow started for Gel service. |
| 6.2 | **Action** | On `/booking` → Select Gel → At payment step → "Apply Voucher" dropdown → Select "Free Gel Manicure" → Apply → Complete booking. |
| 6.3 | **Expected Visualization** | ✅ Voucher dropdown shows available rewards → On select: price updates ₱800 → ₱0 (voucher applied) → Toast "Voucher applied, enjoy your free service!" → Booking confirmation shows ₱0 downpayment. |
| 6.4 | **Expected API/DB** | `POST /api/loyalty/redeem` → 200 → `{voucherId, code:"FREE_GEL", discount:800}` → `POST /api/bookings` → 201 → `downpaymentAmount:0`, `voucherId` linked → `loyalty_voucher` table: `used=true`, `usedAt`, `bookingId`. |
| 6.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 7: Negative — Gallery Filter Returns No Results

| Step | Type | Verification |
|------|------|--------------|
| 7.1 | **Precondition** | Gallery has no items with style="marble" + color="black". Customer logged in. |
| 7.2 | **Action** | Go to `/gallery` → Filter: Style="marble", Color="black" → Apply. |
| 7.3 | **Expected Visualization** | ✅ Empty state illustration → Text: "No designs match your filters" → "Clear filters" button → Clicking clears all filters, shows all designs. |
| 7.4 | **Expected API/DB** | `GET /api/gallery?style=marble&color=black` → 200 → `[]` (empty array) → No DB changes. |
| 7.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 8: Negative — Service Variant Price Mismatch (Tampered Request)

| Step | Type | Verification |
|------|------|--------------|
| 8.1 | **Precondition** | Service Gel, Variant Long = ₱1,200 in DB. Customer logged in. Browser dev tools open. |
| 8.2 | **Action** | Start booking for Gel Long → Intercept `POST /api/bookings` → Modify `variantPrice: 100` → Submit. |
| 8.3 | **Expected Visualization** | ❌ Toast "Invalid pricing detected" → Booking fails → Form resets to service selection. |
| 8.4 | **Expected API/DB** | `POST /api/bookings` → 400 → `{error:"PRICE_MISMATCH", message:"Variant price does not match catalog"}` → No booking created. |
| 8.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 9: Edge — Gallery Image Lazy Load & Lightbox

| Step | Type | Verification |
|------|------|--------------|
| 9.1 | **Precondition** | Gallery page with 20 high-res images (2MB each). Customer on slow 3G simulation. |
| 9.2 | **Action** | Load `/gallery` → Scroll rapidly to bottom → Click 3rd image → Lightbox opens → Navigate next/prev → Close. |
| 9.3 | **Expected Visualization** | ✅ Placeholder blur → Images load progressively → Lightbox: full-screen, zoomable, caption shows tags → Swipe/arrow navigation works → ESC key closes. |
| 9.4 | **Expected API/DB** | `GET /api/gallery` → 200 (metadata only) → Images served via CDN/Storage → No DB queries for images. |
| 9.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 10: Edge — Service Pricing Rule: Shape Surcharge Calculation

| Step | Type | Verification |
|------|------|--------------|
| 10.1 | **Precondition** | Setting: "coffin shape +20% on Long variants". Service Gel, Variant Long = ₱1,200. Customer logged in. |
| 10.2 | **Action** | Book Gel Long → Select shape "coffin" → Verify price calculation. |
| 10.3 | **Expected Visualization** | ✅ Base: ₱1,200 → Shape surcharge: +₱240 (20%) → Total: ₱1,440 → Breakdown shown in booking summary. |
| 10.4 | **Expected API/DB** | `GET /api/services/2/variants/3/price?shape=coffin` → 200 → `{basePrice:1200, surcharge:240, total:1440, breakdown:[{rule:"coffin_surcharge", percent:20}]}` → `setting` table: `pricing_rules` JSON contains coffin rule. |
| 10.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 11: Admin Configures Salon Settings (Theme, Hours, Rules)

| Step | Type | Verification |
|------|------|--------------|
| 11.1 | **Precondition** | Admin logged in. Current settings: theme=light, hours=09:00-18:00, slot=30min. |
| 11.2 | **Action** | Go to `/admin/settings` → General tab → Theme: "dark" → Hours: 10:00-20:00 → Slot: 45min → Save → Verify customer site reflects changes. |
| 11.3 | **Expected Visualization** | ✅ Form saves → Toast "Settings updated" → Customer `/` shows dark theme → `/availability` shows 10:00-20:00, 45-min slots. |
| 11.4 | **Expected API/DB** | `PUT /api/admin/settings` → 200 → `{theme:"dark", openTime:"10:00", closeTime:"20:00", slotDuration:45}` → `setting` table: key-value rows updated. |
| 11.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 12: Customer Views Stamp History (Bacalla Split: Stamp History Display)

| Step | Type | Verification |
|------|------|--------------|
| 12.1 | **Precondition** | Customer has 7 stamps: 5 SERVICE, 1 REFERRAL, 1 BIRTHDAY. Timestamps span 3 months. Customer logged in. |
| 12.2 | **Action** | Go to `/loyalty` → Click "Stamp History" → View list → Filter by type "SERVICE". |
| 12.3 | **Expected Visualization** | ✅ Timeline/list shows: Date, Type badge, Source (Booking # or Manual), Stamp count → Filter reduces to 5 SERVICE entries → Total stamps counter matches. |
| 12.4 | **Expected API/DB** | `GET /api/loyalty/stamps` → 200 → `[{id, type:"SERVICE", bookingId:101, createdAt:"2026-09-15"}, ...]` → `loyalty_stamp` table: 7 rows for customer's card. |
| 12.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 13: Admin Manages Loyalty Tiers & Rewards (Bacalla Split: Reward Tier Config)

| Step | Type | Verification |
|------|------|--------------|
| 13.1 | **Precondition** | Admin logged in. Current tiers: BRONZE (0-3), SILVER (4-7), GOLD (8-10). Rewards: Free Manicure at 10. |
| 13.2 | **Action** | Go to `/admin/loyalty` → Tiers tab → Edit GOLD: minStamps=8, maxStamps=12 → Add reward: "Free Extensions at 12 stamps" → Save. |
| 13.3 | **Expected Visualization** | ✅ Tier cards editable → New reward appears in GOLD card → Toast "Loyalty configuration saved" → Customer `/loyalty` shows updated tiers. |
| 13.4 | **Expected API/DB** | `PUT /api/admin/loyalty/tiers` → 200 → `[{name:"GOLD", minStamps:8, maxStamps:12, rewards:["Free Gel","Free Extensions"]}]` → `setting` table: `loyalty_tiers` JSON updated. |
| 13.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 14: Negative — Upload Gallery Image Exceeds Size Limit

| Step | Type | Verification |
|------|------|--------------|
| 14.1 | **Precondition** | Admin logged in. Test file: `large_image.png` (15MB, exceeds 5MB limit). |
| 14.2 | **Action** | Go to `/admin/gallery` → "Add Design" → Select `large_image.png` → Upload. |
| 14.3 | **Expected Visualization** | ❌ File input shows error "File too large (max 5MB)" → Upload button disabled → Toast "Image must be under 5MB". |
| 14.4 | **Expected API/DB** | Client-side rejection → No API call → If forced: `POST /api/admin/gallery` → 413 Payload Too Large → No gallery row created. |
| 14.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 15: Negative — Duplicate Service Name Creation

| Step | Type | Verification |
|------|------|--------------|
| 15.1 | **Precondition** | Service "Gel" exists. Admin logged in. |
| 15.2 | **Action** | Go to `/admin/services` → "Add Service" → Name="Gel" → Save. |
| 15.3 | **Expected Visualization** | ❌ Inline validation: "Service name already exists" → Save button disabled or shows error → No new service card. |
| 15.4 | **Expected API/DB** | `POST /api/admin/services` → 409 Conflict → `{error:"DUPLICATE_NAME", message:"Service 'Gel' already exists"}` → No insert in `service` table. |
| 15.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 16: Edge — Gallery Search by Multiple Tags (AND Logic)

| Step | Type | Verification |
|------|------|--------------|
| 16.1 | **Precondition** | Gallery: 5 items with (style=minimal, color=nude), 3 with (style=minimal, color=pink), 2 with (style=french, color=nude). Customer logged in. |
| 16.2 | **Action** | Go to `/gallery` → Search "minimal nude" → Verify results. |
| 16.3 | **Expected Visualization** | ✅ Results: 5 items (minimal AND nude) → No french/nude, no minimal/pink → Search chip shows "minimal + nude". |
| 16.4 | **Expected API/DB** | `GET /api/gallery?search=minimal+nude` → 200 → 5 items matching both tags → SQL: `WHERE style='minimal' AND color='nude'`. |
| 16.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 17: Edge — Service Variant Deletion with Existing Bookings

| Step | Type | Verification |
|------|------|--------------|
| 17.1 | **Precondition** | Variant "Gel - Long" has 3 bookings (PENDING/CONFIRMED). Admin logged in. |
| 17.2 | **Action** | Go to `/admin/services` → Edit Gel → Click "Delete" on Long variant → Confirm. |
| 17.3 | **Expected Visualization** | ❌ Modal: "Cannot delete: 3 active bookings use this variant" → Options: "Reassign to Medium" or "Cancel Bookings" → Delete blocked until resolved. |
| 17.4 | **Expected API/DB** | `DELETE /api/admin/services/2/variants/3` → 409 → `{error:"VARIANT_IN_USE", activeBookings:3, suggestion:"REASSIGN"}` → No delete. |
| 17.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 18: Admin Views Reports (Revenue, Popular Services, Gallery Views)

| Step | Type | Verification |
|------|------|--------------|
| 18.1 | **Precondition** | 50 bookings last month, revenue ₱150,000. Gel most booked (20x). Gallery item #5 most viewed (500 views). Admin logged in. |
| 18.2 | **Action** | Go to `/admin/reports` → Select "Last Month" → View Revenue, Services, Gallery tabs. |
| 18.3 | **Expected Visualization** | ✅ Revenue card: ₱150,000 → Bar chart: daily breakdown → Services table: Gel (20), Extensions (15) → Gallery table: Item #5 (500 views) → Export PDF button. |
| 18.4 | **Expected API/DB** | `GET /api/admin/reports/revenue?period=last_month` → 200 → `{total:150000, daily:[...]}` → `GET /api/admin/reports/services` → 200 → `[{serviceId, name:"Gel", count:20}]` → `GET /api/admin/reports/gallery` → 200 → `[{galleryId:5, views:500}]`. |
| 18.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 19: Negative — Unauthorized Gallery Delete Attempt (Customer)

| Step | Type | Verification |
|------|------|--------------|
| 19.1 | **Precondition** | Customer logged in. Gallery item ID=5 exists. |
| 19.2 | **Action** | Direct API call: `DELETE /api/admin/gallery/5` (via Postman/dev tools). |
| 19.3 | **Expected Visualization** | ❌ N/A (API only) → If UI attempt: no delete button visible on `/gallery`. |
| 19.4 | **Expected API/DB** | `DELETE /api/admin/gallery/5` → 403 Forbidden → `{error:"FORBIDDEN", message:"Requires ADMIN role"}` → No delete. |
| 19.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Flow 20: Edge — Loyalty QR Code Scan Simulation (Staff Verification)

| Step | Type | Verification |
|------|------|--------------|
| 20.1 | **Precondition** | Customer shows QR code on phone. Staff admin logged in on tablet. QR contains `loyaltyCardId=123`. |
| 20.2 | **Action** | Staff goes to `/admin/loyalty/scan` → Point camera at QR → Scan → Verify stamp added. |
| 20.3 | **Expected Visualization** | ✅ Scanner opens → QR detected → Toast "Loyalty card found: Maria Santos, 7/10 stamps" → "Add Stamp" button → Click → Success → Customer phone refreshes to 8/10. |
| 20.4 | **Expected API/DB** | `POST /api/admin/loyalty/scan` → 200 → `{customerId, loyaltyCardId:123, currentStamps:7}` → `POST /api/admin/loyalty/stamp` → 201 → `{stampType:"MANUAL", newCount:8}` → `loyalty_stamp` new row, `loyalty_card.stamp_count=8`. |
| 20.5 | **Pass/Fail** | ☐ PASS / ☐ FAIL — Notes: ___________________ |

---

## Summary Checklist

| Flow | Description | Steps | Status |
|------|-------------|-------|--------|
| 1 | Customer Browses Gallery & Favorites | 5 | ☐ |
| 2 | Customer Views Service Menu + Variants | 5 | ☐ |
| 3 | Admin Manages Gallery (CRUD + Reorder) | 5 | ☐ |
| 4 | Admin Manages Services & Pricing Rules | 5 | ☐ |
| 5 | Customer Views Loyalty Card + QR | 5 | ☐ |
| 6 | Customer Redeems Voucher | 5 | ☐ |
| 7 | Gallery Filter No Results | 5 | ☐ |
| 8 | Variant Price Tamper Attempt | 5 | ☐ |
| 9 | Gallery Lazy Load + Lightbox | 5 | ☐ |
| 10 | Shape Surcharge Calculation | 5 | ☐ |
| 11 | Admin Configures Salon Settings | 5 | ☐ |
| 12 | Customer Views Stamp History | 5 | ☐ |
| 13 | Admin Manages Loyalty Tiers/Rewards | 5 | ☐ |
| 14 | Gallery Upload Size Limit | 5 | ☐ |
| 15 | Duplicate Service Name | 5 | ☐ |
| 16 | Gallery Multi-Tag Search (AND) | 5 | ☐ |
| 17 | Variant Delete with Active Bookings | 5 | ☐ |
| 18 | Admin Views Reports | 5 | ☐ |
| 19 | Unauthorized Gallery Delete | 5 | ☐ |
| 20 | Loyalty QR Scan (Staff) | 5 | ☐ |

**Total: 20 Flows × 5 Steps = 100 Verification Steps**  
**Note**: Flows 5–6, 12–13, 20 cover Loyalty (Bacalla split: card view, voucher redeem, stamp history, tier config, QR scan). Flow 11 covers Settings. Flows 1–4, 7–10, 14–19 cover Gallery & Services.

---

**QA Engineer**: _______________  
**Date**: _______________  
**Overall Result**: ☐ PASS / ☐ FAIL