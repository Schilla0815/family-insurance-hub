"use client";

import React, { useMemo } from "react";
import {
  AlertTriangle,
  Car,
  CheckSquare,
  Copy,
  FileText,
  HeartPulse,
  Home,
  MapPin,
  PhoneCall,
  Printer,
  Scale,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { formatDateDE, formatEuro } from "@/lib/calculations";

export function EmergencyBinderPrintModal() {
  const {
    emergencyBinderModalOpen,
    setEmergencyBinderModalOpen,
    contracts,
    members,
    providers,
    categoriesMap,
    showToast,
  } = useHub();

  const printDateStr = formatDateDE(new Date().toISOString().split("T")[0]);

  const activeInsurances = useMemo(
    () => contracts.filter((c) => c.type === "insurance" && c.status === "active"),
    [contracts]
  );

  if (!emergencyBinderModalOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let out = `============================================================\n`;
    out += `NOTFALL-MAPPE DER FAMILIE (Stand: ${printDateStr})\n`;
    out += `Wichtige Notrufnummern, Policen und Ansprechpartner\n`;
    out += `============================================================\n\n`;

    out += `1. ZENTRALE NOTRUFNUMMERN:\n`;
    out += `• Notruf Feuerwehr / Rettungsdienst: 112\n`;
    out += `• Polizei: 110\n`;
    out += `• Ärztlicher Bereitschaftsdienst: 116 117\n`;
    out += `• Kartensperrung (Giro-/Kreditkarten): 116 116\n`;
    out += `• ADAC Pannenhilfe: +49 89 222222\n`;
    out += `• Giftnotrufzentrale: +49 30 19240\n\n`;

    out += `2. FAMILIENMITGLIEDER:\n`;
    for (const m of members) {
      out += `• ${m.first_name} (geb. ${formatDateDE(m.birth_date)}) - ${m.role}\n`;
    }
    out += `\n3. WICHTIGE POLICEN:\n`;
    for (const c of activeInsurances) {
      const p = providers.find((prov) => prov.id === c.provider_id);
      out += `• ${c.title}\n`;
      out += `  Anbieter: ${p?.name || "—"} | Hotline: ${p?.emergency_hotline || "—"}\n`;
      out += `  Policennummer: ${c.policy_number || "Nicht hinterlegt"}\n`;
      if (c.deductible !== undefined) out += `  Selbstbeteiligung: ${formatEuro(c.deductible)}\n`;
      if (c.coverage_amount) out += `  Deckung: ${c.coverage_amount}\n`;
      out += `\n`;
    }

    navigator.clipboard.writeText(out);
    showToast("Notfall-Mappe als Text in Zwischenablage kopiert");
  };

  return (
    <NativeDialog
      open={emergencyBinderModalOpen}
      onClose={() => setEmergencyBinderModalOpen(false)}
      title="Druckbare Notfall-Mappe („Der rote Ordner“)"
      subtitle="Kompakte, druckoptimierte Übersicht für den Notfallordner im Schrank (falls das System offline ist)"
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 print:hidden">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Drucke diese Seite aus und lege sie in den physischen Notfallordner im Haus.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Text kopieren
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Notfall-Mappe drucken (Strg+P)
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="space-y-6 print:space-y-4 text-slate-900 dark:text-slate-100 print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 dark:border-white print:border-black pb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 print:text-black">
                  Vertrauliches Notfall-Dokument
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                  NOTFALL-MAPPE DER FAMILIE
                </h1>
                <p className="text-xs text-slate-500 print:text-slate-600 mt-1">
                  Alle lebenswichtigen Policennummern, Schaden-Hotlines, Ansprechpartner &amp; Dokumenten-Standorte
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 print:text-black shrink-0">
                <div>Stand des Ausdrucks:</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white print:text-black">
                  {printDateStr}
                </div>
              </div>
            </div>
          </div>

          {/* 1. Zentrale Notrufnummern Strip */}
          <div className="rounded-xl border-2 border-rose-500/30 print:border-black bg-rose-50/50 dark:bg-rose-950/20 print:bg-transparent p-4 space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 print:text-black flex items-center gap-2">
              <PhoneCall className="w-4 h-4" />
              <span>1. Zentrale Notrufnummern (24h erreichbar)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 print:bg-transparent print:border print:border-black">
                <div className="text-[10px] text-slate-500 uppercase">Notarzt / Feuerwehr</div>
                <div className="text-base font-extrabold text-rose-600 print:text-black">112</div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 print:bg-transparent print:border print:border-black">
                <div className="text-[10px] text-slate-500 uppercase">Polizei</div>
                <div className="text-base font-extrabold">110</div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 print:bg-transparent print:border print:border-black">
                <div className="text-[10px] text-slate-500 uppercase">Ärztlicher Dienst</div>
                <div className="text-base font-extrabold text-blue-600 print:text-black">116 117</div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 print:bg-transparent print:border print:border-black">
                <div className="text-[10px] text-slate-500 uppercase">Kartensperrung</div>
                <div className="text-base font-extrabold">116 116</div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 print:bg-transparent print:border print:border-black">
                <div className="text-[10px] text-slate-500 uppercase">ADAC Panne</div>
                <div className="text-xs font-bold mt-1">089 222222</div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 print:bg-transparent print:border print:border-black">
                <div className="text-[10px] text-slate-500 uppercase">Giftnotruf</div>
                <div className="text-xs font-bold mt-1">030 19240</div>
              </div>
            </div>
          </div>

          {/* 2. Familienmitglieder Übersicht */}
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600 print:text-black" />
              <span>2. Familienmitglieder &amp; Krankenversicherungs-Status</span>
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 print:border-black">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 text-[11px] font-bold">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Rolle</th>
                    <th className="p-2.5">Geburtsdatum</th>
                    <th className="p-2.5">Wichtige Notizen / Krankenversicherung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td className="p-2.5 font-bold">
                        {m.avatar_emoji} {m.first_name}
                      </td>
                      <td className="p-2.5 text-slate-600 print:text-black">{m.role}</td>
                      <td className="p-2.5 font-mono">{formatDateDE(m.birth_date)}</td>
                      <td className="p-2.5 text-slate-600 print:text-black">{m.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Alle wichtigen Notfall- & Schadenspolicen gegliedert */}
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-rose-600 print:text-black" />
              <span>3. Wichtige Versicherungspolicen &amp; Schaden-Hotlines</span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 print:border-black">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 text-[11px] font-bold">
                  <tr>
                    <th className="p-2.5">Sparte &amp; Police</th>
                    <th className="p-2.5">Versicherer &amp; Hotline</th>
                    <th className="p-2.5">Policennummer</th>
                    <th className="p-2.5">Selbstbeteiligung</th>
                    <th className="p-2.5">Versicherte Personen / Umfang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                  {activeInsurances.map((c) => {
                    const p = providers.find((prov) => prov.id === c.provider_id);
                    const insuredNames = members
                      .filter((m) => c.insured_member_ids.includes(m.id))
                      .map((m) => m.first_name)
                      .join(", ");

                    return (
                      <tr key={c.id}>
                        <td className="p-2.5">
                          <div className="font-bold">{c.title}</div>
                          {c.emergency_group && (
                            <span className="text-[10px] text-slate-500 uppercase print:text-black">
                              Bereich: {c.emergency_group}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold">{p?.name || "Direktvertrag"}</div>
                          <div className="font-bold text-rose-600 print:text-black text-[11px]">
                            {p?.emergency_hotline ? `Hotline: ${p.emergency_hotline}` : "—"}
                          </div>
                        </td>
                        <td className="p-2.5 font-mono font-bold">
                          {c.policy_number || "Nicht hinterlegt"}
                        </td>
                        <td className="p-2.5">
                          {c.deductible !== undefined ? formatEuro(c.deductible, 0) : "0 €"}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600 print:text-black">
                          <div>Mitversichert: {insuredNames || "—"}</div>
                          {c.coverage_amount && (
                            <div className="text-slate-500 print:text-black italic">{c.coverage_amount}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Dokumenten-Standorte & Vorsorge-Checkliste */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 print:border-black p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/40 print:bg-transparent">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 print:text-black" />
              <span>4. Standorte wichtiger Dokumente &amp; Vorsorge-Vollmachten</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 print:text-black">
              <div className="flex items-start gap-2">
                <span className="font-bold">[✓]</span>
                <span><strong>Roter Notfallordner:</strong> Flurschrank Regal 2 (Original-Policen &amp; Versicherungsscheine)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">[✓]</span>
                <span><strong>Vorsorgevollmachten &amp; Patientenverfügung:</strong> Notfallordner Fach 1 / Digital in Paperless-ngx</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">[✓]</span>
                <span><strong>Geburtsurkunden &amp; Stammbuch:</strong> Dokumentenkassette im Schlafzimmerschrank</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold">[✓]</span>
                <span><strong>Digitale Passwörter &amp; Notfallzugriff:</strong> Bitwarden / 1Password Notfallkontakt hinterlegt</span>
              </div>
            </div>
          </div>

          {/* 5. Unterschriften- & Bestätigungsfeld */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 print:border-black flex justify-between items-end text-xs text-slate-500 print:text-black">
            <div>
              Dieses Dokument dient Angehörigen und Bevollmächtigten zur schnellen Orientierung im Schadens- und Notfall.
            </div>
            <div className="w-48 border-b border-black text-center text-[10px] pb-1">
              Unterschrift Haushaltsvorstand
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden when printed) */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800 print:hidden">
          <button
            type="button"
            onClick={() => setEmergencyBinderModalOpen(false)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </NativeDialog>
  );
}
