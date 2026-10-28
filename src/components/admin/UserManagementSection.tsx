"use client";

import React, { useState } from "react";
import {
  Lock,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useHub } from "@/context/HubContext";
import { UserAccount } from "@/types/models";
import { UserFormModal } from "@/components/admin/UserFormModal";
import { formatDateDE } from "@/lib/calculations";

export function UserManagementSection() {
  const { currentUser, isAdmin, users, deleteUser } = useAuth();
  const { showToast } = useHub();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDelete = (user: UserAccount) => {
    if (
      confirm(
        `Möchtest du den Benutzer "${user.displayName} (@${user.username})" wirklich unwiderruflich löschen?`
      )
    ) {
      const res = deleteUser(user.id);
      if (!res.success) {
        alert(res.error);
      } else {
        showToast(`Benutzer "${user.username}" wurde gelöscht.`);
      }
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121622] p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <UserCog className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Benutzerverwaltung &amp; Zugänge</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {users.length} {users.length === 1 ? "Konto" : "Konten"}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Haushaltsmitglieder verwalten, Rollen vergeben und Passwörter pflegen.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Neuen Benutzer anlegen</span>
          </button>
        )}
      </div>

      {!isAdmin ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Eingeschränkter Zugriff</div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Du bist als normales Mitglied angemeldet. Nur Administratoren können Benutzerkonten
              anlegen, Passwörter zurücksetzen oder Rollen ändern.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {users.map((u) => {
            const isSelf = currentUser?.id === u.id;
            const isSuperAdmin = u.username === "admin";

            return (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-slate-50/60 dark:bg-[#161c2a] text-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      u.role === "admin"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {u.role === "admin" ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 dark:text-white truncate">
                        {u.displayName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        @{u.username}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                          Du
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          u.role === "admin"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Mitglied"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      Erstellt am {formatDateDE(u.createdAt.substring(0, 10))}
                      {u.lastLoginAt
                        ? ` • Letzter Login: ${formatDateDE(u.lastLoginAt.substring(0, 10))}`
                        : " • Noch kein Login verzeichnet"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(u)}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Benutzerdaten & Passwort bearbeiten"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bearbeiten</span>
                  </button>

                  {!isSelf && !isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Benutzer löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Löschen</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Form Modal */}
      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userToEdit={selectedUser}
      />
    </section>
  );
}
