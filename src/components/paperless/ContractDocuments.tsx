"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  FolderSearch,
  Hash,
  Loader2,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Star,
  Tag,
} from "lucide-react";
import { Contract, PaperlessDocument } from "@/types/models";
import { useHub } from "@/context/HubContext";
import { formatDateDE } from "@/lib/calculations";

export function ContractDocuments({
  contract,
  compact = false,
}: {
  contract: Contract;
  compact?: boolean;
}) {
  const { providers, paperlessConfig, openPdfPreview, saveContract, showToast } =
    useHub();
  const [docs, setDocs] = useState<PaperlessDocument[]>([]);
  const [mode, setMode] = useState<"live" | "demo_fallback">("demo_fallback");
  const [publicUrl, setPublicUrl] = useState<string>(paperlessConfig.publicUrl);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [directIdInput, setDirectIdInput] = useState("");
  const [showDirectIdInput, setShowDirectIdInput] = useState(false);

  const provider = providers.find((p) => p.id === contract.provider_id);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (contract.paperless_document_id) {
      params.set("documentId", String(contract.paperless_document_id));
    }
    if (paperlessConfig.autoMatchByPolicyNumber && contract.policy_number) {
      params.set("policyNumber", contract.policy_number);
    }
    if (paperlessConfig.autoMatchByTag && contract.paperless_tag) {
      params.set("tag", contract.paperless_tag);
    }
    if (
      paperlessConfig.autoMatchByCorrespondent &&
      provider?.paperless_correspondent_name
    ) {
      params.set("correspondent", provider.paperless_correspondent_name);
    }
    if (contract.paperless_custom_query) {
      params.set("query", contract.paperless_custom_query);
    }
    params.set("title", contract.title);

    fetch(`/api/paperless/documents?${params.toString()}`, {
      headers: {
        "x-paperless-url": paperlessConfig.url || "",
        "x-paperless-token": paperlessConfig.token || "",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setDocs(Array.isArray(data.documents) ? data.documents : []);
        setMode(data.mode === "live" ? "live" : "demo_fallback");
        if (data.paperlessPublicUrl) {
          setPublicUrl(data.paperlessPublicUrl);
        }
      })
      .catch(() => {
        if (!active) return;
        setDocs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    contract.paperless_document_id,
    contract.policy_number,
    contract.paperless_tag,
    contract.paperless_custom_query,
    contract.title,
    provider?.paperless_correspondent_name,
    paperlessConfig,
    refreshTick,
  ]);

  const basePublicUrl = (paperlessConfig.publicUrl || publicUrl).replace(
    /\/+$/,
    ""
  );
  const paperlessFilterUrl = `${basePublicUrl}/documents?query=${encodeURIComponent(
    contract.policy_number || contract.paperless_tag || contract.title
  )}`;

  const pinnedDoc = useMemo(() => {
    if (!contract.paperless_document_id) return null;
    return docs.find((d) => d.id === contract.paperless_document_id) || null;
  }, [docs, contract.paperless_document_id]);

  const filteredDocs = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => {
      return (
        d.title.toLowerCase().includes(q) ||
        String(d.id).includes(q) ||
        (d.archive_serial_number && String(d.archive_serial_number).includes(q)) ||
        (d.correspondent_name && d.correspondent_name.toLowerCase().includes(q)) ||
        (d.document_type_name && d.document_type_name.toLowerCase().includes(q)) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        (d.summary_excerpt && d.summary_excerpt.toLowerCase().includes(q))
      );
    });
  }, [docs, searchFilter]);

  const handlePinDocument = (doc: PaperlessDocument) => {
    saveContract({
      ...contract,
      paperless_document_id: doc.id,
      paperless_document_title: doc.title,
    });
    showToast(`Dokument #${doc.id} als feste Hauptpolice verknüpft`);
  };

  const handleUnpinDocument = () => {
    saveContract({
      ...contract,
      paperless_document_id: undefined,
      paperless_document_title: undefined,
    });
    showToast("Feste Verknüpfung aufgehoben (automatischer Suchmodus)");
  };

  const handleDirectIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(directIdInput.trim().replace(/^#/, ""), 10);
    if (!idNum || isNaN(idNum)) {
      showToast("Bitte eine gültige Dokument-ID eingeben");
      return;
    }
    saveContract({
      ...contract,
      paperless_document_id: idNum,
      paperless_document_title: `Paperless Dokument #${idNum}`,
    });
    showToast(`Dokument #${idNum} verknüpft`);
    setDirectIdInput("");
    setShowDirectIdInput(false);
  };

  // Compact Mode (z. B. für Kurzleisten)
  if (compact) {
    const primaryDoc = pinnedDoc || docs[0];
    return (
      <div className="flex flex-wrap items-center gap-2">
        {loading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Paperless-ngx prüft…
          </span>
        ) : primaryDoc ? (
          <>
            <button
              type="button"
              onClick={() => openPdfPreview({ document: primaryDoc, contract })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {contract.paperless_document_id
                  ? `Hauptpolice (#${primaryDoc.id})`
                  : `Police öffnen (${docs.length})`}
              </span>
            </button>
            <a
              href={`/api/paperless/documents/${primaryDoc.id}/preview?download=1&title=${encodeURIComponent(
                primaryDoc.title
              )}&policyNumber=${encodeURIComponent(
                contract.policy_number || ""
              )}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </a>
          </>
        ) : (
          <span className="text-xs text-slate-400">
            Kein Paperless-Dokument zugeordnet
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-3.5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Paperless-ngx Dokumenten-Verknüpfung
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  mode === "live"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {mode === "live" ? "Live NAS" : "NAS Vorschau"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {contract.paperless_document_id ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Feste Hauptpolice hinterlegt (ID #{contract.paperless_document_id})
                </span>
              ) : (
                <>
                  Automatische Suche nach Policen-Nr.{" "}
                  <code className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                    {contract.policy_number || "—"}
                  </code>{" "}
                  {contract.paperless_tag && (
                    <>
                      &amp; Tag{" "}
                      <code className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                        #{contract.paperless_tag}
                      </code>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowDirectIdInput((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dokument per ID direkt verknüpfen"
          >
            <Hash className="w-3.5 h-3.5 text-emerald-500" />
            <span>ID eingeben</span>
          </button>
          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Erneut in paperless-ngx suchen"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-500" : ""}`}
            />
            <span>Sync</span>
          </button>
          <a
            href={paperlessFilterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Paperless-ngx</span>
          </a>
        </div>
      </div>

      {/* Direct ID Input Drawer */}
      {showDirectIdInput && (
        <form
          onSubmit={handleDirectIdSubmit}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 flex flex-wrap items-center gap-2"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Paperless Dokumenten-ID direkt verknüpfen (z. B. aus der Paperless-URL /documents/401):
            </label>
            <input
              type="text"
              value={directIdInput}
              onChange={(e) => setDirectIdInput(e.target.value)}
              placeholder="z. B. 401 oder #1081"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="self-end inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold cursor-pointer transition-all shadow-2xs"
          >
            <Pin className="w-3.5 h-3.5" />
            Festlegen
          </button>
          <button
            type="button"
            onClick={() => setShowDirectIdInput(false)}
            className="self-end px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Abbrechen
          </button>
        </form>
      )}

      {/* HIGHLIGHT: Pinned Primary Document Card */}
      {contract.paperless_document_id && (
        <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/25 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
              <Star className="w-4 h-4 fill-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 dark:text-emerald-300">
                  Fest verknüpfte Hauptpolice
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  Doc #{contract.paperless_document_id}
                </span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {pinnedDoc?.title ||
                  contract.paperless_document_title ||
                  `Dokument #${contract.paperless_document_id}`}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Wird standardmäßig in der Vertragsübersicht per 1-Klick geöffnet.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pinnedDoc && (
              <button
                type="button"
                onClick={() => openPdfPreview({ document: pinnedDoc, contract })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Vorschau
              </button>
            )}
            <button
              type="button"
              onClick={handleUnpinDocument}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
              title="Feste Verknüpfung aufheben"
            >
              <PinOff className="w-3.5 h-3.5 text-slate-400" />
              Lösen
            </button>
          </div>
        </div>
      )}

      {/* Body: Loading / Empty / Found Docs */}
      {loading ? (
        <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          Suche passende Dokumente in paperless-ngx…
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center space-y-1">
          <FolderSearch className="w-5 h-5 mx-auto text-slate-400" />
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {contract.type === "subscription"
              ? `Kein Dokument für ${contract.title} in Paperless-ngx hinterlegt`
              : `Keine Dokumente für „${contract.policy_number || contract.title}“ gefunden`}
          </p>
          <p className="text-[11px] text-slate-500">
            {contract.type === "subscription"
              ? "Bei Online- und Streaming-Abos liegt meist kein Versicherungsschein vor. Falls du eine Rechnung in Paperless ablegst, verknüpfe sie mit dem Tag #" +
                (contract.paperless_tag || "abo")
              : `Vergib in paperless-ngx das Tag #${contract.paperless_tag || "police"} oder stelle sicher, dass die Policennummer im OCR-Text enthalten ist.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Filter Bar & Document Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Gefundene Archiv-Dokumente ({docs.length}):</span>
              <span className="text-[11px] font-normal text-slate-500">
                Wähle mit 📌 aus, welches Dokument als Hauptpolice verknüpft werden soll.
              </span>
            </div>

            {docs.length > 2 && (
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="In Ergebnissen filtern…"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] pl-8 pr-3 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* List of Found Documents */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const isPinned = contract.paperless_document_id === doc.id;

              return (
                <div
                  key={doc.id}
                  className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isPinned
                      ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                      : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#121622] hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          isPinned ? "text-emerald-500" : "text-slate-400"
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-bold truncate text-slate-900 dark:text-white">
                        {doc.title}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        #{doc.id}
                      </span>
                      {isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Hauptpolice
                        </span>
                      )}
                      {doc.archive_serial_number && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                          <Hash className="w-2.5 h-2.5" />
                          ASN {doc.archive_serial_number}
                        </span>
                      )}
                    </div>

                    {doc.summary_excerpt && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {doc.summary_excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-400">
                      <span>Beleg: {formatDateDE(doc.created)}</span>
                      {doc.correspondent_name && (
                        <span>• {doc.correspondent_name}</span>
                      )}
                      {doc.page_count && <span>• {doc.page_count} Seiten</span>}
                      {doc.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 font-medium"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Pin / Select as Primary Document Button */}
                    {isPinned ? (
                      <button
                        type="button"
                        onClick={handleUnpinDocument}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 text-xs font-bold cursor-pointer hover:bg-emerald-500/20"
                        title="Verknüpfung aufheben"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verknüpft</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePinDocument(doc)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Dieses Dokument als feste Hauptpolice für diesen Vertrag verknüpfen"
                      >
                        <Pin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Verknüpfen</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openPdfPreview({ document: doc, contract })}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Vorschau</span>
                    </button>
                    <a
                      href={`/api/paperless/documents/${doc.id}/preview?download=1&title=${encodeURIComponent(
                        doc.title
                      )}&policyNumber=${encodeURIComponent(
                        contract.policy_number || ""
                      )}&correspondent=${encodeURIComponent(
                        doc.correspondent_name || ""
                      )}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="PDF herunterladen"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`${basePublicUrl}/documents/${doc.id}/details`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="In Paperless-ngx öffnen"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
