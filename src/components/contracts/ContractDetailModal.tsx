"use client";

import React, { useState } from "react";
import {
  Calendar,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  FileSignature,
  Mail,
  PhoneCall,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { ContractDocuments } from "@/components/paperless/ContractDocuments";
import {
  formatDateDE,
  formatEuro,
  getAnnualCost,
  getBillingCycleLabel,
  getCancellationInfo,
  getMonthlyCost,
} from "@/lib/calculations";

export function ContractDetailModal() {
  const {
    detailContractId,
    closeContractDetail,
    contracts,
    categoriesMap,
    providers,
    members,
    openContractModal,
    toggleContractVisibility,
    deleteContract,
    showToast,
  } = useHub();

  const contract = contracts.find((c) => c.id === detailContractId);
  const [showCancelDraft, setShowCancelDraft] = useState(false);

  if (!contract) return null;

  const category = categoriesMap.get(contract.category_slug);
  const provider = providers.find((p) => p.id === contract.provider_id);
  const holder = members.find((m) => m.id === contract.policy_holder_id);
  const insuredList = members.filter((m) =>
    contract.insured_member_ids.includes(m.id)
  );

  const cancellation = getCancellationInfo(contract);
  const monthly = getMonthlyCost(contract.cost, contract.billing_cycle);
  const annual = getAnnualCost(contract.cost, contract.billing_cycle);

  const cancellationLetterText = `Sehr geehrte Damen und Herren,\n\nhiermit kündige ich meinen bestehenden Vertrag „${
    contract.title
  }“ (Vertrags-/Policennummer: ${
    contract.policy_number || "siehe Kundendaten"
  }) ordentlich und fristgerecht zum ${
    contract.contract_end_date
      ? formatDateDE(contract.contract_end_date)
      : "nächstmöglichen Zeitpunkt"
  }, hilfsweise zum nächstmöglichen Termin.\n\nBitte senden Sie mir eine schriftliche Bestätigung der Kündigung unter Angabe des Beendigungszeitpunkts zu. Ein erteiltes SEPA-Lastschriftmandat widerrufe ich zum Ablauf des Vertrags.\n\nMit freundlichen Grüßen\n${
    holder?.first_name || "Versicherungsnehmer"
  }`;

  const copyPolicyNumber = () => {
    if (!contract.policy_number) return;
    navigator.clipboard.writeText(contract.policy_number);
    showToast(`Policennummer ${contract.policy_number} kopiert`);
  };

  return (
    <NativeDialog
      open={Boolean(contract)}
      onClose={closeContractDetail}
      title={contract.title}
      subtitle={`${category?.name || contract.category_slug} • ${
        provider?.name || "Direktvertrag"
      }`}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Top Status & Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {category?.name || contract.category_slug}
            </span>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                contract.status === "active"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : contract.status === "paused"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {contract.status === "active"
                ? "Aktiv"
                : contract.status === "paused"
                ? "Pausiert"
                : "Gekündigt"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!contract.is_hidden}
                onChange={() => toggleContractVisibility(contract.id)}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer"
              />
              <span>In Übersicht sichtbar</span>
            </label>

            <button
              type="button"
              onClick={() => {
                closeContractDetail();
                openContractModal({ contract });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Bearbeiten
            </button>

            <button
              type="button"
              onClick={() => deleteContract(contract.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 text-xs transition-colors cursor-pointer"
              title="Vertrag löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Financial & Policy Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              Beitrag &amp; Turnus
            </div>
            <div className="text-xl font-bold mt-1">
              {formatEuro(contract.cost)}{" "}
              <span className="text-xs font-normal text-slate-500">
                ({getBillingCycleLabel(contract.billing_cycle)})
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              = {formatEuro(monthly)} / Monat • {formatEuro(annual)} / Jahr
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Policen- / Vertragsnummer
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <code className="text-sm font-mono font-bold text-slate-900 dark:text-white truncate">
                {contract.policy_number || "Nicht hinterlegt"}
              </code>
              {contract.policy_number && (
                <button
                  type="button"
                  onClick={copyPolicyNumber}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Kopieren
                </button>
              )}
            </div>
            {contract.deductible !== undefined && contract.type === "insurance" && (
              <div className="text-xs text-slate-500 mt-1">
                Selbstbeteiligung:{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {formatEuro(contract.deductible, 0)}
                </strong>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Kündigungs-Ampel &amp; Fälligkeit
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  cancellation.state === "red"
                    ? "bg-rose-500"
                    : cancellation.state === "yellow"
                    ? "bg-amber-500"
                    : cancellation.state === "green"
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />
              <span className="text-xs font-semibold">{cancellation.label}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Nächste Zahlung: {formatDateDE(contract.next_payment_date)}
            </div>
          </div>
        </div>

        {/* Coverage, Family Members & Provider Hotline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              Zugeordnete Familienmitglieder
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Versicherungsnehmer:{" "}
              <strong>{holder ? `${holder.avatar_emoji} ${holder.first_name}` : "—"}</strong>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {insuredList.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium"
                >
                  <span>{m.avatar_emoji}</span>
                  <span>{m.first_name}</span>
                  <span className="text-[10px] text-slate-400">
                    ({formatDateDE(m.birth_date)})
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              Anbieter &amp; Schaden-Kontakt
            </div>
            <div className="text-sm font-semibold">
              {provider?.name || "Kein Anbieter ausgewählt"}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {provider?.emergency_hotline && (
                <a
                  href={`tel:${provider.emergency_hotline.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Notruf: {provider.emergency_hotline}
                </a>
              )}
              {provider?.portal_url && (
                <a
                  href={provider.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Kundenportal
                </a>
              )}
            </div>
          </div>
        </div>

        {(contract.coverage_amount || contract.notes) && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5 bg-slate-50/40 dark:bg-slate-950/30">
            {contract.coverage_amount && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Deckungsumfang / Tarifdetails:{" "}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {contract.coverage_amount}
                </span>
              </div>
            )}
            {contract.notes && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Notizen:{" "}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {contract.notes}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Paperless-ngx Documents Panel */}
        <ContractDocuments contract={contract} />

        {/* 1-Click Cancellation Letter Generator */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/40 dark:bg-slate-950/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <FileSignature className="w-4 h-4 text-rose-500" />
              Kündigungs-Assistent (Fertige Vorlage mit Policennummer)
            </div>
            <button
              type="button"
              onClick={() => setShowCancelDraft((v) => !v)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {showCancelDraft ? "Vorlage ausblenden" : "Kündigungsvorlage erstellen"}
            </button>
          </div>

          {showCancelDraft && (
            <div className="space-y-2.5">
              <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                {cancellationLetterText}
              </pre>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(cancellationLetterText);
                    showToast("Kündigungsschreiben in Zwischenablage kopiert");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold cursor-pointer shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Kündigungstext kopieren
                </button>
                {provider?.support_email && (
                  <a
                    href={`mailto:${provider.support_email}?subject=${encodeURIComponent(
                      `Kündigung Vertrag ${contract.policy_number || contract.title}`
                    )}&body=${encodeURIComponent(cancellationLetterText)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Per E-Mail an {provider.support_email} öffnen
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </NativeDialog>
  );
}
