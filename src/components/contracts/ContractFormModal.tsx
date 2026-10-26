"use client";

import React, { useEffect, useState } from "react";
import { Check, FileCheck2, Save, ShieldCheck, Tv } from "lucide-react";
import { useHub } from "@/context/HubContext";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { SearchableCategorySelect } from "@/components/ui/SearchableCategorySelect";
import { SearchableProviderSelect } from "@/components/ui/SearchableProviderSelect";
import {
  BillingCycle,
  ContractStatus,
  ContractType,
  EmergencyGroup,
} from "@/types/models";

export function ContractFormModal() {
  const {
    contractModalDraft,
    closeContractModal,
    categories,
    providers,
    members,
    saveContract,
    openContractDetail,
  } = useHub();

  const existing = contractModalDraft?.contract;

  const [type, setType] = useState<ContractType>("insurance");
  const [title, setTitle] = useState("");
  const [categorySlug, setCategorySlug] = useState("privathaftpflicht");
  const [isHidden, setIsHidden] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [policyHolderId, setPolicyHolderId] = useState("");
  const [insuredMemberIds, setInsuredMemberIds] = useState<string[]>([]);
  const [policyNumber, setPolicyNumber] = useState("");
  const [paperlessTag, setPaperlessTag] = useState("");
  const [paperlessDocumentId, setPaperlessDocumentId] = useState("");
  const [cost, setCost] = useState("0");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [nextPaymentDate, setNextPaymentDate] = useState("2026-11-01");
  const [deductible, setDeductible] = useState("0");
  const [coverageAmount, setCoverageAmount] = useState("");
  const [cancellationPeriodDays, setCancellationPeriodDays] = useState("30");
  const [contractEndDate, setContractEndDate] = useState("");
  const [status, setStatus] = useState<ContractStatus>("active");
  const [emergencyGroup, setEmergencyGroup] =
    useState<EmergencyGroup>("haftpflicht_recht");
  const [paymentMethod, setPaymentMethod] = useState("SEPA-Lastschrift");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!contractModalDraft) return;
    if (existing) {
      setType(existing.type);
      setTitle(existing.title);
      setCategorySlug(existing.category_slug);
      setIsHidden(existing.is_hidden);
      setProviderId(existing.provider_id);
      setPolicyHolderId(existing.policy_holder_id);
      setInsuredMemberIds(existing.insured_member_ids);
      setPolicyNumber(existing.policy_number || "");
      setPaperlessTag(existing.paperless_tag || "");
      setPaperlessDocumentId(
        existing.paperless_document_id
          ? String(existing.paperless_document_id)
          : ""
      );
      setCost(String(existing.cost));
      setBillingCycle(existing.billing_cycle);
      setNextPaymentDate(existing.next_payment_date || "2026-11-01");
      setDeductible(String(existing.deductible ?? 0));
      setCoverageAmount(existing.coverage_amount || "");
      setCancellationPeriodDays(
        String(existing.cancellation_period_days ?? 30)
      );
      setContractEndDate(existing.contract_end_date || "");
      setStatus(existing.status);
      setEmergencyGroup(existing.emergency_group || "haftpflicht_recht");
      setPaymentMethod(existing.payment_method || "SEPA-Lastschrift");
      setNotes(existing.notes || "");
    } else {
      const preSlug = contractModalDraft.preselectedCategorySlug;
      const preCat = categories.find((c) => c.slug === preSlug);
      const initialType =
        preCat?.type || contractModalDraft.preselectedType || "insurance";

      setType(initialType);
      const defaultCat =
        preCat ||
        categories.find((c) => c.type === initialType) ||
        categories[0];

      setCategorySlug(defaultCat?.slug || "privathaftpflicht");
      setTitle(defaultCat ? `${defaultCat.name}` : "");
      setIsHidden(false);
      setProviderId(providers[0]?.id || "");
      setPolicyHolderId(members[0]?.id || "");
      setInsuredMemberIds(members.map((m) => m.id));
      setPolicyNumber("");
      setPaperlessTag(defaultCat?.slug.replace(/_/g, "-") || "");
      setPaperlessDocumentId("");
      setCost("");
      setBillingCycle(initialType === "insurance" ? "annual" : "monthly");
      setNextPaymentDate("2026-11-15");
      setDeductible("0");
      setCoverageAmount("");
      setCancellationPeriodDays(initialType === "insurance" ? "30" : "1");
      setContractEndDate("2026-12-31");
      setStatus("active");
      setEmergencyGroup("haftpflicht_recht");
      setPaymentMethod("SEPA-Lastschrift");
      setNotes("");
    }
  }, [contractModalDraft, existing, categories, providers, members]);

  if (!contractModalDraft) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const toggleMember = (id: string) => {
    setInsuredMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveContract({
      id: existing?.id,
      title: title.trim() || "Unbenannter Vertrag",
      type,
      category_slug: categorySlug,
      is_hidden: isHidden,
      provider_id: providerId,
      policy_holder_id: policyHolderId,
      insured_member_ids:
        insuredMemberIds.length > 0
          ? insuredMemberIds
          : policyHolderId
          ? [policyHolderId]
          : [],
      policy_number: policyNumber.trim(),
      paperless_tag: paperlessTag.trim() || undefined,
      paperless_document_id: paperlessDocumentId.trim()
        ? parseInt(paperlessDocumentId.trim().replace(/^#/, ""), 10) || undefined
        : undefined,
      cost: Math.max(0, parseFloat(cost.replace(",", ".")) || 0),
      billing_cycle: billingCycle,
      next_payment_date: nextPaymentDate,
      deductible:
        type === "insurance"
          ? Math.max(0, parseFloat(deductible.replace(",", ".")) || 0)
          : undefined,
      coverage_amount: coverageAmount.trim() || undefined,
      cancellation_period_days: Math.max(
        0,
        parseInt(cancellationPeriodDays, 10) || 0
      ),
      contract_end_date: contractEndDate || undefined,
      status,
      emergency_group: type === "insurance" ? emergencyGroup : undefined,
      payment_method: paymentMethod.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    closeContractModal();
    openContractDetail(saved.id);
  };

  return (
    <NativeDialog
      open={Boolean(contractModalDraft)}
      onClose={closeContractModal}
      title={existing ? "Vertrag bearbeiten" : "Neuen Vertrag / Abo anlegen"}
      subtitle="Inklusive Familien-Zuordnung und Paperless-ngx Verknüpfung"
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Contract Type Switch */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setType("insurance");
              const firstIns = categories.find((c) => c.type === "insurance");
              if (firstIns) setCategorySlug(firstIns.slug);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              type === "insurance"
                ? "bg-white dark:bg-[#121622] text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Versicherungspolice
          </button>
          <button
            type="button"
            onClick={() => {
              setType("subscription");
              const firstSub = categories.find((c) => c.type === "subscription");
              if (firstSub) setCategorySlug(firstSub.slug);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              type === "subscription"
                ? "bg-white dark:bg-[#121622] text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Tv className="w-4 h-4" />
            Sonstiges Abo / Fixkosten
          </button>
        </div>

        {/* Main Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">
              Vertragsbezeichnung / Tarifname *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "insurance"
                  ? "z. B. Familien-Privathaftpflicht Comfort"
                  : "z. B. Netflix Standard oder Telekom Glasfaser"
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <SearchableCategorySelect
              value={categorySlug}
              type={type}
              onChange={(newSlug) => {
                setCategorySlug(newSlug);
                if (!paperlessTag) {
                  setPaperlessTag(newSlug.replace(/_/g, "-"));
                }
              }}
              label="Katalog-Kategorie *"
            />
          </div>

          <div>
            <SearchableProviderSelect
              value={providerId}
              onChange={(newId) => setProviderId(newId)}
              label="Anbieter / Gesellschaft"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Vertragsstatus
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContractStatus)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Aktiv</option>
              <option value="paused">Pausiert</option>
              <option value="cancelled">Gekündigt</option>
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!isHidden}
                onChange={(e) => setIsHidden(!e.target.checked)}
                className="rounded border-slate-300 w-4 h-4 cursor-pointer"
              />
              Vertrag in der Übersicht sichtbar machen
            </label>
          </div>
        </div>

        {/* Financials & Deadlines */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Beitrag in € *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              required
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="z. B. 74.80"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Zahlungsintervall
            </label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monatlich</option>
              <option value="quarterly">Vierteljährlich</option>
              <option value="semi_annual">Halbjährlich</option>
              <option value="annual">Jährlich</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Nächste Abbuchung
            </label>
            <input
              type="date"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Vertragsende / Hauptfälligkeit
            </label>
            <input
              type="date"
              value={contractEndDate}
              onChange={(e) => setContractEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Kündigungsfrist (in Tagen)
            </label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={cancellationPeriodDays}
              onChange={(e) => setCancellationPeriodDays(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {type === "insurance" && (
            <div>
              <label className="block text-xs font-semibold mb-1">
                Selbstbeteiligung (€)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                inputMode="numeric"
                value={deductible}
                onChange={(e) => setDeductible(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Paperless-ngx Linking Section */}
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <FileCheck2 className="w-4 h-4" />
            Paperless-ngx Dokumenten-Verknüpfung
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Policen- / Vertragsnummer
              </label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="z. B. PHV-2023-88412"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Paperless-Tag (optional)
              </label>
              <input
                type="text"
                value={paperlessTag}
                onChange={(e) => setPaperlessTag(e.target.value)}
                placeholder="z. B. haftpflicht"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Feste Dokument-ID (optional)
              </label>
              <input
                type="text"
                value={paperlessDocumentId}
                onChange={(e) => setPaperlessDocumentId(e.target.value)}
                placeholder="z. B. 401"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Tipp: Du kannst das Dokument auch direkt im Vertragsdetailfenster aus der Liste der Suchtreffer per Klick auf <strong>„📌 Verknüpfen“</strong> als feste Hauptpolice auswählen.
          </p>
        </div>

        {/* Family Members Assignment */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Versicherungsnehmer / Hauptinhaber
              </label>
              <select
                value={policyHolderId}
                onChange={(e) => setPolicyHolderId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar_emoji} {m.first_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {type === "insurance" && (
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Deckungssumme / Leistungsumfang
                </label>
                <input
                  type="text"
                  value={coverageAmount}
                  onChange={(e) => setCoverageAmount(e.target.value)}
                  placeholder="z. B. 50 Mio. € pauschal"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              Mitversicherte / Mitnutzende Familienmitglieder
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const selected = insuredMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      selected
                        ? "border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span>{m.avatar_emoji}</span>
                    <span>{m.first_name}</span>
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Notizen / Tarifhinweise
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Besondere Vereinbarungen, Schutzbrief-Leistungen, Rabatt-Hinweise…"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={closeContractModal}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {existing ? "Änderungen speichern" : "Vertrag speichern"}
          </button>
        </div>
      </form>
    </NativeDialog>
  );
}
