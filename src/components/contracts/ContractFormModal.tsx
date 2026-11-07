"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Save,
  ShieldAlert,
  ShieldCheck,
  Tv,
  Users,
} from "lucide-react";
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

const STEPS = [
  { id: 1, label: "Stammdaten & Sparte", short: "1. Stammdaten", icon: FileSpreadsheet },
  { id: 2, label: "Kosten, Rhythmus & Fristen", short: "2. Kosten & Fristen", icon: CreditCard },
  { id: 3, label: "Personen & Versicherungsschutz", short: "3. Personen & Schutz", icon: Users },
  { id: 4, label: "Paperless-ngx & Notizen", short: "4. Paperless & Notizen", icon: FileCheck2 },
] as const;

export function ContractFormModal() {
  const {
    contractModalDraft,
    closeContractModal,
    categories,
    providers,
    members,
    saveContract,
    openContractDetail,
    showToast,
  } = useHub();

  const existing = contractModalDraft?.contract;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

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

  // Track the session key to only initialize once per draft opening
  const initializedDraftRef = useRef<string | null>(null);

  useEffect(() => {
    if (!contractModalDraft) {
      initializedDraftRef.current = null;
      return;
    }

    const currentKey = existing?.id || `new_${contractModalDraft.preselectedCategorySlug || ""}_${contractModalDraft.preselectedType || ""}`;
    if (initializedDraftRef.current === currentKey) {
      return;
    }
    initializedDraftRef.current = currentKey;

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
    setCurrentStep(1);
  }, [contractModalDraft, existing, categories, providers, members]);

  if (!contractModalDraft) return null;

  const toggleMember = (id: string) => {
    setInsuredMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!title.trim()) {
      setCurrentStep(1);
      showToast("Bitte gib mindestens eine Vertragsbezeichnung / einen Tarifnamen an.");
      return;
    }

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
      title={existing ? `Eintrag „${existing.title}“ bearbeiten` : "Neuen Eintrag / Police / Abo anlegen"}
      subtitle="4 strukturierte Bearbeitungsschritte für Stammdaten, Fristen, Familien-Zuordnung und Paperless-ngx"
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step Indicator Header (Clickable Tabs) */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STEPS.map((s) => {
              const isActive = currentStep === s.id;
              const isPassed = currentStep > s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(s.id as 1 | 2 | 3 | 4)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                      : "bg-slate-50 dark:bg-[#161c2a] border border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : isPassed
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] truncate font-bold">{s.short}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* SCHRITT 1: STAMMDATEN & KATEGORIE                                 */}
        {/* ================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Contract Type Switch */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#161c2a]">
              <button
                type="button"
                onClick={() => {
                  setType("insurance");
                  const firstIns = categories.find((c) => c.type === "insurance");
                  if (firstIns) setCategorySlug(firstIns.slug);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  type === "insurance"
                    ? "bg-white dark:bg-[#121622] text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Versicherungspolice
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("subscription");
                  const firstSub = categories.find((c) => c.type === "subscription");
                  if (firstSub) setCategorySlug(firstSub.slug);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  type === "subscription"
                    ? "bg-white dark:bg-[#121622] text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Tv className="w-4 h-4 text-indigo-500" />
                Sonstiges Abo / Fixkosten
              </button>
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vertragsbezeichnung / Tarifname *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === "insurance"
                      ? "z. B. Familien-Privathaftpflicht Comfort"
                      : "z. B. Netflix Standard oder Telekom Glasfaser"
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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
                  label="Anbieter / Versicherungsgesellschaft"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vertragsstatus
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="active">Aktiv</option>
                  <option value="paused">Pausiert</option>
                  <option value="cancelled">Gekündigt</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={!isHidden}
                    onChange={(e) => setIsHidden(!e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <span>In Übersichten und Dashboard anzeigen</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SCHRITT 2: KOSTEN, RHYTHMUS & FRISTEN                             */}
        {/* ================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Zahlungsintervall
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="monthly">Monatlich</option>
                  <option value="quarterly">Vierteljährlich</option>
                  <option value="semi_annual">Halbjährlich</option>
                  <option value="annual">Jährlich</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Zahlungsart
                </label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="z. B. SEPA-Lastschrift, PayPal"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nächste Abbuchung / Fälligkeit
                </label>
                <input
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vertragsende / Hauptfälligkeit
                </label>
                <input
                  type="date"
                  value={contractEndDate}
                  onChange={(e) => setContractEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kündigungsfrist (in Tagen)
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={cancellationPeriodDays}
                  onChange={(e) => setCancellationPeriodDays(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SCHRITT 3: PERSONEN & VERSICHERUNGSSCHUTZ                         */}
        {/* ================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Versicherungsnehmer / Hauptinhaber
                </label>
                <select
                  value={policyHolderId}
                  onChange={(e) => setPolicyHolderId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notfall-Zuordnung (SOS-Ansicht)
                  </label>
                  <select
                    value={emergencyGroup}
                    onChange={(e) => setEmergencyGroup(e.target.value as EmergencyGroup)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="haftpflicht_recht">Haftpflicht &amp; Recht</option>
                    <option value="kfz">Auto &amp; Panne</option>
                    <option value="reise_gesundheit">Reise &amp; Krankheit</option>
                    <option value="haus_wohnen">Haus &amp; Wohnen (Rohrbruch / Sturm)</option>
                    <option value="sonstige">Sonstige</option>
                  </select>
                </div>
              )}

              {type === "insurance" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selbstbeteiligung (€ pro Schaden)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    inputMode="numeric"
                    value={deductible}
                    onChange={(e) => setDeductible(e.target.value)}
                    placeholder="z. B. 150"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {type === "insurance" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deckungssumme / Leistungsumfang
                  </label>
                  <input
                    type="text"
                    value={coverageAmount}
                    onChange={(e) => setCoverageAmount(e.target.value)}
                    placeholder="z. B. 50 Mio. € pauschal für Personen- &amp; Sachschäden"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
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
                          ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <span>{m.avatar_emoji}</span>
                      <span>{m.first_name}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SCHRITT 4: PAPERLESS-NGX & NOTIZEN                                */}
        {/* ================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                Paperless-ngx Dokumenten-Verknüpfung
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Policen- / Vertragsnummer
                  </label>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="z. B. PHV-2023-88412"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paperless-Tag (optional)
                  </label>
                  <input
                    type="text"
                    value={paperlessTag}
                    onChange={(e) => setPaperlessTag(e.target.value)}
                    placeholder="z. B. haftpflicht"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Feste Dokument-ID (optional)
                  </label>
                  <input
                    type="text"
                    value={paperlessDocumentId}
                    onChange={(e) => setPaperlessDocumentId(e.target.value)}
                    placeholder="z. B. 401"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tipp: Dokumente können auch nachträglich im Detailfenster per Klick auf <strong>„📌 Verknüpfen“</strong> als Hauptpolice fest verankert werden.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Notizen &amp; Tarifhinweise
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Besondere Vereinbarungen, Schutzbrief-Leistungen, Rabatt-Hinweise oder Dokumenten-Fundort im Schrank…"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Zurück zu Schritt {currentStep - 1}
              </button>
            ) : (
              <button
                type="button"
                onClick={closeContractModal}
                className="rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer text-slate-600 dark:text-slate-400"
              >
                Abbrechen
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 && (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !title.trim()) {
                    showToast("Bitte gib zuerst eine Vertragsbezeichnung ein.");
                    return;
                  }
                  setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>
                  Weiter zu {STEPS.find((s) => s.id === currentStep + 1)?.label || "Nächster Schritt"}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{existing ? "Änderungen speichern" : "Eintrag anlegen"}</span>
            </button>
          </div>
        </div>
      </form>
    </NativeDialog>
  );
}
