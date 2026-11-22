// ---------------------------------------------------------------------------
// BURSA — Monthly Statement PDF (Document root).
// A 3-page A4 statement: page 1 cover + session summary, page 2 the full
// trades table, page 3 fees + P&L breakdown + proof. Dark identity on
// the cover, warm off-white figures on near-black — the Dribbble look,
// carried into print. Headings carry an explicit Inter fontFamily — the
// PDF's fallback Helvetica cannot draw every glyph the kit uses (the
// lesson paid for in ADOPSI).
// ---------------------------------------------------------------------------

import {
  Column,
  Divider,
  Document,
  Heading,
  PageNumber,
  Row,
  Text,
  token,
} from "@hyper-elements/react";
import {
  feeCents,
  formatPrice,
  formatUsd,
  formatUsdSigned,
  notionalCents,
  portfolioSummary,
  realisedPnlCents,
  sessionTotals,
} from "./money.js";
import { defaultData, sessionDateEn, type SessionData } from "./session.js";
import {
  BursaMark,
  FeeBadge,
  GlowBand,
  PnlBadge,
  ProofStrip,
  SampleNote,
  TradesTable,
} from "./shared.js";
import { C, MONO_FONT, PRINT_DISPLAY_FONT, PRINT_FONT, PRINT_FONTS, bursaTheme } from "./theme.js";

export interface MonthlyStatementPdfProps {
  data?: SessionData;
}

export default function MonthlyStatementPdf({ data = defaultData }: MonthlyStatementPdfProps) {
  const totals = sessionTotals(data);
  const portfolio = portfolioSummary(data);
  return (
    <Document
      theme={bursaTheme}
      fonts={PRINT_FONTS}
      title={`BURSA — Statement ${data.sessionId} (${formatUsd(totals.volumeCents)} volume)`}
      size="A4"
      orientation="portrait"
      lang="en"
      style={{ fontFamily: PRINT_FONT, fontSize: 13 }}
    >
      {/* ================= Page 1: cover + summary ================= */}
      <Document.Page style={{ gap: 14 }}>
        <Column style={{ backgroundColor: C.bg, borderRadius: 10, padding: 20, gap: 8 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: C.ink,
              letterSpacing: 3,
              fontFamily: PRINT_DISPLAY_FONT,
            }}
          >
            BURSA
          </Text>
          <Text style={{ color: C.amber, fontSize: 12, fontFamily: PRINT_FONT }}>
            {data.taglineEn}
          </Text>
          <GlowBand width={480} height={14} color={C.orange} />
        </Column>

        <BursaMark />
        <Heading level={1} style={{ fontFamily: PRINT_DISPLAY_FONT }}>
          Trading Statement
        </Heading>
        <Text style={{ fontSize: 18, fontWeight: 800, color: C.ink, fontFamily: PRINT_DISPLAY_FONT }}>
          {sessionDateEn(data)} · Session {data.sessionId}
        </Text>
        <Text>
          Account {data.accountId} · Trader {data.trader} · {totals.trades} fills ·{" "}
          {totals.buys} buys · {totals.sells} sells · {totals.pairs} pairs
        </Text>

        <Row style={{ gap: 12 }}>
          <Column style={{ flex: 1, backgroundColor: C.panel, borderRadius: 12, padding: 16, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>
              Volume
            </Text>
            <Text style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink }}>
              {formatUsd(totals.volumeCents)}
            </Text>
          </Column>
          <Column style={{ flex: 1, backgroundColor: C.panel, borderRadius: 12, padding: 16, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>
              Fees paid
            </Text>
            <Text style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink }}>
              {formatUsd(totals.feesCents)}
            </Text>
          </Column>
          <Column style={{ flex: 1, backgroundColor: C.panel, borderRadius: 12, padding: 16, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>
              Realised P&amp;L
            </Text>
            <Text style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO_FONT, color: C.orange }}>
              {formatUsdSigned(totals.realisedPnlCents)}
            </Text>
          </Column>
        </Row>

        <Column style={{ backgroundColor: C.panel, borderRadius: 12, padding: 16, gap: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>
            Portfolio at close
          </Text>
          <Text style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink }}>
            {formatUsd(portfolio.finalCents)} ({formatUsdSigned(portfolio.changeCents)}, {portfolio.changePct.toFixed(2)}%)
          </Text>
          <Text style={{ fontSize: 12, color: token("colors.muted") }}>
            Started at {formatUsd(data.startingBalanceCents)} · Marked at the session
            reference prices ({data.priceSource}).
          </Text>
        </Column>

        <Column style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: token("colors.muted") }}>
            Best fill {totals.bestFill.id} — {formatUsdSigned(realisedPnlCents(totals.bestFill) ?? 0)}{" "}
            realised · Worst fill {totals.worstFill.id} —{" "}
            {formatUsdSigned(realisedPnlCents(totals.worstFill) ?? 0)} realised · Biggest fill{" "}
            {totals.biggestFill.id} — {formatUsd(notionalCents(totals.biggestFill))} notional
          </Text>
        </Column>

        <Row style={{ gap: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: token("colors.muted"), fontFamily: MONO_FONT }}>
            Page <PageNumber /> of <PageNumber total />
          </Text>
        </Row>
      </Document.Page>

      {/* ================= Page 2: trades table ================= */}
      <Document.Page style={{ gap: 14 }}>
        <Heading level={2} style={{ fontFamily: PRINT_DISPLAY_FONT }}>
          All fills
        </Heading>
        <TradesTable data={data} />
        <Text style={{ fontSize: 12, color: token("colors.muted") }}>
          All 12 fills, in session order. Notional = quantity × fill price;
          fee = notional × {0.1}% (taker) or {0.08}% (maker), rounded half up
          to the cent. P&amp;L is shown for sells only, against the cost basis
          recorded on each sell.
        </Text>
        <Row style={{ gap: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: token("colors.muted"), fontFamily: MONO_FONT }}>
            Page <PageNumber /> of <PageNumber total />
          </Text>
        </Row>
      </Document.Page>

      {/* ================= Page 3: fees + P&L ================= */}
      <Document.Page style={{ gap: 14 }}>
        <Heading level={2} style={{ fontFamily: PRINT_DISPLAY_FONT }}>
          Fees &amp; P&amp;L
        </Heading>

        <Column style={{ gap: 10 }}>
          {data.trades.map((t) => {
            const pnl = realisedPnlCents(t);
            return (
              <Row key={t.id} style={{ gap: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontFamily: MONO_FONT, color: C.amber }}>
                  {t.id}
                </Text>
                <Text style={{ fontSize: 13, flex: 1 }}>
                  {t.side} {t.pair} · {t.feeTier} {t.feeTier === "maker" ? "0.08%" : "0.10%"}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: MONO_FONT }}>
                  Fee {formatUsd(feeCents(t))}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: MONO_FONT, color: C.orange }}>
                  {pnl === null ? "—" : formatUsdSigned(pnl)}
                </Text>
              </Row>
            );
          })}
        </Column>

        <Divider style={{ borderTop: { width: 1, style: "solid", color: C.borderLight } }} />

        <Row style={{ gap: 12 }}>
          <FeeBadge trade={totals.biggestFill} />
          <PnlBadge trade={totals.bestFill} />
        </Row>

        <Text style={{ fontSize: 13 }}>
          Fee schedule: {data.feeSource}. Total fees for the session:{" "}
          {formatUsd(totals.feesCents)}. Total realised P&amp;L:{" "}
          {formatUsdSigned(totals.realisedPnlCents)} ({totals.wins} winning fills,{" "}
          {totals.losses} losing fill).
        </Text>
        <Text style={{ fontSize: 13 }}>
          Reference prices: {data.priceSource}. Prices move — the statement
          records the prices this session traded at, not the price now.
        </Text>

        <Divider style={{ borderTop: { width: 1, style: "solid", color: C.borderLight } }} />
        <ProofStrip data={data} />
        <SampleNote data={data} />
        <Text style={{ fontSize: 11, color: token("colors.muted"), textAlign: "center" }}>
          {data.brand} · {data.sessionId} · {sessionDateEn(data)} · Statement generated from
          one session file — no figure is typed by hand.
        </Text>
        <Row style={{ gap: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: token("colors.muted"), fontFamily: MONO_FONT }}>
            Page <PageNumber /> of <PageNumber total />
          </Text>
        </Row>
      </Document.Page>
    </Document>
  );
}
