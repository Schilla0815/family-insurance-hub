"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Clock,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  Shield,
  ShieldCheck,
  TrendingUp,
  Tv,
  Users,
  Wallet,
  Zap,
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
  getYearlyCashflowForecast,
} from "@/lib/calculations";
import { DEMO_PAPERLESS_DOCUMENTS } from "@/lib/seed-data";
import { FamilyMilestonesRadar } from "@/components/dashboard/FamilyMilestonesRadar";

export default function DashboardPage() {
  const {
    contracts,
    categories,
    categoriesMap,
    members,
    providers,
    selectedMemberId,
    setSelectedMemberId,
    openContractDetail,
    openContractModal,
    openPdfPreview,
    toggleCategoryVisibility,
    toggleContractVisibility,
  } = useHub();

  const [showHiddenContracts, setShowHiddenContracts] = useState(false);
  const [typeFilter, setTypeFilter] = useState<
    "all" | "insurance" | "subscription"
  >("all");

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Filter active contracts matching member filter, category checkbox, and contract checkbox
  const visibleActiveContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (c.status !== "active") return false;
      const cat = categoriesMap.get(c.category_slug);
      if (cat && !cat.is_visible && !showHiddenContracts) return false;
      if (c.is_hidden && !showHiddenContracts) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (selectedMemberId !== "all") {
        const isHolder = c.policy_holder_id === selectedMemberId;
        const isInsured = c.insured_member_ids.includes(selectedMemberId);
        if (!isHolder && !isInsured) return false;
      }
      return true;
    });
  }, [
    contracts,
    categoriesMap,
    showHiddenContracts,
    typeFilter,
    selectedMemberId,
  ]);

  // Financial KPIs
  const metrics = useMemo(() => {
    let totalMonthly = 0;
    let totalAnnual = 0;
    let insuranceMonthly = 0;
    let insuranceAnnual = 0;
    let insuranceCount = 0;
    let subscriptionMonthly = 0;
    let subscriptionAnnual = 0;
    let subscriptionCount = 0;

    for (const c of visibleActiveContracts) {
      const m = getMonthlyCost(c.cost, c.billing_cycle);
      const a = getAnnualCost(c.cost, c.billing_cycle);
      totalMonthly += m;
      totalAnnual += a;

      if (c.type === "insurance") {
        insuranceMonthly += m;
        insuranceAnnual += a;
        insuranceCount += 1;
      } else {
        subscriptionMonthly += m;
        subscriptionAnnual += a;
        subscriptionCount += 1;
      }
    }

    return {
      totalMonthly,
      totalAnnual,
      insuranceMonthly,
      insuranceAnnual,
      insuranceCount,
      subscriptionMonthly,
      subscriptionAnnual,
      subscriptionCount,
    };
  }, [visibleActiveContracts]);

  // Upcoming payments sorted by next_payment_date
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...visibleActiveContracts]
      .filter((c) => c.cost > 0 && c.next_payment_date)
      .map((c) => {
        const payDate = new Date(c.next_payment_date);
        payDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil(
          (payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          contract: c,
          diffDays,
          payDate,
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 6);
  }, [visibleActiveContracts]);

  // Category spending breakdown for distribution bar
  const categorySpending = useMemo(() => {
    const map = new Map<string, { name: string; monthly: number; count: number; icon: string }>();
    for (const c of visibleActiveContracts) {
      const cat = categoriesMap.get(c.category_slug);
      const name = cat?.name || "Sonstige";
      const icon = cat?.icon_name || "FileText";
      const monthly = getMonthlyCost(c.cost, c.billing_cycle);
      const current = map.get(name) || { name, monthly: 0, count: 0, icon };
      current.monthly += monthly;
      current.count += 1;
      map.set(name, current);
    }
    return Array.from(map.values())
      .sort((a, b) => b.monthly - a.monthly)
      .slice(0, 5);
  }, [visibleActiveContracts, categoriesMap]);

  // Cancellation Traffic Light Radar
  const cancellationRadar = useMemo(() => {
    return visibleActiveContracts
      .map((c) => ({
        contract: c,
        info: getCancellationInfo(c),
      }))
      .filter((item) => item.info.daysUntilNoticeDeadline !== null)
      .sort(
        (a, b) =>
          (a.info.daysUntilNoticeDeadline ?? 9999) -
          (b.info.daysUntilNoticeDeadline ?? 9999)
      );
  }, [visibleActiveContracts]);

  const urgentDeadlines = cancellationRadar.filter(
    (item) => item.info.state === "red" || item.info.state === "yellow"
  );

  const cashflowBuckets = useMemo(
    () => getYearlyCashflowForecast(visibleActiveContracts),
    [visibleActiveContracts]
  );
  const maxCashflowMonth = useMemo(
    () => Math.max(1, ...cashflowBuckets.map((b) => b.totalAmount)),
    [cashflowBuckets]
  );
  const currentMonthIdx = new Date().getMonth();

  const hiddenCount =
    contracts.filter((c) => c.is_hidden).length +
    categories.filter((c) => !c.is_visible).length;

  const getProviderName = (id: string) => {
    return providers.find((p) => p.id === id)?.name || "Kein Anbieter";
  };

  const getHolderEmoji = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.avatar_emoji} ${m.first_name}` : "";
  };

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. TOP HEADER & FILTER BAR                                        */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>
              {selectedMember
                ? `Übersicht für ${selectedMember.avatar_emoji} ${selectedMember.first_name}`
                : "Familien-Übersicht"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Alle ausgewählten Policen, Fixkosten und Paperless-ngx Dokumente im Überblick.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Eye Toggle for hidden items */}
          <button
            type="button"
            onClick={() => setShowHiddenContracts((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              showHiddenContracts
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151a26] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {showHiddenContracts ? (
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              {showHiddenContracts
                ? "Ausgeblendete sichtbar"
                : `Ausgeblendete (${hiddenCount})`}
            </span>
          </button>

          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151a26] hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-1.5 text-xs font-bold transition-all text-slate-800 dark:text-slate-200"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Katalog ankreuzen</span>
          </Link>

          <button
            type="button"
            onClick={() => openContractModal()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Neu</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. METRIC TILES                                                   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Tile 1: Total Monthly */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Monatliche Gesamtkosten
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
              {formatEuro(metrics.totalMonthly)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Jahresprognose:{" "}
              <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                {formatEuro(metrics.totalAnnual)}
              </strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{visibleActiveContracts.length} Verträge aktiv</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              100% kalkuliert
            </span>
          </div>
        </div>

        {/* Tile 2: Insurances */}
        <button
          type="button"
          onClick={() =>
            setTypeFilter(typeFilter === "insurance" ? "all" : "insurance")
          }
          className={`text-left rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all cursor-pointer ${
            typeFilter === "insurance"
              ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20"
              : "border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Versicherungen ({metrics.insuranceCount})
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-blue-600 dark:text-blue-400">
              {formatEuro(metrics.insuranceMonthly)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formatEuro(metrics.insuranceAnnual)} / Jahr
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 w-full">
            <span>
              {metrics.totalMonthly > 0
                ? `${Math.round((metrics.insuranceMonthly / metrics.totalMonthly) * 100)}% der Ausgaben`
                : "—"}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {typeFilter === "insurance" ? "✓ Filter aktiv" : "Filtern"}
            </span>
          </div>
        </button>

        {/* Tile 3: Subscriptions */}
        <button
          type="button"
          onClick={() =>
            setTypeFilter(
              typeFilter === "subscription" ? "all" : "subscription"
            )
          }
          className={`text-left rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all cursor-pointer ${
            typeFilter === "subscription"
              ? "border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20"
              : "border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Abos &amp; Fixkosten ({metrics.subscriptionCount})
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-indigo-600 dark:text-indigo-400">
              {formatEuro(metrics.subscriptionMonthly)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formatEuro(metrics.subscriptionAnnual)} / Jahr
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 w-full">
            <span>
              {metrics.totalMonthly > 0
                ? `${Math.round((metrics.subscriptionMonthly / metrics.totalMonthly) * 100)}% der Ausgaben`
                : "—"}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {typeFilter === "subscription" ? "✓ Filter aktiv" : "Filtern"}
            </span>
          </div>
        </button>

        {/* Tile 4: Notice Radar & Deadlines */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kündigungs-Ampel
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
              {urgentDeadlines.length} Fristen
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              in den nächsten 90 Tagen fällig
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{cancellationRadar.length} Verträge mit Frist</span>
            <Link
              href="/contracts"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Fristen prüfen ↗
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. UPCOMING PAYMENTS & TOP SPENDING SPLIT                         */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Nächste Zahlungen */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Nächste Zahlungen &amp; Fälligkeiten
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Anstehende Abbuchungen im Haushalt (nach Datum geordnet)
                </p>
              </div>
            </div>
            <Link
              href="/contracts"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Alle anzeigen ↗
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {upcomingPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Keine bevorstehenden Zahlungsdaten hinterlegt.
              </div>
            ) : (
              upcomingPayments.map(({ contract: con, diffDays }) => {
                const cat = categoriesMap.get(con.category_slug);
                const providerName = getProviderName(con.provider_id);
                const holderText = getHolderEmoji(con.policy_holder_id);

                return (
                  <div
                    key={con.id}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          con.type === "insurance"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                        }`}
                      >
                        <CategoryIcon
                          name={cat?.icon_name || "FileText"}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openContractDetail(con.id)}
                          className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate text-left block cursor-pointer"
                        >
                          {con.title}
                        </button>
                        <span className="text-[11px] text-slate-400 truncate block">
                          {providerName} {holderText ? `• ${holderText}` : ""}{" "}
                          {con.payment_method ? `• ${con.payment_method}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-sm tabular-nums text-slate-900 dark:text-white">
                        {formatEuro(con.cost)}
                      </div>
                      <div className="text-[10px] font-bold">
                        {diffDays <= 0 ? (
                          <span className="text-rose-500 font-extrabold">Heute fällig</span>
                        ) : diffDays === 1 ? (
                          <span className="text-amber-500 font-extrabold">Morgen</span>
                        ) : (
                          <span className="text-slate-400">
                            In {diffDays} Tagen ({formatDateDE(con.next_payment_date)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Top Category Cost Breakdown */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Größte Kostenblöcke
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Monatlich
            </span>
          </div>

          <div className="space-y-3.5">
            {categorySpending.map((item) => {
              const pct =
                metrics.totalMonthly > 0
                  ? Math.round((item.monthly / metrics.totalMonthly) * 100)
                  : 0;

              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                      {item.name}
                    </span>
                    <span className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {formatEuro(item.monthly)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#1c2436] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick info capsule */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{categories.filter((c) => c.is_visible).length} aktive Sparten</span>
            <Link
              href="/catalog"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Katalog anpassen ↗
            </Link>
          </div>
        </section>
      </div>

      {/* ================================================================= */}
      {/* 4. YEARLY CASHFLOW FORECAST (SEASONAL PEAKS)                      */}
      {/* ================================================================= */}
      <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Jahres-Cashflow &amp; Zahlungsspitzen (12-Monats-Vorschau)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Erkenne teure Monate mit Jahres- oder Quartalsabbuchungen im Voraus.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Jahresgesamtlast:{" "}
            <strong className="text-slate-900 dark:text-white tabular-nums">
              {formatEuro(metrics.totalAnnual)}
            </strong>
          </span>
        </div>

        {/* Histogram / Monthly Bar Chart */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 sm:gap-2 pt-2">
          {cashflowBuckets.map((b, idx) => {
            const isCurrent = idx === currentMonthIdx;
            const heightPercent = Math.max(
              12,
              Math.round((b.totalAmount / maxCashflowMonth) * 100)
            );

            return (
              <div
                key={b.label}
                className={`rounded-xl border p-2 flex flex-col justify-between items-center text-center transition-all ${
                  isCurrent
                    ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20 shadow-2xs"
                    : "border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#161c2a]"
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {b.label}
                </span>

                <div className="w-full h-18 flex items-end justify-center my-1.5 px-1">
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all ${
                      isCurrent
                        ? "bg-emerald-500 shadow-xs"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${b.label}: ${formatEuro(b.totalAmount)}`}
                  />
                </div>

                <span className="text-[10px] font-extrabold tabular-nums text-slate-800 dark:text-slate-200">
                  {Math.round(b.totalAmount)} €
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. CANCELLATION NOTICE WARNING RADAR (IF ANY URGENT)              */}
      {/* ================================================================= */}
      {urgentDeadlines.length > 0 && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="text-sm font-extrabold">
              Achtung: {urgentDeadlines.length} Kündigungsfrist(en) laufen demnächst ab!
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentDeadlines.map(({ contract: c, info }) => (
              <div
                key={c.id}
                className="rounded-xl border border-amber-500/30 bg-white dark:bg-[#151a26] p-3 text-xs flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openContractDetail(c.id)}
                    className="font-bold text-slate-900 dark:text-white hover:text-amber-600 truncate text-left block cursor-pointer"
                  >
                    {c.title}
                  </button>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">
                    Stichtag: {formatDateDE(info.noticeDeadlineDate)} (noch {info.daysUntilNoticeDeadline} Tage)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openContractDetail(c.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold text-[11px] hover:bg-amber-500/20 shrink-0 cursor-pointer"
                >
                  Prüfen
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* 6. FAMILY MILESTONES RADAR                                        */}
      {/* ================================================================= */}
      <FamilyMilestonesRadar />
    </div>
  );
}
