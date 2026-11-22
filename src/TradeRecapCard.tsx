// ---------------------------------------------------------------------------
// BURSA — Trade Recap Card (Canvas root, 1200x630).
// The best fill of the session, as a share image: the pair, the side,
// the fill price, the fee and the realised P&L, on the dark orange-glow
// identity. Drawn entirely in code (glow band, dark panels); no image
// assets. Fonts are the static TTF instances in assets/fonts.
// ---------------------------------------------------------------------------

import { Canvas, Column, Row, Text } from "@hyper-elements/react";
import {
  feeCents,
  formatPrice,
  formatQty,
  formatUsd,
  formatUsdSigned,
  notionalCents,
  realisedPnlCents,
  sessionTotals,
} from "./money.js";
import { defaultData, formatTimeUtc, sessionDateEn, type SessionData } from "./session.js";
import { GlowBand, SidePill } from "./shared.js";
import { C, MONO_FONT, PRINT_DISPLAY_FONT, PRINT_FONT, PRINT_FONTS, bursaTheme } from "./theme.js";

export interface TradeRecapCardProps {
  data?: SessionData;
}

export default function TradeRecapCard({ data = defaultData }: TradeRecapCardProps) {
  const totals = sessionTotals(data);
  const best = totals.bestFill;
  const pnl = realisedPnlCents(best) ?? 0;
  return (
    <Canvas
      theme={bursaTheme}
      fonts={PRINT_FONTS}
      title={`BURSA — Best fill ${best.id}: ${best.side} ${best.pair} (${formatUsdSigned(pnl)})`}
      width={1200}
      height={630}
      lang="en"
      style={{ backgroundColor: C.bg, fontFamily: PRINT_FONT, gap: 0 }}
    >
      {/* ---- Header ---- */}
      <Column style={{ padding: [48, 64, 0, 64], gap: 12 }}>
        <Row style={{ gap: 16, alignItems: "center" }}>
          <Text style={{ color: C.ink, fontSize: 26, fontWeight: 800, letterSpacing: 4, fontFamily: PRINT_DISPLAY_FONT }}>
            BURSA
          </Text>
          <Text
            style={{
              color: C.amber,
              fontSize: 13,
              fontFamily: MONO_FONT,
              flex: 1,
              textAlign: "right",
            }}
          >
            BEST FILL · TRADE {String(best.n).padStart(2, "0")} OF 12
          </Text>
        </Row>
        <GlowBand width={1072} height={14} color={C.orange} />
      </Column>

      {/* ---- Best fill ---- */}
      <Column style={{ padding: [40, 64, 0, 64], gap: 12 }}>
        <Row style={{ gap: 16, alignItems: "center" }}>
          <Column style={{ width: 190 }}>
            <SidePill side={best.side} big />
          </Column>
          <Text style={{ color: C.ink, fontSize: 52, fontWeight: 800, lineHeight: 1.1, fontFamily: PRINT_DISPLAY_FONT }}>
            {best.pair}
          </Text>
        </Row>
        <Text style={{ color: C.muted, fontSize: 20, lineHeight: 1.4 }}>
          {formatQty(best)} · Filled {formatTimeUtc(best.timeIso)} · {sessionDateEn(data)}
        </Text>
      </Column>

      {/* ---- Figures strip ---- */}
      <Column style={{ padding: [40, 64, 0, 64], gap: 20 }}>
        <Row
          style={{
            gap: 24,
            alignItems: "center",
            backgroundColor: C.panel,
            borderRadius: 14,
            padding: [28, 28],
          }}
        >
          <Column style={{ gap: 2, flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
              FILL PRICE
            </Text>
            <Text style={{ fontSize: 36, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink, lineHeight: 1 }}>
              {formatPrice(best.priceCents)}
            </Text>
          </Column>
          <Column style={{ gap: 2, flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
              NOTIONAL
            </Text>
            <Text style={{ fontSize: 36, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink, lineHeight: 1 }}>
              {formatUsd(notionalCents(best))}
            </Text>
          </Column>
          <Column style={{ gap: 2, flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
              FEE · {best.feeTier}
            </Text>
            <Text style={{ fontSize: 36, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink, lineHeight: 1 }}>
              {formatUsd(feeCents(best))}
            </Text>
          </Column>
          <Column style={{ gap: 2, flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
              REALISED P&amp;L
            </Text>
            <Text style={{ fontSize: 36, fontWeight: 800, fontFamily: MONO_FONT, color: C.orange, lineHeight: 1 }}>
              {formatUsdSigned(pnl)}
            </Text>
          </Column>
        </Row>
        <Text style={{ fontSize: 15, color: C.muted }}>
          Session {data.sessionId} · Volume {formatUsd(totals.volumeCents)} · Fees{" "}
          {formatUsd(totals.feesCents)} · Session P&amp;L {formatUsdSigned(totals.realisedPnlCents)}
        </Text>
        {/* ---- Session strip: three headline numbers fill the card ---- */}
        <Row style={{ gap: 28, padding: [8, 0, 0, 0] }}>
          <Column style={{ gap: 4, flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>SESSION VOLUME</Text>
            <Text style={{ fontSize: 30, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink, lineHeight: 1 }}>
              {formatUsd(totals.volumeCents)}
            </Text>
          </Column>
          <Column style={{ gap: 4, flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>FEES PAID</Text>
            <Text style={{ fontSize: 30, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink, lineHeight: 1 }}>
              {formatUsd(totals.feesCents)}
            </Text>
          </Column>
          <Column style={{ gap: 4, flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>SESSION P&amp;L</Text>
            <Text style={{ fontSize: 30, fontWeight: 800, fontFamily: MONO_FONT, color: C.orange, lineHeight: 1 }}>
              {formatUsdSigned(totals.realisedPnlCents)}
            </Text>
          </Column>
        </Row>
      </Column>
    </Canvas>
  );
}
