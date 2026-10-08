# Business decisions

Source of truth for business rules that are **not** derivable from code. Technical decisions live in `docs/ADR/`.
Owner: Nurlan. Everything marked **open** is a `TODO(nurlan)` placeholder in code and must not be invented.

## Decided (spec v2, 2026-10-08)

| # | Decision | Value | Where in code |
|---|---|---|---|
| D1 | Concrete prices (per m³, excl. VAT) | M100 90 ₼ … M600 140 ₼, +5 ₼ per 50 step (spec §4) | `prisma/seed.ts` (Phase 1) |
| D2 | VAT | 18 %, prices stored excl. VAT, VAT added at the end | `settings.vatRate`, `modules/pricing` |
| D3 | Delivery fee | Included in price for all of Baku + Absheron | `settings.deliveryIncluded = true`, `deliveryFee = 0` |
| D4 | Service area | Baku + Absheron polygon, used **only** for validation | `ServiceArea` |
| D5 | Mixer capacities | 8, 10, 12 m³ | `Truck.capacityM3` |
| D6 | Slump options | P2, P3, P4 | `Product.slumpOptions` |
| D7 | Concrete lifetime | 90 min from `departedAt`, warning at 75 min | `settings.concreteLifetimeMin` |
| D8 | Payment | Cash / bank transfer / credit note only, no online card | `PaymentMethod` |
| D9 | GPS source in MVP | Driver's phone (background location) | spec §9 |
| D10 | Auth | Customer & driver: phone + SMS OTP; staff: email + password | `auth` module |
| D11 | Supplier contact | Novxanı şossesi, Bakı · +994 50 620 95 84 · info@novxanibeton.az · novxanibeton.az · 24/7 | `prisma/seed.ts` only |
| D12 | Working hours | 24/7, night slots allowed | `settings.workingHours` |
| D13 | Brand (temporary) | CONCR, scheme `concr://`, bundle id `az.concr.app` | `apps/mobile/app.config.ts` |

## Open questions (spec §22) — placeholders in code until answered

| # | Question | Assumption used now | Status |
|---|---|---|---|
| Q1 | Minimum order volume? Earliest delivery (lead time) in hours? | 3 m³ · 6 h | open |
| Q2 | Pump boom lengths besides 24 m; price model (per order / per m³ / per hour)? | 24 m only, price unknown | open |
| Q3 | Number of mixers per capacity and plate numbers; number of drivers; their phones (Android/iPhone)? | 2×8, 2×10, 2×12, 1 pump, 3 drivers, placeholder plates | open |
| Q4 | Do trucks already have a GPS tracker (which vendor)? | No; `TrackingSource = PHONE` | open |
| Q5 | Cancellation rules and demurrage (waiting) fee? | cancel cutoff 12 h, no demurrage | open |
| Q6 | Company customers (VÖEN, credit limit, monthly invoice) needed in MVP? | fields exist, no flow | open |
| Q7 | Sample of the paper delivery act (photo) for the PDF template | none | open |
| Q8 | Apple Developer ($99/yr) and Google Play ($25) accounts | needed in Phase 2 for iOS dev build | open |
| Q9 | Google Maps Platform billing account | needed in Phase 2 | open |
| Q10 | Domain (`concr.az`?) and VPS provider | Hetzner assumed | open |
| Q11 | Logo / colours: continue with site graphite `#12161F`? Accent `#F5A623`? | yes / yes | open |
| Q12 | Product display order in app (M100→M600 or reverse) and "Popular" badge on M250/M300 | M100→M600, badge on | open |
| Q13 | Supplier legal name and VÖEN for documents | placeholder | open |
