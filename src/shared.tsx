// ---------------------------------------------------------------------------
// Shared pieces of the BURSA kit — used by all 16 outputs so the kit can
// never disagree with itself. Every piece reads the SAME `data` object
// and derives everything from the session file; nothing is re-typed per
// output. The notional a trade shows in its fill email, on the
// dashboard, in the statement PDF and on the share card is the same
// notional, from the same function.
//
// The language rule: English-first. All outputs are full English; the
// only Indonesian word anywhere is the brand name BURSA.
//
// The identity rule: every output carries the orange glow band, the
// session/trade marker and the proof strip — the kit's fingerprint,
// recognisable in any format. One accent system: orange only.
// ---------------------------------------------------------------------------

import {
  Circle,
  Column,
  Divider,
  Line,
  Path,
  Row,
  Span,
  Svg,
  Table,
  TableCell,
  TableRow,
  Text,
  token,
} from "@hyper-elements/react";
import {
  feeCents,
  feeRateLabel,
  formatPrice,
  formatQty,
  formatQtyNumber,
  formatQtyTrimmed,
  formatUsd,
  formatUsdSigned,
  notionalCents,
  portfolioSeries,
  realisedPnlCents,
  sessionTotals,
  tradeKey,
} from "./money.js";
import {
  defaultData,
  formatTimeUtc,
  sessionDateEn,
  type SessionData,
  type Trade,
} from "./session.js";
import { C, DISPLAY_FONT, MONO_FONT } from "./theme.js";

/**
 * The orange glow band — a row of small orange squares with a bright
 * centre, drawn in code (no image assets). The band is the kit's
 * fingerprint and runs across the top of every output, in the header,
 * the footer, or both.
 */
export function GlowBand({
  width = 560,
  height = 16,
  color = C.orange,
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  const step = 22;
  const count = Math.max(1, Math.floor(width / step));
  const squares: { x: number; s: number }[] = [];
  for (let i = 0; i < count; i++) {
    squares.push({ x: i * step + 4, s: i === Math.floor(count / 2) ? 10 : 6 });
  }
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} title="BURSA glow band">
      {squares.map((sq, i) => (
        <Path
          key={`s${i}`}
          d={`M ${sq.x} ${height / 2 - sq.s / 2} h ${sq.s} v ${sq.s} h ${-sq.s} Z`}
          style={{ fill: color }}
        />
      ))}
      <Circle cx={width / 2} cy={height / 2} r={3} style={{ fill: C.amber }} />
    </Svg>
  );
}

/**
 * The glow band for EMAIL roots — the Email writer has no inline SVG,
 * so the email version is a row of orange square glyphs (the same
 * motif, email-safe).
 */
export function GlowBandEmail({ count = 40, color = C.orange }: { count?: number; color?: string }) {
  return (
    <Text style={{ color, fontSize: 11, letterSpacing: 3, textAlign: "center" }}>
      {"▪ ".repeat(count).trim()}
    </Text>
  );
}

/** The session marker — where this output sits in the kit (16 outputs). */
export function BursaMark({ color = C.orange }: { color?: string }) {
  return (
    <Column style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          color,
        }}
      >
        BURSA · Exchange Trade Kit
      </Text>
    </Column>
  );
}

/** The trade marker — "Trade 04 of 12" + the pair and side. */
export function TradeMark({ trade }: { trade: Trade }) {
  return (
    <Column style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: C.orange,
        }}
      >
        Trade {String(trade.n).padStart(2, "0")} of 12
      </Text>
      <Text style={{ fontSize: 15, fontWeight: 800, color: C.ink, fontFamily: DISPLAY_FONT }}>
        {trade.pair} · {trade.side}
      </Text>
      <TradeDots current={trade.n} />
    </Column>
  );
}

/** Twelve numbered dots, the current trade in orange. */
export function TradeDots({ current }: { current: number }) {
  return (
    <Row style={{ gap: 5, alignItems: "center" }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => {
        const isCurrent = n === current;
        const isPast = n < current;
        return (
          <Column
            key={n}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: isCurrent ? C.orange : isPast ? C.panelLight : C.bg,
              border: `1px solid ${isCurrent ? C.orangeBright : C.borderLight}`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: isCurrent ? C.bg : C.inkSoft,
                textAlign: "center",
              }}
            >
              {n}
            </Text>
          </Column>
        );
      })}
      <Text style={{ fontSize: 12, color: token("colors.muted") }}>{current} / 12</Text>
    </Row>
  );
}

/** The side pill — BUY is filled orange, SELL is an amber outline. */
export function SidePill({ side, big = false }: { side: Trade["side"]; big?: boolean }) {
  const isBuy = side === "BUY";
  return (
    <Column
      style={{
        backgroundColor: isBuy ? C.orange : "transparent",
        border: `2px solid ${isBuy ? C.orange : C.amber}`,
        borderRadius: 999,
        padding: big ? [10, 22] : [6, 16],
        gap: 0,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: big ? 16 : 13,
          fontWeight: 800,
          letterSpacing: 2,
          color: isBuy ? C.bg : C.amber,
          textAlign: "center",
        }}
      >
        {isBuy ? "▲ BUY" : "▼ SELL"}
      </Text>
    </Column>
  );
}

/** The fee badge — the fee in big mono type, plus tier and rate. */
export function FeeBadge({ trade, big = false }: { trade: Trade; big?: boolean }) {
  return (
    <Column
      style={{
        backgroundColor: C.panelLight,
        borderRadius: 14,
        padding: [16, 20],
        gap: 4,
        alignItems: "center",
        border: `1px solid ${C.border}`,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1.6,
          color: C.amber,
          textTransform: "uppercase",
        }}
      >
        Fee · {trade.feeTier} {feeRateLabel(trade)}
      </Text>
      <Text
        style={{
          fontSize: big ? 40 : 32,
          fontWeight: 800,
          fontFamily: MONO_FONT,
          color: C.ink,
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        {formatUsd(feeCents(trade))}
      </Text>
      <Text style={{ fontSize: 12, color: token("colors.muted"), textAlign: "center" }}>
        on {formatUsd(notionalCents(trade))} notional
      </Text>
    </Column>
  );
}

/** The realised P&L badge — sells only; orange, signed. */
export function PnlBadge({ trade, big = false }: { trade: Trade; big?: boolean }) {
  const pnl = realisedPnlCents(trade);
  if (pnl === null) return null;
  return (
    <Column
      style={{
        backgroundColor: C.panelLight,
        borderRadius: 14,
        padding: [16, 20],
        gap: 4,
        alignItems: "center",
        border: `1px solid ${C.border}`,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1.6,
          color: C.amber,
          textTransform: "uppercase",
        }}
      >
        Realised P&amp;L vs cost basis
      </Text>
      <Text
        style={{
          fontSize: big ? 40 : 32,
          fontWeight: 800,
          fontFamily: MONO_FONT,
          color: C.orange,
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        {formatUsdSigned(pnl)}
      </Text>
      <Text style={{ fontSize: 12, color: token("colors.muted"), textAlign: "center" }}>
        cost basis {formatPrice(trade.entryPriceCents ?? 0)} → fill {formatPrice(trade.priceCents)}
      </Text>
    </Column>
  );
}

/** The full trades table — same rows on the dashboard and the PDF.
 *  TableCell holds Span (never Text) — the framework's rule.
 *  slim: 5 columns (#, Pair, Side, Notional, P&L) for the dashboard —
 *  the Page root renders at 600px, where the 9-column table wraps. */
export function TradesTable({ data, slim = false }: { data: SessionData; slim?: boolean }) {
  return (
    <Table
      style={{
        cellPadding: [8, 10],
        rowBorder: { width: 1, style: "solid", color: C.border },
      }}
    >
      <TableRow header>
        <TableCell>
          <Span style={{ fontWeight: 700 }}>#</Span>
        </TableCell>
        {!slim && (
          <TableCell>
            <Span style={{ fontWeight: 700 }}>Time (UTC)</Span>
          </TableCell>
        )}
        <TableCell>
          <Span style={{ fontWeight: 700 }}>Pair</Span>
        </TableCell>
        <TableCell>
          <Span style={{ fontWeight: 700 }}>Side</Span>
        </TableCell>
        {!slim && (
          <TableCell>
            <Span style={{ fontWeight: 700 }}>Qty</Span>
          </TableCell>
        )}
        {!slim && (
          <TableCell>
            <Span style={{ fontWeight: 700 }}>Fill</Span>
          </TableCell>
        )}
        <TableCell>
          <Span style={{ fontWeight: 700 }}>Notional</Span>
        </TableCell>
        {!slim && (
          <TableCell>
            <Span style={{ fontWeight: 700 }}>Fee</Span>
          </TableCell>
        )}
        <TableCell>
          <Span style={{ fontWeight: 700 }}>P&amp;L</Span>
        </TableCell>
      </TableRow>
      {data.trades.map((t) => {
        const pnl = realisedPnlCents(t);
        return (
          <TableRow key={t.id}>
            <TableCell>
              <Span style={{ fontFamily: MONO_FONT, fontSize: 13 }}>{t.id}</Span>
            </TableCell>
            {!slim && (
              <TableCell>
                <Span style={{ fontFamily: MONO_FONT, fontSize: 13 }}>{formatTimeUtc(t.timeIso).replace(" UTC", "")}</Span>
              </TableCell>
            )}
            <TableCell>
              <Span style={{ fontWeight: 700 }}>{t.pair}</Span>
            </TableCell>
            <TableCell>
              <Span style={{ fontWeight: 700, color: t.side === "BUY" ? C.orange : C.amber }}>
                {t.side}
              </Span>
            </TableCell>
            {!slim && (
              <TableCell>
                <Span style={{ fontFamily: MONO_FONT, fontSize: 12 }}>{formatQtyTrimmed(t)}</Span>
              </TableCell>
            )}
            {!slim && (
              <TableCell>
                <Span style={{ fontFamily: MONO_FONT, fontSize: 13 }}>{formatPrice(t.priceCents)}</Span>
              </TableCell>
            )}
            <TableCell>
              <Span style={{ fontFamily: MONO_FONT, fontSize: 13 }}>{formatUsd(notionalCents(t))}</Span>
            </TableCell>
            {!slim && (
              <TableCell>
                <Span style={{ fontFamily: MONO_FONT, fontSize: 13 }}>{formatUsd(feeCents(t))}</Span>
              </TableCell>
            )}
            <TableCell>
              <Span style={{ fontFamily: MONO_FONT, fontSize: 13 }}>
                {pnl === null ? "—" : formatUsdSigned(pnl)}
              </Span>
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}

/** The portfolio area chart — Page only (Svg). Orange line, orange
 *  fill fading to transparent, white dot at the peak. Draws the
 *  portfolioSeries, so the chart can never disagree with the numbers. */
export function PortfolioChart({
  data,
  width = 640,
  height = 180,
}: {
  data: SessionData;
  width?: number;
  height?: number;
}) {
  const series = portfolioSeries(data);
  const values = series.map((p) => p.valueCents);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padX = 8;
  const padTop = 14;
  const padBottom = 10;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const pts = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * innerW;
    const y = padTop + (1 - (v - min) / span) * innerH;
    return { x, y };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${height - padBottom} L ${pts[0].x.toFixed(1)} ${height - padBottom} Z`;
  const peak = pts.reduce((a, b) => (b.y < a.y ? b : a), pts[0]);
  // The line is drawn as Line segments, not a stroked Path: the
  // framework rejects fill:"none" on Path, and a stroked Path would
  // fill its implicit closed shape.
  const segments = pts.slice(1).map((p, i) => ({ x1: pts[i].x, y1: pts[i].y, x2: p.x, y2: p.y }));
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} title="Portfolio value">
      <Path d={area} style={{ fill: C.orange, opacity: 0.18 }} />
      {segments.map((s, i) => (
        <Line key={`seg${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} style={{ stroke: C.orange, strokeWidth: 2.5 }} />
      ))}
      <Circle cx={peak.x} cy={peak.y} r={4} style={{ fill: C.ink }} />
      <Circle cx={peak.x} cy={peak.y} r={7} style={{ stroke: C.orange, strokeWidth: 1.5, fill: C.bg }} />
    </Svg>
  );
}

/**
 * The proof strip — IDENTICAL text on all 16 outputs. If any output
 * ever shows a different trade count, volume or fee total, the kit is
 * broken; that is the whole point of "one session file, one exchange".
 */
export function ProofStrip({ data }: { data: SessionData }) {
  const t = sessionTotals(data);
  return (
    <Column style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, color: token("colors.muted"), fontFamily: MONO_FONT }}>
        BURSA · {data.sessionId} · {sessionDateEn(data)} · {t.trades} trades · {t.buys} buys ·{" "}
        {t.sells} sells
      </Text>
      <Text style={{ fontSize: 12, color: token("colors.muted") }}>
        Volume {formatUsd(t.volumeCents)} · Fees {formatUsd(t.feesCents)} · Realised P&amp;L{" "}
        {formatUsdSigned(t.realisedPnlCents)} · Best fill {t.bestFill.id} (
        {formatUsdSigned(realisedPnlCents(t.bestFill) ?? 0)})
      </Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>
        One session file, one exchange — this trade count, volume and fee
        total are identical on the 12 fill emails, the dashboard page, the
        statement PDF and the 2 cards.
      </Text>
    </Column>
  );
}

/** Small divider + honesty note used at the foot of every output. */
export function SampleNote({ data }: { data: SessionData }) {
  return (
    <Column style={{ gap: 8 }}>
      <Divider style={{ borderTop: { width: 1, style: "solid", color: C.borderLight } }} />
      <Text style={{ fontSize: 12, color: token("colors.muted"), textAlign: "center" }}>
        BURSA is a fictional template brand — not a real exchange. The
        session, trader and account are template sample data. The prices
        are real ({data.priceSource}); the fee schedule is the standard
        spot schedule ({data.feeSource}).
      </Text>
    </Column>
  );
}

export { defaultData };
export type { SessionData, Trade };
