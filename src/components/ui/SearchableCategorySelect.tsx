"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, Tag } from "lucide-react";
import { CatalogCategory, ContractType } from "@/types/models";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CategoryFormModal } from "@/components/catalog/CategoryFormModal";
import { useHub } from "@/context/HubContext";

export function SearchableCategorySelect({
  value,
  onChange,
  type,
  label = "Katalog-Kategorie *",
  required = false,
}: {
  value: string;
  onChange: (slug: string) => void;
  type: ContractType;
  label?: string;
  required?: boolean;
}) {
  const { categories } = useHub();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

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

  const selectedCategory = categories.find((c) => c.slug === value);

  // Filter categories
  const filtered = useMemo(() => {
    const list = categories.filter((c) => c.type === type);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.group_label && c.group_label.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, type, search]);

  // Group by group_label
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogCategory[]>();
    for (const cat of filtered) {
      const g = cat.group_label || "Allgemein";
      const arr = map.get(g) || [];
      arr.push(cat);
      map.set(g, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

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
          {selectedCategory ? (
            <>
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                <CategoryIcon
                  iconName={selectedCategory.icon_name}
                  className="w-4 h-4"
                />
              </div>
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {selectedCategory.name}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden sm:inline">
                ({selectedCategory.group_label})
              </span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">
              Kategorie auswählen...
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
                placeholder="Kategorie durchsuchen..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 p-1 space-y-1 divide-y divide-slate-100/50 dark:divide-slate-800/50">
            {grouped.length > 0 ? (
              grouped.map(([groupName, items]) => (
                <div key={groupName} className="pt-1.5 first:pt-0">
                  <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {groupName}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {items.map((cat) => {
                      const isSelected = cat.slug === value;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => {
                            onChange(cat.slug);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <CategoryIcon
                              iconName={cat.icon_name}
                              className="w-3.5 h-3.5 text-slate-400 shrink-0"
                            />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                Keine passende Kategorie gefunden
              </div>
            )}
          </div>

          {/* Action to create new Category */}
          <div className="p-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setCategoryModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neue Kategorie erstellen</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Category Creation Modal */}
      <CategoryFormModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        initialType={type}
        onSaved={(newCat) => {
          onChange(newCat.slug);
        }}
      />
    </div>
  );
}
