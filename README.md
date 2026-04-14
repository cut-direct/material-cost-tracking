# Material Cost Tracking

Internal tooling for [Cut My](https://www.cutmy.co.uk) — a sheet material cutting company. Two tools in one repo:

1. **Material Cost Database** — track supplier costs, parse price-update emails with AI, stage future-dated changes
2. **Peeping Tom** — competitor price monitor dashboard (scraper lives in a [separate repo](https://github.com/perspexmilo/peeping-tom))

---

## Material Cost Database

Track Cut My's own material costs, markup multipliers, and retail prices across the full product range.

- Bulk import from supplier PDF price lists (Perspex, Lathams) via AI parsing
- AI-powered email parser for supplier price update emails — no manual data entry
- Staged changes workflow — review AI-parsed updates before committing them
- Full cost history per variant with change tracking
- Searchable, filterable material database with inline editing

---

## Peeping Tom Dashboard

Surfaces competitor scrape results alongside Cut My's own retail prices for direct comparison.

- Price-per-m² across 9 competitors (6 acrylic, 3 wood)
- Week-on-week delta indicators — green up / red down with absolute and % change
- Searchable, filterable by item name or variant
- Average competitor price column
- Map each basket item to a Cut My variant for retail price comparison
- Covers acrylic (Clear, Black, White, pastels, fluorescents) and MDF

Scrape data is populated by the [Peeping Tom scraper](https://github.com/perspexmilo/peeping-tom), which runs automatically every Monday at 8am and posts results to Slack.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 App Router |
| Database | Supabase PostgreSQL + Prisma ORM |
| Auth | Supabase Auth |
| Styling | Tailwind CSS + shadcn/ui |
| Data fetching | TanStack Query v5 |
| AI parsing | Claude (Anthropic) via API |
| Hosting | Vercel |

---

## Project structure

```
app/
  (app)/
    database/             Material cost database — searchable, editable
    competitor-prices/    Peeping Tom dashboard
    price-updates/        Supplier email parser + context hints
    staged-changes/       Pending future-dated changes queue
  api/
    materials/            CRUD + bulk-update + CSV import
    competitor-prices/    Scrape results read API
    parse-email/          POST — runs AI parser
    parser-context/       GET/POST/DELETE — context hints for AI
    staged-changes/       CRUD
    cron/                 Vercel cron endpoint (applies staged changes daily)
components/
lib/
  ai/parser.ts            Claude extraction + fuzzy material matching
  db/                     Prisma query helpers
prisma/
  schema.prisma           Shared with peeping-tom scraper
scripts/
  run-import.mjs          Standalone bulk CSV import
```

---

## Development

```bash
npm install
npm run dev
```

Requires `.env.local`:

```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
CRON_SECRET=
```

```bash
npx prisma db push      # sync schema to Supabase (uses DIRECT_URL)
npx prisma generate     # regenerate client after schema changes
npx prisma studio       # local DB browser
node scripts/run-import.mjs <path-to-csv>   # bulk CSV import
```

---

## Competitors tracked

### Acrylic

| Competitor | Notes |
|---|---|
| Simply Plastics | Standard Chromium. Colour picker via Bootstrap modal. |
| Plastic People | Standard Chromium. React inputs need native value setter. |
| Cut Plastic Sheeting | Standard Chromium. WooCommerce — real keystrokes required. |
| Sheet Plastics | Stealth Chromium (Cloudflare). Price in `data-price-amount` attribute. |
| Plastic Sheet Shop | Standard Chromium. Calls site's own REST API directly. |
| Plastic Sheets | Stealth Chromium (Cloudflare Turnstile). Knockout.js inputs. |

### Wood

| Competitor | Notes |
|---|---|
| MDF Direct | Standard Chromium. WooCommerce + Uni CPO two-phase price stabilisation. |
| Wood Sheets | Stealth Chromium (Cloudflare). Intercepts Magento `cuttosizeprice` REST API response. |
| CNC Creations | Standard Chromium. WooCommerce + Uni CPO. |

---

## Automation

The scraper runs every **Monday at 8am London time** via Google Cloud Scheduler → Cloud Run Job. After each full run, a Slack message is posted showing any price changes grouped by competitor.

CI/CD: push to `master` on [peeping-tom](https://github.com/perspexmilo/peeping-tom) → GitHub Actions builds and pushes a new Docker image → Cloud Run Job updated automatically.

---

## Roadmap

- [ ] Historical sparkline charts per competitor
- [ ] More coloured variants (Mirror, Opal, etc.)
- [ ] Magento price push (Phase 2)
