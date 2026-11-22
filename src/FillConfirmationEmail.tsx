// ---------------------------------------------------------------------------
// BURSA — Fill Confirmation Email (shared component, no default export).
// One fill email per trade: the fill, the fee breakdown, the balance
// after the fill and the proof strip. Twelve thin wrappers (one per
// trade) turn this into twelve Email roots. No images, no GIFs — the
// email is pure type and tables, so it stays far under Gmail's 100 KB
// clip limit (the LOKER lesson: a GIF is only worth it if the email
// stays under the limit; a fill email does not need one).
// ---------------------------------------------------------------------------

import {
  Button,
  Column,
  Divider,
  Email,
  Heading,
  Menu,
  MergeTag,
  Row,
  Section,
  Text,
  token,
} from "@hyper-elements/react";
import {
  feeCents,
  feeRateLabel,
  formatPrice,
  formatQty,
  formatUsd,
  formatUsdSigned,
  netCents,
  notionalCents,
  realisedPnlCents,
  sessionTotals,
  tradeLabel,
} from "./money.js";
import {
  defaultData,
  formatTimeUtc,
  sessionDateEn,
  type SessionData,
  type Trade,
} from "./session.js";
import {
  FeeBadge,
  GlowBandEmail,
  PnlBadge,
  ProofStrip,
  SampleNote,
  SidePill,
  TradeMark,
} from "./shared.js";
import { C, bursaTheme } from "./theme.js";

export interface FillConfirmationEmailProps {
  data?: SessionData;
  trade: Trade;
}

/** USDT balance after this trade, in integer cents — the fills are
 *  applied in session order from the starting balance. */
export function balanceAfterCents(data: SessionData, trade: Trade): number {
  let balance = data.startingBalanceCents;
  for (const t of data.trades) {
    balance += netCents(t);
    if (t.id === trade.id) return balance;
  }
  throw new Error(`Trade ${trade.id} not in session`);
}

/** Session volume up to and including this trade (sum of notionals
 *  so far) — the "volume so far" line on the fill email. */
export function volumeSoFarCents(data: SessionData, trade: Trade): number {
  let volume = 0;
  for (const t of data.trades) {
    volume += notionalCents(t);
    if (t.id === trade.id) return volume;
  }
  throw new Error(`Trade ${trade.id} not in session`);
}

export function FillConfirmationEmail({ data = defaultData, trade }: FillConfirmationEmailProps) {
  const totals = sessionTotals(data);
  const pnl = realisedPnlCents(trade);
  const balance = balanceAfterCents(data, trade);
  return (
    <Email
      theme={bursaTheme}
      title={`Fill confirmed: ${tradeLabel(trade)} — ${formatUsd(notionalCents(trade))} (BURSA)`}
      previewText={`${trade.side} ${formatQty(trade)} filled at ${formatPrice(trade.priceCents)}. Fee ${formatUsd(feeCents(trade))}. Balance after fill ${formatUsd(balance)}.`}
      lang="en"
      style={{ gap: 0 }}
    >
      {/* ---- Masthead: near-black band + glow ---- */}
      <Section
        tokens={{ colors: { background: C.bg, foreground: C.ink } }}
        style={{ backgroundColor: C.bg, padding: [28, 0, 24, 0], gap: 16 }}
      >
        <Row style={{ gap: 14, alignItems: "center" }}>
          <Column style={{ gap: 2 }}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 1.15,
                color: C.ink,
                letterSpacing: 4,
              }}
            >
              BURSA
            </Text>
            <Text style={{ color: C.amber, fontSize: 13 }}>
              {data.taglineEn}
            </Text>
          </Column>
        </Row>
        <GlowBandEmail color={C.orange} />
        <Row style={{ gap: 16, alignItems: "center" }}>
          <SidePill side={trade.side} />
          <Text style={{ fontSize: 13, color: token("colors.muted") }}>
            {trade.pair} · {sessionDateEn(data)} · {formatTimeUtc(trade.timeIso)}
          </Text>
        </Row>
      </Section>

      {/* ---- Fill ---- */}
      <Section style={{ padding: [24, 0, 8, 0], gap: 24 }}>
        <Column style={{ apply: ["card"] }}>
          <TradeMark trade={trade} />
          <Heading level={1}>Your order filled</Heading>
          <Text>
            Hi, <MergeTag name="first_name" /> — your {trade.side === "BUY" ? "buy" : "sell"}{" "}
            order on BURSA filled in full. {tradeLabel(trade)}.
          </Text>
          <Row style={{ gap: 12, alignItems: "center" }}>
            <Column style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>
                Fill price
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>
                {formatPrice(trade.priceCents)}
              </Text>
            </Column>
            <Column style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: C.amber, textTransform: "uppercase" }}>
                Notional
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>
                {formatUsd(notionalCents(trade))}
              </Text>
            </Column>
          </Row>
          <Text style={{ fontSize: 14 }}>
            Quantity {formatQty(trade)} · {trade.feeTier} · Fee rate {feeRateLabel(trade)} ·{" "}
            Order {trade.id} · Session {data.sessionId}
          </Text>
          {pnl !== null ? <PnlBadge trade={trade} /> : null}
        </Column>

        {/* ---- Fee ---- */}
        <Column style={{ apply: ["card"] }}>
          <Heading level={2}>Fee</Heading>
          <FeeBadge trade={trade} />
          <Text style={{ fontSize: 13, color: token("colors.muted") }}>
            Fee schedule: {data.feeSource}. The fee is computed from the
            notional — {formatUsd(notionalCents(trade))} × {feeRateLabel(trade)} — and
            rounded half up to the cent.
          </Text>
        </Column>

        {/* ---- Balance ---- */}
        <Column style={{ apply: ["card"] }}>
          <Heading level={2}>Balance after this fill</Heading>
          <Text style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>
            {formatUsd(balance)} USDT
          </Text>
          <Text style={{ fontSize: 14 }}>
            This is trade {trade.n} of {totals.trades} in the session. Session volume so
            far: {formatUsd(volumeSoFarCents(data, trade))} across {totals.pairs} pairs.
          </Text>
          <Button href="https://example.com/bursa/dashboard">
            View your dashboard
          </Button>
        </Column>

        {/* ---- Proof strip ---- */}
        <Column style={{ apply: ["card"] }}>
          <Heading level={3}>One session file, one exchange</Heading>
          <ProofStrip data={data} />
        </Column>
      </Section>

      {/* ---- Footer ---- */}
      <Section style={{ padding: [24, 0, 32, 0], gap: 24 }}>
        <GlowBandEmail />
        <Menu
          items={[
            { text: "Dashboard", href: "https://example.com/bursa/dashboard" },
            { text: "Statement", href: "https://example.com/bursa/statement" },
            { text: "Unsubscribe", href: "https://example.com/unsubscribe" },
          ]}
          separator="·"
          style={{ fontSize: 13, color: token("colors.muted"), separatorColor: C.muted }}
        />
        <Text style={{ fontSize: 12, color: token("colors.muted"), textAlign: "center" }}>
          Sent from fills@bursa.example — one sender address for all twelve fill emails
          in this kit.
        </Text>
        <SampleNote data={data} />
        <Text style={{ fontSize: 12, color: token("colors.muted"), textAlign: "center" }}>
          {data.brand} · Trade {String(trade.n).padStart(2, "0")} of 12 · {data.sessionId} ·{" "}
          {formatUsdSigned(totals.realisedPnlCents)} session P&amp;L
        </Text>
      </Section>
    </Email>
  );
}
