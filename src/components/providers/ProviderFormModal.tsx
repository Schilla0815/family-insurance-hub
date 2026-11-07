"use client";

import React, { useEffect, useState } from "react";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { useHub } from "@/context/HubContext";
import { ContractType, InsurerProvider } from "@/types/models";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Globe,
  Mail,
  Phone,
  Save,
  Shield,
  Tag,
  Tv,
} from "lucide-react";

export function ProviderFormModal({
  open,
  onClose,
  initialName = "",
  initialProvider,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  initialProvider?: InsurerProvider | null;
  onSaved?: (provider: InsurerProvider) => void;
}) {
  const { saveProvider, showToast } = useHub();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [categoryFocus, setCategoryFocus] = useState<ContractType>("insurance");
  const [portalUrl, setPortalUrl] = useState("");
  const [emergencyHotline, setEmergencyHotline] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [correspondentName, setCorrespondentName] = useState("");
  const [correspondentId, setCorrespondentId] = useState("");
  const [notes, setNotes] = useState("");

  const isEditing = Boolean(initialProvider);

  useEffect(() => {
    if (initialProvider) {
      setName(initialProvider.name);
      setCategoryFocus(initialProvider.category_focus || "insurance");
      setPortalUrl(initialProvider.portal_url || "");
      setEmergencyHotline(initialProvider.emergency_hotline || "");
      setSupportEmail(initialProvider.support_email || "");
      setCorrespondentName(initialProvider.paperless_correspondent_name || "");
      setCorrespondentId(
        initialProvider.paperless_correspondent_id
          ? String(initialProvider.paperless_correspondent_id)
          : ""
      );
      setNotes(initialProvider.notes || "");
    } else {
      setName(initialName);
      setCategoryFocus("insurance");
      setPortalUrl("");
      setEmergencyHotline("");
      setSupportEmail("");
      setCorrespondentName(initialName);
      setCorrespondentId("");
      setNotes("");
    }
    setCurrentStep(1);
  }, [initialProvider, initialName, open]);

  if (!open) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanName = name.trim();
    if (!cleanName) {
      setCurrentStep(1);
      showToast("Bitte gib den Namen des Anbieters ein.");
      return;
    }

    const saved = saveProvider({
      id: initialProvider?.id,
      name: cleanName,
      category_focus: categoryFocus,
      portal_url: portalUrl.trim() || undefined,
      emergency_hotline: emergencyHotline.trim() || undefined,
      support_email: supportEmail.trim() || undefined,
      paperless_correspondent_name: correspondentName.trim() || cleanName,
      paperless_correspondent_id: correspondentId.trim()
        ? parseInt(correspondentId.trim(), 10) || undefined
        : undefined,
      notes: notes.trim() || undefined,
    });

    if (onSaved) {
      onSaved(saved);
    }
    onClose();
  };

  const copyNameToCorrespondent = () => {
    if (!name.trim()) return;
    setCorrespondentName(name.trim());
    showToast(`Korrespondent auf "${name.trim()}" gesetzt`);
  };

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Anbieter „${initialProvider?.name}“ bearbeiten` : "Neuen Anbieter / Korrespondent anlegen"}
      subtitle="Pflege Stammdaten, Notfall-Hotlines und die Zuordnung zum Paperless-ngx Korrespondenten in 2 Schritten"
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        {/* Stepper Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === 1
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "bg-slate-50 dark:bg-[#161c2a] border border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                  currentStep === 1
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                1
              </div>
              <div className="min-w-0">
                <div className="text-xs truncate font-bold">Schritt 1</div>
                <div className="text-[11px] opacity-80 truncate">Basis- &amp; Kontaktdaten</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                currentStep === 2
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "bg-slate-50 dark:bg-[#161c2a] border border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                  currentStep === 2
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                2
              </div>
              <div className="min-w-0">
                <div className="text-xs truncate font-bold">Schritt 2</div>
                <div className="text-[11px] opacity-80 truncate">Paperless Korrespondent</div>
              </div>
            </button>
          </div>
        </div>

        {/* STEP 1: BASIS & KONTAKT */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Name des Anbieters / Gesellschaft *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    if (!correspondentName || correspondentName === name) {
                      setCorrespondentName(val);
                    }
                  }}
                  placeholder="z. B. HUK-COBURG, Barmer, Netflix, Telekom..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-9 pr-3.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hauptbereich / Sparte
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFocus("insurance")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    categoryFocus === "insurance"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Versicherer / Police
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFocus("subscription")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    categoryFocus === "subscription"
                      ? "border-indigo-600 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Tv className="w-4 h-4 text-indigo-500" />
                  Abonnement / Dienst
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Notfall- &amp; Service-Hotline
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={emergencyHotline}
                    onChange={(e) => setEmergencyHotline(e.target.value)}
                    placeholder="0800 2 153 153"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Support- &amp; Schaden-E-Mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="kundenservice@..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Kundenportal / Login-URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    value={portalUrl}
                    onChange={(e) => setPortalUrl(e.target.value)}
                    placeholder="https://meine.versicherung.de/login"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                {portalUrl && (
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    title="URL testen"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PAPERLESS KORRESPONDENT & NOTIZEN */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                Paperless-ngx Korrespondenten-Zuordnung
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                Dokumente in Paperless-ngx (z. B. Policescheine, Nachträge und Rechnungen) werden automatisch nach diesem Namen gefiltert.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Korrespondenten-Name in Paperless-ngx
                </label>
                {name && correspondentName !== name && (
                  <button
                    type="button"
                    onClick={copyNameToCorrespondent}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Vom Namen („{name}“) übernehmen
                  </button>
                )}
              </div>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={correspondentName}
                  onChange={(e) => setCorrespondentName(e.target.value)}
                  placeholder="z. B. HUK-COBURG"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Korrespondenten-ID (optional)
              </label>
              <input
                type="number"
                value={correspondentId}
                onChange={(e) => setCorrespondentId(e.target.value)}
                placeholder="z. B. 101"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Interne Notizen zum Anbieter
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z. B. Ansprechpartner Herr Müller, Agenturnummer 482-B"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            {currentStep === 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Zurück zu Schritt 1
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800"
              >
                Abbrechen
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => {
                  if (!name.trim()) {
                    showToast("Bitte gib zuerst einen Namen ein.");
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Weiter zu Paperless</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? "Änderungen speichern" : "Anbieter anlegen"}</span>
            </button>
          </div>
        </div>
      </div>
    </NativeDialog>
  );
}
