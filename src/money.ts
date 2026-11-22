// ---------------------------------------------------------------------------
// BURSA — money arithmetic (src/money.ts).
//
// Every money figure on every output is COMPUTED from src/session.ts —
// nothing is typed by hand in a template. The notional a trade shows
// in its fill email, on the dashboard, in the statement PDF and on the
// share card is the same notional, from the same function, so the kit
// can never disagree with itself about what a trade was worth.
//
// INTEGER MONEY ONLY. USDT amounts are integer cents; quantities are
// integer base units (satoshis for BTC, micro-units for ETH/CAKE).
// Notionals divide exactly to the cent by construction (the session
// quantities were chosen for it); fees use round-half-up integer
// division, the way real exchanges round. No float ever touches money
// — a float would let a cent drift between outputs.
// ---------------------------------------------------------------------------

import {
  defaultData,
  pairBySymbol,
  type SessionData,
  type Trade,
} from "./session.js";

/** Fee in basis points: maker 8 (0.08%), taker 10 (0.10%). */
export function feeBps(tier: Trade["feeTier"]): number {
  return tier === "maker" ? 8 : 10;
}

/** Integer division rounding half up (non-negative values only). */
export function divRoundHalfUp(n: number, d: number): number {
  return Math.floor((n + d / 2) / d);
}

/** Exact-division check: is n divisible by d with no remainder? */
export function dividesExactly(n: number, d: number): boolean {
  return n % d === 0;
}

/** Notional in integer cents: qty x price / 10^qtyDecimals. Throws if
 *  the division is not exact — a quantity that does not divide exactly
 *  is a data error, not a rounding opportunity. */
export function notionalCents(trade: Trade): number {
  const pair = pairBySymbol(trade.pair);
  const divisor = 10 ** pair.qtyDecimals;
  const product = trade.qtyUnits * trade.priceCents;
  if (!dividesExactly(product, divisor)) {
    throw new Error(
      `${trade.id}: notional ${trade.qtyUnits} x ${trade.priceCents} does not divide exactly by ${divisor}`,
    );
  }
  return product / divisor;
}

/** Fee in integer cents: notional x bps / 10000, rounded half up. */
export function feeCents(trade: Trade): number {
  return divRoundHalfUp(notionalCents(trade) * feeBps(trade.feeTier), 10000);
}

/** Realised P&L in integer cents, for SELL trades only: (fill - cost
 *  basis) x qty / 10^qtyDecimals. Negative when the fill is below the
 *  cost basis (T04 is the session's one losing fill). Null for buys —
 *  a buy has no realised P&L yet. */
export function realisedPnlCents(trade: Trade): number | null {
  if (trade.side !== "SELL" || trade.entryPriceCents === null) return null;
  const pair = pairBySymbol(trade.pair);
  const divisor = 10 ** pair.qtyDecimals;
  const product = (trade.priceCents - trade.entryPriceCents) * trade.qtyUnits;
  if (!dividesExactly(product, divisor)) {
    throw new Error(`${trade.id}: P&L does not divide exactly by ${divisor}`);
  }
  return product / divisor;
}

/** Net USDT received (sells) or paid (buys) in integer cents:
 *  sells credit notional minus fee; buys debit notional plus fee. */
export function netCents(trade: Trade): number {
  return trade.side === "SELL"
    ? notionalCents(trade) - feeCents(trade)
    : -(notionalCents(trade) + feeCents(trade));
}

/** "$1,659.50" — cents to dollars, always two decimals, thousands
 *  separators, no sign for zero/positive (use formatUsdSigned for P&L). */
export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars.toLocaleString("en-US")}.${String(rem).padStart(2, "0")}`;
}

/** "+$5.50" / "-$0.15" — signed, for P&L and changes. */
export function formatUsdSigned(cents: number): string {
  if (cents === 0) return "$0.00";
  return `${cents > 0 ? "+" : "-"}$${(Math.abs(cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "$59,006.00" — a price in cents. */
export function formatPrice(cents: number): string {
  return formatUsd(cents);
}

/** "0.01" / "0.5" / "100" — quantity with trailing zeros trimmed, for
 *  the full trades table, where the 8-decimal form squeezes the
 *  neighbouring columns. Display only; the computation stays exact. */
export function formatQtyTrimmed(trade: Trade): string {
  const full = formatQtyNumber(trade);
  if (!full.includes(".")) return full;
  const trimmed = full.replace(/0+$/, "").replace(/\.$/, "");
  return trimmed;
}

/** "0.01000000" — quantity number only (the Pair column names the asset). */
export function formatQtyNumber(trade: Trade): string {
  const pair = pairBySymbol(trade.pair);
  const whole = Math.floor(trade.qtyUnits / 10 ** pair.qtyDecimals);
  const frac = trade.qtyUnits % 10 ** pair.qtyDecimals;
  return `${whole}.${String(frac).padStart(pair.qtyDecimals, "0")}`;
}

/** "0.01000000 BTC" — quantity in the pair's own decimals. */
export function formatQty(trade: Trade): string {
  const pair = pairBySymbol(trade.pair);
  const whole = Math.floor(trade.qtyUnits / 10 ** pair.qtyDecimals);
  const frac = trade.qtyUnits % 10 ** pair.qtyDecimals;
  return `${whole}.${String(frac).padStart(pair.qtyDecimals, "0")} ${pair.base}`;
}

/** "0.08%" / "0.10%" — the fee tier as a rate label. */
export function feeRateLabel(trade: Trade): string {
  return trade.feeTier === "maker" ? "0.08%" : "0.10%";
}

/** "BUY 0.01000000 BTC @ $59,006.00" — one line per trade. */
export function tradeLabel(trade: Trade): string {
  return `${trade.side} ${formatQty(trade)} @ ${formatPrice(trade.priceCents)}`;
}

/** "T04 · SELL 0.00500000 BTC" — the compact trade key. */
export function tradeKey(trade: Trade): string {
  return `${trade.id} · ${trade.side} ${formatQty(trade)}`;
}

export interface SessionTotals {
  trades: number;
  buys: number;
  sells: number;
  pairs: number;
  volumeCents: number;
  feesCents: number;
  realisedPnlCents: number;
  wins: number;
  losses: number;
  /** Best fill = highest realised P&L sell. */
  bestFill: Trade;
  /** Worst fill = lowest realised P&L sell. */
  worstFill: Trade;
  /** Biggest fill = largest notional. */
  biggestFill: Trade;
  volumeByPair: Array<{ pair: string; volumeCents: number }>;
}

/** Session totals — all computed from the trades file. */
export function sessionTotals(data: SessionData): SessionTotals {
  const sells = data.trades.filter((t) => t.side === "SELL");
  const pnls = sells.map((t) => ({ trade: t, pnl: realisedPnlCents(t) ?? 0 }));
  const best = pnls.reduce((a, b) => (b.pnl > a.pnl ? b : a), pnls[0]);
  const worst = pnls.reduce((a, b) => (b.pnl < a.pnl ? b : a), pnls[0]);
  const biggest = data.trades.reduce(
    (a, b) => (notionalCents(b) > notionalCents(a) ? b : a),
    data.trades[0],
  );
  const volumeByPair = data.pairs.map((p) => ({
    pair: p.symbol,
    volumeCents: data.trades
      .filter((t) => t.pair === p.symbol)
      .reduce((s, t) => s + notionalCents(t), 0),
  }));
  return {
    trades: data.trades.length,
    buys: data.trades.filter((t) => t.side === "BUY").length,
    sells: sells.length,
    pairs: new Set(data.trades.map((t) => t.pair)).size,
    volumeCents: data.trades.reduce((s, t) => s + notionalCents(t), 0),
    feesCents: data.trades.reduce((s, t) => s + feeCents(t), 0),
    realisedPnlCents: pnls.reduce((s, x) => s + x.pnl, 0),
    wins: pnls.filter((x) => x.pnl > 0).length,
    losses: pnls.filter((x) => x.pnl < 0).length,
    bestFill: best.trade,
    worstFill: worst.trade,
    biggestFill: biggest,
    volumeByPair,
  };
}

export interface PortfolioPoint {
  /** After trade n (0 = session start). */
  step: number;
  usdtCents: number;
  holdingsCents: number;
  valueCents: number;
}

/** Portfolio value after every trade, marked at the session reference
 *  prices: USDT balance + holdings x reference price. Starting balance
 *  is the session's startingBalanceCents; every fill moves USDT by its
 *  net and moves the base holding by its quantity. Pure arithmetic —
 *  the dashboard chart draws this series, so the chart can never
 *  disagree with the statement. */
export function portfolioSeries(data: SessionData): PortfolioPoint[] {
  const points: PortfolioPoint[] = [];
  let usdt = data.startingBalanceCents;
  const holdings = new Map<string, number>();
  const mark = (): number => {
    let h = 0;
    for (const [symbol, qty] of holdings) {
      const pair = pairBySymbol(symbol);
      h += (qty * pair.referencePriceCents) / 10 ** pair.qtyDecimals;
    }
    return h;
  };
  points.push({ step: 0, usdtCents: usdt, holdingsCents: 0, valueCents: usdt });
  data.trades.forEach((t, i) => {
    usdt += netCents(t);
    const q = holdings.get(t.pair) ?? 0;
    holdings.set(t.pair, q + (t.side === "BUY" ? t.qtyUnits : -t.qtyUnits));
    const h = mark();
    if (!Number.isInteger(h)) throw new Error(`step ${i + 1}: holdings value ${h} is not integer cents`);
    points.push({ step: i + 1, usdtCents: usdt, holdingsCents: h, valueCents: usdt + h });
  });
  return points;
}

/** Final portfolio value and change vs the starting balance. */
export function portfolioSummary(data: SessionData): {
  finalCents: number;
  changeCents: number;
  changePct: number;
} {
  const series = portfolioSeries(data);
  const finalCents = series[series.length - 1].valueCents;
  const changeCents = finalCents - data.startingBalanceCents;
  return {
    finalCents,
    changeCents,
    changePct: (changeCents / data.startingBalanceCents) * 100,
  };
}

/** Holdings at the end of the session, valued at reference prices. */
export function finalHoldings(data: SessionData): Array<{
  pair: string;
  base: string;
  qtyUnits: number;
  valueCents: number;
}> {
  const qty = new Map<string, number>();
  for (const t of data.trades) {
    const q = qty.get(t.pair) ?? 0;
    qty.set(t.pair, q + (t.side === "BUY" ? t.qtyUnits : -t.qtyUnits));
  }
  return data.pairs.map((p) => {
    const q = qty.get(p.symbol) ?? 0;
    return {
      pair: p.symbol,
      base: p.base,
      qtyUnits: q,
      valueCents: (q * p.referencePriceCents) / 10 ** p.qtyDecimals,
    };
  });
}

/** A 5-level order book derived from a reference price: bids step
 *  down 0.05% per level, asks step up 0.05% — computed, never typed.
 *  Sizes are the session's own maker quantities for that pair. */
export function orderBook(pairSymbol: string, levels = 5): {
  bids: Array<{ priceCents: number; qtyUnits: number }>;
  asks: Array<{ priceCents: number; qtyUnits: number }>;
} {
  const pair = pairBySymbol(pairSymbol);
  const makerQtys = defaultData.trades
    .filter((t) => t.pair === pairSymbol && t.feeTier === "maker")
    .map((t) => t.qtyUnits);
  const size = makerQtys.length > 0 ? makerQtys[0] : 10 ** pair.qtyDecimals / 100;
  const bids: Array<{ priceCents: number; qtyUnits: number }> = [];
  const asks: Array<{ priceCents: number; qtyUnits: number }> = [];
  for (let i = 1; i <= levels; i++) {
    const bidPrice = Math.round((pair.referencePriceCents * (10000 - i * 5)) / 10000);
    const askPrice = Math.round((pair.referencePriceCents * (10000 + i * 5)) / 10000);
    bids.push({ priceCents: bidPrice, qtyUnits: size * i });
    asks.push({ priceCents: askPrice, qtyUnits: size * i });
  }
  return { bids, asks };
}

/** "T01" .. "T12" — the trade ids in session order. */
export function tradeIds(data: SessionData): string[] {
  return data.trades.map((t) => t.id);
}

export { defaultData };
export type { SessionData, Trade };
