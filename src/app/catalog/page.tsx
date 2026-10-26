"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Square,
  Tv,
  Users,
  X,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatEuro, getMonthlyCost } from "@/lib/calculations";
import { CatalogCategory, ContractType } from "@/types/models";
import { CategoryFormModal } from "@/components/catalog/CategoryFormModal";

export default function CatalogSelectionPage() {
  const {
    categories,
    contracts,
    members,
    providers,
    toggleCategoryVisibility,
    setAllCategoriesVisibility,
    openContractModal,
    openContractDetail,
    toggleContractVisibility,
  } = useHub();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | ContractType>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "checked" | "unchecked"
  >("all");
  const [search, setSearch] = useState("");
  const [expandedListCategory, setExpandedListCategory] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CatalogCategory | null>(null);

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CatalogCategory) => {
    setEditingCategory(cat);
    setCategoryModalOpen(true);
  };

  // Restore view mode from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("catalog_view_mode");
      if (saved === "grid" || saved === "list") {
        setViewMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("catalog_view_mode", mode);
    } catch {
      // ignore
    }
  };

  const q = search.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        if (activeTab !== "all" && cat.type !== activeTab) return false;
        if (visibilityFilter === "checked" && !cat.is_visible) return false;
        if (visibilityFilter === "unchecked" && cat.is_visible) return false;
        if (
          q &&
          !cat.name.toLowerCase().includes(q) &&
          !cat.description.toLowerCase().includes(q) &&
          !cat.group_label.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [categories, activeTab, visibilityFilter, q]);

  const groupedCategories = useMemo(() => {
    const groups = new Map<string, typeof filteredCategories>();
    for (const cat of filteredCategories) {
      const key = cat.group_label || "Allgemein";
      const list = groups.get(key) || [];
      list.push(cat);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [filteredCategories]);

  const stats = useMemo(() => {
    const insVisible = categories.filter(
      (c) => c.type === "insurance" && c.is_visible
    ).length;
    const insTotal = categories.filter((c) => c.type === "insurance").length;
    const subVisible = categories.filter(
      (c) => c.type === "subscription" && c.is_visible
    ).length;
    const subTotal = categories.filter((c) => c.type === "subscription").length;

    return {
      insVisible,
      insTotal,
      subVisible,
      subTotal,
      totalVisible: insVisible + subVisible,
      totalAll: insTotal + subTotal,
    };
  }, [categories]);

  const getProviderName = (providerId: string) => {
    return providers.find((p) => p.id === providerId)?.name || "Kein Anbieter hinterlegt";
  };

  const getMemberSummary = (policyHolderId: string, insuredIds: string[]) => {
    const holder = members.find((m) => m.id === policyHolderId);
    const insured = members.filter((m) => insuredIds.includes(m.id));
    return {
      holderName: holder ? `${holder.avatar_emoji} ${holder.first_name}` : "—",
      insuredNames: insured.length > 0
        ? insured.map((m) => `${m.avatar_emoji} ${m.first_name}`).join(", ")
        : holder ? `${holder.avatar_emoji} ${holder.first_name}` : "—",
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Title & View Switcher + Bulk Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
            <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Katalog &amp; Sichtbarkeit</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Entscheide per Ankreuzen, welche Versicherungsarten und Abos
            in deinem Haushalt sichtbar sein sollen ({stats.totalVisible} von{" "}
            {stats.totalAll} ausgewählt).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Create Custom Category Button */}
          <button
            type="button"
            onClick={handleOpenCreateCategory}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kategorie anlegen</span>
          </button>

          {/* View Mode Switcher: Kacheln vs Liste */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSetViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-100 dark:bg-[#1e2638] text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Kachelansicht mit detaillierten Vertrags- und Anbieter-Informationen"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kacheln (Detail)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-100 dark:bg-[#1e2638] text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Kompakte Listenansicht"
            >
              <List className="w-3.5 h-3.5" />
              <span>Listenansicht</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setAllCategoriesVisibility(
                true,
                activeTab === "all" ? undefined : activeTab
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer text-slate-800 dark:text-slate-200"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Alle</span> ankreuzen
          </button>
          <button
            type="button"
            onClick={() =>
              setAllCategoriesVisibility(
                false,
                activeTab === "all" ? undefined : activeTab
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer text-slate-800 dark:text-slate-200"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Alle</span> abwählen
          </button>
        </div>
      </div>

      {/* Filter Bar (Type Tabs + Checked/Unchecked Filter + Search) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Type Switch */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#161c2a]">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white dark:bg-[#121622] text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Alle ({stats.totalVisible}/{stats.totalAll})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("insurance")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "insurance"
                  ? "bg-white dark:bg-[#121622] text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Versicherungen ({stats.insVisible}/{stats.insTotal})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subscription")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "subscription"
                  ? "bg-white dark:bg-[#121622] text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Abos ({stats.subVisible}/{stats.subTotal})
            </button>
          </div>

          {/* Visibility Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: "Alle anzeigen" },
                { id: "checked", label: "☑️ Nur Angekreuzte" },
                { id: "unchecked", label: "⬜ Nur Ausgeblendete" },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setVisibilityFilter(pill.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  visibilityFilter === pill.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                    : "bg-slate-100 dark:bg-[#161c2a] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Versicherungsart oder Abo suchen (z. B. Haftpflicht, Zahnzusatz, Streaming, KFZ)…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161c2a] pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filteredCategories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-white dark:bg-[#121622]">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Keine Kategorien für die gewählten Filter gefunden.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setVisibilityFilter("all");
              setSearch("");
            }}
            className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}

      {/* VIEW MODE 1: KACHELANSICHT (MIT DETAILLIERTEREN INFOS) */}
      {viewMode === "grid" &&
        groupedCategories.map(([groupName, items]) => (
          <section
            key={groupName}
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] overflow-hidden shadow-xs"
          >
            <div className="px-5 py-3.5 bg-slate-100/80 dark:bg-[#161c2a] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {groupName}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {items.filter((i) => i.is_visible).length} / {items.length} sichtbar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5">
              {items.map((cat) => {
                const catContracts = contracts.filter(
                  (c) => c.category_slug === cat.slug && c.status !== "cancelled"
                );
                const activeContracts = catContracts.filter(
                  (c) => c.status === "active" && !c.is_hidden
                );
                const monthlySum = activeContracts.reduce(
                  (acc, c) => acc + getMonthlyCost(c.cost, c.billing_cycle),
                  0
                );
                const annualSum = monthlySum * 12;

                return (
                  <div
                    key={cat.slug}
                    className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all ${
                      cat.is_visible
                        ? "border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#151a26] hover:border-emerald-500/40 shadow-xs"
                        : "border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121622]/50 opacity-60"
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Checkbox + Title Header + Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer select-none flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={cat.is_visible}
                            onChange={() => toggleCategoryVisibility(cat.slug)}
                            className="mt-1 w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                            title="In Hauptübersicht ein- oder ausblenden"
                          />
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              cat.type === "insurance"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                            }`}
                          >
                            <CategoryIcon
                              name={cat.icon_name}
                              className="w-5 h-5"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm sm:text-base font-extrabold leading-tight text-slate-900 dark:text-white">
                                {cat.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  cat.type === "insurance"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                                }`}
                              >
                                {cat.type === "insurance" ? "Versicherung" : "Abo"}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                              {cat.description}
                            </span>
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                          title="Kategorie / Sparte anpassen oder löschen"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Coverage Status Banner (Detailed Info) */}
                      <div className="pl-8">
                        {catContracts.length > 0 ? (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              <span>
                                {activeContracts.length} {activeContracts.length === 1 ? "Vertrag aktiv" : "Verträge aktiv"}
                              </span>
                            </div>
                            <div className="text-emerald-900 dark:text-emerald-200 font-bold tabular-nums">
                              {formatEuro(monthlySum)} / Monat{" "}
                              <span className="text-[11px] font-normal text-emerald-700/80 dark:text-emerald-300/80">
                                ({formatEuro(annualSum)} / Jahr)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#161c2a] px-3 py-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-slate-400" />
                              Kein Vertrag für diese Kategorie hinterlegt
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">
                              Offen
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Detailed Linked Contracts List */}
                      {catContracts.length > 0 && (
                        <div className="space-y-2 pt-1 pl-8">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Hinterlegte Policen &amp; Details:</span>
                            <span>Sichtbarkeit / Kosten</span>
                          </div>

                          {catContracts.map((con) => {
                            const { holderName, insuredNames } = getMemberSummary(
                              con.policy_holder_id,
                              con.insured_member_ids
                            );
                            const providerName = getProviderName(con.provider_id);
                            const mCost = getMonthlyCost(con.cost, con.billing_cycle);

                            return (
                              <div
                                key={con.id}
                                className={`rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-[#161c2a] p-3 text-xs space-y-2 transition-all ${
                                  con.is_hidden ? "opacity-60 bg-slate-100/50 dark:bg-[#121622]/50" : ""
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <label className="flex items-start gap-2.5 cursor-pointer min-w-0 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={!con.is_hidden}
                                      onChange={() => toggleContractVisibility(con.id)}
                                      className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer shrink-0"
                                      title="Diesen einzelnen Vertrag ein-/ausblenden"
                                    />
                                    <div className="min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => openContractDetail(con.id)}
                                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-500 dark:hover:text-emerald-400 truncate text-left cursor-pointer flex items-center gap-1.5"
                                      >
                                        <span>{con.title}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-400 inline shrink-0" />
                                      </button>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Anbieter: <strong className="text-slate-700 dark:text-slate-300">{providerName}</strong>
                                        {con.policy_number && (
                                          <span className="ml-2 font-mono text-[10px] bg-slate-200/60 dark:bg-[#1a2334] px-1.5 py-0.2 rounded">
                                            Nr: {con.policy_number}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </label>

                                  <div className="text-right shrink-0">
                                    <div className="font-black tabular-nums text-slate-900 dark:text-white">
                                      {formatEuro(mCost)}/M
                                    </div>
                                    <div className="text-[10px] text-slate-400 tabular-nums">
                                      {formatEuro(con.cost)} {con.billing_cycle === "annual" ? "jährl." : con.billing_cycle === "quarterly" ? "viertelj." : "mtl."}
                                    </div>
                                  </div>
                                </div>

                                {/* Extended Details row */}
                                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    <span>Versichert: <strong className="text-slate-700 dark:text-slate-300">{insuredNames}</strong></span>
                                  </div>
                                  {con.next_payment_date && (
                                    <div>
                                      Nächste Zahlung: <strong className="text-slate-700 dark:text-slate-300">{con.next_payment_date}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer Action: Visibility status & Add Contract */}
                    <div className="pt-3 pl-8 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {cat.is_visible
                          ? "☑️ In Hauptübersicht eingeblendet"
                          : "⬜ In Hauptübersicht ausgeblendet"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          openContractModal({
                            preselectedCategorySlug: cat.slug,
                            preselectedType: cat.type,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Vertrag anlegen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

      {/* VIEW MODE 2: LISTENANSICHT (KOMPAKT & EFFIZIENT) */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {groupedCategories.map(([groupName, items]) => (
            <section
              key={groupName}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] overflow-hidden shadow-xs"
            >
              {/* Group Header */}
              <div className="px-5 py-3.5 bg-slate-100/80 dark:bg-[#161c2a] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {groupName}
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    ({items.length} Arten)
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {items.filter((i) => i.is_visible).length} / {items.length} sichtbar
                </span>
              </div>

              {/* Responsive Table / List View */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {items.map((cat) => {
                  const catContracts = contracts.filter(
                    (c) => c.category_slug === cat.slug && c.status !== "cancelled"
                  );
                  const activeContracts = catContracts.filter(
                    (c) => c.status === "active" && !c.is_hidden
                  );
                  const monthlySum = activeContracts.reduce(
                    (acc, c) => acc + getMonthlyCost(c.cost, c.billing_cycle),
                    0
                  );
                  const isExpanded = expandedListCategory === cat.slug;

                  return (
                    <div
                      key={cat.slug}
                      className={`transition-colors ${
                        cat.is_visible
                          ? "hover:bg-slate-50/70 dark:hover:bg-[#161c2a]/50"
                          : "bg-slate-50/40 dark:bg-[#121622]/40 opacity-60"
                      }`}
                    >
                      {/* Main List Row */}
                      <div className="p-3.5 sm:px-5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                        {/* Checkbox & Category Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={cat.is_visible}
                            onChange={() => toggleCategoryVisibility(cat.slug)}
                            className="w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer shrink-0"
                            title="In Hauptübersicht ein-/ausblenden"
                          />
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              cat.type === "insurance"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                            }`}
                          >
                            <CategoryIcon
                              name={cat.icon_name}
                              className="w-4 h-4"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {cat.name}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  cat.type === "insurance"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                }`}
                              >
                                {cat.type === "insurance" ? "Versicherung" : "Abo"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xl">
                              {cat.description}
                            </p>
                          </div>
                        </div>

                        {/* Status / Contracts Count Badge */}
                        <div className="flex items-center gap-4 shrink-0">
                          {catContracts.length > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedListCategory(isExpanded ? null : cat.slug)
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                              title="Verträge anzeigen/ausklappen"
                            >
                              <span>{catContracts.length} {catContracts.length === 1 ? "Vertrag" : "Verträge"}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium px-2 py-0.5">
                              Kein Vertrag
                            </span>
                          )}

                          {/* Monthly sum */}
                          <div className="w-24 text-right">
                            <span className="text-xs sm:text-sm font-black tabular-nums text-slate-900 dark:text-white block">
                              {monthlySum > 0 ? `${formatEuro(monthlySum)}/M` : "—"}
                            </span>
                          </div>

                          {/* Edit Category Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Kategorie bearbeiten oder anpassen"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Action Button */}
                          <button
                            type="button"
                            onClick={() =>
                              openContractModal({
                                preselectedCategorySlug: cat.slug,
                                preselectedType: cat.type,
                              })
                            }
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-emerald-500/10 hover:text-emerald-600 text-slate-500 transition-colors cursor-pointer"
                            title="Neuen Vertrag anlegen"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Contract list inside table row */}
                      {isExpanded && catContracts.length > 0 && (
                        <div className="bg-slate-50/80 dark:bg-[#161c2a]/80 p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Hinterlegte Verträge in dieser Kategorie:
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {catContracts.map((con) => {
                              const providerName = getProviderName(con.provider_id);
                              const { insuredNames } = getMemberSummary(
                                con.policy_holder_id,
                                con.insured_member_ids
                              );
                              return (
                                <div
                                  key={con.id}
                                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] p-2.5 text-xs flex items-center justify-between gap-2 shadow-2xs"
                                >
                                  <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!con.is_hidden}
                                      onChange={() =>
                                        toggleContractVisibility(con.id)
                                      }
                                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 cursor-pointer shrink-0"
                                      title="Einzelnen Vertrag ein-/ausblenden"
                                    />
                                    <div className="min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => openContractDetail(con.id)}
                                        className="font-bold text-slate-900 dark:text-white hover:text-emerald-500 truncate text-left cursor-pointer block"
                                      >
                                        {con.title}
                                      </button>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                        {providerName} • {insuredNames}
                                      </span>
                                    </div>
                                  </label>
                                  <div className="text-right shrink-0">
                                    <span className="font-bold tabular-nums text-xs">
                                      {formatEuro(
                                        getMonthlyCost(con.cost, con.billing_cycle)
                                      )}
                                      /M
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal to create/edit categories */}
      <CategoryFormModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        initialCategory={editingCategory}
        initialType={activeTab === "all" ? "insurance" : activeTab}
      />
    </div>
  );
}
