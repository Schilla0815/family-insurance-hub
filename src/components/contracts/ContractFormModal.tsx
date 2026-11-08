"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Calculator,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Hash,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
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
  CustomField,
  EmergencyGroup,
  NoticePeriodUnit,
} from "@/types/models";
import { getNoticePeriodInDays } from "@/lib/calculations";

const STEPS = [
  { id: 1, label: "Stammdaten, Nummern & Sparte", short: "1. Stammdaten & Nr.", icon: FileSpreadsheet },
  { id: 2, label: "Kosten, Laufzeit & Kündigungsfrist", short: "2. Laufzeit & Frist", icon: CreditCard },
  { id: 3, label: "Personen & Variable Zusatzfelder", short: "3. Personen & Felder", icon: Users },
  { id: 4, label: "Paperless-ngx & Notizen", short: "4. Paperless & Notizen", icon: FileCheck2 },
] as const;

const CUSTOM_FIELD_PRESETS: Record<ContractType, string[]> = {
  insurance: [
    "Schadenfreiheitsklasse (SF)",
    "Kfz-Kennzeichen",
    "Tarifvariante / Generation",
    "Versicherungssumme",
    "Vermittler / Ansprechpartner",
  ],
  contract: [
    "Zählernummer",
    "Marktlokations-ID (MaLo)",
    "Beitragsnummer (Rundfunk)",
    "Rufnummer / Mobilfunknr.",
    "Bandbreite / Tarifleistung",
    "Jahresverbrauch (kWh)",
  ],
  subscription: [
    "Account / Login-E-Mail",
    "Anzahl Streams / Profile",
    "Family-Sharing Plätze",
    "Lizenzschlüssel / Seriennr.",
    "Geräte-Limit",
  ],
};

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
  const [customerNumber, setCustomerNumber] = useState("");
  const [paperlessTag, setPaperlessTag] = useState("");
  const [paperlessDocumentId, setPaperlessDocumentId] = useState("");
  const [cost, setCost] = useState("0");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [nextPaymentDate, setNextPaymentDate] = useState("2026-11-01");
  const [deductible, setDeductible] = useState("0");
  const [coverageAmount, setCoverageAmount] = useState("");

  // Flexible contract term & notice fields
  const [contractStartDate, setContractStartDate] = useState("");
  const [initialTermMonths, setInitialTermMonths] = useState("");
  const [autoRenewalMonths, setAutoRenewalMonths] = useState("");
  const [noticePeriodValue, setNoticePeriodValue] = useState("1");
  const [noticePeriodUnit, setNoticePeriodUnit] = useState<NoticePeriodUnit>("months");
  const [noticePeriodAfterInitialMonths, setNoticePeriodAfterInitialMonths] = useState("1");
  const [cancellationTermsText, setCancellationTermsText] = useState("");
  const [cancellationPeriodDays, setCancellationPeriodDays] = useState("30");
  const [contractEndDate, setContractEndDate] = useState("");

  // Custom fields tailored to the entry
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

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

    const currentKey =
      existing?.id ||
      `new_${contractModalDraft.preselectedCategorySlug || ""}_${
        contractModalDraft.preselectedType || ""
      }`;
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
      setCustomerNumber(existing.customer_number || "");
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
      setContractStartDate(existing.contract_start_date || "");
      setInitialTermMonths(
        existing.initial_term_months !== undefined
          ? String(existing.initial_term_months)
          : ""
      );
      setAutoRenewalMonths(
        existing.auto_renewal_months !== undefined
          ? String(existing.auto_renewal_months)
          : ""
      );
      if (existing.notice_period_value !== undefined && existing.notice_period_unit) {
        setNoticePeriodValue(String(existing.notice_period_value));
        setNoticePeriodUnit(existing.notice_period_unit);
      } else {
        const fallbackDays = existing.cancellation_period_days ?? 30;
        if (fallbackDays % 30 === 0 && fallbackDays >= 30) {
          setNoticePeriodValue(String(Math.round(fallbackDays / 30)));
          setNoticePeriodUnit("months");
        } else {
          setNoticePeriodValue(String(fallbackDays));
          setNoticePeriodUnit("days");
        }
      }
      setNoticePeriodAfterInitialMonths(
        existing.notice_period_after_initial_months !== undefined
          ? String(existing.notice_period_after_initial_months)
          : "1"
      );
      setCancellationTermsText(existing.cancellation_terms_text || "");
      setCancellationPeriodDays(
        String(existing.cancellation_period_days ?? 30)
      );
      setContractEndDate(existing.contract_end_date || "");
      setCustomFields(existing.custom_fields ? [...existing.custom_fields] : []);
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

      const defaultProvider =
        providers.find((p) => p.category_focus === initialType) || providers[0];

      setCategorySlug(defaultCat?.slug || "privathaftpflicht");
      setTitle(defaultCat ? `${defaultCat.name}` : "");
      setIsHidden(false);
      setProviderId(defaultProvider?.id || "");
      setPolicyHolderId(members[0]?.id || "");
      setInsuredMemberIds(members.map((m) => m.id));
      setPolicyNumber("");
      setCustomerNumber(defaultProvider?.customer_number || "");
      setPaperlessTag(defaultCat?.slug.replace(/_/g, "-") || "");
      setPaperlessDocumentId("");
      setCost("");
      setBillingCycle(initialType === "insurance" ? "annual" : "monthly");
      setNextPaymentDate("2026-11-15");
      setDeductible("0");
      setCoverageAmount("");
      setContractStartDate(new Date().toISOString().slice(0, 10));
      setInitialTermMonths(
        initialType === "contract" ? "24" : initialType === "insurance" ? "12" : "1"
      );
      setAutoRenewalMonths("1");
      setNoticePeriodValue("1");
      setNoticePeriodUnit("months");
      setNoticePeriodAfterInitialMonths("1");
      setCancellationTermsText(
        initialType === "contract"
          ? "24 Monate Mindestlaufzeit, danach monatlich kündbar"
          : initialType === "insurance"
          ? "12 Monate Laufzeit, danach jährlich (oder täglich nach Schaden)"
          : "Monatlich kündbar"
      );
      setCancellationPeriodDays(initialType === "subscription" ? "1" : "30");
      setContractEndDate("2026-12-31");
      setCustomFields([]);
      setStatus("active");
      setEmergencyGroup("haftpflicht_recht");
      setPaymentMethod("SEPA-Lastschrift");
      setNotes("");
    }
    setCurrentStep(1);
  }, [contractModalDraft, existing, categories, providers, members]);

  if (!contractModalDraft) return null;

  const selectedProvider = providers.find((p) => p.id === providerId);

  const toggleMember = (id: string) => {
    setInsuredMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const calculateEndDateFromStartAndTerm = (startStr: string, monthsStr: string) => {
    const months = parseInt(monthsStr, 10);
    if (!startStr || isNaN(months) || months <= 0) return;
    const d = new Date(startStr + "T00:00:00");
    if (isNaN(d.getTime())) return;
    d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate() - 1);
    const iso = d.toISOString().slice(0, 10);
    setContractEndDate(iso);
    showToast(`Vertragsende berechnet: ${iso}`);
  };

  const applyTermPreset = (preset: {
    initialMonths: string;
    renewalMonths: string;
    noticeVal: string;
    noticeUnit: NoticePeriodUnit;
    afterInitialMonths: string;
    summary: string;
  }) => {
    setInitialTermMonths(preset.initialMonths);
    setAutoRenewalMonths(preset.renewalMonths);
    setNoticePeriodValue(preset.noticeVal);
    setNoticePeriodUnit(preset.noticeUnit);
    setNoticePeriodAfterInitialMonths(preset.afterInitialMonths);
    setCancellationTermsText(preset.summary);
    const computedDays = getNoticePeriodInDays(
      parseInt(preset.noticeVal, 10) || 0,
      preset.noticeUnit,
      30
    );
    setCancellationPeriodDays(String(computedDays));
    if (contractStartDate && parseInt(preset.initialMonths, 10) > 0) {
      calculateEndDateFromStartAndTerm(contractStartDate, preset.initialMonths);
    }
  };

  const addCustomField = (labelPreset = "") => {
    setCustomFields((prev) => [
      ...prev,
      {
        key: `cf_${Date.now().toString(36)}_${prev.length}`,
        label: labelPreset,
        value: "",
      },
    ]);
  };

  const updateCustomField = (index: number, patch: Partial<CustomField>) => {
    setCustomFields((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const removeCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
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

    const parsedNoticeVal = parseInt(noticePeriodValue, 10);
    const computedNoticeDays = getNoticePeriodInDays(
      !isNaN(parsedNoticeVal) ? parsedNoticeVal : undefined,
      noticePeriodUnit,
      parseInt(cancellationPeriodDays, 10) || 0
    );

    const cleanedCustomFields = customFields
      .map((cf) => ({
        key: cf.key || cf.label.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        label: cf.label.trim(),
        value: cf.value.trim(),
      }))
      .filter((cf) => cf.label !== "" || cf.value !== "");

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
      customer_number: customerNumber.trim() || undefined,
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
      contract_start_date: contractStartDate || undefined,
      initial_term_months:
        initialTermMonths.trim() !== ""
          ? Math.max(0, parseInt(initialTermMonths, 10) || 0)
          : undefined,
      auto_renewal_months:
        autoRenewalMonths.trim() !== ""
          ? Math.max(0, parseInt(autoRenewalMonths, 10) || 0)
          : undefined,
      notice_period_value: !isNaN(parsedNoticeVal)
        ? Math.max(0, parsedNoticeVal)
        : undefined,
      notice_period_unit: noticePeriodUnit,
      notice_period_after_initial_months:
        noticePeriodAfterInitialMonths.trim() !== ""
          ? Math.max(0, parseInt(noticePeriodAfterInitialMonths, 10) || 0)
          : undefined,
      cancellation_terms_text: cancellationTermsText.trim() || undefined,
      cancellation_period_days: computedNoticeDays,
      contract_end_date: contractEndDate || undefined,
      custom_fields: cleanedCustomFields.length > 0 ? cleanedCustomFields : undefined,
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
      title={
        existing
          ? `Eintrag „${existing.title}“ bearbeiten`
          : "Neuen Eintrag (Versicherung / Vertrag / Abo) anlegen"
      }
      subtitle="Flexible Erfassung von Versicherungen, Verträgen (Strom, GEZ, Handy) & Abos inkl. Laufzeiten, Kündigungsfristen und Zusatzfeldern"
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
        {/* SCHRITT 1: STAMMDATEN, NUMMERN & SPARTE                           */}
        {/* ================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* 3-Way Contract Type Switch */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Art des Eintrags wählen
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#161c2a]">
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
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Versicherung</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType("contract");
                    const firstCon = categories.find((c) => c.type === "contract");
                    if (firstCon) setCategorySlug(firstCon.slug);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    type === "contract"
                      ? "bg-white dark:bg-[#121622] text-amber-600 dark:text-amber-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Vertrag (Strom, GEZ, Handy)</span>
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
                  <Tv className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Abo (Streaming, Prime…)</span>
                </button>
              </div>
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bezeichnung / Tarifname *
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
                      : type === "contract"
                      ? "z. B. Ökostrom Garant 24, Telekom Glasfaser 250, Rundfunkbeitrag (GEZ)"
                      : "z. B. Netflix Standard, Amazon Prime, Spotify Duo"
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
                  onChange={(newId) => {
                    setProviderId(newId);
                    const found = providers.find((p) => p.id === newId);
                    if (found?.customer_number && !customerNumber) {
                      setCustomerNumber(found.customer_number);
                    }
                  }}
                  label={
                    type === "insurance"
                      ? "Versicherungsgesellschaft"
                      : type === "contract"
                      ? "Vertragspartner / Versorger"
                      : "Abo-Anbieter / Dienst"
                  }
                />
              </div>

              {/* Policen- / Vertragsnummer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {type === "insurance"
                    ? "Policen- / Versicherungsschein-Nr."
                    : type === "contract"
                    ? "Vertrags- / Beitragsnummer"
                    : "Abo- / Referenznummer"}
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder={
                      type === "insurance"
                        ? "z. B. PHV-2023-88412"
                        : type === "contract"
                        ? "z. B. V-900412 oder GEZ-Beitragsnr."
                        : "z. B. NF-FAMILY-2024"
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-8 pr-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Kundennummer (beim Anbieter / Vertrag) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kundennummer (beim Anbieter)
                  </label>
                  {selectedProvider?.customer_number &&
                    customerNumber !== selectedProvider.customer_number && (
                      <button
                        type="button"
                        onClick={() => setCustomerNumber(selectedProvider.customer_number!)}
                        className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Aus Anbieter übernehmen ({selectedProvider.customer_number})
                      </button>
                    )}
                </div>
                <input
                  type="text"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="z. B. KD-8841920"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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
                  <option value="paused">Pausiert / Ruhend</option>
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
        {/* SCHRITT 2: KOSTEN, LAUFZEIT & FLEXIBLE KÜNDIGUNGSFRIST            */}
        {/* ================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Kosten & Zahlungsintervall */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                  placeholder="z. B. 44.95"
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
                  <option value="quarterly">Vierteljährlich (z. B. GEZ)</option>
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
                  placeholder="SEPA-Lastschrift, PayPal..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nächste Abbuchung
                </label>
                <input
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Flexible Laufzeit & Kündigungsfrist Box */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a]/70 p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Vertragsbeginn, Laufzeit &amp; variable Kündigungsfrist</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-400 mr-1">
                    Schnellwahl:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      applyTermPreset({
                        initialMonths: "24",
                        renewalMonths: "1",
                        noticeVal: "1",
                        noticeUnit: "months",
                        afterInitialMonths: "1",
                        summary: "24 Monate Mindestlaufzeit, danach monatlich kündbar (1 Mon. Frist)",
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    24 Mon. + danach mtl.
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyTermPreset({
                        initialMonths: "12",
                        renewalMonths: "1",
                        noticeVal: "1",
                        noticeUnit: "months",
                        afterInitialMonths: "1",
                        summary: "12 Monate Mindestlaufzeit, danach monatlich kündbar",
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    12 Mon. + danach mtl.
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyTermPreset({
                        initialMonths: "12",
                        renewalMonths: "12",
                        noticeVal: "3",
                        noticeUnit: "months",
                        afterInitialMonths: "3",
                        summary: "Jährliche Verlängerung (3 Monate Kündigungsfrist)",
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    12 Mon. / 3 Mon. Frist
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyTermPreset({
                        initialMonths: "1",
                        renewalMonths: "1",
                        noticeVal: "1",
                        noticeUnit: "days",
                        afterInitialMonths: "1",
                        summary: "Jederzeit monatlich kündbar",
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#121622] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    Monatlich kündbar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vertragsbeginn
                  </label>
                  <input
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mindestlaufzeit (Monate)
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={initialTermMonths}
                    onChange={(e) => setInitialTermMonths(e.target.value)}
                    placeholder="z. B. 24 oder 12"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Verlängerung danach (Monate)
                  </label>
                  <select
                    value={autoRenewalMonths}
                    onChange={(e) => setAutoRenewalMonths(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="">Individuell / Unbefristet</option>
                    <option value="1">1 Monat (danach monatlich kündbar)</option>
                    <option value="3">3 Monate (Quartalsweise)</option>
                    <option value="6">6 Monate (Halbjährlich)</option>
                    <option value="12">12 Monate (Jährlich)</option>
                    <option value="0">Endet automatisch (keine Verlängerung)</option>
                  </select>
                </div>

                {/* Variable Kündigungsfrist (Wert + Einheit) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reguläre Kündigungsfrist
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={noticePeriodValue}
                      onChange={(e) => {
                        setNoticePeriodValue(e.target.value);
                        const days = getNoticePeriodInDays(
                          parseInt(e.target.value, 10) || 0,
                          noticePeriodUnit,
                          30
                        );
                        setCancellationPeriodDays(String(days));
                      }}
                      placeholder="1"
                      className="w-20 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                    <select
                      value={noticePeriodUnit}
                      onChange={(e) => {
                        const unit = e.target.value as NoticePeriodUnit;
                        setNoticePeriodUnit(unit);
                        const days = getNoticePeriodInDays(
                          parseInt(noticePeriodValue, 10) || 0,
                          unit,
                          30
                        );
                        setCancellationPeriodDays(String(days));
                      }}
                      className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    >
                      <option value="months">Monat(e)</option>
                      <option value="weeks">Woche(n)</option>
                      <option value="days">Tag(e)</option>
                    </select>
                  </div>
                </div>

                {/* Frist nach Mindestlaufzeit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Frist nach Mindestlaufzeit (Monate)
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={noticePeriodAfterInitialMonths}
                    onChange={(e) => setNoticePeriodAfterInitialMonths(e.target.value)}
                    placeholder="z. B. 1 (für 1 Monat)"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Vertragsende / Hauptfälligkeit + Berechnen-Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Vertragsende / Stichtag
                    </label>
                    {contractStartDate && initialTermMonths && (
                      <button
                        type="button"
                        onClick={() =>
                          calculateEndDateFromStartAndTerm(
                            contractStartDate,
                            initialTermMonths
                          )
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        title="Aus Vertragsbeginn + Mindestlaufzeit berechnen"
                      >
                        <Calculator className="w-3 h-3" />
                        Berechnen
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Freitext für variable Regelung */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Individuelle Laufzeit- &amp; Kündigungsregelung (Freitext)
                  </label>
                  <input
                    type="text"
                    value={cancellationTermsText}
                    onChange={(e) => setCancellationTermsText(e.target.value)}
                    placeholder="z. B. 24 Monate Mindestlaufzeit, danach monatlich mit 1 Monat Frist kündbar (Sonderpreis bis 11/2027)"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SCHRITT 3: PERSONEN & VARIABLE ZUSATZFELDER                       */}
        {/* ================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vertragsinhaber / Versicherungsnehmer
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

            {/* Variable Zusatzfelder (Custom Fields) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a]/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                    <span>Variable Zusatzfelder (spezifisch für diesen Eintrag)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Beliebige eigene Felder hinzufügen – z. B. Zählernummer, Rufnummer, Beitragsnummer, Login-Account oder SF-Klasse.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addCustomField("")}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Eigenes Feld</span>
                </button>
              </div>

              {/* Quick-Add Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Vorschläge:
                </span>
                {CUSTOM_FIELD_PRESETS[type].map((presetLabel) => (
                  <button
                    key={presetLabel}
                    type="button"
                    onClick={() => addCustomField(presetLabel)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121622] text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-500" />
                    <span>{presetLabel}</span>
                  </button>
                ))}
              </div>

              {/* Custom Fields List */}
              {customFields.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {customFields.map((field, idx) => (
                    <div
                      key={field.key || idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateCustomField(idx, { label: e.target.value })
                          }
                          placeholder="Feldname (z. B. Zählernummer)"
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) =>
                            updateCustomField(idx, { value: e.target.value })
                          }
                          placeholder="Wert (z. B. 1ISK00849122)"
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeCustomField(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Feld entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-[11px] text-slate-400">
                  Noch keine variablen Zusatzfelder angelegt – klicke oben auf einen Vorschlag oder „+ Eigenes Feld“.
                </div>
              )}
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
                Tipp: Dokumente können auch nachträglich im Detailfenster per Klick auf{" "}
                <strong>„📌 Verknüpfen“</strong> als Hauptpolice fest verankert werden.
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
                  setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>
                  Weiter zu{" "}
                  {STEPS.find((s) => s.id === currentStep + 1)?.short ||
                    "Nächster Schritt"}
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
