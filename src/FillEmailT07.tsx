// BURSA — Fill Confirmation Email T07 (thin wrapper: one Email root
// per trade). The fill itself lives in src/session.ts; the layout in
// src/FillConfirmationEmail.tsx.
import { FillConfirmationEmail } from "./FillConfirmationEmail.js";
import { defaultData, tradeById } from "./session.js";

export default function FillEmailT07() {
  return <FillConfirmationEmail data={defaultData} trade={tradeById(defaultData, "T07")} />;
}
