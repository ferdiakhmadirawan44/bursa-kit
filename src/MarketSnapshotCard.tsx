// ---------------------------------------------------------------------------
// BURSA — Market Snapshot Card (Canvas root, 1080x1080).
// The whole session as a square share image: the stat grid, the volume
// split by pair as orange bars, the best and worst fills. Drawn entirely
// in code; no image assets. Fonts are the static TTF instances in
// assets/fonts.
// ---------------------------------------------------------------------------

import { Canvas, Column, Row, Text } from "@hyper-elements/react";
import {
  formatUsd,
  formatUsdSigned,
  realisedPnlCents,
  sessionTotals,
} from "./money.js";
import { defaultData, sessionDateEn, type SessionData } from "./session.js";
import { GlowBand } from "./shared.js";
import { C, MONO_FONT, PRINT_DISPLAY_FONT, PRINT_FONT, PRINT_FONTS, bursaTheme } from "./theme.js";

export interface MarketSnapshotCardProps {
  data?: SessionData;
}

export default function MarketSnapshotCard({ data = defaultData }: MarketSnapshotCardProps) {
  const totals = sessionTotals(data);
  const maxVolume = Math.max(...totals.volumeByPair.map((v) => v.volumeCents));
  return (
    <Canvas
      theme={bursaTheme}
      fonts={PRINT_FONTS}
      title={`BURSA — Session snapshot ${data.sessionId} (${formatUsd(totals.volumeCents)} volume)`}
      width={1080}
      height={1080}
      lang="en"
      style={{ backgroundColor: C.bg, fontFamily: PRINT_FONT, gap: 0 }}
    >
      {/* ---- Header ---- */}
      <Column style={{ padding: [64, 64, 0, 64], gap: 16 }}>
        <Row style={{ gap: 16, alignItems: "center" }}>
          <Text style={{ color: C.ink, fontSize: 32, fontWeight: 800, letterSpacing: 4, fontFamily: PRINT_DISPLAY_FONT }}>
            BURSA
          </Text>
          <Text
            style={{
              color: C.amber,
              fontSize: 15,
              fontFamily: MONO_FONT,
              flex: 1,
              textAlign: "right",
            }}
          >
            {data.sessionId}
          </Text>
        </Row>
        <GlowBand width={952} height={14} color={C.orange} />
        <Text style={{ color: C.ink, fontSize: 50, fontWeight: 800, lineHeight: 1.1, fontFamily: PRINT_DISPLAY_FONT }}>
          One session, on the record.
        </Text>
        <Text style={{ color: C.muted, fontSize: 22 }}>
          {sessionDateEn(data)} · {totals.trades} fills · {totals.buys} buys · {totals.sells} sells
        </Text>
      </Column>

      {/* ---- Stat grid ---- */}
      <Column style={{ padding: [48, 64, 0, 64], gap: 20 }}>
        <Row style={{ gap: 20 }}>
          <Column style={{ flex: 1, backgroundColor: C.panel, borderRadius: 16, padding: 26, gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
              VOLUME
            </Text>
            <Text style={{ fontSize: 40, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink }}>
              {formatUsd(totals.volumeCents)}
            </Text>
          </Column>
          <Column style={{ flex: 1, backgroundColor: C.panel, borderRadius: 16, padding: 26, gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
              FEES PAID
            </Text>
            <Text style={{ fontSize: 40, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink }}>
              {formatUsd(totals.feesCents)}
            </Text>
          </Column>
        </Row>
        <Row style={{ gap: 20 }}>
          <Column style={{ flex: 1, backgroundColor: C.panel, borderRadius: 16, padding: 26, gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
              REALISED P&amp;L
            </Text>
            <Text style={{ fontSize: 40, fontWeight: 800, fontFamily: MONO_FONT, color: C.orange }}>
              {formatUsdSigned(totals.realisedPnlCents)}
            </Text>
          </Column>
          <Column style={{ flex: 1, backgroundColor: C.panel, borderRadius: 16, padding: 26, gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
              WINNING FILLS
            </Text>
            <Text style={{ fontSize: 40, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink }}>
              {totals.wins} / {totals.sells}
            </Text>
          </Column>
        </Row>
      </Column>

      {/* ---- Volume by pair ---- */}
      <Column style={{ padding: [48, 64, 0, 64], gap: 18 }}>
        <Text style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.6, color: C.amber }}>
          VOLUME BY PAIR
        </Text>
        {totals.volumeByPair.map((v) => (
          <Column key={v.pair} style={{ gap: 8 }}>
            <Row style={{ gap: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: 800, color: C.ink, flex: 1 }}>
                {v.pair}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO_FONT, color: C.ink }}>
                {formatUsd(v.volumeCents)}
              </Text>
            </Row>
            <Row style={{ backgroundColor: C.panel, borderRadius: 9, height: 20 }}>
              <Column
                style={{
                  width: Math.max(24, Math.round((v.volumeCents / maxVolume) * 952)),
                  backgroundColor: C.orange,
                  borderRadius: 9,
                  height: 20,
                }}
              />
            </Row>
          </Column>
        ))}
      </Column>

      {/* ---- Best / worst ---- */}
      <Column style={{ padding: [48, 64, 64, 64], gap: 14 }}>
        <Text style={{ fontSize: 18, color: C.muted }}>
          Best fill {totals.bestFill.id} — {formatUsdSigned(realisedPnlCents(totals.bestFill) ?? 0)} ·{" "}
          Worst fill {totals.worstFill.id} —{" "}
          {formatUsdSigned(realisedPnlCents(totals.worstFill) ?? 0)} · Biggest fill{" "}
          {totals.biggestFill.id}
        </Text>
        <Text style={{ fontSize: 15, color: C.faint }}>
          BURSA is a fictional template brand — not a real exchange. Prices
          observed on pancake.xyz, 22 Nov 2026.
        </Text>
      </Column>
    </Canvas>
  );
}
