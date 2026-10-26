"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Copy,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Printer,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { NativeDialog } from "@/components/ui/NativeDialog";
import {
  formatEuro,
  generateTaxCsv,
  getTaxReportData,
} from "@/lib/calculations";

export function TaxReportModal() {
  const {
    taxReportModalOpen,
    setTaxReportModalOpen,
    contracts,
    members,
    categoriesMap,
    showToast,
  } = useHub();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filterMemberId, setFilterMemberId] = useState<string | "all">("all");

  const filteredContracts = useMemo(() => {
    if (filterMemberId === "all") return contracts;
    return contracts.filter((c) => c.policy_holder_id === filterMemberId);
  }, [contracts, filterMemberId]);

  const reportData = useMemo(() => {
    return getTaxReportData(
      filteredContracts,
      members,
      categoriesMap,
      selectedYear
    );
  }, [filteredContracts, members, categoriesMap, selectedYear]);

  if (!taxReportModalOpen) return null;

  const handleDownloadCsv = () => {
    const csvContent = generateTaxCsv(reportData, selectedYear);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Steuer_Vorsorgeaufwand_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Steuerbericht (${selectedYear}) als CSV heruntergeladen`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const lines = [
      `Steuerbericht: Vorsorgeaufwendungen (§ 10 EStG) für das Steuerjahr ${selectedYear}`,
      `Erstellt für: ${
        filterMemberId === "all"
          ? "Gesamter Haushalt"
          : members.find((m) => m.id === filterMemberId)?.first_name || "Haushalt"
      }`,
      `------------------------------------------------------------`,
      `1. Basis Kranken- & Pflegeversicherung: ${formatEuro(
        reportData.groups[0]?.totalAnnual || 0
      )} (voll abzugsfähig)`,
      `2. Haftpflichtversicherungen: ${formatEuro(
        reportData.groups[1]?.totalAnnual || 0
      )} (Zeile 18)`,
      `3. BU, Risikoleben & Unfall: ${formatEuro(
        reportData.groups[2]?.totalAnnual || 0
      )} (Zeile 20–22)`,
      `4. Krankenzusatzversicherungen: ${formatEuro(
        reportData.groups[3]?.totalAnnual || 0
      )} (Zeile 23–25)`,
      `5. Berufsrechtsschutz (Werbungskosten): ${formatEuro(
        reportData.groups[4]?.totalAnnual || 0
      )} (Anlage N)`,
      `------------------------------------------------------------`,
      `Gesamtbetrag Vorsorgeaufwand: ${formatEuro(
        reportData.totalDeductibleAnnual
      )} / Jahr`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    showToast("Steuer-Zusammenfassung in Zwischenablage kopiert");
  };

  return (
    <NativeDialog
      open={taxReportModalOpen}
      onClose={() => setTaxReportModalOpen(false)}
      title="Steuer-Vorsorgeaufwand-Bericht (§ 10 EStG)"
      subtitle={`Absetzbare Versicherungsbeiträge für WISO Steuer, Elster oder deinen Steuerberater (Steuerjahr ${selectedYear})`}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Filter & Year Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Steuerjahr:
            </span>
            <div className="flex items-center gap-1">
              {[currentYear, currentYear - 1, currentYear - 2].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedYear === yr
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Versicherungsnehmer:
            </span>
            <select
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="all">Gesamter Haushalt (Zusammenveranlagung)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.avatar_emoji} {m.first_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Absetzbar (Vorsorgeaufwand)</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatEuro(reportData.totalDeductibleAnnual)}
            </div>
            <div className="text-[11px] text-slate-500">
              Krankenkasse, Haftpflicht, BU, Unfall, Risikoleben
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Werbungskosten (Anlage N)</span>
            </div>
            <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
              {formatEuro(reportData.totalIncomeRelatedAnnual)}
            </div>
            <div className="text-[11px] text-slate-500">
              Berufsrechtsschutz (ca. 40–50 % absetzbar)
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-1 opacity-75">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Nicht abzugsfähig (Sachschutz)</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">
              {formatEuro(reportData.totalNonDeductibleAnnual)}
            </div>
            <div className="text-[11px] text-slate-500">
              Hausrat, Gebäude, Kfz-Kaskoteil, Abos
            </div>
          </div>
        </div>

        {/* Legal Consumer Protection Hint */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Wichtiger Steuer-Tipp zu den Höchstbeträgen (§ 10 Abs. 4 EStG):
            </span>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[11px]">
              Beiträge zur Basis-Kranken- und Pflegeversicherung werden immer zu <strong>100 % in voller Höhe</strong> anerkannt.
              Sonstige Vorsorgeaufwendungen (Haftpflicht, BU, Unfall) werden bis zu einem gesetzlichen Höchstbetrag von <strong>1.900 €</strong> pro Person (Angestellte / Beamte) bzw. <strong>2.800 €</strong> (Selbstständige) berücksichtigt.
            </p>
          </div>
        </div>

        {/* Categorized Tax Groups Accordion / Tables */}
        <div className="space-y-4">
          {reportData.groups.map((group) => {
            if (group.items.length === 0) return null;

            return (
              <div
                key={group.category}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
              >
                {/* Group Header */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {group.title}
                    </h3>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      {group.elsterLine}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-500 block">Jahressumme:</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatEuro(group.totalAnnual)} / Jahr
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-semibold">Police / Vertrag</th>
                        <th className="py-2.5 px-4 font-semibold">Versicherungsnehmer</th>
                        <th className="py-2.5 px-4 font-semibold">Policennummer</th>
                        <th className="py-2.5 px-4 font-semibold">Absetzbarkeit</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Jahresbeitrag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {group.items.map((it) => (
                        <tr
                          key={it.contract.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                            {it.contract.title}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                            {it.policyHolderName}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            {it.contract.policy_number || "—"}
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-500">
                            {it.deductibleShareText}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white text-right">
                            {formatEuro(it.annualPaid)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Als CSV für WISO / Excel</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Zusammenfassung kopieren</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Drucken / PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTaxReportModalOpen(false)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </NativeDialog>
  );
}
