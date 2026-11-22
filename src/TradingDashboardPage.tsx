// ---------------------------------------------------------------------------
// BURSA — Trading Dashboard Page (Page root).
// The Dribbble-style dashboard, adapted to the Page root's 600px canvas:
// centred hero with the glowing orange CTA, the portfolio summary with
// the orange area chart, then the order book beside top assets, then
// the recent fills. The 3-column app mockup from the reference becomes
// a stacked dashboard here — the Page root renders at 600px, so the
// columns stack instead of sitting side by side (see AGENTS.md).
// ---------------------------------------------------------------------------

import {
  Button,
  Column,
  Divider,
  Heading,
  Page,
  Row,
  Section,
  Text,
  token,
} from "@hyper-elements/react";
import {
  finalHoldings,
  formatPrice,
  formatQty,
  formatUsd,
  formatUsdSigned,
  notionalCents,
  orderBook,
  portfolioSummary,
  realisedPnlCents,
  sessionTotals,
} from "./money.js";
import { defaultData, formatTimeUtc, sessionDateEn, type SessionData } from "./session.js";
import {
  BursaMark,
  GlowBand,
  PortfolioChart,
  ProofStrip,
  SampleNote,
  TradesTable,
} from "./shared.js";
import { C, bursaTheme } from "./theme.js";

export interface TradingDashboardPageProps {
  data?: SessionData;
}

function NavItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: active ? 800 : 400,
        color: active ? C.orange : token("colors.muted"),
      }}
    >
      {active ? "● " : "○ "}{label}
    </Text>
  );
}

export default function TradingDashboardPage({ data = defaultData }: TradingDashboardPageProps) {
  const totals = sessionTotals(data);
  const portfolio = portfolioSummary(data);
  const holdings = finalHoldings(data);
  const book = orderBook("BTC/USDT", 5);
  const recent = [...data.trades].slice(-4).reverse();
  return (
    <Page
      theme={bursaTheme}
      title={`BURSA — Trading Dashboard (${totals.trades} trades, ${formatUsd(totals.volumeCents)} volume)`}
      lang="en"
      style={{ gap: 0 }}
    >
      {/* ---- Hero: centred headline + glowing CTA ---- */}
      <Section
        tokens={{ colors: { background: C.bg, foreground: C.ink } }}
        style={{ backgroundColor: C.bg, padding: [36, 0, 28, 0], gap: 18, alignItems: "center" }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.15,
            color: C.ink,
            letterSpacing: 4,
            textAlign: "center",
          }}
        >
          BURSA
        </Text>
        <Text style={{ color: C.amber, fontSize: 14, textAlign: "center" }}>
          {data.taglineEn}
        </Text>
        <Heading level={1} style={{ textAlign: "center" }}>
          Trade fast. Keep the receipt.
        </Heading>
        <Text style={{ fontSize: 15, color: token("colors.muted"), textAlign: "center" }}>
          Every fill, every fee, every dollar of P&amp;L — from one session
          file, in every format you need.
        </Text>
        <Button href="https://example.com/bursa/dashboard">
          Start trading now →
        </Button>
        <GlowBand width={560} height={16} />
      </Section>

      {/* ---- Dashboard ---- */}
      <Section style={{ padding: [28, 0, 8, 0], gap: 24 }}>
        {/* ---- App nav strip (the sidebar, as a horizontal strip) ---- */}
        <Column style={{ apply: ["card"] }}>
          <BursaMark />
          <Row style={{ gap: 18, alignItems: "center" }}>
            <NavItem label="Dashboard" active />
            <NavItem label="Wallet" />
            <NavItem label="Watchlist" />
            <NavItem label="Transactions" />
            <NavItem label="Market" />
            <NavItem label="Analytics" />
          </Row>
          <Text style={{ fontSize: 13, color: token("colors.muted") }}>
            Session {data.sessionId} · {sessionDateEn(data)} · Account {data.accountId}
          </Text>
        </Column>

        {/* ---- Portfolio summary + chart ---- */}
        <Column style={{ apply: ["card"] }}>
          <Heading level={2} style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: C.muted }}>
            Portfolio summary
          </Heading>
          <Row style={{ gap: 16, alignItems: "center" }}>
            <Column style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>
                Current balance (USDT)
              </Text>
              <Text style={{ fontSize: 36, fontWeight: 800, color: C.ink }}>
                {formatUsd(portfolio.finalCents)}
              </Text>
            </Column>
            <Column style={{ gap: 2, alignItems: "end" }}>
              <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>
                Session change
              </Text>
              <Text style={{ fontSize: 22, fontWeight: 800, color: C.orange }}>
                ▲ {formatUsdSigned(portfolio.changeCents)} ({portfolio.changePct.toFixed(2)}%)
              </Text>
            </Column>
          </Row>
          <PortfolioChart data={data} width={544} height={180} />
          <Text style={{ fontSize: 13, color: token("colors.muted") }}>
            Portfolio value after every fill, marked at the session reference
            prices ({data.priceSource}). Started at{" "}
            {formatUsd(data.startingBalanceCents)}.
          </Text>
        </Column>

        {/* ---- Order book + top assets ---- */}
        <Row style={{ gap: 16, alignItems: "start" }}>
          <Column style={{ apply: ["card"], flex: 1 }}>
            <Heading level={2} style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: C.muted }}>
              Order book · BTC/USDT
            </Heading>
            <Column style={{ gap: 4 }}>
              {book.asks.slice().reverse().map((a, i) => (
                <Row key={`a${i}`} style={{ gap: 8, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontFamily: "'DejaVu Sans Mono', monospace", color: C.amber, flex: 1 }}>
                    {formatPrice(a.priceCents)}
                  </Text>
                  <Text style={{ fontSize: 13, color: token("colors.muted") }}>
                    {(a.qtyUnits / 100000000).toFixed(5)} BTC
                  </Text>
                </Row>
              ))}
              <Divider style={{ borderTop: { width: 1, style: "solid", color: C.borderLight } }} />
              <Text style={{ fontSize: 16, fontWeight: 800, color: C.ink, textAlign: "center" }}>
                {formatPrice(5900600)} · spread $59.00
              </Text>
              <Divider style={{ borderTop: { width: 1, style: "solid", color: C.borderLight } }} />
              {book.bids.map((b, i) => (
                <Row key={`b${i}`} style={{ gap: 8, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontFamily: "'DejaVu Sans Mono', monospace", color: C.orange, flex: 1 }}>
                    {formatPrice(b.priceCents)}
                  </Text>
                  <Text style={{ fontSize: 13, color: token("colors.muted") }}>
                    {(b.qtyUnits / 100000000).toFixed(5)} BTC
                  </Text>
                </Row>
              ))}
            </Column>
            <Text style={{ fontSize: 12, color: token("colors.muted") }}>
              Five levels each side, stepped 0.05% from the $59,006.00
              reference price.
            </Text>
          </Column>

          <Column style={{ apply: ["card"], flex: 1 }}>
            <Heading level={2} style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: C.muted }}>
              Top assets
            </Heading>
            <Column style={{ gap: 10 }}>
              {holdings.map((h) => (
                <Column key={h.pair} style={{ gap: 2 }}>
                  <Row style={{ gap: 8, alignItems: "center" }}>
                    <Text style={{ fontSize: 15, fontWeight: 800, color: C.ink, flex: 1 }}>
                      {h.base}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>
                      {formatUsd(h.valueCents)}
                    </Text>
                  </Row>
                  <Text style={{ fontSize: 13, color: token("colors.muted") }}>
                    {(h.qtyUnits / 10 ** (h.base === "BTC" ? 8 : 6)).toFixed(h.base === "BTC" ? 8 : 6)}{" "}
                    {h.base} · {h.pair}
                  </Text>
                </Column>
              ))}
            </Column>
            <Text style={{ fontSize: 12, color: token("colors.muted") }}>
              Holdings at the end of the session, valued at the reference
              prices.
            </Text>
          </Column>
        </Row>

        {/* ---- Recent fills ---- */}
        <Column style={{ apply: ["card"] }}>
          <Heading level={2}>Recent fills</Heading>
          <Column style={{ gap: 10 }}>
            {recent.map((t) => (
              <Row key={t.id} style={{ gap: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontFamily: "'DejaVu Sans Mono', monospace", color: C.amber }}>
                  {t.id}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: 800, color: t.side === "BUY" ? C.orange : C.amber, flex: 1 }}>
                  {t.side} {t.pair}
                </Text>
                <Text style={{ fontSize: 13, color: token("colors.muted") }}>
                  {formatQty(t)}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>
                  {formatUsd(notionalCents(t))}
                </Text>
                <Text style={{ fontSize: 12, color: token("colors.muted") }}>
                  {formatTimeUtc(t.timeIso)}
                </Text>
              </Row>
            ))}
          </Column>
          <Text style={{ fontSize: 13, color: token("colors.muted") }}>
            Latest 4 of {totals.trades} fills — the full table is in the
            statement PDF.
          </Text>
        </Column>

        {/* ---- Session stats ---- */}
        <Column style={{ apply: ["card"] }}>
          <Heading level={2}>Session in numbers</Heading>
          <Row style={{ gap: 16 }}>
            <Column style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>Volume</Text>
              <Text style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>{formatUsd(totals.volumeCents)}</Text>
            </Column>
            <Column style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>Fees</Text>
              <Text style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>{formatUsd(totals.feesCents)}</Text>
            </Column>
            <Column style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>Realised P&amp;L</Text>
              <Text style={{ fontSize: 22, fontWeight: 800, color: C.orange }}>{formatUsdSigned(totals.realisedPnlCents)}</Text>
            </Column>
          </Row>
          <Text style={{ fontSize: 13, color: token("colors.muted") }}>
            {totals.wins} winning fills, {totals.losses} losing fill (T04) · Best fill{" "}
            {totals.bestFill.id} ({formatUsdSigned(realisedPnlCents(totals.bestFill) ?? 0)}) · Biggest fill{" "}
            {totals.biggestFill.id} ({formatUsd(notionalCents(totals.biggestFill))})
          </Text>
        </Column>

        {/* ---- Full table (slim: the Page renders at 600px, where the
               9-column table wraps; time, qty, fill price and fee live
               on the 12 emails and the statement PDF) ---- */}
        <Column style={{ apply: ["card"] }}>
          <Heading level={2}>All fills</Heading>
          <TradesTable data={data} slim />
        </Column>

        {/* ---- Proof strip ---- */}
        <Column style={{ apply: ["card"] }}>
          <Heading level={3}>One session file, one exchange</Heading>
          <ProofStrip data={data} />
        </Column>
      </Section>

      {/* ---- Footer ---- */}
      <Section style={{ padding: [24, 0, 32, 0], gap: 24 }}>
        <GlowBand width={560} height={16} />
        <SampleNote data={data} />
        <Text style={{ fontSize: 12, color: token("colors.muted"), textAlign: "center" }}>
          {data.brand} · {data.sessionId} · {sessionDateEn(data)} · {data.priceSource}
        </Text>
      </Section>
    </Page>
  );
}
