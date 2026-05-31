# CrankyMTB Fit Calculators

Two rider-fit calculators embedded in the CrankyMTB Shopify storefront
(<https://crankymtb.au>):

1. **Geometry / handling calculator** — React + TypeScript + Vite single-page app
   (`src/App.tsx`). Geometry data is complete (28 bikes, 118 size entries, 11 brands).
2. **Dropper-post fit calculator** — vanilla JS, embedded as a Shopify section.
   Backed by `public/mtb_dropper_bikes_database_v0_1.json` (118 entries; some
   measurement gaps, see [Data status](#data-status)).

> A fuller handover document (architecture diagram, credentials guidance,
> troubleshooting log) is maintained separately by the project owner. This
> README is the in-repo summary.

## Architecture

```
Databases (JSON)  ->  GitHub repo  ->  jsDelivr CDN  ->  Shopify storefront
                                                              |
Rider submissions ->  Supabase (Postgres)  <-- approved entries pushed back
                      bike_submissions table       into the GitHub JSON DBs
```

- The bike databases live as JSON in this repo (`public/`).
- jsDelivr serves them to the live theme, so a commit to `main` is a data
  update on the site once the CDN cache refreshes.
- The storefront submission form writes rider-supplied measurements into
  Supabase. Approved submissions are merged back into the JSON DBs.

CDN URL pattern:
`https://cdn.jsdelivr.net/gh/briskites-design/cranky-mtb-fit-calculator@main/<path>`

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | The geometry calculator (all logic and UI) |
| `src/main.tsx`, `src/*.css`, `src/assets/` | React entry, styles, assets |
| `public/emtb-database.json` | eMTB geometry database |
| `public/mtb_dropper_bikes_database_v0_1.json` | Dropper-fit database |
| `shopify-sections/bike-data-submission.liquid` | Rider submission form (mirrors the live Shopify theme file) |
| `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js` | Tooling |

## Local development

```bash
npm install
npm run dev      # Vite dev server
npm run build    # production build
npm run lint
```

## Data models

### Dropper DB (`public/mtb_dropper_bikes_database_v0_1.json`)

Array of objects, one per bike + size:

| Field | Notes |
| --- | --- |
| `bike_id` | unique slug, e.g. `specialized_turbo_levo_gen3_2023_mx_low-2023-s2` |
| `brand`, `model`, `year`, `size` | identity |
| `seat_tube_diameter_mm` | 27.2 / 30.9 / 31.6 / 34.9 |
| `max_insertion_mm` | numeric or `null` |
| `bb_to_collar_mm` | numeric or `null` |
| `insertion_data_confidence` | `manufacturer` / `owner_measured` / `workshop_verified` / `estimated` |

### Supabase `bike_submissions` table

`id` (bigserial PK), `submitted_at`, `brand`, `model`, `year`, `size`,
`seat_tube_diameter_mm`, `max_insertion_mm`, `bb_to_collar_mm`,
`insertion_data_confidence`, `submitter_name`, `submitter_email`, `notes`,
`status` (default `pending`), `reviewed_at`, `reviewer_notes`.

Row Level Security is enabled with an INSERT policy (`WITH CHECK (true)`).
The anonymous role needs these grants for the form to work (idempotent):

```sql
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON bike_submissions TO anon;
GRANT USAGE, SELECT ON SEQUENCE bike_submissions_id_seq TO anon;
```

## Submission form notes

The form authenticates with the Supabase **publishable** key
(`sb_publishable_...`) sent in the `apikey` header only. Do **not** add an
`Authorization: Bearer` header — a publishable key is not a JWT and PostgREST
will reject it (HTTP 401). Correct headers:

```js
xhr.setRequestHeader('apikey', SUPABASE_KEY);        // publishable key
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.setRequestHeader('Prefer', 'return=minimal');
```

The publishable key is safe to ship in client code; access is constrained by
RLS and the grants above. The **secret** key and any GitHub token must never
be committed.

When debugging a failed submission, read the real server message in the
browser DevTools Console (`Submission error: ...`) or Network > the
`bike_submissions` request > Response.

## Data status

As of 1 June 2026, dropper DB (118 entries, 11 brands: Cannondale, Canyon,
Forbidden, Giant, Mondraker, Orbea, Pivot, Santa Cruz, Scott, Specialized,
Trek):

- `bb_to_collar_mm`: 33 populated, **85 null**.
- `max_insertion_mm`: 9 populated, **109 null**.

## Roadmap

- Fill `bb_to_collar_mm` gaps (derive from seat tube length where possible;
  otherwise crowdsource via the form).
- Fill `max_insertion_mm` gaps (crowdsourced / workshop-verified).
- Add brands to the geometry calculator (e.g. YT, Norco, Commencal, Cube).
- Build a review-and-push workflow: read pending `bike_submissions`, approve,
  and merge approved data into the JSON DBs.
