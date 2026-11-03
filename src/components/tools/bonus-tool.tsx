"use client";
import dynamic from "next/dynamic";
const Qr = dynamic(() => import("./qr-generator").then((m) => m.QrGenerator));
const Whatsapp = dynamic(() =>
  import("./whatsapp-link").then((m) => m.WhatsAppLink),
);
const Budget = dynamic(() => import("./orcamento").then((m) => m.Orcamento));
const Pdf = dynamic(() => import("./pdf-editor").then((m) => m.PdfEditor), {
  ssr: false,
});
const Excel = dynamic(
  () => import("./excel-reader").then((m) => m.ExcelReader),
  { ssr: false },
);
export function BonusTool({ tool }: { tool: string }) {
  return tool === "qr" ? (
    <Qr />
  ) : tool === "whatsapp" ? (
    <Whatsapp />
  ) : tool === "orcamento" ? (
    <Budget />
  ) : tool === "pdf" ? (
    <Pdf />
  ) : (
    <Excel />
  );
}
