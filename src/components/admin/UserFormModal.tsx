"use client";

import React, { useEffect, useState } from "react";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { UserAccount, UserRole } from "@/types/models";
import { useAuth } from "@/context/AuthContext";
import { useHub } from "@/context/HubContext";
import { Lock, Save, ShieldAlert, ShieldCheck, User, UserCheck } from "lucide-react";

export function UserFormModal({
  open,
  onClose,
  userToEdit,
}: {
  open: boolean;
  onClose: () => void;
  userToEdit?: UserAccount | null;
}) {
  const { createUser, updateUser } = useAuth();
  const { showToast } = useHub();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(userToEdit);

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setDisplayName(userToEdit.displayName);
      setRole(userToEdit.role);
      setPassword("");
    } else {
      setUsername("");
      setDisplayName("");
      setRole("member");
      setPassword("");
    }
    setError(null);
  }, [userToEdit, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isEditing && userToEdit) {
      const res = updateUser(userToEdit.id, {
        displayName,
        role,
        password: password.trim() ? password.trim() : undefined,
      });

      if (!res.success) {
        setError(res.error || "Aktualisierung fehlgeschlagen.");
        return;
      }

      showToast(`Benutzer "${userToEdit.username}" erfolgreich aktualisiert.`);
      onClose();
    } else {
      const res = createUser({
        username,
        displayName,
        password,
        role,
      });

      if (!res.success) {
        setError(res.error || "Benutzer konnte nicht angelegt werden.");
        return;
      }

      showToast(`Benutzer "${username}" erfolgreich erstellt.`);
      onClose();
    }
  };

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Benutzer "${userToEdit?.username}" bearbeiten` : "Neuen Benutzer anlegen"}
      subtitle={
        isEditing
          ? "Rolle, Anzeigename und optional Passwort anpassen"
          : "Zugangskonto für ein Haushalts- oder Familienmitglied erstellen"
      }
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Benutzername (Login) *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              disabled={isEditing}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              placeholder="z. B. julia"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800"
            />
          </div>
          {isEditing && (
            <p className="text-[11px] text-slate-400 mt-1">
              Der Login-Benutzername kann nachträglich nicht geändert werden.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Anzeigename
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="z. B. Julia Mustermann"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {isEditing ? "Neues Passwort (optional)" : "Passwort *"}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required={!isEditing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? "Unverändert lassen" : "••••••••"}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121622] pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {isEditing && (
            <p className="text-[11px] text-slate-400 mt-1">
              Nur ausfüllen, wenn das Passwort neu vergeben werden soll.
            </p>
          )}
        </div>

        {/* Role selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Berechtigungs-Rolle *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("member")}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                role === "member"
                  ? "border-blue-500/80 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/30"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <div className="text-xs font-bold">Mitglied</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Standardzugriff, kein Adminbereich
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                role === "admin"
                  ? "border-emerald-500/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121622] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold">Administrator</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Vollzugriff, Paperless-Key, Nutzerverwaltung
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
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
            <span>{isEditing ? "Speichern" : "Benutzer anlegen"}</span>
          </button>
        </div>
      </form>
    </NativeDialog>
  );
}
