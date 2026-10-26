"use client";

import React, { useMemo, useState } from "react";
import {
  AlertOctagon,
  Car,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  HeartPulse,
  Home,
  PhoneCall,
  Printer,
  Scale,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatDateDE, formatEuro } from "@/lib/calculations";
import { EmergencyGroup } from "@/types/models";
import { DEMO_PAPERLESS_DOCUMENTS } from "@/lib/seed-data";

const SCENARIO_FILTERS: {
  id: "all" | EmergencyGroup;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "all", label: "Alle Notfall-Policen", icon: ShieldAlert },
  { id: "kfz", label: "Auto & Panne", icon: Car },
  { id: "reise_gesundheit", label: "Reise & Krankheit", icon: HeartPulse },
  { id: "haus_wohnen", label: "Haus & Rohrbruch", icon: Home },
  { id: "haftpflicht_recht", label: "Haftpflicht & Recht", icon: Scale },
];

export default function EmergencyPage() {
  const {
    contracts,
    claims,
    categoriesMap,
    providers,
    members,
    selectedMemberId,
    openPdfPreview,
    openContractDetail,
    setEmergencyBinderModalOpen,
    showToast,
  } = useHub();

  const [scenario, setScenario] = useState<"all" | EmergencyGroup>("all");

  const activeInsurances = useMemo(() => {
    return contracts.filter((c) => {
      if (c.type !== "insurance" || c.status !== "active") return false;
      if (scenario !== "all" && c.emergency_group !== scenario) return false;
      if (selectedMemberId !== "all") {
        const isHolder = c.policy_holder_id === selectedMemberId;
        const isInsured = c.insured_member_ids.includes(selectedMemberId);
        if (!isHolder && !isInsured) return false;
      }
      return true;
    });
  }, [contracts, scenario, selectedMemberId]);

  const copyText = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    showToast(`${label} (${value}) kopiert`);
  };

  return (
    <div className="space-y-6">
      {/* High-Contrast SOS Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4" />
              Notfall- &amp; Schadenshilfe
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Sofort-Hilfe, Policennummern &amp; Schaden-Hotlines
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 max-w-2xl">
              Alle aktiven Familienversicherungen mit 1-Klick-Anruf, Selbstbeteiligung,
              Geburtsdaten der Mitversicherten und direktem PDF-Schein aus Paperless-ngx.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setEmergencyBinderModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/40 px-3.5 py-2 text-xs font-bold backdrop-blur-sm shadow-2xs transition-all cursor-pointer"
              title="Druckbare Notfall-Mappe für den Schrank öffnen"
            >
              <Printer className="w-4 h-4" />
              Notfall-Mappe („Roter Ordner“)
            </button>
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 px-4 py-2 text-xs font-black shadow-sm"
            >
              <PhoneCall className="w-4 h-4" />
              Notruf 112
            </a>
            <a
              href="tel:+4989222222"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 text-white border border-white/30 px-3.5 py-2 text-xs font-bold"
            >
              <Car className="w-4 h-4" />
              ADAC Pannenhilfe
            </a>
          </div>
        </div>
      </div>

      {/* Scenario Quick Filter Buttons (Large Touch Targets) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {SCENARIO_FILTERS.map((item) => {
          const Icon = item.icon;
          const active = scenario === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setScenario(item.id)}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                active
                  ? "border-rose-600 bg-rose-600 text-white shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] text-slate-700 dark:text-slate-200 hover:border-rose-400"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Emergency Insurance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeInsurances.map((c) => {
          const cat = categoriesMap.get(c.category_slug);
          const prov = providers.find((p) => p.id === c.provider_id);
          const holder = members.find((m) => m.id === c.policy_holder_id);
          const insured = members.filter((m) =>
            c.insured_member_ids.includes(m.id)
          );
          const matchedDoc = DEMO_PAPERLESS_DOCUMENTS.find(
            (d) =>
              d.policy_number_matched === c.policy_number ||
              (c.paperless_tag && d.tags.includes(c.paperless_tag))
          );

          return (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 flex flex-col justify-between gap-4 shadow-xs"
            >
              <div className="space-y-4">
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                      <CategoryIcon
                        name={cat?.icon_name}
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        {cat?.name || "Versicherung"}
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                        {c.title}
                      </h2>
                      <p className="text-xs font-semibold text-slate-400">
                        Gesellschaft: {prov?.name || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Big Policy Number & Deductible Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-slate-50 dark:bg-[#161c2a] border border-slate-200/60 dark:border-slate-800 p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Policennummer
                      </div>
                      <code className="text-sm font-mono font-black text-slate-900 dark:text-white">
                        {c.policy_number || "—"}
                      </code>
                    </div>
                    {c.policy_number && (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(c.policy_number, "Policennummer")
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-bold hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-slate-400" />
                        Copy
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-[#161c2a] border border-slate-200/60 dark:border-slate-800 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Selbstbeteiligung (SB)
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {c.deductible
                        ? `${formatEuro(c.deductible, 0)} je Schadenfall`
                        : "0 € (Keine SB)"}
                    </div>
                  </div>
                </div>

                {/* Coverage Summary */}
                {c.coverage_amount && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#161c2a] rounded-xl p-3 border border-slate-200/70 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-white">
                      Deckungsumfang:{" "}
                    </strong>
                    {c.coverage_amount}
                  </div>
                )}

                {/* Insured Persons with Birth Dates for Hotline Verification */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Mitversicherte Personen (Hotline-Abgleich)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {insured.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#161c2a] px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800"
                      >
                        <span>{m.avatar_emoji}</span>
                        <strong>{m.first_name}</strong>
                        <span className="text-[11px] text-slate-400">
                          (*{formatDateDE(m.birth_date)})
                        </span>
                        {holder?.id === m.id && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 rounded font-bold">
                            VN
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Large Touch Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {prov?.emergency_hotline ? (
                  <a
                    href={`tel:${prov.emergency_hotline.replace(/\s+/g, "")}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white py-2.5 px-4 text-xs sm:text-sm font-black shadow-xs transition-all"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Hotline: {prov.emergency_hotline}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => openContractDetail(c.id)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 text-white py-2.5 px-4 text-xs font-bold"
                  >
                    Details anzeigen
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (matchedDoc) {
                        openPdfPreview({ document: matchedDoc, contract: c });
                      } else {
                        openContractDetail(c.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Police (PDF)</span>
                  </button>

                  {prov?.portal_url && (
                    <a
                      href={prov.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Online-Schadenmeldung im Kundenportal"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Claims & Regulierungen Section */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Aktuelle Schadensfälle &amp; Aktenzeichen</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Übersicht aller gemeldeten Schäden, Aktenzeichen der Versicherer und Erstattungen
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#161c2a] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
            {claims.length} Schadensfälle erfasst
          </span>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Keine aktuellen Schadensfälle erfasst.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {claims.map((claim) => {
              const contract = contracts.find((c) => c.id === claim.contract_id);
              const prov = providers.find((p) => p.id === contract?.provider_id);

              return (
                <div
                  key={claim.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5 bg-slate-50/50 dark:bg-[#161c2a] flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                        {claim.title}
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          claim.status === "settled"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : claim.status === "under_review"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                            : claim.status === "rejected"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                            : "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800"
                        }`}
                      >
                        {claim.status === "settled"
                          ? "Reguliert"
                          : claim.status === "under_review"
                          ? "In Prüfung"
                          : claim.status === "rejected"
                          ? "Abgelehnt"
                          : "Gemeldet"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Vertrag: <strong className="text-slate-800 dark:text-slate-200">{contract?.title || "—"}</strong> ({prov?.name || "Versicherung"})
                    </div>

                    {claim.claim_number && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 text-[11px]">Aktenzeichen:</span>
                        <code className="font-mono font-bold bg-white dark:bg-[#121622] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          {claim.claim_number}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText(claim.claim_number!, "Aktenzeichen")}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          title="Kopieren"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs pt-1">
                      {claim.settled_amount !== undefined && (
                        <div>
                          <span className="text-slate-400 text-[11px]">Erstattet: </span>
                          <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatEuro(claim.settled_amount)}
                          </strong>
                        </div>
                      )}
                      {claim.claimed_amount !== undefined && (
                        <div>
                          <span className="text-slate-400 text-[11px]">Gefordert: </span>
                          <strong className="text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatEuro(claim.claimed_amount)}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => contract && openContractDetail(contract.id)}
                    className="w-full text-center py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121622] text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Details &amp; Dokumente anzeigen
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency Step-by-Step Checklist */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 space-y-3 shadow-xs">
        <h2 className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Goldene Regeln im Schadensfall (Obliegenheiten beachten)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-xl bg-slate-50 dark:bg-[#161c2a] border border-slate-200/60 dark:border-slate-800 p-3.5 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">
              1. Schadenminderungspflicht
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Unfallstelle sichern, bei Leitungswasserschaden sofort Haupthahn
              abdrehen, bei Einbruch sofort die Polizei (110) rufen.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-[#161c2a] border border-slate-200/60 dark:border-slate-800 p-3.5 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">
              2. Beweise &amp; Fotos sichern
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Vor dem Aufräumen oder Reparieren ausführliche Fotos vom Schaden
              machen; beschädigte Gegenstände erst nach Freigabe entsorgen.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-[#161c2a] border border-slate-200/60 dark:border-slate-800 p-3.5 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">
              3. Unverzügliche Meldung
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Schäden möglichst innerhalb von 48 Stunden per Hotline oder Portal
              melden. Keine voreiligen Schuldanerkenntnisse vor Ort abgeben.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
