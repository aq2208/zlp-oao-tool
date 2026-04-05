# OAO Hub Tool — Product Document

> Internal management tool for ZaloPay's **Open Account Online (OAO)** feature.  
> This document covers the product context, user roles, business requirements, and full feature specifications for each module.

---

## 1. Product Overview

### What is OAO?

**OAO (Open Account Online)** is ZaloPay's **affiliation flow** that allows end users to open financial products — bank accounts, credit cards, loans, insurance — from ZaloPay's financial partner banks, directly inside the ZaloPay app (ZPA) or the Zalo mini app (ZPI), without leaving the platform.

### The Core Problem: Each Partner Has a Different Flow

Different financial partners require fundamentally different OAO flows. For example:

- **Full KYC flow** (e.g. major Vietnamese banks for credit cards): User fills in a personal information form → authenticates via OTP → creates a card password → completes the account/card opening.
- **Leadgen flow** (simplest): User submits a form and ZaloPay forwards the data to the partner via API. No OTP, no password creation — the partner handles the rest offline.
- Other partners may require partial KYC, NFC-based identity verification, eKYC with document scanning, or other steps in between.

Because each partner's flow is unique and new partners are onboarded regularly, **ZaloPay's dev team cannot hard-code a new flow for every partner**. Instead, they built a configuration-driven system: Product Owners (POs) configure each partner's flow through this tool, without writing code.

### How the OAO Configuration Drives the In-App Experience

When a user opens ZaloPay and browses the OAO Hub (the list of available partner offers), the following happens:

1. **Partner discovery** — ZaloPay frontend displays the list of available partners. Each partner is identified by its `bankCode`.
2. **Configuration fetch** — When a user taps on a partner card, the frontend calls the OAO backend with that `bankCode`. The server returns the full configuration: hero banner image, title, description, TnC content, CTA buttons, etc. — everything the PO configured in this tool.
3. **UI rendering** — The frontend renders Pages 1, 2, and 3 from the configuration data.
4. **CTA action** — When the user taps the CTA button to actually start the account/card opening, the frontend calls the **bank-OAO backend** to execute the partner-specific flow (form submission, OTP, KYC steps, etc.).

> **Scope of this tool:** Steps 1–3 only. The actual execution of the OAO flow (step 4) is handled by a separate bank-OAO backend system and is **out of scope** for this configuration tool.

### About This Implementation

This codebase is a **cloned/demo version** of the real ZaloPay OAO Hub Tool, built as a **university capstone project** to demonstrate the system's concept and UI. It is fully frontend with no real backend — all data is mocked in-memory.

### What OAO Hub Tool Does

**OAO Hub Tool** is the back-office admin interface used by ZaloPay's internal teams and bank partners to:
- Configure the UI, images, banners, CTA buttons, TnC content, and step-by-step guidance shown to end users for each partner's OAO offer
- Define rules (Decision Engine) that determine whether a specific user is eligible to see or enter a partner's OAO flow
- Run A/B experiments on user segment targeting
- Monitor performance metrics per partner

The tool is **fully frontend** — no backend API calls. All state is managed in-memory via Zustand stores seeded from mock data.

---

## 2. User Roles & Access Control

Three roles exist, controlled via login selection (no real auth):

| Role | Who | Access |
|---|---|---|
| `admin` | ZaloPay internal admin | Full CRUD on all modules. Only role that can **delete** configurations. |
| `po` | ZaloPay Product Owner | Can create and edit all configurations, cannot delete. |
| `partner` | Bank partner employee | **Read-only**, scoped to their own `bank_code` — cannot see other banks' configurations. |

The `partner` role has a `bank_code` field (e.g. `CATHAY`) that filters the Configuration list to show only their bank's records.

---

## 3. Product Categories

All features (configurations, decision flows, segment bundles, experiments) are scoped to one of five **product categories**:

- `bank_account` — Savings / current accounts
- `loan` — Consumer loans
- `credit_card` — Credit cards
- `insurance` — Insurance products
- `promotion` — Special promotional offers

---

## 4. Module 1 — Partner Configuration Tool

**Path:** `/configurations`

### 4.1 Purpose

Manages the complete UI and content configuration for a partner bank's OAO screens. A single `MainConfiguration` record drives three pages that a ZaloPay user sees when exploring a bank offer.

### 4.2 Three-Page User Flow (in-app)

```
Page 1 (Discovery)        Page 2 (Detail)          Page 3 (Landing)
─────────────────         ───────────────          ────────────────
Base Card                 Detail Block             Header + Logo
Explored Card             - Top Image              Main Content (rich text)
(badge + benefits)        - Content Primary        Sub Content (hyperlinks)
                          - Content Secondary      Guidances (step-by-step)
                          [optional, can skip]     CTA Buttons
```

Page 2 is **optional** — if `detail_block.enabled = false`, the flow jumps directly from Page 1 to Page 3.

### 4.3 Configuration Sections

Each configuration contains 8 editable sections:

#### ① Basic Information
- `name` — Partner display name, max 41 chars. Convention: `"Bank Name — Product description"`
- `bank_code` — Uppercase identifier (e.g. `CATHAY`, `MSB`). Used for partner role filtering.
- `status` — `ACTIVE | INACTIVE | DRAFT`
- `category` — One of the five product categories
- `extra_title` — Optional badge text shown as a special label (e.g. "Ưu đãi mở tài khoản")

#### ② Banner
Two independent banner components, each toggled on/off:

- **Hero Banner** — Full-width banner at the top. When enabled: title (max 34 chars), subtitle (max 70 chars), image URL required.
- **Freeze Banner** — Sticky mini-bar that appears when user scrolls. Auto-uses thumbnail from Hero Banner image. When enabled: title (max 34 chars), subtitle (max 70 chars).

#### ③ Page 1 — Card Components

- **Base Card** — The main product card on Page 1:
  - Title (max 34 chars), Subtitle (max 46 chars)
  - Text colors: title_color, subtitle_color, content_color
  - Background: solid color OR image (or transparent). At least one must be set.
  - Logo left (brand logo), Logo right (watermark), Top-right shape (decorative element)

- **Explored Card** — Expanded view below Base Card:
  - Badge text (max 46 chars) — e.g. "Hạn mức 40 triệu"
  - Description / Benefits — **rich text HTML** (TipTap editor)

#### ④ Page 2 — Detail Block
- Toggled on/off (disabling skips Page 2 entirely)
- Top image, Content Primary (rich text, required), Content Secondary (rich text, optional)

#### ⑤ CTA Button + Redirect Links
At least 1 CTA required. Up to 5 CTAs, each with a unique `cta_name`:
- `CONFIRM_CONDITION` — User confirms eligibility
- `NOT_ELIGIBLE` — Ineligible user path
- `MAINTENANCE` — Service temporarily unavailable
- `DEEPLINK` — Redirect to URL (requires ZPA Link; ZPI Link optional for mini-app)
- `ERROR_PAGE` — Error state

Each CTA has: button_name (max 15 chars), action type, optional description (internal note), and ZPA/ZPI deeplinks when action = `DEEPLINK`.

**Validation rule:** CTA with `action = DEEPLINK` must have `zpa_link` populated.

#### ⑥ Partner Content Header (Page 3 top)
- Internal description (not shown to users)
- Header title (max 200 chars)
- Header image (brand logo — **required when status = ACTIVE**)
- Main content — rich text HTML (benefits, terms summary)

#### ⑦ Sub Content (Hyperlinks)
List of labeled links on Page 3 (e.g. "Xem điều khoản", "Chính sách bảo mật"). Each has:
- Label (required when status = ACTIVE)
- ZPA Link (required when status = ACTIVE)
- ZPI Link (optional)

#### ⑧ Guidances (Step-by-step instructions)
Ordered list of steps shown on Page 3. Each step has:
- Caption (required when status = ACTIVE)
- Image (required when status = ACTIVE)

Auto-numbered; removing a step re-numbers the rest.

### 4.4 Validation Rules

| Condition | Rule |
|---|---|
| Always | `name`, `bank_code`, and at least 1 CTA required |
| Hero Banner enabled | `title` and `image_url` required |
| Freeze Banner enabled | `title` required |
| Base Card | Must have either `bg_color` or `bg_image_url` (or `bg_transparent = true`) |
| CTA with DEEPLINK action | `zpa_link` required |
| Status = ACTIVE | `header_image_url` required; all guidances need caption + image; all sub-content items need label + ZPA Link |

### 4.5 Import / Export

- **Export** — Copies the configuration as JSON to clipboard. Available in both view and edit mode.
- **Import** — Pastes JSON to override current form fields. JSON must contain a `version` field (schema detection). Preserves the record's `id`, `created_by`, `created_at`. Primarily used to clone a config for a new bank partner (copy JSON → create new record → import).

### 4.6 Versioning

Every save increments `version` by 1 and updates `updated_at` to the current timestamp.

### 4.7 Phone Preview

A sticky mobile phone mockup (right column) updates in real time as fields are edited, showing how the configuration renders on the ZaloPay app.

---

## 5. Module 2 — Decision Flow Tool

**Path:** `/decision-flows`

### 5.1 Purpose

The **Decision Engine** is a rule engine that evaluates a set of conditions against a user's real-time attributes (called "facts") and produces a result. In the OAO context, its role is to decide **whether a specific user is allowed to see or enter a partner's OAO flow**.

**How it fits into the in-app flow:**

1. User attempts to enter an OAO flow (e.g. open a credit card for Bank A).
2. ZaloPay frontend calls the Decision Engine API, passing the user's information as input facts (age, city, KYC status, OS, platform, etc.).
3. The Decision Engine evaluates the rule groups configured by the PO for that partner.
4. It returns a result value (also configured by the PO in the action field of the matching rule group).
5. The frontend reads the result and decides what to display — allow entry, show "not eligible" screen, redirect, etc.

**Example:** Bank A requires users to be over 18 to open a credit card. The PO configures a Decision Flow with the condition `user.age > 18`. If the condition is satisfied, the action returns `"ELIGIBLE"`. If not, it returns `"NOT_ELIGIBLE"`. The frontend maps these result values to the appropriate CTA and screen behavior.

Decision Flows can be **general** (applies to all users entering any OAO flow) or **partner-specific** (scoped to a particular bank's flow).

The engine evaluates Rule Groups top-to-bottom; the first matching group returns its action value (in `FIRST` mode).

### 5.2 Flow Configuration

| Field | Description |
|---|---|
| `name` | Identifier, max 32 chars, typically SNAKE_CASE (e.g. `TNC_CATHAY`) |
| `flow_id` | Auto-generated on create: `NAME_UPPERCASE_TIMESTAMP`. Read-only after creation. |
| `status` | `ACTIVE` or `INACTIVE` |
| `flow_type` | `FIRST` — return result of first matching rule; `ALL` — evaluate every rule |
| `produce_execution_result` | When ON, saves evaluate result to DB; when OFF, only returns response |
| `continue_on_error` | `ALLOWED` — skip errored rules; `STOPPED` — halt on first error |

### 5.3 Rule Groups

Each flow has N Rule Groups, evaluated in order. Each Rule Group has:
- `name` — display label
- `logic` — `ALL` (AND) or `ANY` (OR) across its conditions
- `conditions` — list of fact-based conditions
- `local_facts` — key-value pairs injected into the rule context
- `actions` — the response value to return if this group matches (e.g. `"CATHAY"`, `"NOT_ELIGIBLE"`)

Rule Groups can be **drag-and-drop reordered** (using @dnd-kit). Order determines evaluation priority.

### 5.4 Conditions

Each condition: `fact_name` OPERATOR `value`, with an `enabled` toggle.

**Available facts (40+)** include:
- Identity: Zalopay ID, 2 trailing digits of ID, eKYC status, KYC level, nationality, identity type (CCCD/CMT), gender
- Device: OS (iOS/Android), Platform (ZPA/ZPI), App version
- Geography: Current city, permanent city, inferred permanent city
- Banking: Bank code, Bank OAO active status, NFC status, linked bank count, has existing loan/credit card/insurance
- Behavior: Transaction frequency, transaction value percentile, spending categories, wallet balance level/volatility, recurring inflow detected, DAU, CTR signal, OAO click history, activity drop detected
- Targeting: NBA label, URL query params

**Operators by fact type:**
- Text: `=`, `!=`, `contains`, `in`, `not_in`, `exists`
- Number: `=`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not_in`
- Dropdown: `=`, `!=`, `in`, `not_in`
- Multi-select: `in`, `not_in`

### 5.5 Try Rule (Simulation)

Allows testing a flow against a hypothetical user without connecting to the real engine. Inputs: ZaloPay ID, Platform, OS, App Version, Extra Info JSON.

Returns a breakdown per rule group: which conditions passed/failed, which group matched, and the final action value. (Note: in prototype mode, some facts are randomly simulated.)

### 5.6 Clone

Clones a flow with `_COPY` suffix on the name, a new unique `flow_id`, status reset to `INACTIVE`, version reset to 1.

---

## 6. Module 3 — Segment Bundle

**Path:** `/segment-bundles`

### 6.1 Purpose

Reusable user segment definitions. A Segment Bundle is a named set of Rule Groups (same structure as Decision Flow rule groups) that describes a user segment — e.g. "High spenders with no existing loan."

Bundles are referenced by A/B Experiments as variants. When an experiment starts, a snapshot of the bundle's rules is frozen into the variant (immutable during the experiment run).

### 6.2 Bundle Configuration

- `name`, `category`, `description`
- `status` — `DRAFT` or `ACTIVE`
- `rules` — Rule Groups (identical structure to Decision Flow rule groups)
- `editable` — system bundles may be locked from editing

### 6.3 Save vs Publish

Two save actions in edit mode:
- **Save Draft** → status = `DRAFT` (work in progress, not yet usable in experiments)
- **Publish** → status = `ACTIVE` (available for use in experiments)

---

## 7. Module 4 — A/B Experiment Tool

**Path:** `/experiments`

### 7.1 Purpose

Tests which user segment targeting (Segment Bundle) drives better outcomes for a given product category. Each experiment runs N variants simultaneously, splitting eligible traffic between them, and tracks conversion metrics per variant.

### 7.2 Experiment Configuration

| Field | Description |
|---|---|
| `name` | Experiment name |
| `category` | Product category (variants are filtered to same category) |
| `traffic_allocation` | % of eligible users who enter the experiment (1–100%) |
| `start_time` / `end_time` | Experiment schedule |
| `variants` | 2–5 variants; total `traffic_split` across all variants must equal 100% |

### 7.3 Variants

Each variant:
- `name` — e.g. "Variant A", "Variant B"
- `segment_bundle_id` — references an ACTIVE Segment Bundle of the same category
- `segment_bundle_snapshot` — immutable copy of bundle rules taken at start time
- `traffic_split` (%) — portion of experiment traffic routed to this variant

### 7.4 Experiment Lifecycle

```
draft → running → paused → running → completed
               └─────────────────→ completed
```

- **draft**: Editable. Can set variants, timing, allocation.
- **running**: Locked (no edits). Can Pause or Stop.
- **paused**: Can Resume or Stop.
- **completed**: Read-only. View metrics only.

Only `draft` experiments can be edited.

### 7.5 Validation

- Minimum 2 variants
- Total traffic split must equal exactly 100%
- Each variant must reference a Segment Bundle

### 7.6 Metrics Dashboard

Available for non-draft experiments. Compares variants side-by-side across:

| Metric | Description |
|---|---|
| Impressions | Total views of the OAO offer |
| Clicks | Users who tapped to see more |
| Conversions | Users who completed the application |
| CTR | Click-through rate (Clicks / Impressions) |
| CVR | Conversion rate (Conversions / Clicks) |
| Revenue | Estimated revenue attributed |

Best-performing variant per metric is highlighted in green with an upward arrow indicator.

---

## 8. Module 5 — Analytics Dashboard

**Path:** `/analytics`

### 8.1 Purpose

Overview of OAO performance across all active partner configurations over the past 30 days. Used by ZaloPay POs and leadership to assess which partners are driving results.

### 8.2 KPI Summary (header cards)

- Total Impressions across all partners
- Total Clicks
- Total Conversions
- Average CTR

### 8.3 Partner Comparison Bar Chart

Horizontal bar chart comparing partners by Impressions, Clicks, or Conversions (toggle between metrics).

### 8.4 Per-Configuration Table

Detailed table with columns: Impressions, Clicks, CTR, Conversions, CVR, Avg Time on Page, 7-day sparkline trend.

CTR thresholds: ≥12% = green, ≥10% = yellow, <10% = red.

### 8.5 Daily Breakdown

Click any row to expand a 7-day daily bar chart for that partner, showing daily impressions and clicks/CTR per day.

---

## 9. Cross-Cutting Concerns

### 9.1 Dual-platform links (ZPA / ZPI)

Many link fields come in pairs:
- **ZPA Link** — Used when user is in ZaloPay app (ZPA platform)
- **ZPI Link** — Used when user is in Zalo mini-app (ZPI platform). Always optional.

### 9.2 Rich Text Fields

Several content fields store HTML from the TipTap editor:
- `explored_card.description` — Benefits list on Page 1
- `detail_block.content_primary` / `content_secondary` — Detail content on Page 2
- `main_content` — Main content on Page 3

These render as formatted HTML in-app (bold, italic, lists, links, underline, text alignment).

### 9.3 Status Lifecycle (Configurations)

```
DRAFT → ACTIVE    (publish — stricter validation kicks in)
ACTIVE → INACTIVE (deactivate — removes from user-facing serve)
INACTIVE → ACTIVE (re-activate)
```

### 9.4 Supported Partner Banks (current mock data)

`CATHAY`, `MSB`, `VPB`, `TCB`, `VIB`, `BIDV`, `VCB`, `ACB`, `MBB`

---

## 10. Planned / Incomplete Features

Items referenced in code comments (`PRD §`) that are not yet fully implemented:

- **Real Decision Flow evaluation** — `Try Rule` currently simulates results on the frontend with partial randomization; production needs to call the backend rule engine API.
- **Reload Cache** button — Currently shows a toast but doesn't perform a real cache invalidation; would call a backend cache-bust endpoint.
- **User inferred permanent city fact** — Marked in `factDefinitions.ts` as missing from PRD `§4.x`.
- **Persist state** — All mutations are in-memory and reset on page refresh. Production needs API integration.
- **Real analytics** — `AnalyticsDashboard` uses static mock data; production would query a time-series analytics service.
