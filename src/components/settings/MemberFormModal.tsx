"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Save,
  Shield,
  User,
  UserCheck,
} from "lucide-react";
import { Member } from "@/types/models";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { useHub } from "@/context/HubContext";
import { useAuth } from "@/context/AuthContext";
import { calculateAge, formatDateDE } from "@/lib/calculations";

interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  memberToEdit?: Member | null;
}

const EMOJI_PRESETS = [
  "👨‍💻", "👩‍⚕️", "👦", "👧", "👶", "🧑", "👵", "👴", "🐱", "🐶", "🧔", "👱‍♀️"
];

const COLOR_PRESETS = [
  { id: "blue", label: "Blau", class: "bg-blue-500" },
  { id: "emerald", label: "Grün", class: "bg-emerald-500" },
  { id: "rose", label: "Rosa", class: "bg-rose-500" },
  { id: "purple", label: "Lila", class: "bg-purple-500" },
  { id: "amber", label: "Gelb", class: "bg-amber-500" },
  { id: "cyan", label: "Türkis", class: "bg-cyan-500" },
];

export function MemberFormModal({
  open,
  onClose,
  memberToEdit,
}: MemberFormModalProps) {
  const { saveMember, showToast } = useHub();
  const { users } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("Familienmitglied");
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [avatarEmoji, setAvatarEmoji] = useState("👤");
  const [avatarColor, setAvatarColor] = useState("blue");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [linkedUserId, setLinkedUserId] = useState("");
  const [notes, setNotes] = useState("");

  const isEditing = Boolean(memberToEdit);

  useEffect(() => {
    if (memberToEdit) {
      setFirstName(memberToEdit.first_name || "");
      setRole(memberToEdit.role || "Familienmitglied");
      setBirthDate(memberToEdit.birth_date || "2000-01-01");
      setAvatarEmoji(memberToEdit.avatar_emoji || "👤");
      setAvatarColor(memberToEdit.avatar_color || "blue");
      setHealthInsurance(memberToEdit.health_insurance || "");
      setInsuranceNumber(memberToEdit.insurance_number || "");
      setLinkedUserId(memberToEdit.linked_user_id || "");
      setNotes(memberToEdit.notes || "");
    } else {
      setFirstName("");
      setRole("Familienmitglied");
      setBirthDate("2000-01-01");
      setAvatarEmoji("👤");
      setAvatarColor("blue");
      setHealthInsurance("");
      setInsuranceNumber("");
      setLinkedUserId("");
      setNotes("");
    }
    setCurrentStep(1);
  }, [memberToEdit, open]);

  if (!open) return null;

  const calculatedAge = birthDate ? calculateAge(birthDate) : null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firstName.trim()) {
      setCurrentStep(1);
      showToast("Bitte gib den Vornamen des Familienmitglieds ein.");
      return;
    }

    saveMember({
      id: memberToEdit?.id,
      first_name: firstName.trim(),
      role: role.trim() || "Familienmitglied",
      birth_date: birthDate || "2000-01-01",
      avatar_emoji: avatarEmoji,
      avatar_color: avatarColor,
      health_insurance: healthInsurance.trim() || undefined,
      insurance_number: insuranceNumber.trim() || undefined,
      linked_user_id: linkedUserId.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Familienmitglied „${memberToEdit?.first_name}“ bearbeiten` : "Neues Familienmitglied anlegen"}
      subtitle="Verwalte persönliche Stammdaten, Notfall-Informationen für den Roten Ordner und Benutzer-Verknüpfungen in 2 Schritten"
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
                <div className="text-[11px] opacity-80 truncate">Persönliche Daten &amp; Avatar</div>
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
                <div className="text-[11px] opacity-80 truncate">Notfall, GKV &amp; Verknüpfung</div>
              </div>
            </button>
          </div>
        </div>

        {/* STEP 1: PERSÖNLICHE DATEN & AVATAR */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vorname / Rufname *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="z. B. Maximilian, Laura, Ben"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-9 pr-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rolle im Haushalt
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="z. B. Vater, Mutter, Sohn, Tochter, Partner"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Geburtsdatum
                </label>
                {calculatedAge !== null && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {calculatedAge} Jahre alt
                  </span>
                )}
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Wichtig für den Familien-Meilenstein-Radar (KFO, Schulunfähigkeit, BU, Volljährigkeit).
              </span>
            </div>

            {/* Avatar & Color Picker */}
            <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Avatar-Emoji auswählen
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      avatarEmoji === emoji
                        ? "bg-emerald-500/20 border-2 border-emerald-500 scale-110 shadow-xs"
                        : "bg-slate-100 dark:bg-[#161c2a] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Akzentfarbe
              </label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setAvatarColor(col.id)}
                    className={`w-6 h-6 rounded-full ${col.class} transition-all cursor-pointer flex items-center justify-center ${
                      avatarColor === col.id
                        ? "ring-2 ring-offset-2 ring-emerald-500 scale-110"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    title={col.label}
                  >
                    {avatarColor === col.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: NOTFALL, GKV & BENUTZERKONTO */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                Notfall-Mappe („Der rote Ordner“) &amp; Gesundheitsdaten
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                Diese Angaben fließen direkt in den druckbaren Notfall-Ordner ein, damit Ärzte und Angehörige im Notfall Krankenkasse und KVNR sofort parat haben.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Krankenkasse / GKV / PKV
                </label>
                <input
                  type="text"
                  value={healthInsurance}
                  onChange={(e) => setHealthInsurance(e.target.value)}
                  placeholder="z. B. Techniker Krankenkasse (TK), Barmer"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Krankenversichertennummer (KVNR)
                </label>
                <input
                  type="text"
                  value={insuranceNumber}
                  onChange={(e) => setInsuranceNumber(e.target.value)}
                  placeholder="z. B. T123456789"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Verknüpftes Login-Benutzerkonto (optional)
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={linkedUserId}
                  onChange={(e) => setLinkedUserId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161c2a] pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="">Kein Benutzerkonto verknüpft (nur Profil)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} (@{u.username}) – {u.role === "admin" ? "Admin" : "Mitglied"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Notizen &amp; medizinische Besonderheiten
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z. B. Hausarzt Dr. Schmidt (Tel: 089 12345), Blutgruppe A+, Penicillin-Allergie"
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
                className="rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer text-slate-600 dark:text-slate-400"
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
                  if (!firstName.trim()) {
                    showToast("Bitte gib zuerst den Vornamen ein.");
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Weiter zu Notfall &amp; GKV</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? "Änderungen speichern" : "Mitglied anlegen"}</span>
            </button>
          </div>
        </div>
      </div>
    </NativeDialog>
  );
}
