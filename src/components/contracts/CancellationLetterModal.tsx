"use client";

import React, { useId, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  FileSignature,
  Mail,
  Printer,
  ShieldAlert,
} from "lucide-react";
import { useHub } from "@/context/HubContext";
import { NativeDialog } from "@/components/ui/NativeDialog";
import { formatDateDE } from "@/lib/calculations";

type CancellationType = "ordinary" | "price_increase" | "claim" | "revocation";

export function CancellationLetterModal() {
  const {
    cancellationModalContractId,
    closeCancellationModal,
    contracts,
    providers,
    members,
    showToast,
  } = useHub();

  const contract = contracts.find((c) => c.id === cancellationModalContractId);
  const provider = providers.find((p) => p.id === contract?.provider_id);
  const holder = members.find((m) => m.id === contract?.policy_holder_id);

  const [cancellationType, setCancellationType] =
    useState<CancellationType>("ordinary");
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [revokeSepa, setRevokeSepa] = useState(true);
  const [demandConfirmation, setDemandConfirmation] = useState(true);
  const [prohibitAdvertising, setProhibitAdvertising] = useState(true);
  const [customReason, setCustomReason] = useState("");

  const senderId = useId();
  const addressId = useId();
  const customReasonId = useId();

  // Reset or initialize values when modal opens
  React.useEffect(() => {
    if (contract) {
      setSenderName(holder?.first_name ? `${holder.first_name} Muster` : "Max Mustermann");
      setSenderAddress("Musterstraße 12\n12345 Musterstadt");
      setCancellationType("ordinary");
      setRevokeSepa(true);
      setDemandConfirmation(true);
      setProhibitAdvertising(true);
      setCustomReason("");
    }
  }, [contract, holder]);

  const effectiveSender = senderName.trim() || holder?.first_name || "Versicherungsnehmer";

  const letterData = useMemo(() => {
    if (!contract) return null;

    const todayStr = formatDateDE(new Date().toISOString().split("T")[0]);
    const policyNum = contract.policy_number || "Nicht hinterlegt (siehe Kundendaten)";
    const endDateStr = contract.contract_end_date
      ? formatDateDE(contract.contract_end_date)
      : null;

    let subject = "";
    let mainParagraph = "";
    let legalHint = "";

    switch (cancellationType) {
      case "price_increase":
        subject = `Sonderkündigung wegen Beitragsanpassung – Vertrag: ${contract.title} (Nr. ${policyNum})`;
        mainParagraph = `hiermit kündige ich den oben genannten Vertrag „${contract.title}“ (Policen-/Vertragsnummer: ${policyNum}) von meinem gesetzlichen Sonderkündigungsrecht gem. § 40 Versicherungsvertragsgesetz (VVG) bzw. den geltenden Vertragsbedingungen Gebrauch machend zum Zeitpunkt des Wirksamwerdens der angekündigten Beitragserhöhung.`;
        legalHint = "Rechtlicher Hinweis: Die Kündigung muss dem Versicherer innerhalb eines Monats nach Zugang der Erhöhungsmitteilung zugehen.";
        break;

      case "claim":
        subject = `Sonderkündigung nach Schadensfall – Vertrag: ${contract.title} (Nr. ${policyNum})`;
        mainParagraph = `hiermit kündige ich den oben genannten Vertrag „${contract.title}“ (Policen-/Vertragsnummer: ${policyNum}) von meinem außerordentlichen Kündigungsrecht nach Schadensfall gem. § 92 VVG Gebrauch machend mit sofortiger Wirkung, hilfsweise zum nächstmöglichen Zeitpunkt.`;
        legalHint = "Rechtlicher Hinweis: Die Kündigung ist bis zum Ablauf eines Monats seit dem Abschluss der Verhandlungen über die Entschädigung zulässig.";
        break;

      case "revocation":
        subject = `Widerruf der Vertragserklärung – Vertrag: ${contract.title} (Nr. ${policyNum})`;
        mainParagraph = `hiermit widerrufe ich meine Vertragserklärung zum oben genannten Vertrag „${contract.title}“ (Policen-/Vertragsnummer: ${policyNum}) fristgerecht gem. § 8 VVG / Fernabsatzrecht.`;
        legalHint = "Rechtlicher Hinweis: Gesetzliche Widerrufsfrist beträgt in der Regel 14 Tage (bei Lebensversicherungen 30 Tage) ab Erhalt der Unterlagen.";
        break;

      case "ordinary":
      default:
        subject = `Kündigung Vertrag: ${contract.title} (Policen-/Vertrags-Nr. ${policyNum})`;
        mainParagraph = endDateStr
          ? `hiermit kündige ich den oben genannten Vertrag „${contract.title}“ (Policen-/Vertragsnummer: ${policyNum}) ordentlich und fristgerecht zum Ablauf am ${endDateStr}, hilfsweise zum nächstmöglichen Zeitpunkt.`
          : `hiermit kündige ich den oben genannten Vertrag „${contract.title}“ (Policen-/Vertragsnummer: ${policyNum}) ordentlich und fristgerecht zum nächstmöglichen Termin.`;
        legalHint = "Ordentliche Kündigung unter Berücksichtigung der vertraglichen Kündigungsfrist.";
        break;
    }

    const clauses: string[] = [];
    if (customReason.trim()) {
      clauses.push(customReason.trim());
    }
    if (revokeSepa) {
      clauses.push(
        "Ein Ihnen erteiltes SEPA-Lastschriftmandat bzw. eine Einzugsermächtigung widerrufe ich hiermit ausdrücklich zum Wirksamwerden der Kündigung."
      );
    }
    if (prohibitAdvertising) {
      clauses.push(
        "Bitte sehen Sie von telefonischen oder schriftlichen Rückgewinnungsversuchen oder Werbeangeboten ab (§ 7 UWG)."
      );
    }
    if (demandConfirmation) {
      clauses.push(
        "Bitte bestätigen Sie mir den Eingang dieser Kündigung sowie das konkrete Datum des Vertragsendes zeitnah schriftlich oder per E-Mail."
      );
    }

    const fullText = `${effectiveSender}\n${senderAddress}\n\nAn:\n${
      provider?.name || "Versicherungsgesellschaft / Anbieter"
    }\n${provider?.support_email ? `E-Mail: ${provider.support_email}\n` : ""}\nDatum: ${todayStr}\n\nBetreff: ${subject}\n\nSehr geehrte Damen und Herren,\n\n${mainParagraph}\n\n${clauses.join(
      "\n\n"
    )}\n\nMit freundlichen Grüßen\n\n${effectiveSender}`;

    return {
      subject,
      mainParagraph,
      legalHint,
      fullText,
    };
  }, [
    contract,
    provider,
    effectiveSender,
    senderAddress,
    cancellationType,
    revokeSepa,
    demandConfirmation,
    prohibitAdvertising,
    customReason,
  ]);

  if (!contract || !letterData) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(letterData.fullText);
    showToast("Kündigungsschreiben in die Zwischenablage kopiert");
  };

  const downloadAsTxt = () => {
    const filename = `Kuendigung_${contract.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
    const blob = new Blob([letterData.fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Datei „${filename}“ heruntergeladen`);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Druckfenster konnte nicht geöffnet werden (Popup-Blocker)");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kündigungsschreiben - ${contract.title}</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              padding: 2.5cm;
              color: #111;
            }
            .header { margin-bottom: 2cm; }
            .subject { font-weight: bold; margin-bottom: 1.5cm; }
            .content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="content">${letterData.fullText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <NativeDialog
      open={Boolean(cancellationModalContractId)}
      onClose={closeCancellationModal}
      title="Kündigungs-Assistent"
      subtitle={`Rechtssichere Kündigungsvorlage für „${contract.title}“ (${provider?.name || "Anbieter"})`}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Step 1: Type Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Anlass &amp; Kündigungsart wählen
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setCancellationType("ordinary")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                cancellationType === "ordinary"
                  ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="font-semibold text-xs sm:text-sm">Ordentlich</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Zum Ablauf der Kündigungsfrist
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCancellationType("price_increase")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                cancellationType === "price_increase"
                  ? "border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                <span>Preiserhöhung</span>
                <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-1 rounded">
                  § 40 VVG
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                1 Monat Sonderkündigungsrecht
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCancellationType("claim")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                cancellationType === "claim"
                  ? "border-rose-600 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                <span>Nach Schaden</span>
                <span className="text-[10px] font-bold bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 px-1 rounded">
                  § 92 VVG
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Nach Entschädigungsverhandlung
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCancellationType("revocation")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                cancellationType === "revocation"
                  ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                <span>Widerruf</span>
                <span className="text-[10px] font-bold bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 px-1 rounded">
                  § 8 VVG
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Binnen 14 Tagen ab Abschluss
              </div>
            </button>
          </div>

          {letterData.legalHint && (
            <div className="text-xs flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{letterData.legalHint}</span>
            </div>
          )}
        </div>

        {/* Step 2: Customization & Clauses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Absender-Angaben (Versicherungsnehmer)
            </label>
            <div className="space-y-2">
              <div>
                <label htmlFor={senderId} className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Name
                </label>
                <input
                  id={senderId}
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
                  placeholder="Vorname Nachname"
                />
              </div>
              <div>
                <label htmlFor={addressId} className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Adresse (Straße, PLZ, Ort)
                </label>
                <textarea
                  id={addressId}
                  rows={2}
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white"
                  placeholder="Musterstraße 12&#10;12345 Musterstadt"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Klauseln &amp; Zusätze
            </label>
            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeSepa}
                  onChange={(e) => setRevokeSepa(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <strong>SEPA-Lastschriftmandat widerrufen:</strong> Verhindert weitere unberechtigte Abbuchungen nach Vertragsende.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demandConfirmation}
                  onChange={(e) => setDemandConfirmation(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <strong>Schriftliche Kündigungsbestätigung anfordern:</strong> Mit konkretem Beendigungszeitpunkt.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prohibitAdvertising}
                  onChange={(e) => setProhibitAdvertising(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <strong>Werbe- &amp; Rückgewinnungsverbot (§ 7 UWG):</strong> Keine belästigenden Verkaufs- oder Überredungsanrufe.
                </span>
              </label>

              <div className="pt-1">
                <label htmlFor={customReasonId} className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Optionaler Zusatztext / Individuelle Begründung:
                </label>
                <input
                  id={customReasonId}
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="z. B. Kfz wurde verkauft / Umzug ins Ausland / etc."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-blue-600" />
              Live-Vorschau des Kündigungsschreibens
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              DIN 5008 konform
            </span>
          </div>

          <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 p-4 text-xs font-sans text-slate-800 dark:text-slate-200 leading-relaxed max-h-64 overflow-y-auto selection:bg-blue-200 dark:selection:bg-blue-900">
            {letterData.fullText}
          </pre>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Text kopieren
            </button>

            {provider?.support_email && (
              <a
                href={`mailto:${provider.support_email}?subject=${encodeURIComponent(
                  letterData.subject
                )}&body=${encodeURIComponent(letterData.fullText)}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                Als E-Mail an {provider.support_email}
              </a>
            )}

            <button
              type="button"
              onClick={downloadAsTxt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Als .txt Datei
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Drucken / PDF
            </button>
          </div>

          <button
            type="button"
            onClick={closeCancellationModal}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </NativeDialog>
  );
}
