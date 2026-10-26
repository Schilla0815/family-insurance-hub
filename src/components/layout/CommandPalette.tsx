"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  FileText,
  PhoneCall,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { formatEuro, getMonthlyCost } from "@/lib/calculations";
import { DEMO_PAPERLESS_DOCUMENTS } from "@/lib/seed-data";

export function CommandPalette() {
  const router = useRouter();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    contracts,
    categories,
    providers,
    openContractDetail,
    openContractModal,
    openPdfPreview,
    toggleCategoryVisibility,
    setCalendarExportModalOpen,
    setEmergencyBinderModalOpen,
    setTaxReportModalOpen,
  } = useHub();

  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const matchedContracts = useMemo(() => {
    if (!q) return contracts.slice(0, 5);
    return contracts
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.policy_number.toLowerCase().includes(q) ||
          c.category_slug.toLowerCase().includes(q) ||
          (c.paperless_tag && c.paperless_tag.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [contracts, q]);

  const matchedCategories = useMemo(() => {
    if (!q) return categories.slice(0, 4);
    return categories
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(q) ||
          cat.description.toLowerCase().includes(q) ||
          cat.group_label.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [categories, q]);

  const matchedDocs = useMemo(() => {
    if (!q) return DEMO_PAPERLESS_DOCUMENTS.slice(0, 3);
    return DEMO_PAPERLESS_DOCUMENTS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.policy_number_matched &&
          d.policy_number_matched.toLowerCase().includes(q)) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
    ).slice(0, 4);
  }, [q]);

  if (!commandPaletteOpen) return null;

  return (
    <NativeDialog
      open={commandPaletteOpen}
      onClose={() => setCommandPaletteOpen(false)}
      title="Schnellsuche & Befehle (Ctrl+K)"
      subtitle="Suche nach Verträgen, Policennummern, Paperless-ngx Dokumenten oder Katalog-Kategorien"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Policennummer, Versicherung, Streaming-Abo oder Tag eingeben…"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCommandPaletteOpen(false);
              openContractModal({ preselectedType: "insurance" });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Neue Versicherung
          </button>
          <button
            type="button"
            onClick={() => {
              setCommandPaletteOpen(false);
              openContractModal({ preselectedType: "subscription" });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Neues Abo
          </button>
          <button
            type="button"
            onClick={() => {
              setCommandPaletteOpen(false);
              router.push("/emergency");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Notfall-Ansicht
          </button>
          <button
            type="button"
            onClick={() => {
              setCommandPaletteOpen(false);
              setEmergencyBinderModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Notfall-Mappe („Roter Ordner“)
          </button>
          <button
            type="button"
            onClick={() => {
              setCommandPaletteOpen(false);
              setTaxReportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Steuer-Bericht (§ 10 EStG)
          </button>
          <button
            type="button"
            onClick={() => {
              setCommandPaletteOpen(false);
              setCalendarExportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Kalender-Abo (iCal)
          </button>
        </div>

        {/* Matched Contracts */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Policen &amp; Abos ({matchedContracts.length})
          </div>
          {matchedContracts.map((c) => {
            const prov = providers.find((p) => p.id === c.provider_id);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCommandPaletteOpen(false);
                    openContractDetail(c.id);
                  }}
                  className="text-left flex-1 min-w-0 cursor-pointer"
                >
                  <div className="text-sm font-semibold truncate">{c.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{prov?.name}</span>
                    {c.policy_number && (
                      <code className="font-mono text-blue-600 dark:text-blue-400">
                        {c.policy_number}
                      </code>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold">
                    {formatEuro(getMonthlyCost(c.cost, c.billing_cycle))}/M
                  </span>
                  {prov?.emergency_hotline && (
                    <a
                      href={`tel:${prov.emergency_hotline.replace(/\s+/g, "")}`}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                      title={`Notruf: ${prov.emergency_hotline}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Matched Paperless Documents */}
        {matchedDocs.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Paperless-ngx Dokumente ({matchedDocs.length})
            </div>
            {matchedDocs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  openPdfPreview({ document: doc });
                }}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ASN #{doc.archive_serial_number} • {doc.correspondent_name}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                  PDF öffnen
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Matched Catalog Categories (Checkbox visibility) */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Katalog-Kategorien (Per Ankreuzen ein-/ausblenden)
          </div>
          {matchedCategories.map((cat) => (
            <div
              key={cat.slug}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5"
            >
              <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cat.is_visible}
                  onChange={() => toggleCategoryVisibility(cat.slug)}
                  className="w-4 h-4 rounded border-slate-300 cursor-pointer shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {cat.group_label}
                  </div>
                </div>
              </label>
              <button
                type="button"
                onClick={() => {
                  setCommandPaletteOpen(false);
                  router.push("/catalog");
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <CheckSquare className="w-3 h-3 text-blue-600" />
                Im Katalog
              </button>
            </div>
          ))}
        </div>
      </div>
    </NativeDialog>
  );
}
