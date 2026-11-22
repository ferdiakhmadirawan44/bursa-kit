# BURSA — Exchange Trade Kit

**One trading session file → every trade record out, in 4 roots.**
Entry for the Unlayer Hyper Elements Template Challenge
(deadline 29 Nov 2026 23:59 UTC). The first exchange-themed entry in
the whole contest.

BURSA (Indonesian for bourse/exchange) is a fictional template brand —
not a real exchange. One session file (`src/session.ts`) produces 16
outputs: 12 fill-confirmation emails, a trading dashboard page, a
3-page monthly statement PDF, a trade recap card and a market
snapshot card. Every number on every output comes from the same file,
so the trade count, volume and fee total are identical everywhere —
the proof strip at the foot of each output says so, and the gate
asserts it.

## The session

22 November 2026 · 12 trades · 6 buys / 6 sells · 3 pairs
(BTC/USDT, ETH/USDT, CAKE/USDT) · maker and taker fills.

| | |
|---|---|
| Volume | **$7,129.36** |
| Fees paid | **$6.54** |
| Realised P&L | **+$14.94** (5 winning fills, 1 losing fill) |
| Best fill | T11 — SELL 0.5 ETH @ $1,672.00, +$5.50 |
| Worst fill | T04 — SELL 0.005 BTC @ $59,120.00, −$0.15 |
| Biggest fill | T08 — BUY 1 ETH @ $1,659.50, $1,659.50 notional |
| Portfolio at close | **$10,010.94** (+$10.94, +0.11% from $10,000.00) |
| Holdings at close | BTC 0.015 ($885.09) · ETH 0.75 ($1,245.75) · CAKE 200 ($292.00) |

**Real data rules, sample session.** Reference prices are BTC $59,006,
ETH $1,661, CAKE $1.46 — observed on pancake.xyz, 22 Nov 2026. The
fee schedule is the standard spot schedule: maker 0.08%, taker
0.10%, rounded half up to the cent. The session, trader (Alex) and
account (BURSA-ACC-001) are template sample data. All money is
computed in integer minor units (cents for USDT) — never float money
— with unit tests proving it (`tests/money.test.ts`, 14 tests).

## Outputs (16)

| Root | Template | Output |
|---|---|---|
| Email × 12 | `src/FillEmailT01.tsx` … `FillEmailT12.tsx` | One fill confirmation per trade: pair, side, qty, fill price, fee, balance after fill, plain-text twin from the same render. Largest email 36.2 KB — far under Gmail's 100 KB clip limit. |
| Page × 1 | `src/TradingDashboardPage.tsx` | Trading dashboard: centred hero + glowing CTA, portfolio summary with orange area chart, order book (BTC/USDT, best bid $58,976.50 / best ask $59,035.50, spread $59.00) + top assets, recent fills, session stats, slim all-fills table. |
| Document × 1 | `src/MonthlyStatementPdf.tsx` | 3-page A4 statement PDF: cover + summary, full 9-column trades table, fees & P&L per fill. |
| Canvas × 2 | `src/TradeRecapCard.tsx` (1200×630) | Best fill of the session (T11) as a share card. |
| Canvas × 2 | `src/MarketSnapshotCard.tsx` (1080×1080) | Session stats as a square share card: stat grid + volume-by-pair bars. |

## Design

Dark warm near-black `#050201`, vivid orange `#F4550D`, amber
`#EE8F33`, warm off-white `#FBFAF7` — after the Dribbble shot
"Crypto Trading — Safe & Easy Tools Landing Page" by Kris Anfalova
(**design only**: the layout, palette and mood are the reference;
every word and the BURSA brand are our own work). Centred hero,
glowing orange CTA pill, 3-column dashboard mockup (sidebar /
portfolio summary with orange area chart / swap panel), rounded
cards, pill buttons, minimal line icons, clean geometric sans.
Space Grotesk for display headlines, Inter for body and figures
(static TTF instances in `assets/fonts/` — variable fonts crash
satori). Gains use orange, in the Dribbble style; no invented
green/red semantics.

## How to run

```bash
npm install
npm test          # 14 unit tests (money math, fee tiers, P&L)
npm run gate      # check + render + preview + validate + invariants
npm run preview   # 12 fill emails × 7 email clients
npm run typecheck # tsc --noEmit
```

`npm run gate` is the proof: it must pass with check 0/0/0, render
0/0/0, preview 0/0/0, validate() 0 errors 0 warnings on all 16
templates, 15 invariants, and writes `out/checks.json`. It copies
the rendered outputs + 156 client previews into `examples/` and
writes a Pages-ready `examples/index.html` — that folder is the live
preview (rendered examples + GitHub Pages-ready output), which the
strongest rivals lack. `docs/` holds rendered screenshots of the
dashboard page, the PDF pages and one fill email.

## File map

```
src/
  session.ts            single source of truth (12 trades, pairs, fees)
  money.ts              integer-cent engine: notionals, fees, P&L,
                        balances, portfolio series, holdings, order book
  theme.ts              BURSA palette, fonts, theme tokens
  shared.tsx            GlowBand, BursaMark, SidePill, FeeBadge,
                        PnlBadge, TradesTable (full + slim), PortfolioChart,
                        ProofStrip, SampleNote
  FillConfirmationEmail.tsx   the shared email + balance/volume-so-far
  FillEmailT01..T12.tsx       thin wrappers, one Email root per trade
  TradingDashboardPage.tsx    Page root (renders at 600px — stacks)
  MonthlyStatementPdf.tsx     Document root, 3 pages
  TradeRecapCard.tsx          Canvas 1200×630
  MarketSnapshotCard.tsx      Canvas 1080×1080
tests/money.test.ts     14 tests
scripts/gate.tsx        the gate: check/render/preview/validate/
                        invariants → out/checks.json + examples/
assets/fonts/           Inter + Space Grotesk static TTFs + DejaVu
examples/               live preview (28 files + 156 client previews)
docs/                   screenshots of the rendered outputs
```

## Rival benchmarks cleared

- **#310 MEND** (40 emails + 7-page PDF, gate 0/0/0, validate gate,
  email-client proof, 1.6s batch, no live preview) — matched on
  4 roots, gate 0/0/0, validate gate, email-client proof (12 emails ×
  7 clients); **beaten on live preview** (examples/ + Pages-ready
  index.html).
- **#308 WAYFARER** (20 files, 4 output types, gate 0/0/0, validate
  gate, email-client proof, no live preview) — matched on breadth
  (16 outputs, 4 roots); beaten on live preview.
- **#293 Latchkey** (computed risk scoring + haversine) — matched
  with equally real computed logic (integer money, fees, P&L,
  portfolio series, order book — all tested).
- **#301 The Listing** (all 4 roots, computed money, live preview)
  — matched on all three.
- **#303 Foldline** (17 tests, live preview, most original) —
  matched on tests (14 unit tests + 15 gate invariants) and live
  preview, with a distinctive dark-orange visual identity.

Edges: first exchange-themed entry in the contest; real data rules
(observed prices + real fee schedule) vs fictional sample data;
English-first with an Indonesian brand name.
