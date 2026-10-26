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
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatDateDE } from "@/lib/calculations";

const EMOJI_OPTIONS = ["👨‍💻", "👩‍⚕️", "👦", "👧", "👶", "🧑", "👵", "👴", "🐶", "🐱"];

export default function SettingsPage() {
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
    importBackupJson,
    resetToDemoDefaults,
    clearAllData,
    setCalendarExportModalOpen,
    setEmergencyBinderModalOpen,
    setTaxReportModalOpen,
    showToast,
  } = useHub();

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
    updatePaperlessConfig({
      url: plUrl.trim(),
      publicUrl: plPublicUrl.trim(),
      token: plToken.trim(),
      autoMatchByPolicyNumber: matchPolicy,
      autoMatchByTag: matchTag,
      autoMatchByCorrespondent: matchCorrespondent,
    });
    showToast("Paperless-ngx Konfiguration gespeichert");
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
      {/* Page Title */}
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

      {/* ================================================================= */}
      {/* 1. PAPERLESS-NGX NAS INTEGRATION SECTION                          */}
      {/* ================================================================= */}
      <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Paperless-ngx Schnittstelle (Single Source of Truth)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verknüpft Policen-Dokumente und Rechnungen direkt auf demselben NAS ohne doppelte PDF-Speicherung.
              </p>
            </div>
          </div>

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
        </div>

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
                value={plUrl}
                onChange={(e) => setPlUrl(e.target.value)}
                placeholder="http://paperless-web:8000 oder http://192.168.178.10:8000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                value={plPublicUrl}
                onChange={(e) => setPlPublicUrl(e.target.value)}
                placeholder="http://192.168.178.10:8000 oder https://paperless.nas.home"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Erlaubt das Öffnen von Dokumenten im nativen Paperless-Webinterface.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              API-Token (Paperless-ngx Benutzer &gt; API Tokens)
            </label>
            <input
              type="password"
              value={plToken}
              onChange={(e) => setPlToken(e.target.value)}
              placeholder="z. B. 4b8d7c2a1e9f0..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={matchPolicy}
                  onChange={(e) => setMatchPolicy(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <span>Automatischer Abgleich nach Policennummer (Volltextsuche)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={matchTag}
                  onChange={(e) => setMatchTag(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <span>Automatischer Abgleich nach Paperless-Tags</span>
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Schnittstelle speichern
            </button>
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
      </section>

      {/* ================================================================= */}
      {/* 2. FAMILY MEMBERS & PROVIDERS STAMMDATEN                          */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Family Members Card */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Familienmitglieder ({members.length})
            </h2>
          </div>

          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{m.avatar_emoji}</span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {m.first_name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {m.role} • Geboren {formatDateDE(m.birth_date)}
                    </span>
                  </div>
                </div>

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
            ))}
          </div>

          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              + Neues Familienmitglied anlegen:
            </span>
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
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161c2a] text-slate-900 dark:text-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
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
        </section>

        {/* Insurers & Providers Card */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Versicherer &amp; Dienstanbieter ({providers.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {providers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] p-2.5 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white block truncate">
                    {p.name}
                  </span>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                    {p.emergency_hotline && (
                      <span>Hotline: {p.emergency_hotline}</span>
                    )}
                    {p.portal_url && <span>• Portal hinterlegt</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteProvider(p.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Löschen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Provider Form */}
          <form onSubmit={handleAddProvider} className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              + Neuen Anbieter / Versicherer anlegen:
            </span>
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
        </section>
      </div>

      {/* ================================================================= */}
      {/* 3. THEME & BACKUP / DATABASE SECTION                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Three-State Color Scheme Control */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3.5 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Darstellung &amp; Farbschema
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wähle dein bevorzugtes Design oder folge automatisch den Einstellungen deines Betriebssystems:
          </p>
          <div className="pt-1">
            <ThemeToggle variant="segmented" className="w-full justify-between" />
          </div>
        </section>

        {/* Kalender-Abo & Fristen-Export (iCal / WebCal) */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Kalender-Abo &amp; Fristen-Export (iCal)
            </h2>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              WebCal / RFC 5545
            </span>
          </div>

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
        </section>

        {/* Notfall-Mappe & Steuer-Vorsorgeaufwand */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Printer className="w-4 h-4 text-rose-600" />
              Notfall-Mappe &amp; Steuer-Export
            </h2>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Druck &amp; CSV
            </span>
          </div>

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
        </section>

        {/* Backup, Export & PocketBase Status */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Datenbank &amp; NAS-Backup
            </h2>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              PocketBase: {pocketbaseConnected ? "Online" : "Lokaler Speicher"}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sichere deinen kompletten Datenbestand inklusive aller Verträge, Policen-Zuordnungen
            und Paperless-Metadaten als JSON oder spiele ein vorhandenes Backup ein.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              JSON-Backup exportieren
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
        </section>
      </div>
    </div>
  );
}
