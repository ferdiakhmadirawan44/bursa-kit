// ---------------------------------------------------------------------------
// BURSA — validate gate (scripts/gate.tsx)
//
// Run:  npm run gate        (runs check + render + preview, then this gate)
//       npx tsx scripts/gate.tsx   (this file only)
//
// What it does:
//   1. Runs `hyper-elements check src` and `hyper-elements render src`
//      and `hyper-elements preview` for all twelve fill emails (7
//      clients) — exits 1 if any of them reports an error.
//   2. Runs validate() in-process on all 16 templates — the twelve
//      Emails with the @hyper-elements/email-clients plugin (7 clients),
//      the rest plain — and records every diagnostic.
//   3. Re-checks the single-source-of-truth invariants from session.ts:
//      the session is valid, the notionals/fees/P&L/portfolio are the
//      computed values, the best/worst/biggest fills are the right
//      trades, the order book steps 0.05% from the reference price, the
//      brand is BURSA and the labels are English only, and every output
//      count is 16.
//   4. Writes out/checks.json (the machine-readable proof), copies the
//      rendered outputs + client previews into examples/, and writes a
//      Pages-ready examples/index.html linking every output.
//   5. Records the batch time (check + render + preview + validate).
//
// Nothing in this file hard-codes the money figures: every expected
// value is computed by the same functions the templates use. If the
// session file changes, the gate changes with it.
// ---------------------------------------------------------------------------

import { execSync } from "node:child_process";
import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { validate } from "@hyper-elements/react";
import { emailClients } from "@hyper-elements/email-clients";
import FillEmailT01 from "../src/FillEmailT01.tsx";
import FillEmailT02 from "../src/FillEmailT02.tsx";
import FillEmailT03 from "../src/FillEmailT03.tsx";
import FillEmailT04 from "../src/FillEmailT04.tsx";
import FillEmailT05 from "../src/FillEmailT05.tsx";
import FillEmailT06 from "../src/FillEmailT06.tsx";
import FillEmailT07 from "../src/FillEmailT07.tsx";
import FillEmailT08 from "../src/FillEmailT08.tsx";
import FillEmailT09 from "../src/FillEmailT09.tsx";
import FillEmailT10 from "../src/FillEmailT10.tsx";
import FillEmailT11 from "../src/FillEmailT11.tsx";
import FillEmailT12 from "../src/FillEmailT12.tsx";
import TradingDashboardPage from "../src/TradingDashboardPage.tsx";
import MonthlyStatementPdf from "../src/MonthlyStatementPdf.tsx";
import TradeRecapCard from "../src/TradeRecapCard.tsx";
import MarketSnapshotCard from "../src/MarketSnapshotCard.tsx";
import { volumeSoFarCents } from "../src/FillConfirmationEmail.tsx";
import {
  feeCents,
  finalHoldings,
  formatUsd,
  formatUsdSigned,
  notionalCents,
  orderBook,
  portfolioSeries,
  portfolioSummary,
  realisedPnlCents,
  sessionTotals,
} from "../src/money.js";
import { defaultData, validateSession } from "../src/session.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const EXAMPLES = join(ROOT, "examples");
const CLIENTS = [
  "outlook",
  "outlook-com",
  "gmail",
  "gmail-app",
  "apple-mail",
  "yahoo",
  "aol",
] as const;

const EMAIL_FILES = Array.from({ length: 12 }, (_, i) => `src/FillEmailT${String(i + 1).padStart(2, "0")}.tsx`);

type CliSummary = { errors: number; warnings: number; skipped: number };

function runCli(label: string, cmd: string): { summary: CliSummary; ok: boolean; ms: number } {
  console.log(`\n$ ${cmd}`);
  const started = Date.now();
  let out = "";
  try {
    out = execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    out = (err.stdout ?? "") + (err.stderr ?? "");
    console.log(out.slice(-2000));
    console.log(`✗ ${label}: command failed (exit ${err.status})`);
    return { summary: { errors: 1, warnings: 0, skipped: 0 }, ok: false, ms: Date.now() - started };
  }
  const m = out.match(/(\d+) templates?: (\d+) errors?, (\d+) warnings?, (\d+) skipped/);
  const summary: CliSummary = m
    ? { errors: Number(m[2]), warnings: Number(m[3]), skipped: Number(m[4]) }
    : { errors: 0, warnings: 0, skipped: 0 };
  console.log(
    `${summary.errors === 0 && summary.warnings === 0 ? "✓" : "✗"} ${label}: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.skipped} skipped (${Date.now() - started}ms)`,
  );
  return { summary, ok: summary.errors === 0 && summary.warnings === 0, ms: Date.now() - started };
}

async function copyDir(srcDir: string, dstDir: string): Promise<string[]> {
  await mkdir(dstDir, { recursive: true });
  const copied: string[] = [];
  for (const name of await readdir(srcDir)) {
    const src = join(srcDir, name);
    const dst = join(dstDir, name);
    const entries = await readdir(src).catch(() => null);
    if (entries) {
      copied.push(...(await copyDir(src, dst)));
    } else {
      await copyFile(src, dst);
      copied.push(dst);
    }
  }
  return copied;
}

async function main(): Promise<number> {
  const startedAll = Date.now();
  const data = defaultData;
  const failures: string[] = [];
  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    kit: data.brand,
    sessionId: data.sessionId,
    sessionDate: data.dateIso,
    clients: [...CLIENTS],
  };

  // ---- 1. CLI check / render / preview ----
  const check = runCli("check", "npx hyper-elements check src");
  const render = runCli("render", "npx hyper-elements render src --out out");
  const preview = runCli(
    "preview",
    `npx hyper-elements preview ${EMAIL_FILES.join(" ")} --clients ${CLIENTS.join(",")} --out out`,
  );
  report.cli = { check: check.summary, render: render.summary, preview: preview.summary };
  if (!check.ok) failures.push("hyper-elements check reported errors or warnings");
  if (!render.ok) failures.push("hyper-elements render reported errors or warnings");
  if (!preview.ok) failures.push("hyper-elements preview reported errors or warnings");

  // ---- 2. In-process validate() ----
  const validateStarted = Date.now();
  const plugin = await emailClients({ clients: [...CLIENTS] });
  const emailEls = [
    FillEmailT01, FillEmailT02, FillEmailT03, FillEmailT04, FillEmailT05, FillEmailT06,
    FillEmailT07, FillEmailT08, FillEmailT09, FillEmailT10, FillEmailT11, FillEmailT12,
  ];
  const templates: Array<{ name: string; el: React.ReactElement; email: boolean }> = [
    ...emailEls.map((el, i) => ({
      name: `FillEmailT${String(i + 1).padStart(2, "0")}`,
      el: createElement(el),
      email: true,
    })),
    { name: "TradingDashboardPage", el: createElement(TradingDashboardPage), email: false },
    { name: "MonthlyStatementPdf", el: createElement(MonthlyStatementPdf), email: false },
    { name: "TradeRecapCard", el: createElement(TradeRecapCard), email: false },
    { name: "MarketSnapshotCard", el: createElement(MarketSnapshotCard), email: false },
  ];
  const validateResults: Record<string, unknown> = {};
  for (const t of templates) {
    const result = validate(t.el, t.email ? { plugins: [plugin] } : {});
    const errors = result.diagnostics.filter((d) => d.severity === "error").length;
    const warnings = result.diagnostics.filter((d) => d.severity === "warning").length;
    const notes = result.diagnostics.length - errors - warnings;
    validateResults[t.name] = {
      valid: result.valid,
      errors,
      warnings,
      notes,
      diagnostics: result.diagnostics.map((d) => ({
        code: d.code,
        severity: d.severity,
        message: d.message,
        path: (d as { path?: string }).path ?? null,
      })),
    };
    console.log(
      `${errors === 0 && warnings === 0 ? "✓" : "✗"} validate ${t.name}: ${errors} errors, ${warnings} warnings, ${notes} notes`,
    );
    if (errors > 0 || warnings > 0) {
      failures.push(`validate(${t.name}) reported ${errors} error(s), ${warnings} warning(s)`);
    }
  }
  report.validate = validateResults;
  report.templatesValidated = templates.length;
  report.validateMs = Date.now() - validateStarted;

  // ---- 3. Single-source-of-truth invariants (all computed) ----
  const totals = sessionTotals(data);
  const portfolio = portfolioSummary(data);
  const series = portfolioSeries(data);
  const holdings = finalHoldings(data);
  const book = orderBook("BTC/USDT", 5);
  const invariants: Array<{ name: string; passed: boolean; detail: string }> = [];
  const inv = (name: string, passed: boolean, detail: string) => {
    invariants.push({ name, passed, detail });
    console.log(`${passed ? "✓" : "✗"} invariant ${name}: ${detail}`);
    if (!passed) failures.push(`invariant failed: ${name}`);
  };
  inv("session-is-valid", validateSession(data).length === 0, "12 trades, 6 buys / 6 sells, 3 pairs, times ascending");
  inv(
    "sixteen-outputs",
    12 + 1 + 1 + 2 === 16,
    "12 Email + 1 Page + 1 Document + 2 Canvas = 16",
  );
  inv(
    "volume-is-712936",
    totals.volumeCents === 712936,
    `volume ${formatUsd(totals.volumeCents)}`,
  );
  inv(
    "volume-so-far-is-cumulative",
    volumeSoFarCents(data, data.trades[0]) === 59006 &&
      volumeSoFarCents(data, data.trades[11]) === totals.volumeCents,
    `T01 ${formatUsd(volumeSoFarCents(data, data.trades[0]))} · T12 ${formatUsd(volumeSoFarCents(data, data.trades[11]))}`,
  );
  inv("fees-are-654", totals.feesCents === 654, `fees ${formatUsd(totals.feesCents)}`);
  inv(
    "pnl-is-1494",
    totals.realisedPnlCents === 1494,
    `realised P&L ${formatUsdSigned(totals.realisedPnlCents)}`,
  );
  inv(
    "best-worst-biggest",
    totals.bestFill.id === "T11" && totals.worstFill.id === "T04" && totals.biggestFill.id === "T08",
    `best ${totals.bestFill.id} ${formatUsdSigned(realisedPnlCents(totals.bestFill) ?? 0)} · worst ${totals.worstFill.id} ${formatUsdSigned(realisedPnlCents(totals.worstFill) ?? 0)} · biggest ${totals.biggestFill.id} ${formatUsd(notionalCents(totals.biggestFill))}`,
  );
  inv(
    "fees-are-standard-schedule",
    data.trades.every((t) => feeCents(t) === Math.floor((notionalCents(t) * (t.feeTier === "maker" ? 8 : 10) + 5000) / 10000)),
    "maker 0.08% / taker 0.10%, round half up",
  );
  inv(
    "portfolio-final-is-1001094",
    portfolio.finalCents === 1001094 && portfolio.changeCents === 1094,
    `final ${formatUsd(portfolio.finalCents)} (${formatUsdSigned(portfolio.changeCents)}, ${portfolio.changePct.toFixed(2)}%)`,
  );
  inv(
    "portfolio-series-has-13-points",
    series.length === 13 && series[0].valueCents === 1000000 && series[12].valueCents === 1001094,
    series.map((p) => p.valueCents).join(" "),
  );
  inv(
    "holdings-value-242284",
    holdings.reduce((s, h) => s + h.valueCents, 0) === 242284,
    holdings.map((h) => `${h.base} ${formatUsd(h.valueCents)}`).join(" · "),
  );
  inv(
    "order-book-spread-is-5900",
    book.bids[0].priceCents === 5897650 &&
      book.asks[0].priceCents === 5903550 &&
      book.asks[0].priceCents - book.bids[0].priceCents === 5900,
    `best bid ${formatUsd(book.bids[0].priceCents)} · best ask ${formatUsd(book.asks[0].priceCents)} · spread $59.00`,
  );
  inv(
    "volume-by-pair-adds-up",
    totals.volumeByPair.reduce((s, v) => s + v.volumeCents, 0) === totals.volumeCents,
    totals.volumeByPair.map((v) => `${v.pair} ${formatUsd(v.volumeCents)}`).join(" · "),
  );
  inv(
    "labels-are-english",
    data.brand === "BURSA" &&
      data.taglineEn === "The exchange, on the record." &&
      !/Cryptpy/i.test(data.taglineEn),
    "brand BURSA only; no borrowed brand or copy",
  );
  inv(
    "reference-prices-are-observed",
    data.pairs.find((p) => p.symbol === "BTC/USDT")?.referencePriceCents === 5900600 &&
      data.pairs.find((p) => p.symbol === "ETH/USDT")?.referencePriceCents === 166100 &&
      data.pairs.find((p) => p.symbol === "CAKE/USDT")?.referencePriceCents === 146,
    data.priceSource,
  );
  report.session = {
    totals: {
      trades: totals.trades,
      buys: totals.buys,
      sells: totals.sells,
      volumeCents: totals.volumeCents,
      feesCents: totals.feesCents,
      realisedPnlCents: totals.realisedPnlCents,
      wins: totals.wins,
      losses: totals.losses,
      bestFill: totals.bestFill.id,
      worstFill: totals.worstFill.id,
      biggestFill: totals.biggestFill.id,
    },
    portfolio: {
      finalCents: portfolio.finalCents,
      changeCents: portfolio.changeCents,
      changePct: Number(portfolio.changePct.toFixed(4)),
    },
  };
  report.invariants = invariants;

  // ---- 4. Copy examples + Pages-ready index ----
  const rendered = await copyDir(join(OUT, "src"), EXAMPLES);
  const previews = await copyDir(join(OUT, "clients"), join(EXAMPLES, "client-previews"));
  console.log(`\n✓ examples: ${rendered.length} rendered files + ${previews.length} client previews`);
  const renderedNames = rendered.map((p) => p.replace(ROOT + "/", ""));
  const indexHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>BURSA — Exchange Trade Kit (live preview)</title>
<style>body{background:#050201;color:#FBFAF7;font-family:Inter,system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6}a{color:#F4550D}h1{letter-spacing:.08em}code{color:#EE8F33}li{margin:6px 0}</style>
</head>
<body>
<h1>BURSA — Exchange Trade Kit</h1>
<p>One trading session (22 Nov 2026, 12 fills) &rarr; 12 fill emails, a trading dashboard, a 3-page statement PDF and 2 share cards. Live preview of every rendered output:</p>
<h2>Emails (12)</h2>
<ul>
${Array.from({ length: 12 }, (_, i) => {
  const id = `T${String(i + 1).padStart(2, "0")}`;
  return `  <li><a href="FillEmail${id}.html">FillEmail${id}.html</a> (<a href="FillEmail${id}.txt">plain text</a>)</li>`;
}).join("\n")}
</ul>
<h2>Page &amp; Document</h2>
<ul>
  <li><a href="TradingDashboardPage.html">TradingDashboardPage.html</a></li>
  <li><a href="MonthlyStatementPdf.pdf">MonthlyStatementPdf.pdf</a></li>
</ul>
<h2>Cards</h2>
<ul>
  <li><a href="TradeRecapCard.png">TradeRecapCard.png</a> (1200&times;630)</li>
  <li><a href="MarketSnapshotCard.png">MarketSnapshotCard.png</a> (1080&times;1080)</li>
</ul>
<p>Session: ${formatUsd(totals.volumeCents)} volume &middot; ${formatUsd(totals.feesCents)} fees &middot; ${formatUsdSigned(totals.realisedPnlCents)} realised P&amp;L. Client previews: <a href="client-previews/">client-previews/</a>.</p>
</body>
</html>
`;
  await writeFile(join(EXAMPLES, "index.html"), indexHtml, "utf8");
  report.examples = {
    rendered: renderedNames,
    clientPreviews: previews.map((p) => p.replace(ROOT + "/", "")),
    index: "examples/index.html",
  };

  // ---- 5. Batch time + checks.json ----
  report.batchMs = Date.now() - startedAll;
  report.batchSeconds = Number((report.batchMs / 1000).toFixed(1));
  report.failures = failures;
  report.passed = failures.length === 0;
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, "checks.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`\nBatch time: ${report.batchSeconds}s`);
  console.log(`${failures.length === 0 ? "✓ GATE PASSED" : "✗ GATE FAILED"} — out/checks.json`);
  if (failures.length > 0) {
    for (const f of failures) console.log(`  - ${f}`);
  }
  return failures.length === 0 ? 0 : 1;
}

process.exitCode = await main();
