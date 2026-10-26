"use client";

import React, { useId, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BriefcaseMedical,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Edit2,
  EyeOff,
  HeartPulse,
  Info,
  Link as LinkIcon,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import {
  FamilyMilestone,
  MilestoneOverride,
  MilestoneStatus,
} from "@/types/models";
import { buildFamilyMilestones, formatDateDE } from "@/lib/calculations";
import { NativeDialog } from "@/components/ui/NativeDialog";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  ShieldAlert,
  Car,
  Scale,
  HeartPulse,
  BriefcaseMedical,
};

export function FamilyMilestonesRadar() {
  const {
    members,
    contracts,
    milestoneOverrides,
    saveMilestoneOverride,
    resetMilestoneOverride,
    selectedMemberId,
    openContractDetail,
  } = useHub();

  const [statusFilter, setStatusFilter] = useState<"all" | MilestoneStatus>("all");
  const [editingMilestone, setEditingMilestone] = useState<FamilyMilestone | null>(null);

  // Form states for the customization dialog
  const [editStatus, setEditStatus] = useState<MilestoneStatus>("action_needed");
  const [editContractId, setEditContractId] = useState<string>("");
  const [editTargetAge, setEditTargetAge] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  const statusId = useId();
  const contractId = useId();
  const targetAgeId = useId();
  const notesId = useId();

  // Compute milestones dynamically from members & contracts
  const allMilestones = useMemo(() => {
    return buildFamilyMilestones(members, contracts, milestoneOverrides);
  }, [members, contracts, milestoneOverrides]);

  // Filter by selected family member (global member bar)
  const memberFilteredMilestones = useMemo(() => {
    if (selectedMemberId === "all") return allMilestones;
    return allMilestones.filter((m) => m.member_id === selectedMemberId);
  }, [allMilestones, selectedMemberId]);

  // Filter by status tab
  const displayedMilestones = useMemo(() => {
    if (statusFilter === "all") return memberFilteredMilestones;
    return memberFilteredMilestones.filter((m) => m.status === statusFilter);
  }, [memberFilteredMilestones, statusFilter]);

  // Statistics
  const actionNeededCount = memberFilteredMilestones.filter(
    (m) => m.status === "action_needed"
  ).length;
  const coveredCount = memberFilteredMilestones.filter(
    (m) => m.status === "covered"
  ).length;
  const dismissedCount = memberFilteredMilestones.filter(
    (m) => m.status === "dismissed"
  ).length;

  const openEditDialog = (milestone: FamilyMilestone) => {
    setEditingMilestone(milestone);
    setEditStatus(milestone.status);
    setEditContractId(milestone.linked_contract_id || "");
    setEditTargetAge(String(milestone.target_age));
    setEditNotes(milestone.custom_notes || "");
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    saveMilestoneOverride(editingMilestone.id, {
      status: editStatus,
      linked_contract_id: editContractId || undefined,
      custom_target_age: editTargetAge ? parseInt(editTargetAge, 10) : undefined,
      custom_notes: editNotes.trim() || undefined,
    });

    setEditingMilestone(null);
  };

  const handleReset = () => {
    if (!editingMilestone) return;
    resetMilestoneOverride(editingMilestone.id);
    setEditingMilestone(null);
  };

  // List of active insurance contracts available for linking
  const activeInsuranceContracts = useMemo(
    () => contracts.filter((c) => c.status === "active"),
    [contracts]
  );

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold tracking-tight">
              Familien-Meilenstein-Radar
            </h2>
            {actionNeededCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 text-xs font-bold animate-pulse">
                {actionNeededCount} Handlungsbedarf
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Altersgrenzen, Kieferorthopädie, Volljährigkeit &amp; rechtzeitige Policen-Anpassungen
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Alle ({memberFilteredMilestones.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("action_needed")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              statusFilter === "action_needed"
                ? "bg-amber-600 text-white"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            Handlungsbedarf ({actionNeededCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("covered")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              statusFilter === "covered"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            Abgedeckt ({coveredCount})
          </button>
          {dismissedCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter("dismissed")}
              className={`px-2.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                statusFilter === "dismissed"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Ausgeblendet ({dismissedCount})
            </button>
          )}
        </div>
      </div>

      {/* Milestones Cards Grid */}
      {displayedMilestones.length === 0 ? (
        <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500">
          Keine Meilensteine in dieser Filteransicht.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedMilestones.map((m) => {
            const member = members.find((mem) => mem.id === m.member_id);
            const IconComponent = ICON_MAP[m.icon_name] || Sparkles;
            const linkedContract = contracts.find((c) => c.id === m.linked_contract_id);

            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-4 space-y-3 flex flex-col justify-between transition-all ${
                  m.status === "action_needed"
                    ? "border-amber-500/30 bg-gradient-to-br from-amber-50/40 to-orange-50/20 dark:from-amber-950/20 dark:to-orange-950/10"
                    : m.status === "covered"
                    ? "border-emerald-500/20 bg-white dark:bg-slate-900"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 opacity-60"
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Icon, Member Avatar & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          m.status === "action_needed"
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : m.status === "covered"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span>{member?.avatar_emoji}</span>
                          <span>{member?.first_name}</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            (aktuell {m.current_age} Jahre)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {m.category_name}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        m.status === "action_needed"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                          : m.status === "covered"
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {m.status === "action_needed" ? (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Handlungsbedarf
                        </>
                      ) : m.status === "covered" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Abgedeckt
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-slate-500" />
                          Ausgeblendet
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title & Timing */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {m.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        Stichtag mit {m.target_age} Jahren am {formatDateDE(m.due_date)}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {m.months_until_due > 0
                          ? `in ca. ${m.months_until_due} Monaten`
                          : m.months_until_due === 0
                          ? "genau JETZT fällig"
                          : `vor ${Math.abs(m.months_until_due)} Monaten erreicht`}
                      </span>
                    </div>
                  </div>

                  {/* Consumer Protection Recommendation Tip */}
                  <div className="rounded-xl p-2.5 text-xs bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-[11px]">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>Empfehlung:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {m.recommendation}
                    </p>
                  </div>

                  {/* User Custom Notes if any */}
                  {m.custom_notes && (
                    <div className="text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-amber-900 dark:text-amber-200">
                      <strong>Eigene Notiz:</strong> {m.custom_notes}
                    </div>
                  )}
                </div>

                {/* Card Bottom: Linked Policy & Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    {linkedContract ? (
                      <button
                        type="button"
                        onClick={() => openContractDetail(linkedContract.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold hover:underline truncate cursor-pointer"
                        title="Zugeordnete Police öffnen"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Police: {linkedContract.title}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Keine Police zugeordnet
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditDialog(m)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    <Edit2 className="w-3 h-3 text-slate-400" />
                    <span>Anpassen</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Customization Dialog */}
      <NativeDialog
        open={Boolean(editingMilestone)}
        onClose={() => setEditingMilestone(null)}
        title="Meilenstein anpassen &amp; Police zuordnen"
        subtitle={editingMilestone?.title}
        maxWidthClass="max-w-xl"
      >
        {editingMilestone && (
          <form onSubmit={handleSaveOverride} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor={statusId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status festlegen
              </label>
              <select
                id={statusId}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as MilestoneStatus)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="action_needed">⚠️ Handlungsbedarf (noch nicht erledigt / prüfen)</option>
                <option value="covered">✅ Abgedeckt (Police vorhanden / erledigt)</option>
                <option value="dismissed">👁️‍🗨️ Ausblenden (für uns nicht relevant)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor={contractId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Verknüpfte Police / Vertrag zuordnen
              </label>
              <select
                id={contractId}
                value={editContractId}
                onChange={(e) => setEditContractId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="">— Keine Police verknüpfen —</option>
                {activeInsuranceContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.policy_number || "ohne Nr."})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Wähle eine bestehende Police im Haushalt aus, die diese Absicherung bereits erfüllt.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor={targetAgeId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Zielalter anpassen (in Jahren)
              </label>
              <input
                id={targetAgeId}
                type="number"
                min="1"
                max="99"
                value={editTargetAge}
                onChange={(e) => setEditTargetAge(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500">
                Standard-Empfehlung: {editingMilestone.target_age} Jahre. Du kannst das Alter nach individuellem Bedarf verändern.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor={notesId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Eigene Notizen / Termine
              </label>
              <textarea
                id={notesId}
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="z. B. Arzttermin zur KFO-Früherkennung am 15.11. vereinbart..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              {editingMilestone.is_custom_override ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Auf Standard zurücksetzen</span>
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </div>
          </form>
        )}
      </NativeDialog>
    </div>
  );
}
