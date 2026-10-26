"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  Layers,
  PhoneCall,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ContractDetailModal } from "@/components/contracts/ContractDetailModal";
import { ContractFormModal } from "@/components/contracts/ContractFormModal";
import { CancellationLetterModal } from "@/components/contracts/CancellationLetterModal";
import { CalendarExportModal } from "@/components/calendar/CalendarExportModal";
import { TaxReportModal } from "@/components/tax/TaxReportModal";
import { EmergencyBinderPrintModal } from "@/components/emergency/EmergencyBinderPrintModal";
import { PdfPreviewModal } from "@/components/paperless/PdfPreviewModal";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { formatEuro, getMonthlyCost } from "@/lib/calculations";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Übersicht",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    href: "/contracts",
    label: "Policen & Abos",
    shortLabel: "Verträge",
    icon: FileSpreadsheet,
    badge: null,
  },
  {
    href: "/catalog",
    label: "Katalog & Auswahl",
    shortLabel: "Katalog",
    icon: CheckSquare,
    badge: "33",
  },
  {
    href: "/emergency",
    label: "Notfall & Schaden",
    shortLabel: "Notfall",
    icon: PhoneCall,
    badge: "SOS",
    isEmergency: true,
  },
  {
    href: "/settings",
    label: "Einstellungen & Sync",
    shortLabel: "Setup",
    icon: Settings,
    badge: null,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    members,
    selectedMemberId,
    setSelectedMemberId,
    openContractModal,
    setCommandPaletteOpen,
    setCalendarExportModalOpen,
    toastMessage,
    contracts,
    categories,
    paperlessConfig,
  } = useHub();

  const activeContracts = contracts.filter(
    (c) => c.status === "active" && !c.is_hidden
  );
  const activeCount = activeContracts.length;
  const visibleCatCount = categories.filter((c) => c.is_visible).length;

  const totalMonthlySpend = activeContracts.reduce(
    (acc, c) => acc + getMonthlyCost(c.cost, c.billing_cycle),
    0
  );

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0c0e14] text-slate-900 dark:text-slate-100 transition-colors duration-150 w-full max-w-full overflow-x-hidden">
      {/* ================================================================= */}
      {/* DESKTOP SIDEBAR (Wallos-inspired clean obsidian / slate design)   */}
      {/* ================================================================= */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] z-30 shadow-xs">
        {/* Brand Header */}
        <div className="px-5 py-4.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>FamilyHub</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                Versicherungen &amp; Abos
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Action: New Contract (Wallos style) */}
        <div className="p-3.5 pb-2">
          <button
            type="button"
            onClick={() => openContractModal()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs py-2.5 px-3.5 shadow-sm shadow-emerald-950/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Vertrag / Abo</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          className="flex-1 px-3 py-2 space-y-1 overflow-y-auto"
          aria-label="Hauptnavigation"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? item.isEmergency
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    : item.isEmergency
                    ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.isEmergency
                        ? isActive
                          ? "bg-white/20 text-white"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Hub Status & Paperless NAS connection pill */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5 bg-slate-50/50 dark:bg-[#0f131d]">
          {/* Paperless NAS Capsule */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#151a26] p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0 truncate">
                <span className="font-bold text-[11px] block truncate text-slate-800 dark:text-slate-200">
                  Paperless-ngx
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {(paperlessConfig.publicUrl || paperlessConfig.url).replace("http://", "").replace("https://", "")}
                </span>
              </div>
            </div>
            <a
              href={paperlessConfig.publicUrl || paperlessConfig.url}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
              title="Paperless Web UI im neuen Tab öffnen"
            >
              NAS ↗
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-white dark:bg-[#151a26] p-2 border border-slate-200/60 dark:border-slate-800/80">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                {activeCount}
              </div>
              <div className="text-[10px] text-slate-400">Aktive Verträge</div>
            </div>
            <div className="rounded-lg bg-white dark:bg-[#151a26] p-2 border border-slate-200/60 dark:border-slate-800/80">
              <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatEuro(totalMonthlySpend)}
              </div>
              <div className="text-[10px] text-slate-400">pro Monat</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MAIN CONTENT AREA                                                 */}
      {/* ================================================================= */}
      <div className="flex-1 lg:pl-68 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Sticky Top Header (Desktop + Mobile) with Theme Switcher */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#121622]/95 backdrop-blur-md w-full max-w-full">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
              {/* Mobile Brand Logo */}
              <div className="flex items-center gap-2 lg:hidden shrink-0 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-xs tracking-tight block leading-tight text-slate-900 dark:text-white truncate">
                    FamilyHub
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate block">
                    Policen &amp; Abos
                  </span>
                </div>
              </div>

              {/* Desktop Command Search Trigger (hidden on mobile) */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden sm:flex flex-1 max-w-md min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-[#161c2a] hover:bg-slate-100 dark:hover:bg-[#1c2436] px-3.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 truncate min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    Vertrag, Abo, Anbieter oder Dokument suchen…
                  </span>
                </span>
                <kbd className="hidden md:inline-block rounded bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                  Ctrl+K
                </kbd>
              </button>

              {/* Header Right Actions: Always fit without horizontal scroll */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Mobile Search Icon Button (opens same CommandPalette) */}
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  aria-label="Vertrag suchen"
                  title="Suchen (Ctrl+K)"
                  className="sm:hidden w-9 h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#151a26] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </button>

                {/* Monthly Spending Pill (Desktop XL) */}
                <div className="hidden xl:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151a26] px-3 py-1.5 text-xs">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-500 dark:text-slate-400">Monatlich:</span>
                  <strong className="font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatEuro(totalMonthlySpend)}
                  </strong>
                </div>

                {/* Calendar Subscription Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setCalendarExportModalOpen(true)}
                  className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151a26] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  title="iCal Kalender-Export & Fristen-Abo (Apple, Google, Outlook)"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Kalender</span>
                </button>

                {/* THEME TOGGLE: Bright / Dark Mode (Always visible on mobile & desktop) */}
                <ThemeToggle className="shrink-0" />

                {/* Mobile Quick Add (+) */}
                <button
                  type="button"
                  onClick={() => openContractModal()}
                  aria-label="Neuer Vertrag anlegen"
                  title="Neuer Vertrag oder Abo anlegen"
                  className="lg:hidden w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Family Member Quick-Switcher Filter Bar (Smooth horizontal swipe on mobile, no page scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full touch-pan-x">
              <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0 uppercase tracking-wider">
                Mitglieder:
              </span>
              <button
                type="button"
                onClick={() => setSelectedMemberId("all")}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedMemberId === "all"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                    : "bg-slate-100 dark:bg-[#161c2a] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                👨‍👩‍👧‍👦 Alle ({members.length})
              </button>
              {members.map((m) => {
                const active = selectedMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setSelectedMemberId(active ? "all" : m.id)
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      active
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "bg-slate-100 dark:bg-[#161c2a] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{m.avatar_emoji}</span>
                    <span>{m.first_name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {/* ================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< lg)                               */}
      {/* ================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#121622]/95 backdrop-blur-md px-2 py-1.5"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-bold transition-colors ${
                  isActive
                    ? item.isEmergency
                      ? "bg-rose-600 text-white"
                      : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : item.isEmergency
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate max-w-full">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ================================================================= */}
      {/* GLOBAL MODALS & TOAST                                             */}
      {/* ================================================================= */}
      <ContractDetailModal />
      <ContractFormModal />
      <CancellationLetterModal />
      <CalendarExportModal />
      <TaxReportModal />
      <EmergencyBinderPrintModal />
      <PdfPreviewModal />
      <CommandPalette />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-18 lg:bottom-6 right-4 sm:right-6 z-50 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-2.5 text-xs font-bold shadow-lg border border-slate-800 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
