"use client";

import React, { useId, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Edit2,
  FileText,
  Plus,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { ClaimStatus, Contract, InsuranceClaim } from "@/types/models";
import { formatDateDE, formatEuro } from "@/lib/calculations";
import { NativeDialog } from "@/components/ui/NativeDialog";

interface ContractClaimsPanelProps {
  contract: Contract;
}

const STATUS_CONFIG: Record<
  ClaimStatus,
  {
    label: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  reported: {
    label: "Gemeldet",
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800",
    icon: Clock,
  },
  under_review: {
    label: "In Prüfung",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    icon: AlertCircle,
  },
  settled: {
    label: "Reguliert",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Abgelehnt",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    icon: XCircle,
  },
};

export function ContractClaimsPanel({ contract }: ContractClaimsPanelProps) {
  const { claims, saveClaim, deleteClaim, showToast } = useHub();

  const contractClaims = useMemo(
    () => claims.filter((c) => c.contract_id === contract.id),
    [claims, contract.id]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<InsuranceClaim | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [reportedDate, setReportedDate] = useState("");
  const [claimNumber, setClaimNumber] = useState("");
  const [status, setStatus] = useState<ClaimStatus>("reported");
  const [claimedAmount, setClaimedAmount] = useState<string>("");
  const [settledAmount, setSettledAmount] = useState<string>("");
  const [deductibleApplied, setDeductibleApplied] = useState<string>("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const titleId = useId();
  const incDateId = useId();
  const repDateId = useId();
  const claimNumId = useId();
  const claimedAmtId = useId();
  const settledAmtId = useId();
  const deductibleId = useId();

  const openNewClaimModal = () => {
    setEditingClaim(null);
    setTitle("");
    const today = new Date().toISOString().split("T")[0];
    setIncidentDate(today);
    setReportedDate(today);
    setClaimNumber("");
    setStatus("reported");
    setClaimedAmount("");
    setSettledAmount("");
    setDeductibleApplied(contract.deductible ? String(contract.deductible) : "0");
    setDescription("");
    setNotes("");
    setModalOpen(true);
  };

  const openEditClaimModal = (claim: InsuranceClaim) => {
    setEditingClaim(claim);
    setTitle(claim.title);
    setIncidentDate(claim.incident_date);
    setReportedDate(claim.reported_date);
    setClaimNumber(claim.claim_number || "");
    setStatus(claim.status);
    setClaimedAmount(claim.claimed_amount !== undefined ? String(claim.claimed_amount) : "");
    setSettledAmount(claim.settled_amount !== undefined ? String(claim.settled_amount) : "");
    setDeductibleApplied(
      claim.deductible_applied !== undefined ? String(claim.deductible_applied) : ""
    );
    setDescription(claim.description || "");
    setNotes(claim.notes || "");
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Bitte gib eine Schadensbezeichnung ein");
      return;
    }

    saveClaim({
      id: editingClaim?.id,
      contract_id: contract.id,
      title: title.trim(),
      incident_date: incidentDate || new Date().toISOString().split("T")[0],
      reported_date: reportedDate || new Date().toISOString().split("T")[0],
      claim_number: claimNumber.trim() || undefined,
      status,
      claimed_amount: claimedAmount ? parseFloat(claimedAmount) : undefined,
      settled_amount: settledAmount ? parseFloat(settledAmount) : undefined,
      deductible_applied: deductibleApplied ? parseFloat(deductibleApplied) : undefined,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setModalOpen(false);
  };

  const copyClaimNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    showToast(`Schadensnummer „${num}“ kopiert`);
  };

  // Aggregated totals
  const totalSettled = contractClaims.reduce(
    (sum, c) => sum + (c.settled_amount || 0),
    0
  );
  const totalClaimed = contractClaims.reduce(
    (sum, c) => sum + (c.claimed_amount || 0),
    0
  );
  const openCount = contractClaims.filter(
    (c) => c.status === "reported" || c.status === "under_review"
  ).length;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/40 dark:bg-slate-950/30">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Schadensfälle &amp; Regulierungen</span>
            {contractClaims.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {contractClaims.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aktenzeichen, Erstattungen, Selbstbeteiligung und Korrespondenz
          </p>
        </div>

        <button
          type="button"
          onClick={openNewClaimModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Schaden erfassen
        </button>
      </div>

      {/* Aggregate KPI Strip */}
      {contractClaims.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 text-[11px]">Bisher erstattet:</span>
            <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatEuro(totalSettled)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 text-[11px]">Gefordert gesamt:</span>
            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
              {formatEuro(totalClaimed)}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 text-[11px]">Laufende Fälle:</span>
            <div
              className={`font-extrabold text-sm ${
                openCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-500"
              }`}
            >
              {openCount} in Bearbeitung
            </div>
          </div>
        </div>
      )}

      {/* Claims List */}
      {contractClaims.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Bisher keine Schadensfälle erfasst
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Wenn ein Schaden eintritt, kannst du hier die Schadensnummer,
            geforderten Betrag und den Regulierungsstatus festhalten.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contractClaims.map((claim) => {
            const statusMeta = STATUS_CONFIG[claim.status] || STATUS_CONFIG.reported;
            const StatusIcon = statusMeta.icon;

            return (
              <div
                key={claim.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {claim.title}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>Schaden: {formatDateDE(claim.incident_date)}</span>
                      <span>•</span>
                      <span>Gemeldet: {formatDateDE(claim.reported_date)}</span>
                      {claim.claim_number && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {claim.claim_number}
                            <button
                              type="button"
                              onClick={() => copyClaimNumber(claim.claim_number!)}
                              title="Schadensnummer kopieren"
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditClaimModal(claim)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Schaden bearbeiten"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteClaim(claim.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Schaden löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amounts Breakdown */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  {claim.claimed_amount !== undefined && (
                    <div>
                      <span className="text-slate-500">Gefordert: </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatEuro(claim.claimed_amount)}
                      </strong>
                    </div>
                  )}

                  {claim.settled_amount !== undefined && (
                    <div>
                      <span className="text-slate-500">Erstattet: </span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {formatEuro(claim.settled_amount)}
                      </strong>
                    </div>
                  )}

                  {claim.deductible_applied !== undefined && claim.deductible_applied > 0 && (
                    <div>
                      <span className="text-slate-500">SB abgezogen: </span>
                      <strong className="text-amber-600 dark:text-amber-400">
                        {formatEuro(claim.deductible_applied)}
                      </strong>
                    </div>
                  )}
                </div>

                {claim.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-0.5 leading-relaxed">
                    {claim.description}
                  </p>
                )}

                {claim.notes && (
                  <div className="text-[11px] bg-slate-50 dark:bg-slate-950 p-2 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                    <strong className="text-slate-700 dark:text-slate-300">Notiz: </strong>
                    {claim.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / New Claim Modal */}
      <NativeDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClaim ? "Schadensfall bearbeiten" : "Neuen Schadensfall erfassen"}
        subtitle={`Vertrag: ${contract.title}`}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor={titleId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bezeichnung des Schadens *
            </label>
            <input
              id={titleId}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Steinschlag Windschutzscheibe / Fahrradklau am Bahnhof"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={incDateId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Schadensdatum
              </label>
              <input
                id={incDateId}
                type="date"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={repDateId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gemeldet am
              </label>
              <input
                id={repDateId}
                type="date"
                required
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={claimNumId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Schadensnummer / Aktenzeichen
              </label>
              <input
                id={claimNumId}
                type="text"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                placeholder="z. B. HUK-2026-99120"
                className="w-full font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClaimStatus)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="reported">Gemeldet (Warten auf Rückmeldung)</option>
                <option value="under_review">In Prüfung / Unterlagen eingereicht</option>
                <option value="settled">Reguliert (Erstattung erfolgt)</option>
                <option value="rejected">Abgelehnt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor={claimedAmtId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Geforderte Summe (€)
              </label>
              <input
                id={claimedAmtId}
                type="number"
                step="0.01"
                min="0"
                value={claimedAmount}
                onChange={(e) => setClaimedAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={settledAmtId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Erstattete Summe (€)
              </label>
              <input
                id={settledAmtId}
                type="number"
                step="0.01"
                min="0"
                value={settledAmount}
                onChange={(e) => setSettledAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={deductibleId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                SB abgezogen (€)
              </label>
              <input
                id={deductibleId}
                type="number"
                step="0.01"
                min="0"
                value={deductibleApplied}
                onChange={(e) => setDeductibleApplied(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Beschreibung des Vorfalls
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was ist genau passiert? Ort, Hergang..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Notizen / Stand der Bearbeitung
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z. B. Kostenvoranschlag am 15.08. eingereicht, Gutachter bestellt..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {editingClaim ? "Änderungen speichern" : "Schaden erfassen"}
            </button>
          </div>
        </form>
      </NativeDialog>
    </div>
  );
}
