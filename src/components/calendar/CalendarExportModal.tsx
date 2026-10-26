"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Globe,
  HelpCircle,
  Share2,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { generateIcsCalendar } from "@/lib/calculations";

export function CalendarExportModal() {
  const {
    calendarExportModalOpen,
    setCalendarExportModalOpen,
    contracts,
    providers,
    showToast,
  } = useHub();

  const [feedUrl, setFeedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFeedUrl(`${window.location.origin}/api/calendar/export`);
    }
  }, []);

  if (!calendarExportModalOpen) return null;

  const handleDownloadIcs = () => {
    const icsString = generateIcsCalendar(
      contracts,
      providers,
      "Familien-Versicherungen & Kündigungsfristen"
    );
    const blob = new Blob([icsString], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "familien-versicherungen.ics";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Kalenderdatei (.ics) erfolgreich heruntergeladen");
  };

  const handleCopyFeedUrl = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    showToast("Kalender-Abo-Link in Zwischenablage kopiert");
    setTimeout(() => setCopied(false), 2500);
  };

  const webcalUrl = feedUrl.replace(/^https?:\/\//, "webcal://");

  const activeContractsCount = contracts.filter((c) => c.status === "active").length;

  return (
    <NativeDialog
      open={calendarExportModalOpen}
      onClose={() => setCalendarExportModalOpen(false)}
      title="Kalender-Export &amp; Fristen-Abo (iCal / WebCal)"
      subtitle="Verpasse nie wieder eine Kündigungsfrist oder Hauptfälligkeit auf deinem Smartphone"
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Automatische Kalender-Ereignisse</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Exportiert Termine für <strong>{activeContractsCount} aktive Verträge</strong>:
              Kündigungs-Stichtage (mit 7-Tage-Vorwarnung), Hauptfälligkeiten und Beitragsabbuchungen.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>.ics Datei herunterladen</span>
          </button>
        </div>

        {/* Live WebCal Subscription URL */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Abonnierbarer Kalender-Feed (URL)</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aktualisiert sich automatisch
            </span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={feedUrl}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyFeedUrl}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>URL kopieren</span>
                  </>
                )}
              </button>

              <a
                href={webcalUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-2 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                title="Direkt mit Apple Kalender / Thunderbird abonnieren"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>In Kalender öffnen</span>
              </a>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Kopiere diese URL in deine Kalender-App, um Kündigungsfristen fortlaufend synchron zu halten.
          </p>
        </div>

        {/* Step by Step Instructions */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>So bindest du den Kalender auf deinem Gerät ein</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5 bg-white dark:bg-slate-900">
              <div className="font-bold flex items-center gap-1.5">
                <span className="text-base">🍎</span>
                <span>Apple iPhone / Mac</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <li>Klicke oben auf <strong>„In Kalender öffnen“</strong> oder öffne <em>Einstellungen &gt; Kalender &gt; Accounts</em>.</li>
                <li>Wähle <strong>„Kalenderabonnement hinzufügen“</strong>.</li>
                <li>Füge die URL ein und bestätige die Benachrichtigungen.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5 bg-white dark:bg-slate-900">
              <div className="font-bold flex items-center gap-1.5">
                <span className="text-base">🌐</span>
                <span>Google Kalender</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <li>Öffne <em>calendar.google.com</em> im Browser.</li>
                <li>Links bei „Weitere Kalender“ auf das <strong>+</strong> klicken.</li>
                <li><strong>„Per URL“</strong> auswählen und den kopierten Link einfügen.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5 bg-white dark:bg-slate-900">
              <div className="font-bold flex items-center gap-1.5">
                <span className="text-base">💻</span>
                <span>Outlook &amp; Thunderbird</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <li>In Thunderbird oder Outlook auf <strong>„Neuer Kalender“</strong>.</li>
                <li>Option <strong>„Im Netzwerk / Aus dem Web“</strong> wählen.</li>
                <li>iCal-Link einfügen und gewünschte Erinnerungszeit festlegen.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Included Event Types Legend */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3.5 text-xs space-y-2 border border-slate-200/80 dark:border-slate-800">
          <div className="font-bold text-slate-700 dark:text-slate-300">
            Enthaltene Termintypen im Kalender:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-rose-500 font-bold">⚠️ Kündigungsfrist</span>
              <span>Letzter Kündigungstag mit Alarm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500 font-bold">🔄 Hauptfälligkeit</span>
              <span>Laufzeitende / Verlängerung</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">💶 Zahlungstermin</span>
              <span>Fälliger Monats-/Jahresbeitrag</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setCalendarExportModalOpen(false)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </NativeDialog>
  );
}
