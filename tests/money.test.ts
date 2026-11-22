// Unit tests for the BURSA money arithmetic (src/money.ts) and the
// session record (src/session.ts). Run with: npm test
// (tsx --test tests/money.test.ts)
// These tests ARE the "tests" check the kit proves — they prove the
// notionals, fees, P&L, portfolio series and order book are arithmetic
// from one session file, not typed-in numbers.
import test from "node:test";
import assert from "node:assert/strict";
import {
  divRoundHalfUp,
  feeBps,
  feeCents,
  feeRateLabel,
  finalHoldings,
  formatQty,
  formatUsd,
  formatUsdSigned,
  netCents,
  notionalCents,
  orderBook,
  portfolioSeries,
  portfolioSummary,
  realisedPnlCents,
  sessionTotals,
  tradeIds,
} from "../src/money.js";
import { defaultData, tradeById, validateSession } from "../src/session.js";
import { balanceAfterCents } from "../src/FillConfirmationEmail.js";

const EXPECTED_NOTIONAL: Record<string, number> = {
  T01: 59006, T02: 83050, T03: 14600, T04: 29560, T05: 41700, T06: 7400,
  T07: 117880, T08: 165950, T09: 36250, T10: 59240, T11: 83600, T12: 14700,
};
const EXPECTED_FEE: Record<string, number> = {
  T01: 59, T02: 66, T03: 15, T04: 30, T05: 33, T06: 7,
  T07: 94, T08: 166, T09: 29, T10: 59, T11: 84, T12: 12,
};
const EXPECTED_PNL: Record<string, number | null> = {
  T01: null, T02: null, T03: null, T04: -15, T05: 325, T06: 200,
  T07: null, T08: null, T09: null, T10: 234, T11: 550, T12: 200,
};
const EXPECTED_BALANCE_AFTER: Record<string, number> = {
  T01: 940935, T02: 857819, T03: 843204, T04: 872734, T05: 914401, T06: 921794,
  T07: 803820, T08: 637704, T09: 601425, T10: 660606, T11: 744122, T12: 758810,
};
const EXPECTED_PORTFOLIO: number[] = [
  1000000, 999941, 999875, 999860, 999887, 1000029, 1000122, 1000160, 1000144,
  1000365, 1000540, 1001006, 1001094,
];

test("session record is valid", () => {
  assert.deepEqual(validateSession(defaultData), []);
  assert.deepEqual(tradeIds(defaultData), [
    "T01", "T02", "T03", "T04", "T05", "T06",
    "T07", "T08", "T09", "T10", "T11", "T12",
  ]);
});

test("fee tiers are the standard schedule", () => {
  assert.equal(feeBps("maker"), 8);
  assert.equal(feeBps("taker"), 10);
  assert.equal(feeRateLabel(tradeById(defaultData, "T01")), "0.10%");
  assert.equal(feeRateLabel(tradeById(defaultData, "T02")), "0.08%");
});

test("notionals divide exactly and match hand computation", () => {
  for (const t of defaultData.trades) {
    assert.equal(notionalCents(t), EXPECTED_NOTIONAL[t.id], t.id);
  }
});

test("fees are round-half-up integer cents", () => {
  assert.equal(divRoundHalfUp(59006 * 10, 10000), 59);
  assert.equal(divRoundHalfUp(83050 * 8, 10000), 66);
  assert.equal(divRoundHalfUp(14600 * 10, 10000), 15);
  assert.equal(divRoundHalfUp(165950 * 10, 10000), 166);
  for (const t of defaultData.trades) {
    assert.equal(feeCents(t), EXPECTED_FEE[t.id], t.id);
  }
});

test("realised P&L is measured against the cost basis", () => {
  for (const t of defaultData.trades) {
    assert.equal(realisedPnlCents(t), EXPECTED_PNL[t.id], t.id);
  }
  // T04 is the session's one losing fill.
  assert.equal(realisedPnlCents(tradeById(defaultData, "T04")), -15);
  // Buys have no realised P&L.
  assert.equal(realisedPnlCents(tradeById(defaultData, "T01")), null);
});

test("session totals add up", () => {
  const t = sessionTotals(defaultData);
  assert.equal(t.trades, 12);
  assert.equal(t.buys, 6);
  assert.equal(t.sells, 6);
  assert.equal(t.pairs, 3);
  assert.equal(t.volumeCents, 712936);
  assert.equal(t.feesCents, 654);
  assert.equal(t.realisedPnlCents, 1494);
  assert.equal(t.wins, 5);
  assert.equal(t.losses, 1);
  assert.equal(t.bestFill.id, "T11");
  assert.equal(t.worstFill.id, "T04");
  assert.equal(t.biggestFill.id, "T08");
  assert.deepEqual(
    t.volumeByPair.map((v) => [v.pair, v.volumeCents]),
    [["BTC/USDT", 265686], ["ETH/USDT", 374300], ["CAKE/USDT", 72950]],
  );
});

test("USDT balance after every fill", () => {
  for (const t of defaultData.trades) {
    assert.equal(balanceAfterCents(defaultData, t), EXPECTED_BALANCE_AFTER[t.id], t.id);
  }
  assert.equal(balanceAfterCents(defaultData, tradeById(defaultData, "T12")), 758810);
});

test("portfolio series is exact at every step", () => {
  const series = portfolioSeries(defaultData);
  assert.equal(series.length, 13);
  assert.deepEqual(series.map((p) => p.valueCents), EXPECTED_PORTFOLIO);
  const s = portfolioSummary(defaultData);
  assert.equal(s.finalCents, 1001094);
  assert.equal(s.changeCents, 1094);
  assert.ok(Math.abs(s.changePct - 0.1094) < 0.0001);
});

test("final holdings are valued at the reference prices", () => {
  const h = finalHoldings(defaultData);
  assert.deepEqual(
    h.map((x) => [x.base, x.qtyUnits, x.valueCents]),
    [["BTC", 1500000, 88509], ["ETH", 750000, 124575], ["CAKE", 200000000, 29200]],
  );
  const total = h.reduce((sum, x) => sum + x.valueCents, 0);
  assert.equal(total, 242284);
  assert.equal(758810 + total, 1001094);
});

test("order book steps 0.05% from the reference price", () => {
  const book = orderBook("BTC/USDT", 5);
  assert.equal(book.bids.length, 5);
  assert.equal(book.asks.length, 5);
  assert.equal(book.bids[0].priceCents, 5897650);
  assert.equal(book.asks[0].priceCents, 5903550);
  assert.equal(book.asks[0].priceCents - book.bids[0].priceCents, 5900);
  for (let i = 1; i < 5; i++) {
    assert.ok(book.bids[i].priceCents < book.bids[i - 1].priceCents);
    assert.ok(book.asks[i].priceCents > book.asks[i - 1].priceCents);
  }
});

test("net is notional plus/minus fee, signed by side", () => {
  const buy = tradeById(defaultData, "T01");
  const sell = tradeById(defaultData, "T04");
  assert.equal(netCents(buy), -(59006 + 59));
  assert.equal(netCents(sell), 29560 - 30);
});

test("formatters never show a float", () => {
  assert.equal(formatUsd(165950), "$1,659.50");
  assert.equal(formatUsd(0), "$0.00");
  assert.equal(formatUsdSigned(550), "+$5.50");
  assert.equal(formatUsdSigned(-15), "-$0.15");
  assert.equal(formatUsdSigned(0), "$0.00");
  assert.equal(formatQty(tradeById(defaultData, "T01")), "0.01000000 BTC");
  assert.equal(formatQty(tradeById(defaultData, "T02")), "0.500000 ETH");
  assert.equal(formatQty(tradeById(defaultData, "T03")), "100.000000 CAKE");
});

test("brand is BURSA and labels are English only", () => {
  assert.equal(defaultData.brand, "BURSA");
  assert.equal(defaultData.taglineEn, "The exchange, on the record.");
  for (const label of [
    feeRateLabel(tradeById(defaultData, "T01")),
    formatUsd(165950),
    defaultData.taglineEn,
  ]) {
    assert.ok(!/jam|tahun|bulan|beli|jual/i.test(label), label);
  }
});

test("reference prices are the observed 22 Nov 2026 prices", () => {
  const btc = defaultData.pairs.find((p) => p.symbol === "BTC/USDT");
  const eth = defaultData.pairs.find((p) => p.symbol === "ETH/USDT");
  const cake = defaultData.pairs.find((p) => p.symbol === "CAKE/USDT");
  assert.equal(btc?.referencePriceCents, 5900600);
  assert.equal(eth?.referencePriceCents, 166100);
  assert.equal(cake?.referencePriceCents, 146);
  assert.match(defaultData.priceSource, /pancake\.xyz/);
  assert.match(defaultData.priceSource, /22 Nov 2026/);
});
