# @concr/dispatch

Next.js 16 App Router · Tailwind 4 · shadcn/ui (Base UI) · next-intl · TanStack Query. Dispatcher and
supplier-admin panel, desktop-first, works at 768 px.

```
npm run dev          # http://localhost:3001 (API expected on :3000)
npm run typecheck && npm run lint && npm test
npx shadcn@latest add <component>   # UI primitives land in src/components/ui
```

Copy `.env.example` to `.env`. Locale comes from the `concr.locale` cookie (default `az`), no URL prefix.

## Layout

```
src/app/            routes (server components by default)
src/features/       feature UI + hooks (client components where needed)
src/components/ui/  shadcn primitives (generated, keep edits minimal)
src/api/            fetch wrapper that understands the API error envelope
src/i18n/           next-intl request config over @concr/shared bundles
src/lib/            shared helpers (cn)
```
