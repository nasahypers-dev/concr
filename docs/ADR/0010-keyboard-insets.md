# ADR 0010 — Keyboard handling on forms

Date: 2026-10-12 · Status: accepted

## Context

On the site form the fields below the map (access notes, contact name, phone) were covered by the
keyboard: the screen used `KeyboardAvoidingView` (padding) around a ScrollView, which shrinks the
viewport but does not scroll the focused field into view. The owner wants the tapped input to sit
fully above the keyboard.

## Decision

Two modes on `Screen` (`src/ui/screen.tsx`), chosen per screen:

- `keyboard` (KeyboardAvoidingView, iOS padding): screens with a button pinned to the bottom that must
  stay visible while typing — login phone, OTP, name setup, profile.
- `keyboard="insets"` (ScrollView `automaticallyAdjustKeyboardInsets`, iOS): long forms. React Native's
  Fabric scroll view computes the inset from its real lower edge (tab bar included) and scrolls the
  first responder above the keyboard itself; nothing moves twice because no KeyboardAvoidingView is
  involved. `Scroll` (wizard body) already works this way. Android keeps Expo's default
  `softwareKeyboardLayoutMode: resize` plus native focus scrolling.

The two are never combined: insets are computed before KeyboardAvoidingView shrinks the view and would
double the bottom space.

## Alternatives

- `scrollResponderScrollNativeHandleToKeyboard` from a focus handler in `TextField`: works, but assumes
  the scroll view fills the screen (under-scrolls by the safe-area top) and duplicates what the native
  inset path does on Fabric.
- A third-party keyboard-aware scroll view: another dependency for behaviour RN now ships.

## Consequences

- Site form hosts (`sites/new`, `sites/[id]`, `order/new/site-new`) use `keyboard="insets"`.
- Jest cannot exercise native scrolling; the behaviour is verified on the device.
