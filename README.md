# OAO Hub Tool

An internal configuration management tool for ZaloPay's OAO (Open Account Online) affiliation flow — built as a university capstone demo.

## Overview

OAO Hub Tool allows ZaloPay's PO team and partner banks to configure and manage the full lifecycle of the OAO product: from UI/content setup to eligibility rule logic and A/B testing.

## Modules

- **Configurations** — Build the UI for each bank's OAO product (banners, cards, CTAs, rich-text content). Partner users see only their own bank's configs.
- **Decision Flows** — Define the rule engine logic that determines user eligibility. Rule groups support drag-and-drop reordering, condition editing, and Segment Bundle references.
- **Segment Bundles** — Reusable named sets of rule groups that can be referenced across multiple Decision Flows.
- **A/B Testing** — Link experiments to a Decision Flow and compare Rule Groups as natural cohorts (no random traffic split). Tracks impressions, clicks, conversions, CTR, CVR, and revenue per variant.
- **Analytics** — Overview dashboard for OAO performance metrics.

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management)
- React Router v7
- Tailwind CSS v3
- TipTap (rich text editor)
- @dnd-kit (drag-and-drop)

## Getting Started

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Demo Accounts

| Email | Role | Access |
|---|---|---|
| admin@zalopay.vn | Admin | Full access |
| po@zalopay.vn | PO | All modules |
| partner@cathay.vn | Partner | Cathay configs only |

> All data is in-memory and resets on page refresh — no backend required.
