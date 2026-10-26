"use client";

import React, { useEffect, useState } from "react";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { useHub } from "@/context/HubContext";
import { InsurerProvider } from "@/types/models";
import { Building2, Globe, Mail, Phone, Save, Tag } from "lucide-react";

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
  const { saveProvider } = useHub();

  const [name, setName] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [emergencyHotline, setEmergencyHotline] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [correspondentName, setCorrespondentName] = useState("");

  useEffect(() => {
    if (initialProvider) {
      setName(initialProvider.name);
      setPortalUrl(initialProvider.portal_url || "");
      setEmergencyHotline(initialProvider.emergency_hotline || "");
      setSupportEmail(initialProvider.support_email || "");
      setCorrespondentName(initialProvider.paperless_correspondent_name || "");
    } else {
      setName(initialName);
      setPortalUrl("");
      setEmergencyHotline("");
      setSupportEmail("");
      setCorrespondentName(initialName);
    }
  }, [initialProvider, initialName, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const saved = saveProvider({
      id: initialProvider?.id,
      name: cleanName,
      portal_url: portalUrl.trim() || undefined,
      emergency_hotline: emergencyHotline.trim() || undefined,
      support_email: supportEmail.trim() || undefined,
      paperless_correspondent_name: correspondentName.trim() || cleanName,
    });

    if (onSaved) {
      onSaved(saved);
    }
    onClose();
  };

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      title={initialProvider ? "Anbieter bearbeiten" : "Neuen Anbieter anlegen"}
      subtitle="Gesellschaft oder Dienstleister mit Notfall- und Paperless-Kontaktdaten"
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
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
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Notfall- &amp; Service-Hotline
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={emergencyHotline}
                onChange={(e) => setEmergencyHotline(e.target.value)}
                placeholder="0800 2 153 153"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Support-E-Mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="kundenservice@..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Kundenportal / Login-URL
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="url"
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              placeholder="https://meine.versicherung.de/login"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Paperless-ngx Korrespondent
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={correspondentName}
              onChange={(e) => setCorrespondentName(e.target.value)}
              placeholder="z. B. HUK-COBURG"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Wird verwendet, um Dokumente in Paperless automatisch nach diesem Korrespondenten zu filtern.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Anbieter speichern
          </button>
        </div>
      </form>
    </NativeDialog>
  );
}
