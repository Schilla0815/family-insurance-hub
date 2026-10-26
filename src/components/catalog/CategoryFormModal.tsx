"use client";

import React, { useEffect, useState } from "react";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CatalogCategory, ContractType } from "@/types/models";
import { useHub } from "@/context/HubContext";
import { Check, Plus, Save, Tag, Trash2 } from "lucide-react";

const AVAILABLE_ICONS = [
  "ShieldCheck",
  "HeartPulse",
  "BriefcaseMedical",
  "Car",
  "Home",
  "Sofa",
  "Scale",
  "Plane",
  "Luggage",
  "PawPrint",
  "Cat",
  "Users",
  "Baby",
  "Activity",
  "Stethoscope",
  "Smartphone",
  "Wifi",
  "PhoneCall",
  "Tv",
  "Music",
  "Gamepad2",
  "Dumbbell",
  "BookOpen",
  "ShoppingBag",
  "TrainFront",
  "Zap",
  "Cloud",
  "Radio",
  "Archive",
];

const DEFAULT_GROUPS_INSURANCE = [
  "Gesundheit, Einkommen & Familie",
  "Haus, Wohnen & Haftung",
  "Fahrzeuge, Reise & Haustiere",
];

const DEFAULT_GROUPS_SUBSCRIPTION = [
  "Haushalt, Kommunikation & Mobilität",
  "Streaming, Medien, Software & Freizeit",
  "Sport, Verein & Mitgliedschaften",
];

export function CategoryFormModal({
  open,
  onClose,
  initialCategory,
  initialType = "insurance",
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialCategory?: CatalogCategory | null;
  initialType?: ContractType;
  onSaved?: (cat: CatalogCategory) => void;
}) {
  const { categories, saveCategory, deleteCategory } = useHub();

  const [name, setName] = useState("");
  const [type, setType] = useState<ContractType>(initialType);
  const [groupLabel, setGroupLabel] = useState("");
  const [customGroup, setCustomGroup] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("ShieldCheck");
  const [isVisible, setIsVisible] = useState(true);

  // Collect existing group labels
  const existingGroups = Array.from(
    new Set(
      categories
        .filter((c) => c.type === type)
        .map((c) => c.group_label)
        .filter(Boolean)
        .concat(
          type === "insurance"
            ? DEFAULT_GROUPS_INSURANCE
            : DEFAULT_GROUPS_SUBSCRIPTION
        )
    )
  );

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setType(initialCategory.type);
      setGroupLabel(initialCategory.group_label);
      setCustomGroup("");
      setDescription(initialCategory.description || "");
      setIconName(initialCategory.icon_name || "ShieldCheck");
      setIsVisible(initialCategory.is_visible);
    } else {
      setName("");
      setType(initialType);
      const defaultGroup =
        initialType === "insurance"
          ? DEFAULT_GROUPS_INSURANCE[0]
          : DEFAULT_GROUPS_SUBSCRIPTION[0];
      setGroupLabel(defaultGroup);
      setCustomGroup("");
      setDescription("");
      setIconName(initialType === "insurance" ? "ShieldCheck" : "Tv");
      setIsVisible(true);
    }
  }, [initialCategory, initialType, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) return;

    const finalGroup =
      groupLabel === "__new__"
        ? customGroup.trim() || "Eigene Kategorien"
        : groupLabel || "Allgemein";

    const saved = saveCategory({
      id: initialCategory?.id,
      slug:
        initialCategory?.slug ||
        finalName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      name: finalName,
      type,
      group_label: finalGroup,
      description: description.trim(),
      icon_name: iconName,
      is_visible: isVisible,
      sort_order: initialCategory?.sort_order ?? 99,
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
      title={initialCategory ? "Katalog-Kategorie anpassen" : "Neue Kategorie anlegen"}
      subtitle="Katalog individuell um eigene Sparten und Abos erweitern"
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type switch */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setType("insurance");
              if (!initialCategory) {
                setIconName("ShieldCheck");
                setGroupLabel(DEFAULT_GROUPS_INSURANCE[0]);
              }
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              type === "insurance"
                ? "bg-white dark:bg-[#161c2a] text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Versicherungssparte
          </button>
          <button
            type="button"
            onClick={() => {
              setType("subscription");
              if (!initialCategory) {
                setIconName("Tv");
                setGroupLabel(DEFAULT_GROUPS_SUBSCRIPTION[0]);
              }
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              type === "subscription"
                ? "bg-white dark:bg-[#161c2a] text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Sonstiges Abo / Fixkosten
          </button>
        </div>

        {/* Category Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Name der Sparte / Kategorie *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === "insurance"
                ? "z. B. Bootskasko, E-Bike-Versicherung, Krankentagegeld"
                : "z. B. Dauerkarten & Sportvereine, Musikunterricht, Cloud-Backup"
            }
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Group / Thematischer Bereich */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Themen-Gruppe im Katalog
          </label>
          <select
            value={groupLabel}
            onChange={(e) => setGroupLabel(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
          >
            {existingGroups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
            <option value="__new__">+ Neue Gruppe erstellen…</option>
          </select>
          {groupLabel === "__new__" && (
            <input
              type="text"
              required
              value={customGroup}
              onChange={(e) => setCustomGroup(e.target.value)}
              placeholder="Eigener Gruppenname (z. B. Hobbys & Verein)"
              className="mt-2 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Symbol / Icon
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161c2a] max-h-36 overflow-y-auto">
            {AVAILABLE_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIconName(ic)}
                className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  iconName === ic
                    ? "bg-emerald-600 text-white shadow-2xs scale-105"
                    : "bg-white dark:bg-[#121622] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={ic}
              >
                <CategoryIcon name={ic} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Kurzbeschreibung (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Zweck oder Erläuterung dieser Sparte..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Visibility */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
          />
          <span>Standardmäßig im Katalog ankreuzen (in Übersicht sichtbar)</span>
        </label>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          {initialCategory ? (
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    `Möchtest du die Sparte "${initialCategory.name}" wirklich aus dem Katalog entfernen?`
                  )
                ) {
                  deleteCategory(initialCategory.slug);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sparte löschen</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Kategorie speichern</span>
            </button>
          </div>
        </div>
      </form>
    </NativeDialog>
  );
}
