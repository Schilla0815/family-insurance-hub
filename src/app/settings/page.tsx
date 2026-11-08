"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  FileCheck2,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  Palette,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Tag,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { useAuth } from "@/context/AuthContext";
import { UserManagementSection } from "@/components/admin/UserManagementSection";
import { ProviderFormModal } from "@/components/providers/ProviderFormModal";
import { MemberFormModal } from "@/components/settings/MemberFormModal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatDateDE } from "@/lib/calculations";
import { InsurerProvider, Member } from "@/types/models";

const EMOJI_OPTIONS = ["👨‍💻", "👩‍⚕️", "👦", "👧", "👶", "🧑", "👵", "👴", "🐶", "🐱"];

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const {
    members,
    providers,
    paperlessConfig,
    pocketbaseConnected,
    pocketbaseUrl,
    saveMember,
    deleteMember,
    saveProvider,
    deleteProvider,
    updatePaperlessConfig,
    exportBackupJson,
    downloadDatabaseBackup,
    setBackupModalOpen,
    importBackupJson,
    resetToDemoDefaults,
    clearAllData,
    setCalendarExportModalOpen,
    setEmergencyBinderModalOpen,
    setTaxReportModalOpen,
    showToast,
  } = useHub();

  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("settings_collapsed_sections");
      if (saved) {
        setCollapsedSections(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem("settings_collapsed_sections", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const collapseAll = () => {
    const allCollapsed = {
      paperless: true,
      users: true,
      members: true,
      providers: true,
      theme: true,
      calendar: true,
      emergency: true,
      backup: true,
    };
    setCollapsedSections(allCollapsed);
    try {
      localStorage.setItem("settings_collapsed_sections", JSON.stringify(allCollapsed));
    } catch {}
  };

  const expandAll = () => {
    setCollapsedSections({});
    try {
      localStorage.setItem("settings_collapsed_sections", JSON.stringify({}));
    } catch {}
  };

  // Paperless Config Form State
  const [plUrl, setPlUrl] = useState(paperlessConfig.url);
  const [plPublicUrl, setPlPublicUrl] = useState(paperlessConfig.publicUrl);
  const [plToken, setPlToken] = useState(paperlessConfig.token);
  const [matchPolicy, setMatchPolicy] = useState(
    paperlessConfig.autoMatchByPolicyNumber
  );
  const [matchTag, setMatchTag] = useState(paperlessConfig.autoMatchByTag);
  const [matchCorrespondent, setMatchCorrespondent] = useState(
    paperlessConfig.autoMatchByCorrespondent
  );
  const [testingPaperless, setTestingPaperless] = useState(false);
  const [paperlessStatus, setPaperlessStatus] = useState<{
    ok: boolean;
    count?: number;
    error?: string;
  } | null>(null);
  const [showPaperlessFaq, setShowPaperlessFaq] = useState(false);

  // Sync state when paperlessConfig finishes hydrating from LocalStorage
  useEffect(() => {
    if (paperlessConfig) {
      setPlUrl(paperlessConfig.url || "");
      setPlPublicUrl(paperlessConfig.publicUrl || "");
      setPlToken(paperlessConfig.token || "");
      setMatchPolicy(paperlessConfig.autoMatchByPolicyNumber);
      setMatchTag(paperlessConfig.autoMatchByTag);
      setMatchCorrespondent(paperlessConfig.autoMatchByCorrespondent);
    }
  }, [paperlessConfig]);

  // Provider & Member Modal States
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<InsurerProvider | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  // New Member Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberBirth, setNewMemberBirth] = useState("");
  const [newMemberEmoji, setNewMemberEmoji] = useState("👤");

  // New Provider Form State
  const [newProvName, setNewProvName] = useState("");
  const [newProvUrl, setNewProvUrl] = useState("");
  const [newProvHotline, setNewProvHotline] = useState("");
  const [newProvEmail, setNewProvEmail] = useState("");

  const handleSavePaperless = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Nur Administratoren können die Paperless-Zugangsdaten anpassen.");
      return;
    }
    updatePaperlessConfig({
      url: plUrl.trim(),
      publicUrl: plPublicUrl.trim(),
      token: plToken.trim(),
      autoMatchByPolicyNumber: matchPolicy,
      autoMatchByTag: matchTag,
      autoMatchByCorrespondent: matchCorrespondent,
    });
    showToast("Paperless-ngx Konfiguration gespeichert (für alle Nutzer aktiv)");
  };

  const handleTestPaperless = async () => {
    setTestingPaperless(true);
    setPaperlessStatus(null);
    try {
      const res = await fetch("/api/paperless/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: plUrl.trim(),
          token: plToken.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok || data.connected) {
        const count = data.documentCount ?? data.totalDocuments ?? 0;
        setPaperlessStatus({ ok: true, count });
        showToast(
          data.message || `Verbindung erfolgreich! ${count} Dokumente gefunden.`
        );
      } else {
        setPaperlessStatus({
          ok: false,
          error: data.message || data.error || "Keine Verbindung zum Paperless-ngx Server",
        });
        showToast(data.message || data.error || "Fehler bei der Verbindung zu Paperless-ngx");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setPaperlessStatus({
        ok: false,
        error: `Netzwerkfehler: ${message}`,
      });
      showToast("Netzwerkfehler beim Paperless-Test");
    } finally {
      setTestingPaperless(false);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    saveMember({
      first_name: newMemberName.trim(),
      role: newMemberRole.trim() || "Familienmitglied",
      birth_date: newMemberBirth || "2000-01-01",
      avatar_emoji: newMemberEmoji,
      avatar_color: "blue",
    });
    setNewMemberName("");
    setNewMemberRole("");
    setNewMemberBirth("");
    showToast(`Familienmitglied ${newMemberName} angelegt`);
  };

  const handleAddProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim()) return;
    saveProvider({
      name: newProvName.trim(),
      portal_url: newProvUrl.trim() || undefined,
      emergency_hotline: newProvHotline.trim() || undefined,
      support_email: newProvEmail.trim() || undefined,
    });
    setNewProvName("");
    setNewProvUrl("");
    setNewProvHotline("");
    setNewProvEmail("");
    showToast(`Versicherer / Anbieter ${newProvName} angelegt`);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `family-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup erfolgreich als JSON heruntergeladen");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importBackupJson(content);
        showToast(res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Expand/Collapse All Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
            <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Einstellungen, Paperless-ngx &amp; Stammdaten</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Verwalte deine NAS Paperless-ngx Schnittstelle, Familienmitglieder,
            Versicherungsanbieter, Farbschema und Daten-Backups.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Alle öffnen</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            <span>Alle einklappen</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 1. PAPERLESS-NGX NAS INTEGRATION SECTION                          */}
      {/* ================================================================= */}
      <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            onClick={() => toggleSection("paperless")}
            className="flex items-center gap-3 cursor-pointer select-none group flex-1"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Paperless-ngx Schnittstelle (Single Source of Truth)
                </h2>
                {isAdmin ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                    Admin-Verwaltung
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Global aktiv
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verknüpft Policen-Dokumente und Rechnungen direkt auf demselben NAS ohne doppelte PDF-Speicherung.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleTestPaperless}
              disabled={testingPaperless}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer text-slate-800 dark:text-slate-200"
            >
              {testingPaperless ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>Verbindung testen</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSection("paperless")}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={collapsedSections.paperless ? "Aufklappen" : "Einklappen"}
            >
              {collapsedSections.paperless ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {!collapsedSections.paperless && (
          <>
            {paperlessStatus && (
              <div
                className={`rounded-xl p-3.5 text-xs font-semibold flex items-center justify-between border ${
                  paperlessStatus.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {paperlessStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <span>
                    {paperlessStatus.ok
                      ? `Paperless-ngx erreichbar: ${paperlessStatus.count} Dokumente indexiert.`
                      : paperlessStatus.error}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSavePaperless} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Interne NAS Server URL (Docker Netzwerk oder IP)
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={plUrl}
                    onChange={(e) => setPlUrl(e.target.value)}
                    placeholder="http://paperless-web:8000 oder http://192.168.178.10:8000"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Wird vom Next.js Backend-Proxy für PDF-Streams &amp; REST-Abfragen genutzt.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Öffentliche Web-URL (für Direktlinks ins Paperless-UI)
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={plPublicUrl}
                    onChange={(e) => setPlPublicUrl(e.target.value)}
                    placeholder="http://192.168.178.10:8000 oder https://paperless.nas.home"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Erlaubt das Öffnen von Dokumenten im nativen Paperless-Webinterface.
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    API-Token (Paperless-ngx Benutzer &gt; API Tokens)
                  </label>
                  {!isAdmin && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Vom Admin hinterlegt (geschützt)
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  disabled={!isAdmin}
                  value={!isAdmin && plToken ? "••••••••••••••••••••" : plToken}
                  onChange={(e) => setPlToken(e.target.value)}
                  placeholder="z. B. 4b8d7c2a1e9f0..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={matchPolicy}
                      onChange={(e) => setMatchPolicy(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-70"
                    />
                    <span>Automatischer Abgleich nach Policennummer (Volltextsuche)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={matchTag}
                      onChange={(e) => setMatchTag(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-70"
                    />
                    <span>Automatischer Abgleich nach Paperless-Tags</span>
                  </label>
                </div>

                {isAdmin ? (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Schnittstelle speichern
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#161c2a] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Dieser Schlüssel gilt für alle Nutzer und kann nur vom Admin geändert werden.</span>
                  </div>
                )}
              </div>
            </form>

            {/* Paperless Linking FAQ & Best Practice Guide */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowPaperlessFaq((v) => !v)}
                className="w-full flex items-center justify-between text-left py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-[#161c2a] hover:bg-slate-100 dark:hover:bg-[#1c2436] transition-colors cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Dokumenten-Leitfaden &amp; FAQ: Wie sind Daten &amp; Tags verknüpft?</span>
                </div>
                {showPaperlessFaq ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showPaperlessFaq && (
                <div className="mt-3 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161c2a]/60 space-y-4 text-xs">
                  {/* Question 1 */}
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">1</span>
                      Wie findet die App die passenden Dokumente in Paperless-ngx?
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                      Die App nutzt eine mehrstufige Suchhierarchie über die Paperless REST-API:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-5 text-slate-600 dark:text-slate-400">
                      <li>
                        <strong className="text-slate-800 dark:text-slate-200">Policennummer (Höchste Priorität):</strong> Sucht die exakte Nummer im OCR-Volltext &amp; Titel (z. B. <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400">&quot;PHV-2023-88412&quot;</code>).
                      </li>
                      <li>
                        <strong className="text-slate-800 dark:text-slate-200">Paperless-Tag:</strong> Filtert gezielt nach einem Tag aus dem Vertrag (z. B. <code className="font-mono text-emerald-600 dark:text-emerald-400">tag:haftpflicht</code>).
                      </li>
                      <li>
                        <strong className="text-slate-800 dark:text-slate-200">Korrespondent:</strong> Filtert nach dem Versicherer/Anbieter (z. B. <code className="font-mono text-emerald-600 dark:text-emerald-400">HUK-COBURG</code>).
                      </li>
                      <li>
                        <strong className="text-slate-800 dark:text-slate-200">Eigene Abfrage:</strong> Falls gewünscht, kann im Vertrag eine individuelle Suchsyntax hinterlegt werden.
                      </li>
                    </ul>
                  </div>

                  {/* Question 2 */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">2</span>
                      Welche Tags &amp; Dokumenttypen gehören zu einer aktiven Police?
                    </h4>
                    <div className="pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                      <p>Für eine saubere Ordnung im NAS empfehlen wir folgendes Tagging-Schema:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200 font-sans">Aktive Haupturkunde (Police)</div>
                          <div className="text-emerald-600 dark:text-emerald-400">Tags: #police, #haftpflicht, #aktiv</div>
                          <div className="text-slate-400 font-sans">Dokumenttyp: Versicherungsschein (Police)</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200 font-sans">Jährliche Beitragsrechnung</div>
                          <div className="text-blue-600 dark:text-blue-400">Tags: #rechnung, #steuer-2026</div>
                          <div className="text-slate-400 font-sans">Dokumenttyp: Beitragsrechnung</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200 font-sans">Tarifänderung / Nachtrag</div>
                          <div className="text-amber-600 dark:text-amber-400">Tags: #nachtrag, #tarifwechsel</div>
                          <div className="text-slate-400 font-sans">Dokumenttyp: Nachtrag / Änderung</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200 font-sans">Kündigungsbestätigung</div>
                          <div className="text-rose-600 dark:text-rose-400">Tags: #kuendigung, #beendet</div>
                          <div className="text-slate-400 font-sans">Dokumenttyp: Kündigungsbestätigung</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question 3 */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">3</span>
                      Wie kann ich final auswählen, welches Dokument verknüpft wird, wenn viele Treffer gefunden werden?
                    </h4>
                    <div className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5 space-y-1.5">
                      <p>
                        Wenn Paperless-ngx mehrere Treffer liefert (z. B. alte Nachträge, Rechnungen und Schreiben), kannst du das gewünschte Dokument mit 1 Klick als Hauptpolice festlegen:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong className="text-slate-800 dark:text-slate-200">1-Klick-Verknüpfung im Vertrag:</strong> Öffne den Vertrag über <em>„Details &amp; Fristen“</em>. Klicke beim passenden Beleg einfach auf <strong>„📌 Verknüpfen“</strong>.
                        </li>
                        <li>
                          <strong className="text-slate-800 dark:text-slate-200">Feste Hauptpolice:</strong> Das Dokument wird mit einem Stern hervorgehoben und beim Klick auf „PDF“ in der Vertragsübersicht sofort vorrangig geöffnet.
                        </li>
                        <li>
                          <strong className="text-slate-800 dark:text-slate-200">Schnellsuche in Treffern:</strong> Nutze das Filterfeld oberhalb der Dokumentenliste, um die Treffer nach Begriffen wie <em>„Police“</em> oder <em>„2026“</em> einzuschränken.
                        </li>
                        <li>
                          <strong className="text-slate-800 dark:text-slate-200">ID direkt eingeben:</strong> Über den Button <strong>„# ID eingeben“</strong> kannst du auch direkt eine bekannte Paperless-ID (z. B. <code className="font-mono">401</code>) zuweisen.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Question 4 */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">4</span>
                      Warum ist bei Abos wie Netflix, Spotify oder iCloud kein PDF-Preview sichtbar?
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                      Bei digitalen Online-Abonnements gibt es in der Regel keine Versicherungspolice oder Papierurkunde. Die App prüft vor der Anzeige live, ob für den jeweiligen Vertrag ein Dokument im Paperless-Archiv existiert. 
                      <strong className="text-slate-800 dark:text-slate-200"> Wenn kein Dokument vorliegt, wird der PDF-Vorschau-Button automatisch komplett ausgeblendet</strong>, sodass keine leeren oder fälschlich generierten Dokumente angezeigt werden. Sobald du eine Rechnung in Paperless hochlädst (z. B. mit dem Tag <code className="font-mono text-emerald-600 dark:text-emerald-400">#streaming</code> oder dem Anbieternamen), erscheint die Vorschau sofort automatisch.
                    </p>
                  </div>

                  {/* Question 5 */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">5</span>
                      Was ist der Unterschied zwischen interner Server-URL und öffentlicher Web-URL?
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                      <strong className="text-slate-800 dark:text-slate-200">Interne NAS URL:</strong> Wird vom Node.js-Backend verwendet, um PDFs und Metadaten über das lokale Docker- oder Heimnetzwerk (z. B. <code className="font-mono">http://paperless-web:8000</code> oder <code className="font-mono">http://192.168.178.50:8000</code>) ohne Datenverkehr nach außen abzurufen.<br />
                      <strong className="text-slate-800 dark:text-slate-200">Öffentliche Web-URL:</strong> Wird für Klicks im Browser verwendet (&quot;In Paperless-ngx öffnen&quot;), z. B. deine benutzerfreundliche Domain oder reverse Proxy Adresse.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ================================================================= */}
      {/* USER MANAGEMENT SECTION (ADMIN ACCESS)                            */}
      {/* ================================================================= */}
      <UserManagementSection
        collapsed={Boolean(collapsedSections.users)}
        onToggle={() => toggleSection("users")}
      />

      {/* ================================================================= */}
      {/* 2. FAMILY MEMBERS & PROVIDERS STAMMDATEN                          */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Family Members Card */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => toggleSection("members")}
              className="flex items-center gap-2.5 cursor-pointer select-none group flex-1"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Familienmitglieder
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {members.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMemberToEdit(null);
                  setMemberModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mitglied anlegen</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSection("members")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={collapsedSections.members ? "Aufklappen" : "Einklappen"}
              >
                {collapsedSections.members ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!collapsedSections.members && (
            <>
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] p-3 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{m.avatar_emoji}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {m.first_name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {m.role} • Geboren {formatDateDE(m.birth_date)}
                        </span>
                        {m.health_insurance && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block truncate mt-0.5">
                            GKV: {m.health_insurance} {m.insurance_number ? `(${m.insurance_number})` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setMemberToEdit(m);
                          setMemberModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Familienmitglied bearbeiten (2 Schritte)"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteMember(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    + Schnellanlage:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberToEdit(null);
                      setMemberModalOpen(true);
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Geführter 2-Schritte-Assistent &gt;
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Vorname"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    required
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Rolle (z. B. Kind)"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="date"
                    value={newMemberBirth}
                    onChange={(e) => setNewMemberBirth(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {EMOJI_OPTIONS.slice(0, 6).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewMemberEmoji(emoji)}
                        className={`p-1 rounded-lg text-sm transition-all cursor-pointer ${
                          newMemberEmoji === emoji
                            ? "bg-emerald-500/20 scale-110"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Hinzufügen
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        {/* Insurers & Providers Card */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => toggleSection("providers")}
              className="flex items-center gap-2.5 cursor-pointer select-none group flex-1"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Versicherer &amp; Anbieter
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {providers.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProviderToEdit(null);
                  setProviderModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Anbieter anlegen</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSection("providers")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={collapsedSections.providers ? "Aufklappen" : "Einklappen"}
              >
                {collapsedSections.providers ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!collapsedSections.providers && (
            <>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] p-2.5 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {p.category_focus === "subscription"
                            ? "📺 Abo"
                            : p.category_focus === "contract"
                            ? "📄 Vertrag"
                            : "🛡️ Versicherung"}
                        </span>
                        {p.customer_number && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            KD: {p.customer_number}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {p.emergency_hotline && (
                          <span className="text-slate-500 dark:text-slate-300 font-mono">
                            Hotline: {p.emergency_hotline}
                          </span>
                        )}
                        {p.paperless_correspondent_name && (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                            <Tag className="w-3 h-3" />
                            Paperless: {p.paperless_correspondent_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setProviderToEdit(p);
                          setProviderModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Anbieter & Korrespondent bearbeiten (2 Schritte)"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProvider(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Add Provider Form */}
              <form onSubmit={handleAddProvider} className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    + Schnellanlage:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProviderToEdit(null);
                      setProviderModalOpen(true);
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Geführter 2-Schritte-Assistent mit Paperless &gt;
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Name (z. B. HUK, Allianz, Netflix)"
                    value={newProvName}
                    onChange={(e) => setNewProvName(e.target.value)}
                    required
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Notfall-Hotline"
                    value={newProvHotline}
                    onChange={(e) => setNewProvHotline(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="url"
                    placeholder="Kundenportal URL"
                    value={newProvUrl}
                    onChange={(e) => setNewProvUrl(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="email"
                    placeholder="Support-E-Mail"
                    value={newProvEmail}
                    onChange={(e) => setNewProvEmail(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Anbieter speichern
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      {/* ================================================================= */}
      {/* 3. THEME & BACKUP / DATABASE SECTION                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Three-State Color Scheme Control */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3.5 shadow-xs">
          <div
            onClick={() => toggleSection("theme")}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Palette className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Darstellung &amp; Farbschema
              </h2>
            </div>

            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={collapsedSections.theme ? "Aufklappen" : "Einklappen"}
            >
              {collapsedSections.theme ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          {!collapsedSections.theme && (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wähle dein bevorzugtes Design oder folge automatisch den Einstellungen deines Betriebssystems:
              </p>
              <div className="pt-1">
                <ThemeToggle variant="segmented" className="w-full justify-between" />
              </div>
            </>
          )}
        </section>

        {/* Kalender-Abo & Fristen-Export (iCal / WebCal) */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3.5 shadow-xs">
          <div
            onClick={() => toggleSection("calendar")}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Kalender-Abo &amp; Fristen-Export (iCal)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                WebCal / RFC 5545
              </span>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={collapsedSections.calendar ? "Aufklappen" : "Einklappen"}
              >
                {collapsedSections.calendar ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!collapsedSections.calendar && (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exportiere alle Kündigungsfristen, Stichtage und Beitragszahlungen direkt in deinen Kalender
                (Apple iPhone / Mac, Google Kalender, Outlook oder Thunderbird).
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setCalendarExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  Kalender-Abo &amp; Export öffnen
                </button>
              </div>
            </>
          )}
        </section>

        {/* Notfall-Mappe & Steuer-Vorsorgeaufwand */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3.5 shadow-xs">
          <div
            onClick={() => toggleSection("emergency")}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
                <Printer className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Notfall-Mappe &amp; Steuer-Export
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                Druck &amp; CSV
              </span>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={collapsedSections.emergency ? "Aufklappen" : "Einklappen"}
              >
                {collapsedSections.emergency ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!collapsedSections.emergency && (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Erstelle einen physischen Notfall-Ordner für Partner und Angehörige („Der rote Ordner“)
                oder werte deine absetzbaren Versicherungsbeiträge nach § 10 EStG für Elster und WISO aus.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEmergencyBinderModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Notfall-Mappe („Roter Ordner“)
                </button>
                <button
                  type="button"
                  onClick={() => setTaxReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Steuer-Bericht (§ 10 EStG)
                </button>
              </div>
            </>
          )}
        </section>

        {/* Backup, Export & PocketBase Status */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3.5 shadow-xs">
          <div
            onClick={() => toggleSection("backup")}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Datenbank &amp; NAS-Backup
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                PocketBase: {pocketbaseConnected ? "Online" : "Lokaler Speicher"}
              </span>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={collapsedSections.backup ? "Aufklappen" : "Einklappen"}
              >
                {collapsedSections.backup ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!collapsedSections.backup && (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sichere deinen kompletten Datenbestand inklusive aller Verträge, Policen-Zuordnungen
                und Paperless-Metadaten als JSON oder spiele ein vorhandenes Backup ein.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBackupModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  Datenbank-Sicherung &amp; Format-Auswahl
                </button>

                <button
                  type="button"
                  onClick={() => downloadDatabaseBackup("json")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON-Snapshot (.json)
                </button>

                <button
                  type="button"
                  onClick={() => downloadDatabaseBackup("csv")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Excel-Tabelle (.csv)
                </button>

                <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer text-slate-800 dark:text-slate-200">
                  <Upload className="w-3.5 h-3.5" />
                  Backup importieren
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Möchtest du alle Demo-Verträge und Beispieldaten entfernen, um mit deinem eigenen Haushalt sauber zu starten?"
                      )
                    ) {
                      clearAllData();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Beispieldaten leeren (Frischer Start)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Möchtest du die Standard-Demo-Daten wiederherstellen? Deine aktuellen Einträge werden dabei überschrieben."
                      )
                    ) {
                      resetToDemoDefaults();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Demo-Daten wiederherstellen
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Provider & Correspondent Modal with 2 Bearbeitungsschritte */}
      <ProviderFormModal
        open={providerModalOpen}
        onClose={() => {
          setProviderModalOpen(false);
          setProviderToEdit(null);
        }}
        initialProvider={providerToEdit}
      />

      {/* Family Member Modal with 2 Bearbeitungsschritte */}
      <MemberFormModal
        open={memberModalOpen}
        onClose={() => {
          setMemberModalOpen(false);
          setMemberToEdit(null);
        }}
        memberToEdit={memberToEdit}
      />
    </div>
  );
}
