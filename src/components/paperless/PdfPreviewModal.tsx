"use client";

import React from "react";
import { Download, ExternalLink, FileText, Hash, ShieldCheck } from "lucide-react";
import { useHub } from "@/context/HubContext";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { formatDateDE } from "@/lib/calculations";

export function PdfPreviewModal() {
  const { pdfPreviewTarget, closePdfPreview, paperlessConfig } = useHub();

  if (!pdfPreviewTarget) return null;

  const { document: doc, contract } = pdfPreviewTarget;
  const previewUrl = `/api/paperless/documents/${doc.id}/preview?title=${encodeURIComponent(
    doc.title
  )}&policyNumber=${encodeURIComponent(
    contract?.policy_number || doc.policy_number_matched || ""
  )}&correspondent=${encodeURIComponent(doc.correspondent_name || "")}`;

  const downloadUrl = `${previewUrl}&download=1`;
  const deepLink = `${paperlessConfig.publicUrl.replace(/\/+$/, "")}/documents/${
    doc.id
  }/details`;

  return (
    <NativeDialog
      open={Boolean(pdfPreviewTarget)}
      onClose={closePdfPreview}
      title={doc.title}
      subtitle={`Paperless-ngx Dokument #${doc.id} • ${
        doc.correspondent_name || "Archiv-Beleg"
      } • ${formatDateDE(doc.created)}`}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {contract?.policy_number && (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                Police: {contract.policy_number}
              </span>
            )}
            {doc.archive_serial_number && (
              <span className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300">
                <Hash className="w-3.5 h-3.5" />
                ASN {doc.archive_serial_number}
              </span>
            )}
            <span className="text-slate-500">
              Single Source of Truth: Paperless-ngx NAS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF herunterladen
            </a>
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              In Paperless-ngx öffnen
            </a>
          </div>
        </div>

        {doc.summary_excerpt && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-950/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              OCR-Volltext-Auszug (aus Paperless-ngx Index):
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {doc.summary_excerpt}
            </p>
          </div>
        )}

        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 h-[58dvh] min-h-[360px]">
          <iframe
            src={previewUrl}
            title={`PDF-Vorschau: ${doc.title}`}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </NativeDialog>
  );
}
