"use client";

import React, { useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileCode2,
  FileSpreadsheet,
  HardDriveDownload,
  Info,
  Server,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { useHub } from "@/context/HubContext";

export function DatabaseBackupModal() {
  const {
    backupModalOpen,
    setBackupModalOpen,
    contracts,
    members,
    providers,
    categories,
    claims,
    downloadDatabaseBackup,
    exportBackupJson,
    importBackupJson,
    showToast,
  } = useHub();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [showRawPreview, setShowRawPreview] = useState(false);

  if (!backupModalOpen) return null;

  const insurancesCount = contracts.filter((c) => c.type === "insurance").length;
  const fixedContractsCount = contracts.filter((c) => c.type === "contract").length;
  const subscriptionsCount = contracts.filter(
    (c) => c.type === "subscription"
  ).length;

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const res = importBackupJson(reader.result);
        setImportStatus(res);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <NativeDialog
      open={backupModalOpen}
      onClose={() => {
        setBackupModalOpen(false);
        setImportStatus(null);
      }}
      title="Datenbank-Sicherung & Export"
      subtitle="Vollständige Sicherung aller Versicherungen, Verträge, Abos, variablen Zusatzfelder & Einstellungen"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Live Snapshot Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] p-3">
            <div className="text-[11px] text-slate-500 font-semibold">
              Einträge gesamt
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {contracts.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {insurancesCount} Vers. • {fixedContractsCount} Vertr. •{" "}
              {subscriptionsCount} Abos
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] p-3">
            <div className="text-[11px] text-slate-500 font-semibold">
              Anbieter &amp; Kunden-Nr.
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {providers.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              inkl. Hotlines &amp; Korrespondenten
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] p-3">
            <div className="text-[11px] text-slate-500 font-semibold">
              Familie &amp; Schäden
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {members.length} / {claims.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Personen &amp; Schadensfälle
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] p-3">
            <div className="text-[11px] text-slate-500 font-semibold">
              Katalog-Kategorien
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {categories.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              inkl. eigener Kategorien
            </div>
          </div>
        </div>

        {/* Format Recommendation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Primary Recommended Format: JSON Snapshot */}
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Empfohlen für Voll-Backup
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  .JSON
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Vollständiger JSON-Datenbank-Snapshot
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Sichert <strong>verlustfrei 100 % der Datenbank</strong>: Alle
                Versicherungen, Verträge &amp; Abos, variable Zusatzfelder,
                Kündigungsregeln, Anbieter, Personen, Schäden &amp;
                Einstellungen. Jederzeit 1:1 wiederherstellbar.
              </p>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => downloadDatabaseBackup("json")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>JSON-Datenbank-Sicherung herunterladen</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(exportBackupJson(true));
                  showToast("JSON-Backup in Zwischenablage kopiert");
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>In Zwischenablage kopieren</span>
              </button>
            </div>
          </div>

          {/* Secondary Format: CSV / Excel Export */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161c2a] p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Für Excel &amp; Auswertung
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  .CSV
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500 shrink-0" />
                Tabellen-Export (Excel / CSV)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Exportiert alle Einträge als strukturierte Tabelle (UTF-8 mit
                BOM &amp; Semikolon-Trennung) inkl. Kundennummern, Vertragsnr.,
                Kosten, Fristen und Zusatzfeldern direkt für Microsoft Excel
                oder LibreOffice Calc.
              </p>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => downloadDatabaseBackup("csv")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-4 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Als Excel-CSV exportieren</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRawPreview((v) => !v)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>
                  {showRawPreview
                    ? "JSON-Vorschau ausblenden"
                    : "JSON-Inhalt einsehen"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {showRawPreview && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-3 max-h-48 overflow-y-auto">
            <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap">
              {exportBackupJson(false)}
            </pre>
          </div>
        )}

        {/* Restore / Import Section */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-[#161c2a]/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-500" />
                Datenbank-Sicherung wiederherstellen (JSON-Import)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Lade eine zuvor gespeicherte <code className="font-mono">.json</code>{" "}
                Sicherungsdatei hoch, um alle Einträge sofort wiederherzustellen
                und mit der NAS-Datenbank zu synchronisieren.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] hover:border-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>JSON-Datei auswählen &amp; importieren</span>
            </button>
          </div>

          {importStatus && (
            <div
              className={`rounded-xl p-3 text-xs font-medium flex items-center gap-2 ${
                importStatus.ok
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* NAS Git Pull & Docker Rebuild Persistence Info */}
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-blue-500 shrink-0" />
            Automatische Datenübernahme bei Git Pull &amp; neuem Docker-Build auf dem NAS
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Die Datenbank liegt auf dem NAS im persistenten Ordner{" "}
            <code className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              ./pb_data
            </code>{" "}
            außerhalb des Containers. Wenn du ein{" "}
            <code className="font-mono">git pull</code> und anschließend{" "}
            <code className="font-mono">docker compose up -d --build</code>{" "}
            ausführst, wird nur der Programmcode erneuert – alle bestehenden
            Verträge, Kategorien und Einstellungen bleiben automatisch erhalten.
          </p>
        </div>
      </div>
    </NativeDialog>
  );
}
