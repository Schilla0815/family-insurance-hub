"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  List,
  Plus,
  Receipt,
  Search,
  Shield,
  Table as TableIcon,
  Tv,
  Users,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import {
  formatDateDE,
  formatEuro,
  getAnnualCost,
  getBillingCycleShort,
  getCancellationInfo,
  getMonthlyCost,
} from "@/lib/calculations";
import { ContractType } from "@/types/models";
import { DEMO_PAPERLESS_DOCUMENTS } from "@/lib/seed-data";

export default function ContractsPage() {
  const {
    contracts,
    categoriesMap,
    providers,
    members,
    selectedMemberId,
    openContractDetail,
    openContractModal,
    openPdfPreview,
    toggleContractVisibility,
    setTaxReportModalOpen,
    showToast,
  } = useHub();

  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [typeFilter, setTypeFilter] = useState<"all" | ContractType>("all");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [sortBy, setSortBy] = useState<
    "cost_desc" | "deadline_asc" | "next_payment" | "title"
  >("cost_desc");
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();

  const filteredContracts = useMemo(() => {
    const list = contracts.filter((c) => {
      const cat = categoriesMap.get(c.category_slug);
      if (!includeHidden && (c.is_hidden || (cat && !cat.is_visible))) {
        return false;
      }
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (selectedMemberId !== "all") {
        const isHolder = c.policy_holder_id === selectedMemberId;
        const isInsured = c.insured_member_ids.includes(selectedMemberId);
        if (!isHolder && !isInsured) return false;
      }
      if (q) {
        const prov = providers.find((p) => p.id === c.provider_id);
        const match =
          c.title.toLowerCase().includes(q) ||
          c.policy_number.toLowerCase().includes(q) ||
          (c.paperless_tag && c.paperless_tag.toLowerCase().includes(q)) ||
          (prov && prov.name.toLowerCase().includes(q)) ||
          (cat && cat.name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "cost_desc") {
        return (
          getMonthlyCost(b.cost, b.billing_cycle) -
          getMonthlyCost(a.cost, a.billing_cycle)
        );
      }
      if (sortBy === "deadline_asc") {
        const dA = getCancellationInfo(a).daysUntilNoticeDeadline ?? 9999;
        const dB = getCancellationInfo(b).daysUntilNoticeDeadline ?? 9999;
        return dA - dB;
      }
      if (sortBy === "next_payment") {
        return (a.next_payment_date || "9999").localeCompare(
          b.next_payment_date || "9999"
        );
      }
      return a.title.localeCompare(b.title, "de");
    });
  }, [
    contracts,
    categoriesMap,
    providers,
    includeHidden,
    typeFilter,
    selectedMemberId,
    q,
    sortBy,
  ]);

  const summary = useMemo(() => {
    let monthly = 0;
    let annual = 0;
    for (const c of filteredContracts) {
      if (c.status === "active" && !c.is_hidden) {
        monthly += getMonthlyCost(c.cost, c.billing_cycle);
        annual += getAnnualCost(c.cost, c.billing_cycle);
      }
    }
    return { monthly, annual };
  }, [filteredContracts]);

  const getProviderName = (id: string) => {
    return providers.find((p) => p.id === id)?.name || "Kein Anbieter hinterlegt";
  };

  const getDaysUntilPayment = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Policen &amp; Abonnements ({filteredContracts.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Summe der sichtbaren Verträge:{" "}
            <strong className="text-slate-900 dark:text-white tabular-nums font-bold">
              {formatEuro(summary.monthly)} / Monat
            </strong>{" "}
            ({formatEuro(summary.annual)} / Jahr)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Table vs Cards View Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-slate-100 dark:bg-[#1e2638] text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Wallos-Kacheln</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-slate-100 dark:bg-[#1e2638] text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Listenansicht</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTaxReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            title="Vorsorgeaufwand nach § 10 EStG für Steuererklärung"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Steuer-Bericht (§ 10 EStG)</span>
          </button>

          <button
            type="button"
            onClick={() => openContractModal()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Vertrag hinzufügen</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Type Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: "Alle Verträge" },
                { id: "insurance", label: "🛡️ Versicherungen" },
                { id: "subscription", label: "📺 Sonstige Abos" },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setTypeFilter(btn.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === btn.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                    : "bg-slate-100 dark:bg-[#161c2a] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Sort & Hidden Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sortierung"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161c2a] text-slate-800 dark:text-slate-200 px-3 py-1.5 text-xs font-bold cursor-pointer"
            >
              <option value="cost_desc">Höchste Monatskosten</option>
              <option value="deadline_asc">Nächste Kündigungsfrist</option>
              <option value="next_payment">Nächste Abbuchung</option>
              <option value="title">Alphabetisch (A–Z)</option>
            </select>

            <button
              type="button"
              onClick={() => setIncludeHidden((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                includeHidden
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {includeHidden ? (
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              Ausgeblendete zeigen
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nach Vertragsname, Policennummer, Anbieter oder Paperless-Tag filtern…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161c2a] pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* VIEW 1: WALLOS-STYLE SUBSCRIPTION CARDS GRID                      */}
      {/* ================================================================= */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContracts.map((c) => {
            const cat = categoriesMap.get(c.category_slug);
            const provName = getProviderName(c.provider_id);
            const monthly = getMonthlyCost(c.cost, c.billing_cycle);
            const annual = getAnnualCost(c.cost, c.billing_cycle);
            const cancellation = getCancellationInfo(c);
            const daysUntilPay = getDaysUntilPayment(c.next_payment_date);

            const matchedDoc = c.paperless_document_id
              ? DEMO_PAPERLESS_DOCUMENTS.find(
                  (d) => d.id === c.paperless_document_id
                ) || {
                  id: c.paperless_document_id,
                  title:
                    c.paperless_document_title ||
                    `Hauptpolice #${c.paperless_document_id}`,
                  created:
                    c.next_payment_date ||
                    new Date().toISOString().slice(0, 10),
                  added: new Date().toISOString(),
                  tags: ["police"],
                  policy_number_matched: c.policy_number,
                }
              : DEMO_PAPERLESS_DOCUMENTS.find(
                  (d) =>
                    d.policy_number_matched === c.policy_number ||
                    (c.paperless_tag && d.tags.includes(c.paperless_tag))
                );

            return (
              <div
                key={c.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                  c.is_hidden
                    ? "border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121622]/50 opacity-60"
                    : "border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] hover:border-emerald-500/50 shadow-xs"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Checkbox + Icon + Title + Provider */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={!c.is_hidden}
                        onChange={() => toggleContractVisibility(c.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer shrink-0 mt-1"
                        title="Vertrag per Ankreuzen ein-/ausblenden"
                      />
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          c.type === "insurance"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                        }`}
                      >
                        <CategoryIcon
                          name={cat?.icon_name}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0 flex-1 pr-1">
                        <button
                          type="button"
                          onClick={() => openContractDetail(c.id)}
                          className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-left block break-words [overflow-wrap:anywhere] hyphens-auto leading-snug cursor-pointer"
                        >
                          {c.title}
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                          {provName}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5 ${
                        c.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {c.status === "active" ? "Aktiv" : "Pausiert"}
                    </span>
                  </div>

                  {/* Primary Price Section (Wallos signature design) */}
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#161c2a] p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-black tabular-nums text-slate-900 dark:text-white tracking-tight">
                        {formatEuro(c.cost)}
                        <span className="text-xs font-semibold text-slate-400 ml-1">
                          {getBillingCycleShort(c.billing_cycle)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        entspricht {formatEuro(monthly)} monatlich ({formatEuro(annual)}/J)
                      </div>
                    </div>

                    {/* Next Payment Countdown (Wallos signature) */}
                    {daysUntilPay !== null && (
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Nächste Zahlung
                        </div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>
                            {daysUntilPay <= 0
                              ? "Heute"
                              : daysUntilPay === 1
                              ? "Morgen"
                              : `in ${daysUntilPay} Tagen`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata: Policy Number + Insured Persons */}
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {c.policy_number && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Police / Kunden-Nr.:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(c.policy_number);
                            showToast(`Nr. ${c.policy_number} kopiert`);
                          }}
                          className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{c.policy_number}</span>
                          <Copy className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <span>Mitversichert:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {members
                          .filter((m) => c.insured_member_ids.includes(m.id))
                          .map((m) => `${m.avatar_emoji} ${m.first_name}`)
                          .join(", ") || "—"}
                      </span>
                    </div>

                    {cancellation.state !== "none" && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Kündigungs-Ampel:</span>
                        <span
                          className={`font-bold ${
                            cancellation.state === "red"
                              ? "text-rose-500"
                              : cancellation.state === "yellow"
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        >
                          ● {cancellation.shortLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions: Details, PDF & Edit */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {matchedDoc && (
                      <button
                        type="button"
                        onClick={() =>
                          openPdfPreview({
                            document: matchedDoc,
                            contract: c,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-[#1a2334] hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 hover:text-emerald-500 px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer border border-slate-200/60 dark:border-slate-800"
                        title="Versicherungsschein PDF aus Paperless-ngx öffnen"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>PDF</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openContractModal({ contract: c })}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                      title="Bearbeiten"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => openContractDetail(c.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <span>Details &amp; Fristen</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================================================================= */
        /* VIEW 2: RESPONSIVE DATA TABLE (KOMPAKT & OHNE HORIZONTALES SCROLLEN) */
        /* ================================================================= */
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] overflow-hidden shadow-xs">
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="contracts-table-caption"
            className="table-wrapper"
          >
            <table className="responsive-contracts-table text-left text-xs w-full">
              <caption id="contracts-table-caption" className="sr-only">
                Aktive Familienversicherungen und Abonnements
              </caption>
              <thead className="bg-slate-100/80 dark:bg-[#161c2a] text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-3.5 w-[33%]">Vertrag &amp; Sparte</th>
                  <th className="py-3 px-3 w-[20%]">Anbieter &amp; Police</th>
                  <th className="py-3 px-3 w-[15%]">Personen</th>
                  <th className="py-3 px-3 w-[11%]">Kosten</th>
                  <th className="py-3 px-3 w-[10%]">Kündigung</th>
                  <th className="py-3 px-3.5 text-right w-[11%]">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredContracts.map((c) => {
                  const cat = categoriesMap.get(c.category_slug);
                  const prov = providers.find((p) => p.id === c.provider_id);
                  const monthly = getMonthlyCost(c.cost, c.billing_cycle);
                  const cancellation = getCancellationInfo(c);
                  const matchedDoc = c.paperless_document_id
                    ? DEMO_PAPERLESS_DOCUMENTS.find(
                        (d) => d.id === c.paperless_document_id
                      ) || {
                        id: c.paperless_document_id,
                        title:
                          c.paperless_document_title ||
                          `Hauptpolice #${c.paperless_document_id}`,
                        created:
                          c.next_payment_date ||
                          new Date().toISOString().slice(0, 10),
                        added: new Date().toISOString(),
                        tags: ["police"],
                        policy_number_matched: c.policy_number,
                      }
                    : DEMO_PAPERLESS_DOCUMENTS.find(
                        (d) =>
                          d.policy_number_matched === c.policy_number ||
                          (c.paperless_tag && d.tags.includes(c.paperless_tag))
                      );

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#161c2a]/80 transition-colors ${
                        c.is_hidden || (cat && !cat.is_visible)
                          ? "opacity-55"
                          : ""
                      }`}
                    >
                      {/* Spalte 1: Vertrag & Sparte/Kategorie kombiniert */}
                      <th
                        scope="row"
                        className="py-3 px-3.5 font-bold text-slate-900 dark:text-white bg-white dark:bg-[#121622] align-middle"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={!c.is_hidden}
                            onChange={() => toggleContractVisibility(c.id)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer shrink-0 mt-1"
                            title="Vertrag per Ankreuzen ein-/ausblenden"
                          />
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              c.type === "insurance"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                            }`}
                          >
                            <CategoryIcon
                              name={cat?.icon_name}
                              className="w-4 h-4"
                            />
                          </div>
                          <div className="min-w-0 flex-1 pr-1">
                            <button
                              type="button"
                              onClick={() => openContractDetail(c.id)}
                              className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-left block break-words [overflow-wrap:anywhere] hyphens-auto leading-tight cursor-pointer"
                            >
                              {c.title}
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center rounded bg-slate-100 dark:bg-[#161c2a] px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                                {cat?.name || c.category_slug}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                • Fällig: {formatDateDE(c.next_payment_date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </th>

                      {/* Spalte 2: Anbieter & Policennummer */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {prov?.name || "—"}
                          </span>
                          {c.policy_number ? (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(c.policy_number);
                                showToast(`Police ${c.policy_number} kopiert`);
                              }}
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 px-1 py-0.5 rounded cursor-pointer w-fit"
                              title="Policennummer kopieren"
                            >
                              <span className="truncate max-w-[120px]">
                                {c.policy_number}
                              </span>
                              <Copy className="w-2.5 h-2.5 opacity-60 shrink-0" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Keine Nr.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Spalte 3: Familienmitglieder im kompakten 2x2 Panel */}
                      <td className="py-3 px-3 align-middle">
                        <div className="grid grid-cols-2 gap-1 w-fit max-w-[130px]">
                          {members
                            .filter((m) => c.insured_member_ids.includes(m.id))
                            .map((m) => (
                              <span
                                key={m.id}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-[#161c2a] px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800"
                                title={`${m.first_name} (${m.role})`}
                              >
                                <span className="text-xs shrink-0">
                                  {m.avatar_emoji}
                                </span>
                                <span className="truncate max-w-[42px]">
                                  {m.first_name}
                                </span>
                              </span>
                            ))}
                        </div>
                      </td>

                      {/* Spalte 4: Kosten & Turnus */}
                      <td className="py-3 px-3 align-middle">
                        <div className="text-right sm:text-left">
                          <div className="text-xs sm:text-sm font-black tabular-nums text-slate-900 dark:text-white">
                            {formatEuro(monthly)}{" "}
                            <span className="text-[10px] font-normal text-slate-400">
                              / M
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 tabular-nums">
                            {formatEuro(c.cost)}{" "}
                            {getBillingCycleShort(c.billing_cycle)}
                          </div>
                        </div>
                      </td>

                      {/* Spalte 5: Kündigungs-Ampel */}
                      <td className="py-3 px-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cancellation.state === "red"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : cancellation.state === "yellow"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : cancellation.state === "green"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-100 dark:bg-[#161c2a] text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              cancellation.state === "red"
                                ? "bg-rose-500"
                                : cancellation.state === "yellow"
                                ? "bg-amber-500"
                                : cancellation.state === "green"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span className="truncate">
                            {cancellation.shortLabel}
                          </span>
                        </span>
                      </td>

                      {/* Spalte 6: Aktionen (PDF & Bearbeiten untereinander) */}
                      <td className="py-2.5 px-3.5 text-right align-middle">
                        <div className="flex flex-col items-end justify-center gap-1.5">
                          {matchedDoc && (
                            <button
                              type="button"
                              onClick={() =>
                                openPdfPreview({
                                  document: matchedDoc,
                                  contract: c,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                              title="Versicherungsschein PDF öffnen"
                            >
                              <FileText className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              openContractModal({ contract: c })
                            }
                            className="p-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Bearbeiten"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
