# AGENTS.md — BURSA Exchange Trade Kit

Invariants learned building this kit (and the eight kits before it:
LOKER + seven submitted entries). Do not break them; the gate asserts
the important ones.

## Design invariants

- **English-first.** All outputs are full English. The brand name
  "BURSA" (Indonesian for bourse/exchange) is the ONLY Indonesian
  word anywhere — every other label is English. The gate asserts
  labels are English and no borrowed brand or copy appears.
- **Dribbble palette (design only — never the shot's text or brand).**
  Warm near-black `#050201` background, vivid orange `#F4550D`
  (primary, chart line, active states), amber `#EE8F33` (gradient
  highlights), warm off-white `#FBFAF7` (headlines/figures), muted
  warm grey-brown `#B8AFA2` (secondary text), burnt orange-red
  `#B8310A` (glow shadows). One accent colour; gains use orange, never
  invented green/red semantics.
- **One session file.** `src/session.ts` is the single source of
  truth: every trade's pair, side, qty, price, fee tier and timestamp
  lives there. Nothing is typed twice. Session date, reference prices
  and totals are computed values only.
- **All money is integer minor units** (cents for USDT, satoshis
  where sensible) — never float money. Fees are round-half-up
  (`feeCents` in `money.ts`). Realised P&L is shown for sells only,
  against the cost basis recorded on each sell. The gate asserts the
  exact computed values (volume $7,129.36, fees $6.54, P&L +$14.94).
- **All prices trace to a real observation.** Reference prices are
  BTC $59,006, ETH $1,661, CAKE $1.46 — observed on pancake.xyz,
  22 Nov 2026. The fee schedule is the standard spot schedule
  (maker 0.08%, taker 0.10%). BURSA is a fictional template brand —
  say so on every output (ProofStrip + SampleNote). The session,
  trader and account are template sample data; the prices are real
  and the fee schedule is the real standard.
- **Balance and volume-so-far are cumulative in session order.**
  `balanceAfterCents` and `volumeSoFarCents` (in
  `FillConfirmationEmail.tsx`) walk the trades in order from the
  starting balance; the "volume so far" on email T01 is $590.06, not
  the full session volume. The gate asserts both endpoints.
- **Qty display:** full decimals in the fill emails (0.01000000 BTC);
  trailing zeros trimmed in the statement PDF table (0.01) so the
  9-column table fits A4 portrait — display only, computation stays
  exact (`formatQtyTrimmed` in `money.ts`).

## Component invariants (from the ADOPSI + LOKER builds)

- `TableCell` never contains `Text` — put `Span` inside the cell.
- `Text` cannot contain `Text`.
- `Svg` never renders to Email — the glow band is a `Row` of ▪
  glyphs in Email (`GlowBandEmail`), `Svg` only on Page/Document/Canvas.
- `borderTop` only on `Divider`.
- `Row` has no `margin` style.
- `marginTop` does not exist on `TextStyle` — use the parent
  `Column`'s `gap` instead.
- PDF headings that contain non-ASCII need an explicit DejaVu
  `fontFamily`.
- In Email, `Image` width must fit the 542px card — a 600px image
  triggers `layout/overflow`.
- **Gmail clips emails over 100 KB.** The fill emails are pure type
  and tables with no images and no GIF — largest is 36.2 KB. A hero
  GIF was considered and skipped: a fill email does not need one.
- **The Page root renders at 600px** — a 3-column dashboard stacks
  (documented in `TradingDashboardPage.tsx`). The 9-column trades
  table wraps at 600px, so the Page uses the slim 5-column variant
  (`TradesTable slim`: #, Pair, Side, Notional, P&L); the full
  9-column table lives only in the statement PDF.
- **Stroked SVG lines are `Line` segments, not a stroked `Path`.**
  The framework rejects `fill: "none"` on Path, and a stroked Path
  fills its implicit closed shape. The portfolio chart draws its line
  as 12 `Line` segments over a filled area `Path`.

## Font invariants

- **Variable TTFs crash satori's opentype parser** (parseFvarAxis).
  Ship STATIC TTF instances only, made with fontTools
  `varLib.instancer` (pin all axes). Google Fonts `l/font` URLs
  return EOT — unusable. Valid sources: Inter + Space Grotesk
  variable TTFs from the google/fonts GitHub repo.
- Registered print fonts: Space Grotesk 500/700/800, Inter
  400/700/800, DejaVu Sans Mono 400/700/800. Any weight used in a
  template must be registered, or the linter warns (Space Grotesk
  800 was added for this kit).
- Email/Page use the font stack with Inter fallback — email clients
  do not reliably load web fonts.

## Verification invariants

- `npm run gate` must pass: check 0/0/0, render 0/0/0, preview 0/0/0,
  validate() 0 errors 0 warnings on all 16 templates, 15 invariants,
  14 unit tests, examples copied (28 rendered files + 156 client
  previews). Last gate: batch 23.1s.
- **Always visually check Canvas outputs after any layout edit** —
  the linter does not catch visual problems (checked 2026-11-22:
  both cards, all 3 PDF pages, the dashboard page at 600px, one fill
  email in Chrome). Layout fixes made from visual checks: stretched
  SELL pill (wrapped in a fixed-width Column), empty card bottoms
  (session strip + larger paddings), cramped PDF table (trimmed qty,
  wider cell padding), wrapping dashboard table (slim variant).
- Run the tests explicitly: `npx tsx --test tests/money.test.ts`
  (14 tests: notionals, fees, P&L, balances, portfolio series,
  order book).
- `examples/` is the live preview: rendered HTML/PDF/PNG + client
  previews + a Pages-ready `index.html`. `docs/` holds rendered
  screenshots of the dashboard, the PDFs and one email.
- Never claim a check passed if it did not run. The gate writes its
  proof to `out/checks.json`.
