# Architecture Decision Records

One file per technical decision: `NNNN-kebab-title.md`. Business decisions go to `docs/DECISIONS.md` instead.

## Index

| # | Title | Status |
|---|---|---|
| 0001 | Monorepo: npm workspaces, shared package built to dist | accepted |
| 0002 | Dependency version pins for Phase 0 | accepted |
| 0003 | API conventions: error envelope, zod validation, request id, health probes | accepted |
| 0004 | Mobile local storage: expo-secure-store until the EAS dev build | accepted |
| 0005 | i18n libraries: i18next (mobile), next-intl (web), shared JSON | accepted |

## Template

```markdown
# NNNN. Title

Date: YYYY-MM-DD
Status: proposed | accepted | superseded by NNNN

## Context
What forces are at play; what problem this solves.

## Decision
What we do, concretely.

## Consequences
What becomes easier, what becomes harder, what we must remember.
```
