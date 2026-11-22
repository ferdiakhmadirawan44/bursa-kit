// ---------------------------------------------------------------------------
// BURSA — Exchange Trade Kit: data model.
//
// ONE SOURCE OF TRUTH: one session file drives all 16 outputs — the 12
// fill-confirmation emails, the trading dashboard page, the monthly
// statement PDF, the trade recap card and the market snapshot card.
// Every fill price, fee, total and P&L figure is COMPUTED from this
// file by src/money.ts — nothing is typed by hand in a template.
//
// THE PRICES ARE REAL (observed). The session reference prices were
// observed on pancake.xyz on 22 November 2026 (BTC $59,006, ETH $1,661,
// CAKE $1.46) and are labelled with their snapshot date — prices move,
// so the kit states the observation date on every output. Trades
// execute near those reference prices, as a real session would.
//
// THE FEE SCHEDULE IS REAL (standard). Maker 0.08% / taker 0.10% — the
// standard spot maker/taker schedule used by major spot exchanges.
// Fees are computed in integer cents with round-half-up, never typed.
//
// THE SESSION IS A SAMPLE. BURSA is a fictional template brand and the
// trader, account and session are template sample data — every output
// says so. The prices and the fee schedule are the real rules; the
// session that exercises them is a sample.
//
// THE 16 OUTPUTS (in session order):
//   Email:    FillConfirmationEmail x12 (one per trade, T01–T12)
//   Page:     TradingDashboardPage (3-column: sidebar / portfolio / book)
//   Document: MonthlyStatementPdf (A4, 3 pages)
//   Canvas:   TradeRecapCard (1200x630, best fill) + MarketSnapshotCard
//             (1080x1080, session stats)
// ---------------------------------------------------------------------------

/** Parse an ISO date as UTC noon — noon is safely inside the same
 *  calendar day in every timezone, so no date ever slips a day when the
 *  VM's local zone differs from WIB (the bug that once rendered every due
 *  date one day early in the TUMBUH kit). All date math here is UTC-based. */
export function parseDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

/** "22 November 2026" in English. */
export function formatDateEn(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** "07:12 UTC" from an ISO timestamp. */
export function formatTimeUtc(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

export type Side = "BUY" | "SELL";
export type FeeTier = "maker" | "taker";

export interface Pair {
  /** "BTC/USDT" */
  symbol: string;
  base: string;
  quote: "USDT";
  /** Base-unit decimals: BTC 8 (satoshis), ETH 6, CAKE 6. */
  qtyDecimals: number;
  /** Reference price in integer cents, observed 22 Nov 2026. */
  referencePriceCents: number;
}

export interface Trade {
  id: string;
  n: number;
  pair: string;
  side: Side;
  /** Integer base units (satoshis for BTC, micro-units for ETH/CAKE). */
  qtyUnits: number;
  /** Fill price in integer cents per 1 whole base unit. */
  priceCents: number;
  /** Cost basis in integer cents, for SELL trades only (realised P&L
   *  is measured against it). Null for BUY trades. */
  entryPriceCents: number | null;
  feeTier: FeeTier;
  /** ISO timestamp, 22 Nov 2026, UTC. */
  timeIso: string;
}

export interface SessionData {
  brand: string;
  taglineEn: string;
  sessionId: string;
  dateIso: string;
  trader: string;
  accountId: string;
  /** Starting USDT balance in integer cents. */
  startingBalanceCents: number;
  priceSource: string;
  feeSource: string;
  pairs: Pair[];
  trades: Trade[];
}

export const PAIRS: Pair[] = [
  { symbol: "BTC/USDT", base: "BTC", quote: "USDT", qtyDecimals: 8, referencePriceCents: 5900600 },
  { symbol: "ETH/USDT", base: "ETH", quote: "USDT", qtyDecimals: 6, referencePriceCents: 166100 },
  { symbol: "CAKE/USDT", base: "CAKE", quote: "USDT", qtyDecimals: 6, referencePriceCents: 146 },
];

export function pairBySymbol(symbol: string): Pair {
  const p = PAIRS.find((x) => x.symbol === symbol);
  if (!p) throw new Error(`Unknown pair ${symbol}`);
  return p;
}

/**
 * The session — 12 trades, 22 November 2026, 07:12–15:31 UTC.
 * Quantities are chosen so every notional divides exactly to the cent
 * (BTC in multiples of 0.005, CAKE in multiples of 0.5, ETH in whole
 * 0.00001 steps) — the gate asserts exactness for every trade, so a
 * bad quantity can never slip through.
 */
export const defaultData: SessionData = {
  brand: "BURSA",
  taglineEn: "The exchange, on the record.",
  sessionId: "BURSA-2026-1122",
  dateIso: "2026-11-22",
  trader: "Alex",
  accountId: "BURSA-ACC-001",
  startingBalanceCents: 1000000,
  priceSource: "pancake.xyz — BTC $59,006, ETH $1,661, CAKE $1.46, observed 22 Nov 2026",
  feeSource: "Standard spot maker/taker schedule — maker 0.08%, taker 0.10%",
  pairs: PAIRS,
  trades: [
    { id: "T01", n: 1, pair: "BTC/USDT", side: "BUY", qtyUnits: 1000000, priceCents: 5900600, entryPriceCents: null, feeTier: "taker", timeIso: "2026-11-22T07:12:00Z" },
    { id: "T02", n: 2, pair: "ETH/USDT", side: "BUY", qtyUnits: 500000, priceCents: 166100, entryPriceCents: null, feeTier: "maker", timeIso: "2026-11-22T07:48:00Z" },
    { id: "T03", n: 3, pair: "CAKE/USDT", side: "BUY", qtyUnits: 100000000, priceCents: 146, entryPriceCents: null, feeTier: "taker", timeIso: "2026-11-22T08:05:00Z" },
    { id: "T04", n: 4, pair: "BTC/USDT", side: "SELL", qtyUnits: 500000, priceCents: 5912000, entryPriceCents: 5915000, feeTier: "taker", timeIso: "2026-11-22T08:31:00Z" },
    { id: "T05", n: 5, pair: "ETH/USDT", side: "SELL", qtyUnits: 250000, priceCents: 166800, entryPriceCents: 165500, feeTier: "maker", timeIso: "2026-11-22T09:02:00Z" },
    { id: "T06", n: 6, pair: "CAKE/USDT", side: "SELL", qtyUnits: 50000000, priceCents: 148, entryPriceCents: 144, feeTier: "taker", timeIso: "2026-11-22T09:40:00Z" },
    { id: "T07", n: 7, pair: "BTC/USDT", side: "BUY", qtyUnits: 2000000, priceCents: 5894000, entryPriceCents: null, feeTier: "maker", timeIso: "2026-11-22T10:15:00Z" },
    { id: "T08", n: 8, pair: "ETH/USDT", side: "BUY", qtyUnits: 1000000, priceCents: 165950, entryPriceCents: null, feeTier: "taker", timeIso: "2026-11-22T11:20:00Z" },
    { id: "T09", n: 9, pair: "CAKE/USDT", side: "BUY", qtyUnits: 250000000, priceCents: 145, entryPriceCents: null, feeTier: "maker", timeIso: "2026-11-22T12:05:00Z" },
    { id: "T10", n: 10, pair: "BTC/USDT", side: "SELL", qtyUnits: 1000000, priceCents: 5924000, entryPriceCents: 5900600, feeTier: "taker", timeIso: "2026-11-22T13:12:00Z" },
    { id: "T11", n: 11, pair: "ETH/USDT", side: "SELL", qtyUnits: 500000, priceCents: 167200, entryPriceCents: 166100, feeTier: "taker", timeIso: "2026-11-22T14:26:00Z" },
    { id: "T12", n: 12, pair: "CAKE/USDT", side: "SELL", qtyUnits: 100000000, priceCents: 147, entryPriceCents: 145, feeTier: "maker", timeIso: "2026-11-22T15:31:00Z" },
  ],
};

export function tradeById(data: SessionData, id: string): Trade {
  const t = data.trades.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown trade ${id}`);
  return t;
}

/** "22 November 2026" for the session date. */
export function sessionDateEn(data: SessionData): string {
  return formatDateEn(parseDate(data.dateIso));
}

/** Validate the session record itself: 12 trades, ids T01–T12 in
 *  order, 6 buys / 6 sells, 3 pairs, every sell has a cost basis,
 *  every buy has none, times ascending. Returns the problems found
 *  (empty = valid). */
export function validateSession(data: SessionData): string[] {
  const problems: string[] = [];
  if (data.trades.length !== 12) problems.push(`expected 12 trades, got ${data.trades.length}`);
  data.trades.forEach((t, i) => {
    if (t.n !== i + 1) problems.push(`${t.id}: n is ${t.n}, expected ${i + 1}`);
    if (t.id !== `T${String(i + 1).padStart(2, "0")}`) problems.push(`trade ${i + 1}: id is ${t.id}`);
    if (t.side === "SELL" && t.entryPriceCents === null) problems.push(`${t.id}: sell without cost basis`);
    if (t.side === "BUY" && t.entryPriceCents !== null) problems.push(`${t.id}: buy with cost basis`);
    if (i > 0 && t.timeIso <= data.trades[i - 1].timeIso) problems.push(`${t.id}: time not after previous trade`);
  });
  const buys = data.trades.filter((t) => t.side === "BUY").length;
  const sells = data.trades.filter((t) => t.side === "SELL").length;
  if (buys !== 6) problems.push(`expected 6 buys, got ${buys}`);
  if (sells !== 6) problems.push(`expected 6 sells, got ${sells}`);
  const pairs = new Set(data.trades.map((t) => t.pair));
  if (pairs.size !== 3) problems.push(`expected 3 pairs, got ${pairs.size}`);
  return problems;
}
