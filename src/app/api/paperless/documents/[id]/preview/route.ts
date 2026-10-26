import { NextRequest, NextResponse } from "next/server";
import { DEMO_PAPERLESS_DOCUMENTS } from "@/lib/seed-data";
import { normalizePaperlessUrl, normalizePaperlessToken } from "@/lib/paperless";

function escapePdfText(input: string): string {
  return input
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildValidPolicyPdf(params: {
  id: string;
  title: string;
  correspondent: string;
  policyNumber: string;
  created: string;
  summary: string;
}): Uint8Array {
  const lines = [
    "FAMILY INSURANCE & SUBSCRIPTION HUB - PAPERLESS-NGX VORSCHAU",
    "--------------------------------------------------------------------",
    `Dokument-ID:     #${params.id}`,
    `Titel:           ${params.title.slice(0, 68)}`,
    `Gesellschaft:    ${params.correspondent}`,
    `Policennummer:   ${params.policyNumber}`,
    `Ausstelldatum:   ${params.created}`,
    "--------------------------------------------------------------------",
    "ZUSAMMENFASSUNG (OCR-VOLLTEXT AUS PAPERLESS-NGX):",
    params.summary.slice(0, 80),
    params.summary.slice(80, 160),
    params.summary.slice(160, 240),
    "--------------------------------------------------------------------",
    "HINWEIS:",
    "Dieses PDF wird im lokalen Vorschau-Modus generiert, solange noch",
    "keine Live-Verbindung zur Paperless-ngx NAS-Instanz aktiv ist.",
    "Sobald PAPERLESS_URL und PAPERLESS_TOKEN hinterlegt sind, streamt",
    "dieser Endpunkt direkt das Original-PDF von deinem NAS.",
  ];

  const textOps = lines
    .map((line, idx) => {
      const y = 760 - idx * 24;
      const font = idx === 0 || idx === 8 || idx === 13 ? "/F2 11 Tf" : "/F1 10 Tf";
      return `BT ${font} 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
    })
    .join("\n");

  const streamContent = `q\n0.95 0.97 1.0 rg\n40 742 515 34 re f\n0.12 0.25 0.68 rg\n40 742 4 34 re f\n0 0 0 rg\n${textOps}\nQ`;

  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";
  const titleParam = searchParams.get("title") || "";
  const policyNumberParam = searchParams.get("policyNumber") || "";
  const correspondentParam = searchParams.get("correspondent") || "";

  const paperlessUrl = normalizePaperlessUrl(
    request.headers.get("x-paperless-url") ||
    searchParams.get("paperlessUrl") ||
    process.env.PAPERLESS_URL ||
    ""
  );

  const paperlessToken = normalizePaperlessToken(
    request.headers.get("x-paperless-token") ||
    searchParams.get("paperlessToken") ||
    process.env.PAPERLESS_TOKEN ||
    ""
  );

  if (
    paperlessUrl &&
    paperlessToken &&
    paperlessToken !== "dein_paperless_api_token_hier"
  ) {
    try {
      const endpoint = download ? "download" : "preview";
      const targetUrl = `${paperlessUrl}/api/documents/${encodeURIComponent(
        id
      )}/${endpoint}/`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(targetUrl, {
        headers: {
          Authorization: `Token ${paperlessToken}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok && res.body) {
        const contentType = res.headers.get("content-type") || "application/pdf";
        const disposition = download
          ? `attachment; filename="paperless-doc-${id}.pdf"`
          : `inline; filename="paperless-doc-${id}.pdf"`;

        return new NextResponse(res.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": disposition,
            "Cache-Control": "private, max-age=300",
          },
        });
      }
    } catch {
      // Fallback zum generierten Vorschau-PDF
    }
  }

  const demoDoc = DEMO_PAPERLESS_DOCUMENTS.find((d) => String(d.id) === id);
  const pdfBytes = buildValidPolicyPdf({
    id,
    title: demoDoc?.title || titleParam || `Versicherungsschein #${id}`,
    correspondent:
      demoDoc?.correspondent_name || correspondentParam || "Versicherungsgesellschaft",
    policyNumber:
      demoDoc?.policy_number_matched || policyNumberParam || `POL-${id}`,
    created: demoDoc?.created || new Date().toISOString().slice(0, 10),
    summary:
      demoDoc?.summary_excerpt ||
      "Versicherungsschein und Vertragsbedingungen gemaess hinterlegter Police im Family Insurance & Subscription Hub.",
  });

  const disposition = download
    ? `attachment; filename="police-${id}.pdf"`
    : `inline; filename="police-${id}.pdf"`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
    },
  });
}
