# CONCR — Concrete Ordering & Delivery Platform
## Claude Code üçün tam texniki spesifikasiya və master prompt (v2 — Nurlanın cavabları ilə)

> **Bu faylı necə istifadə etməli:** Layihənin kök qovluğunda `docs/CONCR_SPEC.md` kimi saxlanılır. Claude Code-a ilk mesaj:
> `Read CLAUDE.md and docs/CONCR_SPEC.md fully. Then enter plan mode and propose the Phase 0 implementation plan. Do not write code until I approve the plan.`
> Hər növbəti faza üçün: `Read docs/CONCR_SPEC.md section 19, Phase N. Plan it, then implement.`

---

## 0. Bir cümləlik tərif

**CONCR** — müştərinin mobil tətbiqdən hazır beton sifariş etdiyi, zavod dispetçerinin sifarişi veb paneldən idarə etdiyi, sürücünün çatdırılmanı mobil tətbiqdən aparıb **canlı izlənildiyi** platformadır. İlk və hazırda yeganə təchizatçı (supplier) **Novxanı Beton** (novxanibeton.az) — arxitektura ilk gündən çox-təchizatçılıdır.

---

## 1. Biznes konteksti

- **Sahib:** Nurlan — Novxanı Beton-un sahibi (2018-dən fəaliyyətdə, Novxanı, Bakı; 7/24 işləyir). React/TypeScript bilir; ilk mobil layihəsi.
- **Məqsəd:** saytdakı (novxanibeton.az) satışların rəqəmsal kanaldan da gəlməsi; sifariş → çatdırılma prosesinin tam elektron olması.
- **Bazar:** Bakı və Abşeron. Çatdırılma bu ərazinin hər yerinə **qiymətə daxildir** — ayrıca çatdırılma haqqı yoxdur.
- **Rəsmi əlaqə:** Novxanı şossesi, Bakı; tel. +994 50 620 95 84; info@novxanibeton.az; novxanibeton.az; 7/24. Şüar: "Möhkəmlik. Etibar. Keyfiyyət."
- **İndiki proses (as-is):** telefon və WhatsApp ilə sifariş, saytda kalkulyator və əlaqə forması. Dispetçer şifahi/dəftər ilə planlaşdırır.
- **Hədəf proses (to-be):** müştəri tətbiqdə marka + həcm + ünvan + vaxt + nasos seçir → dispetçer paneldə təsdiqləyir, mikser/sürücü təyin edir → sürücü tətbiqdə reysi aparır, telefon GPS-i canlı ötürür → müştəri xəritədə izləyir → sənəd (təhvil aktı) tarixçədə qalır.
- **Sürücü tətbiqi və canlı izləmə MVP-nin məcburi hissəsidir** (Nurlanın qərarı). Production-a çıxanda hər şey yerində olmalıdır.
- **Gələcək (indi qurulmur, arxitektura imkan verir):** başqa zavodların qoşulması, qiymət müqayisəsi, komissiya, onlayn ödəniş.

### 1.1 Uğur meyarları
1. 3 ay ərzində real sifarişlərin ən azı 50%-i tətbiq/panel üzərindən keçir.
2. Dispetçer sifarişi 2 dəqiqədən az vaxtda təsdiqləyib mikser təyin edir.
3. Müştəri "maşın harda?" deyə zəng etmir — tətbiqdə görür.
4. Hər reys üçün rəqəmsal iz: kim, nə vaxt, nə qədər, hansı maşın, hansı yolla.

### 1.2 Qeyri-məqsədlər (MVP-də YOX)
- Zavodların özbaşına qeydiyyatı / marketplace müqayisəsi, komissiya
- Onlayn kart ödənişi (yalnız "nağd / köçürmə / kredit" qeydi)
- Mühasibat inteqrasiyası (1C və s.)
- Tərəzi və laboratoriya xidmətlərinin sifarişi (saytda var, amma MVP-dən kənar)

---

## 2. Rollar

| Rol | Kim | İnterfeys | Əsas işlər |
|---|---|---|---|
| `CUSTOMER` | Fərdi ev tikən, usta, podratçı, tikinti şirkəti | Mobil app | Sifariş yaratmaq, canlı izləmək, tarixçə, təkrar sifariş |
| `DISPATCHER` | Zavodun dispetçeri / satış meneceri | Veb panel | Qəbul/rədd, qiymət təsdiqi, reys planı, mikser/sürücü təyini, canlı xəritə |
| `DRIVER` | Mikser (və nasos) sürücüsü | Mobil app (eyni app, driver rejimi) | Reysi qəbul, status, GPS, foto ilə tamamlama |
| `SUPPLIER_ADMIN` | Zavod rəhbəri (Nurlan) | Veb panel | Qiymətlər, mikserlər, nasoslar, sürücülər, hesabatlar |
| `PLATFORM_ADMIN` | Platforma sahibi (gələcəkdə ayrı) | Veb panel | Supplier-lərin idarəsi |

MVP-də `SUPPLIER_ADMIN` və `PLATFORM_ADMIN` eyni şəxsdir, kodda ayrı rollardır.

---

## 3. Domen lüğəti

| Termin | İzah | Kodda |
|---|---|---|
| Beton markası | 11 marka: M100, M150, M200, M250, M300, M350, M400, M450, M500, M550, M600. Hər marka ayrıca məhsuldur. | `Product` (`grade`, `strengthClass`) |
| Konus çökməsi (slump) | P2, P3, P4. Nasosla tökmək üçün adətən P4. | `Product.slumpOptions[]`, `Order.slump` |
| Həcm | m³. Mikser tutumları **8, 10, 12 m³**. Minimum sifariş — `TODO(nurlan)` (fərziyyə 3 m³). | `Order.volumeM3` |
| Reys (load) | Bir mikserin bir gedişi. 25 m³ sifariş, 10 m³ mikserlərlə = 3 reys (10+10+5). | `Delivery` |
| Nasos (pump) | Beton nasosu; bum uzunluğuna görə: **24 m** (var) və digərləri (`TODO(nurlan)`: hansı uzunluqlar, qiymət). | `Order.pumpRequired`, `PumpOption` |
| Çatdırılma pəncərəsi | Tarix + 2 saatlıq pəncərə. Zavod 7/24 işləyir — gecə slotları da mümkündür. | `Order.requestedDate`, `timeWindowStart/End` |
| Obyekt (site) | Tökmə yeri: ünvan + koordinat + giriş qeydləri. | `Site` |
| Xidmət ərazisi | Bakı + Abşeron polygon-u. Yalnız **yoxlama** üçün ("bu ünvana çatdırmırıq"); qiymətə təsir etmir. | `ServiceArea` |
| Betonun ömrü | ~90 dəq. `departedAt`-dan sayğac. | `Delivery.departedAt` |
| Təhvil aktı | Hər reys üçün sənəd: həcm, marka, vaxt, sürücü, foto, qəbul edənin adı. | `DeliveryDocument` |
| Aqreqat | Qum, atsep, şeben — tonla satılır (topdan min 250 t). **Phase 4** — `Product.unit = TON`. | `Product.category = AGGREGATE` |

---

## 4. Qiymətlər (real — Nurlan, 08.10.2026)

| Marka | Qiymət (m³, **ƏDV-siz**) | ƏDV 18% ilə |
|---|---|---|
| M600 | 140 ₼ | 165,20 ₼ |
| M550 | 135 ₼ | 159,30 ₼ |
| M500 | 130 ₼ | 153,40 ₼ |
| M450 | 125 ₼ | 147,50 ₼ |
| M400 | 120 ₼ | 141,60 ₼ |
| M350 | 115 ₼ | 135,70 ₼ |
| M300 | 110 ₼ | 129,80 ₼ |
| M250 | 105 ₼ | 123,90 ₼ |
| M200 | 100 ₼ | 118,00 ₼ |
| M150 | 95 ₼ | 112,10 ₼ |
| M100 | 90 ₼ | 106,20 ₼ |

Rəsmi qiymət siyahısı (Novxanı Beton): 11 marka, M100-dən M600-ə hər 50 addımda +5 ₼. Seed-də `sortOrder` M600 → M100 (bahadan ucuza) və ya M100 → M600 — `TODO(nurlan)` hansı sıra tətbiqdə görünsün (fərziyyə: M100 → M600, ən çox satılan M250/M300 "Populyar" nişanı ilə).

- Çatdırılma Bakı və Abşeronun hər yerinə **qiymətə daxildir**.
- Nasos qiyməti: `TODO(nurlan)` (sifariş başına? m³ başına? bum uzunluğuna görə?).
- Supplier settings: `vatRate: 0.18`, `pricesIncludeVat: false`, `deliveryIncluded: true`.
- Tətbiqdə göstəriş: "110 ₼ + ƏDV" və yekunda "Cəmi: 1 298,00 ₼ (ƏDV daxil)".

---

## 5. Arxitektura

### 5.1 Repo (tək git repo, lightweight monorepo, npm workspaces)

```
concr/
├── CLAUDE.md
├── docs/  CONCR_SPEC.md · SETUP_GUIDE.md · DECISIONS.md · PROGRESS.md · ADR/ · api/openapi.json
├── apps/
│   ├── mobile/      Expo (RN + TS + Expo Router) — Customer + Driver
│   ├── api/         NestJS + Prisma + PostgreSQL/PostGIS + Redis + Socket.IO + BullMQ
│   └── dispatch/    Next.js — Dispatcher + Supplier Admin
├── packages/shared/ enum-lar, error-codes, zod sxemləri, i18n JSON  (@concr/shared)
├── infra/           docker-compose.yml (postgis, redis), scripts/
├── .github/workflows/ci.yml
└── package.json
```

### 5.2 Backend modulları

`auth · users · suppliers · catalog · sites · orders · deliveries · tracking · fleet · pricing · notifications · documents · realtime · admin` (+ `common`, `config`, `prisma`).

### 5.3 Multi-supplier prinsipi
- Hər domen cədvəlində `supplierId`; bütün sorğular onunla filtrlənir; staff endpoint-ləri `SupplierScopeGuard`-dan keçir.
- Müştəri sifariş yaradanda MVP-də supplier seçmir — backend `DEFAULT_SUPPLIER_ID` (Novxanı Beton) qoyur.
- "Novxanı" sözü yalnız `prisma/seed.ts`-də.

---

## 6. Texnologiya yığını

| Qat | Seçim | Qeyd |
|---|---|---|
| Mobil | **Expo (ən son stabil SDK, 56+)**, React Native, TypeScript strict, **Expo Router** | New Architecture (default) |
| Mobil data/state | TanStack Query (server), Zustand (UI/session), MMKV (lokal növbə) | |
| Mobil UI | NativeWind + öz `src/ui/` komponentləri | |
| Xəritə & GPS | `react-native-maps` (Android: Google Maps, iOS: Apple Maps), `expo-location` + `expo-task-manager` (background), Google Places (ünvan axtarış), Google Routes API (ETA) | Google Maps Platform key lazımdır |
| Push | `expo-notifications` + Expo Push Service | Dev build lazımdır |
| Backend | **NestJS**, **Prisma**, **PostgreSQL 16 + PostGIS**, **Redis**, **Socket.IO**, **BullMQ** | REST + WS |
| Validasiya | `zod` (shared) | |
| Auth | Telefon + SMS OTP (müştəri, sürücü); email + şifrə (staff); JWT 15 dəq + refresh 30 gün rotation | |
| SMS | `SmsProvider` interface → `DevFixedOtpProvider` (dev, kod `123456`) → prod: **Twilio Verify** ilk real provayder (NestJS-dən HTTP, mobil tərəfdə native modul lazım deyil) → sonradan yerli gateway eyni interface ilə əvəzlənir | §21 izah |
| Fayl saxlama | `StorageProvider` → dev: lokal disk; prod: S3-uyğun (Hetzner Object Storage / MinIO) | |
| Veb panel | **Next.js App Router**, Tailwind, shadcn/ui, TanStack Query/Table, `@vis.gl/react-google-maps` (canlı xəritə), dnd-kit | |
| i18n | `az` default, `ru`, `en` — `packages/shared/i18n/*.json` | |
| Test | Jest + Supertest (api), Jest + RNTL (mobile), Maestro (E2E, Phase 4) | |
| CI/CD | GitHub Actions (lint, typecheck, test, migrate check); EAS Build (mobil); Docker (api) | |

**Versiya qaydası:** `npm view <pkg> version` ilə ən son stabil; Expo paketləri **yalnız** `npx expo install`.

---

## 7. Data modeli (Prisma — istiqamət)

```prisma
model User { id, phone @unique (E.164), email?, passwordHash?, fullName?, locale "az", role UserRole, isActive,
             pushTokens PushToken[], memberships SupplierMembership[], customerProfile?, driverProfile? }
model CustomerProfile { userId @id, customerType INDIVIDUAL|COMPANY, companyName?, taxId? (VÖEN), creditLimit?, sites Site[] }
model SupplierMembership { userId, supplierId, role, @@id([userId, supplierId]) }

model Supplier { id, name, slug, legalName?, taxId?, phone, website?, logoUrl?, isActive,
                 settings Json  // {minOrderM3, vatRate:0.18, pricesIncludeVat:false, deliveryIncluded:true,
                                //  concreteLifetimeMin:90, leadTimeHours, cancelCutoffHours:12, workingHours:"24/7",
                                //  locationUpdateIntervalSec:10, arrivalGeofenceM:150}
                 plants, products, pumpOptions, serviceAreas, trucks, drivers, orders }
model Plant { id, supplierId, name, address, location Point, isDefault }   // seed: Novxanı 40.4858529, 49.8294278

model Product { id, supplierId, category CONCRETE|AGGREGATE, unit M3|TON, grade "M300", strengthClass?,
                description?, slumpOptions String[], basePrice Decimal(10,2) /* ƏDV-siz */, minQty Decimal?, isActive, sortOrder }
model PumpOption { id, supplierId, boomLengthM Int, pricePerOrder Decimal?, pricePerM3 Decimal?, isActive }
model ServiceArea { id, supplierId, name "Bakı və Abşeron", polygon Polygon, isActive }   // yalnız yoxlama

model Site { id, customerId, name, addressLine, location Point, accessNotes?, contactName?, contactPhone?, isDefault }

model Order { id, number @unique /* CN-2026-000123 */, supplierId, customerId, siteId, productId,
              volumeM3 Decimal(8,2), slump, pumpRequired, pumpOptionId?,
              requestedDate, timeWindowStart "08:00", timeWindowEnd "10:00", status OrderStatus,
              pricing Json /* snapshot: {basePerM3, subtotal, pumpFee, vat, total, currency:"AZN", overrideReason?} */,
              totalAmount Decimal(12,2), paymentMethod CASH|BANK_TRANSFER|CREDIT, paymentStatus UNPAID|PARTIAL|PAID,
              customerNote?, internalNote?, cancelReason?, cancelledBy?,
              deliveries Delivery[], events OrderEvent[], createdAt, confirmedAt?, completedAt? }
model OrderEvent { id, orderId, type, fromStatus?, toStatus?, actorId?, payload Json, createdAt }

model Delivery { id, orderId, supplierId, sequence Int, volumeM3 Decimal, truckId?, driverId?, status DeliveryStatus,
                 plannedDepartureAt?, departedAt?, arrivedAt?, unloadStartedAt?, completedAt?,
                 lastLocation Point?, lastLocationAt?, lastSpeedKmh?, etaMinutes Int?,
                 failReason?, document DeliveryDocument?, locations DeliveryLocation[] }
model DeliveryLocation { id, deliveryId, location Point, speedKmh?, heading?, accuracyM?, recordedAt, @@index([deliveryId, recordedAt]) }
model DeliveryDocument { id, deliveryId, number, pdfUrl?, photoUrls String[], signatureUrl?, receivedByName, receivedAt }

model Truck { id, supplierId, plateNumber @unique, type MIXER|PUMP, capacityM3 Decimal? /* 8/10/12 */, boomLengthM Int? /* nasos */, isActive, currentDriverId? }
model DriverProfile { userId @id, supplierId, isOnShift, currentTruckId?, lastSeenAt? }
model PushToken { id, userId, token, platform, createdAt }
model OtpCode { id, phone, codeHash, expiresAt, attempts, consumedAt? }
```

**Enumlar (`@concr/shared`):**
```ts
OrderStatus: PENDING | CONFIRMED | SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED | REJECTED
DeliveryStatus: PLANNED | ASSIGNED | LOADING | EN_ROUTE | ARRIVED | UNLOADING | COMPLETED | CANCELLED | FAILED
```

---

## 8. State machine-lər

### 8.1 Order
| From | To | Kim | Yan təsir |
|---|---|---|---|
| — | PENDING | CUSTOMER | pricing snapshot; dispetçerə push + panel |
| PENDING | CONFIRMED | DISPATCHER | vaxt/qiymət override mümkündür (`overrideReason` məcburi); müştəriyə push |
| PENDING | REJECTED | DISPATCHER | səbəb məcburi |
| PENDING | CANCELLED | CUSTOMER | sərbəst |
| CONFIRMED | SCHEDULED | DISPATCHER | Delivery-lər yaradılır (avtomatik bölgü: ən böyük mikserdən başlayaraq) |
| CONFIRMED | CANCELLED | CUSTOMER | yalnız `requestedDate − now > cancelCutoffHours`; əks halda DISPATCHER |
| SCHEDULED | IN_PROGRESS | sistem | ilk Delivery EN_ROUTE olanda |
| IN_PROGRESS | COMPLETED | sistem | bütün Delivery-lər terminal statusda |
| SCHEDULED/IN_PROGRESS | CANCELLED | DISPATCHER | yola düşməmiş reyslər ləğv olunur |

### 8.2 Delivery
`PLANNED → ASSIGNED → LOADING → EN_ROUTE → ARRIVED → UNLOADING → COMPLETED`; istənilən yerdən `CANCELLED`; `ARRIVED/UNLOADING → FAILED` (səbəb məcburi). GPS yalnız `EN_ROUTE` və `ARRIVED`-də. Keçid məntiqi pure function + 100% test.

---

## 9. Canlı izləmə arxitekturası (VACİB — Nurlan ətraflı istədi)

### 9.1 Mənbə: sürücünün telefonu (MVP)
Mikserə ayrıca cihaz qoyulmur. Sürücü tətbiqdə "Yola düşdüm" basanda telefon GPS-i işə düşür.
- `expo-location` + `expo-task-manager` ilə **background location task** qeydiyyatdan keçir: tətbiq bağlı/arxada olsa da, ekran sönsə də GPS işləyir. Android-də davamlı bildiriş ("CONCR çatdırılmanı izləyir") göstərilir — bu OS tələbidir.
- Parametrlər: `accuracy: High`, `timeInterval: 10 s`, `distanceInterval: 25 m`, `deferredUpdatesInterval` (batarya üçün).
- Hər nöqtə `{lat, lng, speedKmh, heading, accuracyM, recordedAt}` lokal **MMKV növbəsinə** yazılır, hər 10–15 saniyədə batch ilə `POST /driver/deliveries/:id/location` göndərilir. İnternet kəsilsə növbə yığılır, gələndə boşalır — **heç bir nöqtə itmir**.
- `ARRIVED` və ya `COMPLETED` olanda task dayandırılır. Reys olmayanda GPS **yığılmır** (sürücü məxfiliyi + batarya).
- İcazələr: iOS "Always" location + background modes; Android `ACCESS_BACKGROUND_LOCATION` + foreground service. İcazə mətnləri i18n ilə izah edir ki, niyə lazımdır.

### 9.2 Server: qəbul və yayım
1. API batch-i validasiya edir (accuracy > 100 m olan nöqtələri atır, zamana görə sıralayır, dublikatları silir).
2. `DeliveryLocation`-a yazır (tarixçə, 30 gün sonra arxiv/silinmə).
3. `Delivery.lastLocation/lastLocationAt/lastSpeedKmh` yenilənir; eyni dəyər **Redis**-də `delivery:{id}:pos` kimi saxlanılır (sürətli oxunuş üçün).
4. Hər 30 saniyədə (və ya 500 m-dən çox yerdəyişmədə) **ETA** hesablanır: Google Routes API (yol üzrə) → nəticə yoxdursa haversine / orta sürət fallback. `Delivery.etaMinutes` yenilənir.
5. **Geofence:** obyektə 150 m qalanda server avtomatik `ARRIVED` təklif edir — sürücüyə push "Çatdınız? Təsdiq edin"; sürücü basmasa 3 dəq sonra avtomatik ARRIVED.
6. **Socket.IO** ilə yayım (throttle 5 s): `delivery.location {deliveryId, lat, lng, heading, speedKmh, etaMinutes, at}` → room `order:{orderId}` (müştəri) və `supplier:{supplierId}` (dispetçerlər).
7. 90 dəq xəbərdarlığı BullMQ delayed job ilə: `departedAt + 75 dəq` → dispetçerə və sürücüyə push.

### 9.3 Müştəri nə görür
Sifariş detalında (`orders/[id]`) xəritə: obyekt pin-i, zavod pin-i, hər aktiv reys üçün mikser ikonu (heading-ə görə dönür), marker 5 saniyədə bir **animasiya ilə** sürüşür (`AnimatedRegion`), üstündə "Reys 2/3 · ETA 18 dəq · 10 m³ · Sürücü: Elşən · 📞". Tətbiq açılanda əvvəl REST ilə son mövqe (`GET /orders/:id` → `deliveries[].lastLocation`), sonra socket-ə qoşulur. Tətbiq arxada olsa push gəlir ("Mikser yola düşdü, ~25 dəq").

### 9.4 Dispetçer nə görür
Canlı xəritə: bütün növbədə olan mikserlər (boş olanlar boz, reysdə olanlar rəngli), klik → reys kartı; sağ panel: gecikən reyslər (ETA > pəncərə), 90 dəq riski, GPS siqnalı 2 dəqdən çox gəlməyən sürücülər ("siqnal yoxdur" nişanı). Lövhədə statusa görə rənglər.

### 9.5 Gələcək: hardware GPS treker
Mikserlərdə artıq telematika trekeri varsa (Wialon, Teltonika, yerli GPS monitorinq şirkəti) — `TrackingSource` interface-i var: `PHONE` (MVP) və `TELEMATICS_API` (sonra). Server tərəfdə eyni `DeliveryLocation` axınına qoşulur; mobil tərəf dəyişmir. **Sual Nurlan üçün:** maşınlarda treker varmı, hansı şirkət?

### 9.6 Tipik tələlər (Claude Code bilsin)
- iOS background location-u Expo Go-da işləmir → **dev build** məcburidir.
- Android 14+ foreground service type `location` manifest-də olmalıdır (`expo-location` config plugin edir).
- Batarya rejimi (Xiaomi/Huawei) tətbiqi öldürə bilər → sürücü profilində "batarya optimizasiyasını söndür" təlimatı + link.
- GPS "sıçrayışları": accuracy filtri + minimal Kalman/median hamarlama server tərəfdə.
- Socket qopanda müştəri tətbiqi 10 s-də bir REST polling-ə düşür (fallback).

---

## 10. Qiymət hesablama (pricing service, pure function)

```
subtotal   = product.basePrice × volumeM3                 // ƏDV-siz
pumpFee    = pump ? (pump.pricePerOrder ?? 0) + (pump.pricePerM3 ?? 0) × volumeM3 : 0
deliveryFee = 0                                            // settings.deliveryIncluded = true
vat        = (subtotal + pumpFee) × settings.vatRate       // 0.18
total      = subtotal + pumpFee + vat
```
- `volumeM3 < settings.minOrderM3` → `MIN_VOLUME_NOT_MET`.
- Obyekt `ServiceArea` polygon-undan kənardadırsa → `OUT_OF_SERVICE_AREA`.
- Snapshot `Order.pricing`-ə yazılır; köhnə sifarişlər dəyişmir.
- Dispetçer override edə bilər (`overrideReason` məcburi, OrderEvent-ə düşür).

---

## 11. API (`/api/v1`, JSON, ISO-8601 UTC, pul `string` decimal AZN)

Xəta formatı: `{statusCode, code, message, details?, requestId}`; `code` → `@concr/shared/error-codes`. Pagination `?page&limit` → `{items,total,page,limit}`. Swagger `/api/docs`.

**Auth:** `POST /auth/otp/request` · `POST /auth/otp/verify` · `POST /auth/refresh` · `POST /auth/logout` · `POST /auth/staff/login` · `GET/PATCH /me` · `POST/DELETE /me/push-tokens`
**Catalog (public):** `GET /suppliers/:id/products?category=` · `GET /suppliers/:id/pump-options` · `POST /suppliers/:id/quote` → `PricingBreakdown + inServiceArea + earliestSlot`
**Sites:** CRUD `/sites`
**Orders (customer):** `POST /orders` · `GET /orders` · `GET /orders/:id` (deliveries + lastLocation + eta) · `POST /orders/:id/cancel` · `POST /orders/:id/reorder` · `GET /orders/:id/documents`
**Dispatch:** `GET /dispatch/orders` · `GET /dispatch/orders/:id` · `POST …/confirm` · `POST …/reject` · `POST …/schedule` · `POST …/cancel` · `GET /dispatch/board?date=` · `GET /dispatch/live` (bütün aktiv reyslərin son mövqeyi)
**Driver:** `GET /driver/deliveries?date=` · `POST /driver/deliveries/:id/status` · `POST /driver/deliveries/:id/location` (batch array) · `POST /driver/deliveries/:id/complete` (multipart) · `POST /driver/shift`
**Admin:** CRUD `/admin/trucks` `/admin/drivers` `/admin/products` `/admin/pump-options` `/admin/service-areas` · `PATCH /admin/supplier/settings` · `GET /admin/reports/summary`

**WebSocket** `/rt` (JWT handshake). Rooms: `order:{id}`, `supplier:{id}`, `delivery:{id}`. Server→client: `order.status`, `delivery.status`, `delivery.location`, `order.created`. Client→server: `delivery.location` (driver, HTTP fallback var).

---

## 12. Bildirişlər (i18n açarı ilə, BullMQ, 3 retry)

| Hadisə | Müştəri | Dispetçer | Sürücü |
|---|---|---|---|
| Sifariş yaradıldı | "Qəbul edildi #CN-…" | "Yeni sifariş" | — |
| Təsdiqləndi / Rədd | "Təsdiqləndi: {date} {window}" / səbəb | — | — |
| Reys təyin edildi | — | — | "{date} {time}, {site}, {m3} m³" |
| Yola düşdü | "Mikser yola düşdü, ~{eta} dəq" | — | — |
| Geofence | — | — | "Çatdınız? Təsdiq edin" |
| Çatdı / Tamamlandı | "Obyektdədir" / "Tamamlandı, sənəd hazırdır" | — | — |
| 75 dəq | — | "Reys #… 75 dəqdir yoldadır" | "15 dəq qaldı" |
| GPS siqnalı yoxdur 3 dəq | — | "Sürücü {name} siqnal vermir" | — |

---

## 13. Mobil tətbiq (Expo Router)

```
app/
├── _layout.tsx              providers; role-a görə yönləndirmə
├── (auth)/ welcome · phone · otp
├── (customer)/
│   ├── _layout.tsx          tabs: Ana | Sifarişlərim | Obyektlər | Profil
│   ├── index.tsx            CTA "Beton sifariş et", aktiv sifariş kartı (canlı ETA), son sifarişlər
│   ├── order/new/ product · site · pump · schedule · review
│   ├── orders/index.tsx · orders/[id].tsx   (timeline, reyslər, CANLI XƏRİTƏ, sənədlər, ləğv/təkrar)
│   ├── sites/ (CRUD, xəritədə pin)
│   └── profile.tsx
├── (driver)/
│   ├── _layout.tsx          tabs: Bu gün | Profil
│   ├── index.tsx            növbə toggle (+ mikser seçimi), bugünkü reyslər
│   └── delivery/[id].tsx    böyük düymələr: Yükləmə → Yola düş → Çatdım → Boşaldım → Tamamla;
│                            naviqasiya (Google/Apple Maps/Waze), 90 dəq sayğac, foto, qəbul edənin adı
└── +not-found.tsx
```
- Sürücü düymələri min 56 px, yüksək kontrast; offline növbə; dərin link `concr://orders/{id}`.
- Dizayn tokenləri: primary `#12161F` (saytın theme-color-u — dərin qrafit), accent `#F5A623`, dark mode tokenlər indidən.
- Hər ekran: loading / empty / error. Azərbaycan hərfləri test olunur.

---

## 14. Dispetçer paneli (apps/dispatch)
1. Login · 2. Gələn sifarişlər (PENDING) + detallar + təsdiq/rədd/override · 3. Planlama lövhəsi (mikser × saat, dnd, "avtomatik böl") · 4. **Canlı xəritə** (§9.4) · 5. Sifariş tarixçəsi + CSV · 6. Ayarlar (məhsullar/qiymətlər, nasoslar, mikserlər 8/10/12, sürücülər, xidmət ərazisi polygon, min həcm, ƏDV) · 7. Hesabat. Desktop-first, 768 px-də işləyir.

---

## 15. i18n · 16. Təhlükəsizlik · 17. Test — (v1 ilə eyni, qısa)
- i18n: `az` default, açarlar `namespace.key`, `packages/shared/i18n/*.json`, pul `1 298,00 ₼`.
- OTP hash + rate limit + 5 cəhd blok; JWT secrets env; refresh rotation; cross-supplier → 404; zod hər yerdə; fayl 5 MB jpg/png EXIF strip; pino + requestId, telefon maskalanır; `OrderEvent` audit.
- `pricing`, iki state machine, location ingestion (filtr/dedupe) — 100% unit; API e2e happy path + 5 error; mobil wizard validasiya; CI yaşıl.

---

## 18. Dev mühiti və seed
- `infra/docker-compose.yml`: `postgis/postgis:16`, `redis:7`. `.env.example` izahlı.
- `npm run dev` (api+dispatch), `npm run dev:mobile`, `db:migrate|seed|reset`.
- **Seed:** Supplier `novxani-beton` ("Novxanı Beton", website novxanibeton.az, phone +994506209584, email info@novxanibeton.az, address "Novxanı şossesi, Bakı", settings: vatRate 0.18, pricesIncludeVat false, deliveryIncluded true, minOrderM3 3 `TODO`, leadTimeHours 6 `TODO`, cancelCutoffHours 12 `TODO`, concreteLifetimeMin 90); Plant "Novxanı" (40.4858529, 49.8294278); **Products M100–M600 (11 marka) real qiymətlərlə (§4)**, slump ["P2","P3","P4"]; PumpOption 24 m (qiymət `TODO`); ServiceArea "Bakı və Abşeron" (kobud polygon, `TODO` dəqiqləşdir); Trucks: 2×8 m³, 2×10 m³, 2×12 m³ (nömrələr placeholder), 1 nasos 24 m; 3 sürücü; dispatcher `dispatcher@novxanibeton.az / Dispatcher123!`; admin; 2 müştəri; 6 nümunə sifariş müxtəlif statusda (biri EN_ROUTE, saxta GPS tarixçəsi ilə — xəritə testi üçün).
- Dev OTP `123456`. `npm run sim:driver` — saxta sürücü skripti: seed-dəki reysi Novxanıdan obyektə doğru 10 saniyədə bir hərəkət etdirir (xəritəni real telefon olmadan test etmək üçün).

---

## 19. Mərhələli plan (sürücü + canlı izləmə önə çəkilib)

### Phase 0 — Skelet (1–2 gün)
Workspaces, lint/TS, docker-compose, NestJS (`/health`, swagger, logger, error filter, zod), `@concr/shared`, Expo app (Router, NativeWind, Query, i18n, boş `(auth)/(customer)/(driver)` qrupları, `ui/` 4 komponent), Next.js login, CI.
**DoD:** API `/health` 200; Expo Go-da "CONCR" welcome; login səhifəsi açılır.

### Phase 1 — Auth + kataloq + müştəri sifarişi + minimal dispetçer (1 həftə)
Prisma tam + seed (real qiymətlər); auth (OTP, staff); catalog + quote + pricing (test); sites; orders create/list/detail/cancel + state machine; veb: login, gələn sifarişlər, təsdiq/rədd. Mobil: auth, ana səhifə, 5 addımlı wizard, sifariş siyahısı/detalı (statik), obyektlər, profil.
**DoD:** telefonda sifariş yaranır → paneldə görünür → təsdiqlənir → müştəri statusu görür.

### Phase 2 — Sürücü tətbiqi + canlı izləmə (1–2 həftə) ← **MVP-nin ürəyi**
Schedule endpoint + avtomatik reys bölgüsü; fleet CRUD; driver endpoint-ləri; delivery state machine; location ingestion + Redis + ETA + geofence; Socket.IO; **dev build (EAS)**; mobil `(driver)` tam; background location + offline növbə; müştəri canlı xəritə; veb canlı xəritə + lövhə (ilk versiya); `sim:driver` skripti.
**DoD:** real sürücü real yolda reysi aparır, müştərinin telefonunda marker hərəkət edir, panel görür, 90 dəq sayğac işləyir.

### Phase 3 — Push + sənədlər + ayarlar (1 həftə)
Expo push bütün hadisələr; DeliveryDocument PDF (QR ilə); admin ayarları (məhsullar, nasoslar, mikserlər, sürücülər, polygon); dnd lövhə; Twilio Verify real OTP.
**DoD:** push hər rolda gəlir; hər tamamlanan reysin PDF-i var; Nurlan ayarları paneldən dəyişir.

### Phase 4 — Hesabat, aqreqatlar, cilalama (1 həftə)
Hesabat + CSV; qum/atsep/şeben sifarişi (ton, min 250 t, "qiymət təklifi al" axını); Sentry; dark mode; performans; Maestro E2E; accessibility.
**DoD:** 20 sifarişlik real sınaq həftəsi.

### Phase 5 — Production (3–5 gün)
API Docker → VPS (Hetzner) + Caddy HTTPS + pg backup; veb Vercel; mobil EAS production → Google Play internal testing + TestFlight → sonra mağazalar; monitorinq; release checklist; `.env` prod.
**DoD:** Nurlan, dispetçer və sürücülər real sifarişlərdə istifadə edir.

---

## 20. Fərziyyələr (dəyişdirilə bilər)
1. ƏDV 18%, qiymətlər ƏDV-siz saxlanılır, ƏDV yekunda əlavə olunur.
2. Çatdırılma Bakı+Abşeronun hər yerinə qiymətə daxildir; xidmət ərazisi polygon-u yalnız yoxlama üçündür.
3. Min sifariş 3 m³ (`TODO`), ləğv cutoff 12 saat (`TODO`), lead time 6 saat (`TODO`).
4. Müştəri və sürücü OTP ilə; staff email+şifrə.
5. Ödəniş onlayn deyil.
6. Bir sifariş = bir marka.
7. GPS mənbəyi sürücü telefonu; hardware treker sonra.
8. Brend: **CONCR** (müvəqqəti). Order nömrəsi `CN-YYYY-NNNNNN`. Bundle id `az.concr.app`.

---

## 21. SMS "provayder" nədir (Nurlanın 5-ci sualına cavab)
Tətbiq OTP kodunu özü SMS kimi göndərə bilmir — bunu **SMS gateway şirkəti** edir: sənin serverin ona HTTP sorğu göndərir ("bu nömrəyə bu mətni yolla"), o da operatorlar (Azercell/Bakcell/Nar) vasitəsilə çatdırır, hər SMS üçün pul alır. Seçimlər:
1. **Dev-də heç nə lazım deyil** — kod həmişə `123456` (Phase 0–2).
2. **Twilio Verify** (beynəlxalq, Azərbaycana çatdırır, dəqiqələrlə qoşulur, SMS başına ~0,1–0,4 $): ilk real provayder — Phase 3.
3. **Yerli gateway** (Azərbaycanda korporativ SMS xidməti verən şirkətlər; operatorların özlərinin də korporativ SMS paketləri var) — daha ucuz, "NOVXANI" kimi sender adı, amma müqavilə/sənəd istəyir. Həcm artanda `SmsProvider` interface-i ilə Twilio-nu əvəz edirik; mobil tərəfdə heç nə dəyişmir.
4. Alternativ: WhatsApp OTP (saytda onsuz da WhatsApp var) — Phase 4-də baxıla bilər.

---

## 22. Qalan açıq suallar (`docs/DECISIONS.md`-ə)
1. Minimum sifariş həcmi? Ən erkən çatdırılma (lead time) neçə saat?
2. Nasos: 24 m-dən başqa hansı bum uzunluqları; qiymət necə (sifariş başına / m³ başına / saatla)?
3. Mikserlərin sayı (8/10/12 m³-dən neçə ədəd) və nömrələri; sürücülərin sayı, telefon tipi (Android/iPhone)?
4. Maşınlarda hazır GPS treker varmı (hansı şirkət)?
5. Ləğv qaydası və boşdayanma haqqı varmı?
6. Şirkət müştəriləri (VÖEN, kredit limiti, aylıq hesab) MVP-də lazımdırmı?
7. Kağız təhvil aktının nümunəsi (foto) — PDF şablonu üçün.
8. Apple Developer ($99/il) və Google Play ($25) hesabları — Phase 2-də iOS dev build üçün Apple hesabı lazım olacaq.
9. Google Maps Platform billing (kart) aça bilərsənmi?
10. Domen (`concr.az`?) və VPS seçimi.
11. Logo/rəng: saytın `#12161F` qrafit tonundan davam edəkmi?

---

## 23. Hazır prompt-lar

**Phase 0:**
```
Read CLAUDE.md and docs/CONCR_SPEC.md completely. Summarize the architecture back to me in 10 bullet points so I can confirm you understood it, and list every TODO(nurlan) placeholder you will need. Then enter plan mode and write the Phase 0 plan (section 19): exact commands, files, order. Do not write code until I approve.
```
**Faza şablonu:**
```
We are starting Phase N from docs/CONCR_SPEC.md section 19. Re-read sections 7, 8, 9, 10, 11 and 19. Enter plan mode. Break Phase N into 5–10 tasks with a checklist, mark the risky ones, tell me which tests you'll write first. Wait for my approval.
```
**Canlı izləmə (Phase 2) xüsusi:**
```
Implement live tracking exactly as in spec section 9. Start with the backend ingestion endpoint + tests (filtering, dedupe, batch), then the Socket.IO gateway, then the driver background-location task in Expo, then the customer map. Also build scripts/sim-driver.ts so I can test the map without a real truck. Tell me when the dev build becomes necessary and give me the exact EAS commands.
```
**Debug:** `Here is the error from Metro/phone: <paste>. Diagnose the root cause first, explain in 3 sentences, then fix.`
**Faza bağlamaq:** `Phase N done. Run lint, typecheck, tests. Update README, PROGRESS.md, ADRs. 5-sentence summary: built / skipped / TODO(nurlan) placeholders / risks / next. Commit (conventional).`
