# 0007. Pricing and state machines live in `@concr/shared`

Date: 2026-10-09
Status: accepted

## Context

CLAUDE.md rules 5 and 6 place the state machines in `apps/api/.../orders` and `deliveries` and
pricing in `apps/api/modules/pricing`, as pure functions with full tests. With the UI-first order
of work the mock client and the wizard's price preview need exactly those functions before the API
module exists, and later the API must not re-implement them.

## Decision

- `packages/shared/src/pricing/calculate-quote.ts` implements spec §10 (integer-qəpik money
  arithmetic from `money/money.ts`, VAT last, delivery fee zero, pump fee or "price unknown").
- `packages/shared/src/state-machines/order-state.machine.ts` and `delivery-state.machine.ts`
  implement spec §8 as data tables plus `check*/transition*` functions with actor rules, reason
  requirements and the customer cancel cutoff; `deriveOrderStatus` derives the order status from
  its deliveries.
- In Phase B1 the API modules named by CLAUDE.md re-export these functions; they stay the single
  implementation. Tests live next to the functions in shared (coverage is part of the gate).

## Consequences

- Rules 5 and 6 are satisfied in intent (one implementation, pure, fully tested); their file paths
  will point to re-exports. CLAUDE.md gets a one-line note when B1 lands.
- Mobile and web can show correct totals and allowed actions offline/mock, exactly as the API will.
