"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Plus, Search } from "lucide-react";
import { InsurerProvider } from "@/types/models";
import { useHub } from "@/context/HubContext";
import { ProviderFormModal } from "@/components/providers/ProviderFormModal";

export function SearchableProviderSelect({
  value,
  onChange,
  label = "Anbieter / Gesellschaft",
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const { providers } = useHub();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerToCreateName, setProviderToCreateName] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const selectedProvider = providers.find((p) => p.id === value);

  // Filter providers
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.emergency_hotline && p.emergency_hotline.includes(q)) ||
        (p.support_email && p.support_email.toLowerCase().includes(q)) ||
        (p.paperless_correspondent_name &&
          p.paperless_correspondent_name.toLowerCase().includes(q))
    );
  }, [providers, search]);

  const exactMatch = providers.some(
    (p) => p.name.trim().toLowerCase() === search.trim().toLowerCase()
  );

  const handleOpenNewModal = (prefillName = "") => {
    setProviderToCreateName(prefillName);
    setIsOpen(false);
    setProviderModalOpen(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer hover:border-slate-400 dark:hover:border-slate-600"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          {selectedProvider ? (
            <span className="font-medium text-slate-900 dark:text-white truncate">
              {selectedProvider.name}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">
              Anbieter auswählen oder neu anlegen...
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Embedded Search Field */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Anbieter durchsuchen..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 p-1 space-y-0.5">
            {filtered.length > 0 ? (
              filtered.map((p) => {
                const isSelected = p.id === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(p.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                Kein passender Anbieter gefunden
              </div>
            )}
          </div>

          {/* Action: Create Provider Popup */}
          <div className="p-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={() => handleOpenNewModal(search.trim())}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="truncate">
                {search.trim() && !exactMatch
                  ? `„${search.trim()}“ neu anlegen`
                  : "Neuen Anbieter anlegen"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Provider Creation Modal */}
      <ProviderFormModal
        open={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        initialName={providerToCreateName}
        onSaved={(newProvider) => {
          onChange(newProvider.id);
        }}
      />
    </div>
  );
}
