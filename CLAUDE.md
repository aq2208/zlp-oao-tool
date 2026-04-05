# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check then build for production (tsc -b && vite build)
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

There are no tests in this project.

## Architecture

**OAO Hub Tool** is a ZaloPay internal frontend for managing OAO (Open Account Opening) configurations — a fully client-side React app with no backend. All data lives in Zustand stores seeded from `src/mocks/`.

### Data flow

```
src/mocks/*.ts  →  src/stores/*.ts  →  src/pages/**/*.tsx
```

- Mock data files define the initial in-memory state
- Zustand stores expose CRUD operations (add/save/remove/clone); all mutations stay in memory and reset on page refresh
- Pages consume stores directly via hooks; no API calls anywhere

### State management (`src/stores/`)

| Store | Domain | Notes |
|---|---|---|
| `useAuthStore` | Auth | Persisted to localStorage (`oao-hub-auth`). Exposes `login(userId)` / `logout()`. |
| `useConfigStore` | Configurations | `visibleConfigs()` filters by `bank_code` for `partner` role |
| `useDecisionStore` | Decision Flows | Includes `clone()` operation |
| `useBundleStore` | Segment Bundles | |
| `useExperimentStore` | A/B Experiments | |

### Role-based access

Three hardcoded users in `useAuthStore`: `admin`, `po`, and `partner`. The `partner` role has a `bank_code` field and can only see configurations matching their bank. `ProtectedRoute` redirects unauthenticated users to `/login`.

### All types in one place

`src/types/index.ts` is the single source of truth for all TypeScript types. When adding new data shapes, define them here.

### Routing

React Router v7, defined in `App.tsx`. The old `/partner-configurations` routes redirect to `/configurations` — `PartnerConfiguration` type is deprecated in favor of `MainConfiguration`.

### Key shared components (`src/components/shared/`)

- `RichTextEditor` — TipTap-based editor; several fields (e.g. `main_content`, `content_primary`) store rich text as HTML strings
- `PhonePreview` — renders a mobile phone mockup for visual preview
- `ColorPicker`, `ImageUpload`, `Toggle`, `Badge`, `ConfirmDialog` — reusable UI primitives

### Styling

Tailwind CSS v3 with custom color tokens (e.g. `bg-surface-50`). No component library — all UI is built with Tailwind utility classes.
