import {
  BillingCycle,
  CancellationInfo,
  CatalogCategory,
  Contract,
  FamilyMilestone,
  InsurerProvider,
  Member,
  MilestoneOverride,
  MilestoneStatus,
  PriorityTier,
  TaxDeductibleCategory,
  TaxReportGroup,
  TaxReportItem,
} from "@/types/models";

export function getMonthlyCost(cost: number, cycle: BillingCycle): number {
  if (!cost || cost <= 0) return 0;
  switch (cycle) {
    case "monthly":
      return cost;
    case "quarterly":
      return cost / 3;
    case "semi_annual":
      return cost / 6;
    case "annual":
      return cost / 12;
    default:
      return cost;
  }
}

export function getAnnualCost(cost: number, cycle: BillingCycle): number {
  if (!cost || cost <= 0) return 0;
  switch (cycle) {
    case "monthly":
      return cost * 12;
    case "quarterly":
      return cost * 4;
    case "semi_annual":
      return cost * 2;
    case "annual":
      return cost;
    default:
      return cost * 12;
  }
}

export function getBillingCycleLabel(cycle: BillingCycle): string {
  switch (cycle) {
    case "monthly":
      return "Monatlich";
    case "quarterly":
      return "Vierteljährlich";
    case "semi_annual":
      return "Halbjährlich";
    case "annual":
      return "Jährlich";
  }
}

export function getBillingCycleShort(cycle: BillingCycle): string {
  switch (cycle) {
    case "monthly":
      return "/ Monat";
    case "quarterly":
      return "/ Quartal";
    case "semi_annual":
      return "/ Halbjahr";
    case "annual":
      return "/ Jahr";
  }
}

export function formatEuro(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatDateDE(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function getPriorityMeta(tier: PriorityTier): {
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotColor: string;
} {
  switch (tier) {
    case "muss":
      return {
        label: "MUSS",
        shortLabel: "MUSS",
        badgeClass:
          "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        dotColor: "bg-rose-500",
      };
    case "empfohlen":
      return {
        label: "Empfohlen",
        shortLabel: "Empfohlen",
        badgeClass:
          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        dotColor: "bg-amber-500",
      };
    case "kann":
    default:
      return {
        label: "KANN",
        shortLabel: "KANN",
        badgeClass:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        dotColor: "bg-emerald-500",
      };
  }
}

export function getEffectivePriority(
  contract: Contract,
  categoriesMap: Map<string, CatalogCategory>
): PriorityTier {
  if (contract.priority_override) {
    return contract.priority_override;
  }
  const cat = categoriesMap.get(contract.category_slug);
  return cat?.priority_tier || "kann";
}

export function getCancellationInfo(
  contract: Contract,
  referenceDate: Date = new Date()
): CancellationInfo {
  if (!contract.contract_end_date || contract.status === "cancelled") {
    return {
      state: "none",
      daysUntilNoticeDeadline: null,
      noticeDeadlineDate: null,
      daysUntilContractEnd: null,
      label:
        contract.cancellation_period_days && contract.cancellation_period_days <= 1
          ? "Täglich / monatlich kündbar"
          : "Laufend (monatlich kündbar)",
      shortLabel: "Flexibel",
    };
  }

  const endDate = new Date(contract.contract_end_date + "T00:00:00");
  if (Number.isNaN(endDate.getTime())) {
    return {
      state: "none",
      daysUntilNoticeDeadline: null,
      noticeDeadlineDate: null,
      daysUntilContractEnd: null,
      label: "Kein Stichtag",
      shortLabel: "—",
    };
  }

  const noticeDays = contract.cancellation_period_days ?? 30;
  const deadline = new Date(endDate);
  deadline.setDate(deadline.getDate() - noticeDays);

  const todayMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - todayMidnight.getTime()) / msPerDay
  );
  const daysUntilEnd = Math.ceil(
    (endDate.getTime() - todayMidnight.getTime()) / msPerDay
  );

  const deadlineIso = deadline.toISOString().slice(0, 10);

  if (daysUntilDeadline < 0) {
    return {
      state: "red",
      daysUntilNoticeDeadline: daysUntilDeadline,
      noticeDeadlineDate: deadlineIso,
      daysUntilContractEnd: daysUntilEnd,
      label: `Frist vor ${Math.abs(daysUntilDeadline)} Tagen abgelaufen (${formatDateDE(deadlineIso)})`,
      shortLabel: "Frist vorbei",
    };
  }

  if (daysUntilDeadline <= 30) {
    return {
      state: "red",
      daysUntilNoticeDeadline: daysUntilDeadline,
      noticeDeadlineDate: deadlineIso,
      daysUntilContractEnd: daysUntilEnd,
      label: `Kündigungsfrist in ${daysUntilDeadline} Tagen (${formatDateDE(deadlineIso)})`,
      shortLabel: `${daysUntilDeadline} Tage`,
    };
  }

  if (daysUntilDeadline <= 60) {
    return {
      state: "yellow",
      daysUntilNoticeDeadline: daysUntilDeadline,
      noticeDeadlineDate: deadlineIso,
      daysUntilContractEnd: daysUntilEnd,
      label: `Kündigungsfrist in ${daysUntilDeadline} Tagen (${formatDateDE(deadlineIso)})`,
      shortLabel: `${daysUntilDeadline} Tage`,
    };
  }

  return {
    state: "green",
    daysUntilNoticeDeadline: daysUntilDeadline,
    noticeDeadlineDate: deadlineIso,
    daysUntilContractEnd: daysUntilEnd,
    label: `Stichtag am ${formatDateDE(deadlineIso)} (noch ${daysUntilDeadline} Tage)`,
    shortLabel: `${daysUntilDeadline} Tage`,
  };
}

export interface MonthlyCashflowBucket {
  monthIndex: number; // 0..11
  label: string; // "Jan", "Feb", ...
  insuranceAmount: number;
  subscriptionAmount: number;
  totalAmount: number;
  highlightContracts: string[];
}

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

/**
 * Berechnet die tatsächlichen Abbuchungsbeträge pro Kalendermonat (inkl. Quartals-, Halbjahres- und Jahrespolicen)
 */
export function getYearlyCashflowForecast(
  contracts: Contract[]
): MonthlyCashflowBucket[] {
  const buckets: MonthlyCashflowBucket[] = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i,
    label: MONTH_NAMES_SHORT[i],
    insuranceAmount: 0,
    subscriptionAmount: 0,
    totalAmount: 0,
    highlightContracts: [],
  }));

  for (const c of contracts) {
    if (c.status !== "active" || !c.cost || c.cost <= 0) continue;

    const anchorMonth = c.next_payment_date
      ? new Date(c.next_payment_date + "T00:00:00").getMonth()
      : 0;
    const baseMonth = Number.isNaN(anchorMonth) ? 0 : anchorMonth;

    for (let m = 0; m < 12; m++) {
      let due = false;
      if (c.billing_cycle === "monthly") {
        due = true;
      } else if (c.billing_cycle === "quarterly") {
        due = (m - baseMonth + 12) % 3 === 0;
      } else if (c.billing_cycle === "semi_annual") {
        due = (m - baseMonth + 12) % 6 === 0;
      } else if (c.billing_cycle === "annual") {
        due = m === baseMonth;
      }

      if (due) {
        if (c.type === "insurance") {
          buckets[m].insuranceAmount += c.cost;
        } else {
          buckets[m].subscriptionAmount += c.cost;
        }
        buckets[m].totalAmount += c.cost;
        if (c.billing_cycle !== "monthly") {
          buckets[m].highlightContracts.push(c.title);
        }
      }
    }
  }

  return buckets;
}

// =========================================================================
// FAMILIEN-MEILENSTEIN-RADAR (ALPERSGRENZEN & EMPFEHLUNGEN)
// =========================================================================

interface MilestoneTemplate {
  key: string;
  targetAge: number;
  title: string;
  categoryName: string;
  categorySlug: string;
  iconName: string;
  description: string;
  recommendation: string;
  applicableRole?: "child" | "all";
}

export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    key: "kfo_dental",
    targetAge: 8,
    title: "Kieferorthopädie & Zahnzusatz-Früherkennung",
    categoryName: "Zahnzusatz & KFO",
    categorySlug: "zahnzusatz",
    iconName: "Sparkles",
    description:
      "Fast jedes 2. Kind benötigt eine Zahnspange. Gesetzliche Krankenkassen leisten bei leichten/mittleren Fehlstellungen (KIG 1-2) gar nicht und bei KIG 3-5 nur für Standard-Kassenversorgung.",
    recommendation:
      "Zahnzusatzversicherung mit KFO-Leistung (KIG 1-5, mind. 80-90 % Erstattung) abschließen, BEVOR der Zahnarzt eine Fehlstellung in die Patientenakte einträgt.",
    applicableRole: "child",
  },
  {
    key: "school_disability",
    targetAge: 6,
    title: "Schuleintritt: Kinderinvalidität & Schulunfähigkeit",
    categoryName: "Existenzschutz Kinder",
    categorySlug: "kinderunfall",
    iconName: "ShieldAlert",
    description:
      "Kinder haben vor dem Berufsleben keinen staatlichen Erwerbsminderungsschutz. Über 90 % dauerhafter Behinderungen bei Kindern entstehen durch schwere Krankheiten (Krebs, Diabetes, Infektionen), nicht durch Unfälle.",
    recommendation:
      "Echte Kinderinvaliditäts- oder Schulunfähigkeitsversicherung abschließen (idealerweise mit späterer BU-Optionsgarantie ohne erneute Gesundheitsprüfung).",
    applicableRole: "child",
  },
  {
    key: "scooter_mobility",
    targetAge: 15,
    title: "Mofa / Roller / E-Scooter Versicherungskennzeichen",
    categoryName: "Mobilität & Kfz",
    categorySlug: "kfz_haftpflicht",
    iconName: "Car",
    description:
      "Mit 14-16 Jahren dürfen Jugendliche E-Scooter und Mofas (Führerschein AM) im Straßenverkehr führen. Kraftfahrzeuge sind gesetzlich nicht über die Privathaftpflicht der Eltern versichert.",
    recommendation:
      "Eigenes Versicherungskennzeichen / Moped-Haftpflichtplakette (ca. 30–50 €/Jahr) vor Fahrtantritt besorgen.",
    applicableRole: "child",
  },
  {
    key: "adulthood_liability",
    targetAge: 18,
    title: "Volljährigkeit: Eigene Haftpflicht & Kfz-Fahrerkreis",
    categoryName: "Recht & Haftpflicht",
    categorySlug: "privathaftpflicht",
    iconName: "Scale",
    description:
      "Mit 18 Jahren endet die automatische Mitversicherung in der Familienhaftpflicht, sobald die Erstausbildung (Schule/Lehre/Bachelor) beendet oder unterbrochen wird. Zudem: Fährt das Kind Familienautos?",
    recommendation:
      "1. Fahrerkreis in der Kfz-Versicherung auf 'Fahrer unter 25' erweitern (unbedingt vor Begleitetem Fahren ab 17 melden!). 2. Status in Familienhaftpflicht prüfen.",
    applicableRole: "child",
  },
  {
    key: "bu_start",
    targetAge: 21,
    title: "Ausbildungs- & Berufsstart: Eigene Berufsunfähigkeit (BU)",
    categoryName: "Einkommensschutz",
    categorySlug: "berufsunfaehigkeit",
    iconName: "BriefcaseMedical",
    description:
      "Der gesetzliche Staatsschutz (Erwerbsminderungsrente) reicht bei Berufsstartern kaum zum Überleben. Jeder 4. wird im Laufe des Arbeitslebens berufsunfähig.",
    recommendation:
      "Eigene BU-Versicherung abschließen: In jungen Jahren sind die Beiträge dauerhaft am günstigsten und es gibt noch keine Ausschlüsse wegen Vorerkrankungen.",
    applicableRole: "all",
  },
  {
    key: "family_health_exit",
    targetAge: 25,
    title: "25. Geburtstag: Ende der Familienkrankenversicherung",
    categoryName: "Krankenversicherung & Kindergeld",
    categorySlug: "kranken_pflege",
    iconName: "HeartPulse",
    description:
      "Mit Vollendung des 25. Lebensjahres endet die beitragsfreie Mitversicherung in der gesetzlichen Krankenkasse (GKV) der Eltern und der Anspruch auf Kindergeld.",
    recommendation:
      "Rechtzeitig (2 Monate vor dem 25. Geburtstag) eigene studentische oder freiwillige Krankenversicherung bei der Krankenkasse anmelden.",
    applicableRole: "child",
  },
];

/**
 * Berechnet das Alter in Jahren basierend auf einem Geburtsdatum
 */
export function calculateAge(birthDateStr: string, refDate = new Date()): number {
  const birth = new Date(birthDateStr);
  if (Number.isNaN(birth.getTime())) return 0;
  let age = refDate.getFullYear() - birth.getFullYear();
  const m = refDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Erzeugt dynamische Familien-Meilensteine für alle Familienmitglieder,
 * matcht aktive Verträge im Haushalt und wendet Nutzer-Overrides an.
 */
export function buildFamilyMilestones(
  members: Member[],
  contracts: Contract[],
  overrides: Record<string, MilestoneOverride> = {},
  refDate = new Date()
): FamilyMilestone[] {
  const milestones: FamilyMilestone[] = [];
  const activeContracts = contracts.filter((c) => c.status === "active");

  for (const member of members) {
    if (!member.birth_date) continue;
    const birthDate = new Date(member.birth_date);
    if (Number.isNaN(birthDate.getTime())) continue;

    const currentAge = calculateAge(member.birth_date, refDate);
    const isChild =
      member.role.toLowerCase().includes("kind") ||
      member.role.toLowerCase().includes("schüler") ||
      currentAge < 25;

    for (const tpl of MILESTONE_TEMPLATES) {
      if (tpl.applicableRole === "child" && !isChild) {
        continue;
      }

      const milestoneId = `${tpl.key}-${member.id}`;
      const userOverride = overrides[milestoneId];

      const targetAge = userOverride?.custom_target_age ?? tpl.targetAge;

      // Calculate exact due date (Birth date + targetAge years)
      const dueDateObj = new Date(birthDate);
      dueDateObj.setFullYear(birthDate.getFullYear() + targetAge);
      const dueDateIso = dueDateObj.toISOString().split("T")[0];

      // Calculate months until due
      const monthsUntilDue = Math.round(
        (dueDateObj.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
      );

      // Check if an existing active contract matches this category & member
      const matchingContract = activeContracts.find((c) => {
        if (c.category_slug !== tpl.categorySlug) return false;
        const isHolder = c.policy_holder_id === member.id;
        const isInsured = c.insured_member_ids.includes(member.id);
        return isHolder || isInsured;
      });

      // Default status logic
      let defaultStatus: MilestoneStatus = "action_needed";
      let linkedContractId = matchingContract?.id;

      if (matchingContract) {
        defaultStatus = "covered";
      }

      // Apply user overrides
      const finalStatus = userOverride?.status ?? defaultStatus;
      const finalLinkedContract = userOverride?.linked_contract_id !== undefined
        ? userOverride.linked_contract_id
        : linkedContractId;

      milestones.push({
        id: milestoneId,
        template_key: tpl.key,
        member_id: member.id,
        target_age: targetAge,
        current_age: currentAge,
        due_date: dueDateIso,
        months_until_due: monthsUntilDue,
        title: `${tpl.title} (${member.first_name})`,
        category_name: tpl.categoryName,
        category_slug: tpl.categorySlug,
        icon_name: tpl.iconName,
        description: tpl.description,
        recommendation: tpl.recommendation,
        status: finalStatus,
        linked_contract_id: finalLinkedContract || undefined,
        custom_notes: userOverride?.custom_notes,
        is_custom_override: Boolean(userOverride),
      });
    }
  }

  // Sort: First "action_needed" by closest due date / age, then "covered", then "dismissed"
  return milestones.sort((a, b) => {
    const statusWeight: Record<MilestoneStatus, number> = {
      action_needed: 1,
      covered: 2,
      dismissed: 3,
    };
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    return a.months_until_due - b.months_until_due;
  });
}

// =========================================================================
// ICAL / WEBCAL KALENDER GENERATOR (RFC 5545)
// =========================================================================

function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/[-:]/g, "");
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateIcsCalendar(
  contracts: Contract[],
  providers: InsurerProvider[] = [],
  hubTitle = "Family Insurance & Subscription Hub"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Family Insurance Hub//DE",
    `X-WR-CALNAME:${escapeIcsText(hubTitle)}`,
    "X-WR-TIMEZONE:Europe/Berlin",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  for (const c of contracts) {
    if (c.status !== "active") continue;
    const prov = providers.find((p) => p.id === c.provider_id);
    const provName = prov?.name || "Versicherung / Anbieter";
    const hotline = prov?.emergency_hotline ? `Hotline: ${prov.emergency_hotline}` : "";
    const policy = c.policy_number ? `Policen-Nr: ${c.policy_number}` : "";

    // 1. Kündigungsfrist Deadline Event
    if (c.contract_end_date) {
      const cancellation = getCancellationInfo(c);
      if (cancellation.noticeDeadlineDate) {
        const dt = formatIcsDate(cancellation.noticeDeadlineDate);
        lines.push(
          "BEGIN:VEVENT",
          `UID:cancel-deadline-${c.id}@familyhub`,
          `DTSTAMP:${now}`,
          `DTSTART;VALUE=DATE:${dt}`,
          `DTEND;VALUE=DATE:${dt}`,
          `SUMMARY:${escapeIcsText(`⚠️ Kündigungsfrist: ${c.title} (${provName})`)}`,
          `DESCRIPTION:${escapeIcsText(
            `Kündigungsfrist endet heute! ${c.cancellation_period_days ? `Kündigungsfrist: ${c.cancellation_period_days} Tage vor Ablauf.` : ""} ${policy}\n${hotline}`
          )}`,
          "STATUS:CONFIRMED",
          "TRANSP:TRANSPARENT",
          "BEGIN:VALARM",
          "TRIGGER:-P7D",
          "ACTION:DISPLAY",
          `DESCRIPTION:${escapeIcsText(`Erinnerung: Kündigungsfrist für ${c.title} in 7 Tagen`)}`,
          "END:VALARM",
          "END:VEVENT"
        );
      }

      // 2. Vertragsverlängerung / Hauptfälligkeit Event
      const endDt = formatIcsDate(c.contract_end_date);
      lines.push(
        "BEGIN:VEVENT",
        `UID:contract-end-${c.id}@familyhub`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${endDt}`,
        `DTEND;VALUE=DATE:${endDt}`,
        `SUMMARY:${escapeIcsText(`🔄 Hauptfälligkeit / Laufzeitende: ${c.title}`)}`,
        `DESCRIPTION:${escapeIcsText(
          `Vertragsverlängerung bzw. Stichtag von ${c.title} (${provName}). ${policy}`
        )}`,
        "STATUS:CONFIRMED",
        "TRANSP:TRANSPARENT",
        "END:VEVENT"
      );
    }

    // 3. Nächste Beitragszahlung Event
    if (c.next_payment_date && c.cost > 0) {
      const payDt = formatIcsDate(c.next_payment_date);
      lines.push(
        "BEGIN:VEVENT",
        `UID:payment-due-${c.id}-${payDt}@familyhub`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${payDt}`,
        `DTEND;VALUE=DATE:${payDt}`,
        `SUMMARY:${escapeIcsText(
          `💶 Beitragszahlung (${formatEuro(c.cost)}): ${c.title}`
        )}`,
        `DESCRIPTION:${escapeIcsText(
          `Fälliger Beitrag: ${formatEuro(c.cost)} (${getBillingCycleShort(c.billing_cycle)}). ${policy}\nZahlungsmethode: ${c.payment_method || "SEPA-Lastschrift"}`
        )}`,
        "STATUS:CONFIRMED",
        "TRANSP:TRANSPARENT",
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// =========================================================================
// STEUER-VORSORGEAUFWAND & EINKOMMENSTEUER-BERICHT (§ 10 EStG / ELSTER)
// =========================================================================

export function getTaxReportData(
  contracts: Contract[],
  members: Member[],
  categoriesMap: Map<string, CatalogCategory>,
  taxYear = new Date().getFullYear()
): {
  groups: TaxReportGroup[];
  totalDeductibleAnnual: number;
  totalNonDeductibleAnnual: number;
  totalIncomeRelatedAnnual: number;
} {
  const activeContracts = contracts.filter((c) => c.status === "active");

  const groupTemplates: Record<
    TaxDeductibleCategory,
    { title: string; elsterLine: string; description: string }
  > = {
    health_basic: {
      title: "1. Gesetzliche & private Kranken- und Pflege-Basisabsicherung",
      elsterLine: "Anlage Vorsorgeaufwand Zeile 11–16",
      description:
        "Voll abzugsfähig im Rahmen des Bürgerentlastungsgesetzes – ohne Kürzung durch Höchstbeträge.",
    },
    liability: {
      title: "2. Gesetzliche & private Haftpflichtversicherungen",
      elsterLine: "Anlage Vorsorgeaufwand Zeile 18",
      description:
        "Privathaftpflicht, Hundehaftpflicht sowie der reine Haftpflichtanteil der Kfz-Versicherung.",
    },
    disability_life_accident: {
      title: "3. Berufsunfähigkeit (BU), Risikoleben & Unfallversicherung",
      elsterLine: "Anlage Vorsorgeaufwand Zeile 20–22",
      description:
        "Sichert das Existenzrisiko bei Invalidität oder Tod der Hinterbliebenen ab (Sonstige Vorsorgeaufwendungen).",
    },
    health_supplementary: {
      title: "4. Krankenzusatz- & Auslandsreisekrankenversicherungen",
      elsterLine: "Anlage Vorsorgeaufwand Zeile 23–25",
      description:
        "Zahnzusatz, Wahlleistungen (Chefarzt, Einbettzimmer) und weltweite Auslandsreise-Krankenversicherungen.",
    },
    income_related_expense: {
      title: "5. Berufs-Rechtsschutz (Werbungskosten)",
      elsterLine: "Anlage N Zeile 46–48 (Werbungskosten)",
      description:
        "Der Arbeits- bzw. Berufsrechtsschutzanteil einer Rechtsschutzpolice ist als Werbungskosten absetzbar.",
    },
    non_deductible: {
      title: "6. Sachversicherungen & Lifestyle-Abos (Nicht absetzbar)",
      elsterLine: "Privat nicht absetzbar",
      description:
        "Sachversicherungen (Hausrat, Wohngebäude, Kfz-Kasko) schützen Vermögen/Sachen und sind privat nicht abzugsfähig.",
    },
  };

  const groupItemsMap = new Map<TaxDeductibleCategory, TaxReportItem[]>();
  for (const cat of Object.keys(groupTemplates) as TaxDeductibleCategory[]) {
    groupItemsMap.set(cat, []);
  }

  let totalDeductibleAnnual = 0;
  let totalNonDeductibleAnnual = 0;
  let totalIncomeRelatedAnnual = 0;

  for (const c of activeContracts) {
    const annual = getAnnualCost(c.cost, c.billing_cycle);
    const holder = members.find((m) => m.id === c.policy_holder_id);
    const holderName = holder ? `${holder.avatar_emoji} ${holder.first_name}` : "—";

    let taxCat: TaxDeductibleCategory = "non_deductible";
    let shareText = "Nicht absetzbar";
    let lineHint = "Nicht absetzbar";
    let catLabel = "Sachversicherung";

    if (c.category_slug === "kranken_pflege") {
      taxCat = "health_basic";
      catLabel = "Kranken- & Pflege-Basisabsicherung";
      lineHint = "Anlage Vorsorgeaufwand Zeile 11–16";
      shareText = "100 % voll abzugsfähig";
      totalDeductibleAnnual += annual;
    } else if (
      c.category_slug === "privathaftpflicht" ||
      c.category_slug === "tierhaftpflicht"
    ) {
      taxCat = "liability";
      catLabel = "Haftpflichtversicherung";
      lineHint = "Anlage Vorsorgeaufwand Zeile 18";
      shareText = "100 % absetzbar (im Höchstbetrag)";
      totalDeductibleAnnual += annual;
    } else if (c.category_slug === "kfz_haftpflicht") {
      taxCat = "liability";
      catLabel = "Kfz-Haftpflichtanteil";
      lineHint = "Anlage Vorsorgeaufwand Zeile 18";
      shareText = "Reiner Haftpflichtanteil (Kasko nicht absetzbar)";
      totalDeductibleAnnual += annual;
    } else if (
      c.category_slug === "berufsunfaehigkeit" ||
      c.category_slug === "risikoleben" ||
      c.category_slug === "kinderunfall" ||
      c.category_slug === "unfall_erwachsene" ||
      c.category_slug === "pflegezusatz"
    ) {
      taxCat = "disability_life_accident";
      catLabel = "BU, Lebens- & Unfallversicherung";
      lineHint = "Anlage Vorsorgeaufwand Zeile 20–22";
      shareText = "100 % absetzbar (im Höchstbetrag)";
      totalDeductibleAnnual += annual;
    } else if (
      c.category_slug === "zahnzusatz" ||
      c.category_slug === "krankenzusatz" ||
      c.category_slug === "auslandskranken"
    ) {
      taxCat = "health_supplementary";
      catLabel = "Krankenzusatzversicherung";
      lineHint = "Anlage Vorsorgeaufwand Zeile 23–25";
      shareText = "100 % absetzbar (im Höchstbetrag)";
      totalDeductibleAnnual += annual;
    } else if (c.category_slug === "rechtsschutz") {
      taxCat = "income_related_expense";
      catLabel = "Berufsrechtsschutz (Werbungskosten)";
      lineHint = "Anlage N (Werbungskosten)";
      shareText = "Berufs-Anteil (ca. 40–50 %) absetzbar";
      totalIncomeRelatedAnnual += annual;
    } else {
      taxCat = "non_deductible";
      catLabel = c.type === "insurance" ? "Sachversicherung" : "Abonnement";
      lineHint = "Privat nicht absetzbar";
      shareText = "Kein steuerlicher Sonderausgabenabzug";
      totalNonDeductibleAnnual += annual;
    }

    const item: TaxReportItem = {
      contract: c,
      taxCategory: taxCat,
      categoryLabel: catLabel,
      elsterLineHint: lineHint,
      annualPaid: annual,
      deductibleShareText: shareText,
      policyHolderName: holderName,
    };

    groupItemsMap.get(taxCat)?.push(item);
  }

  const groups: TaxReportGroup[] = (
    Object.keys(groupTemplates) as TaxDeductibleCategory[]
  ).map((cat) => {
    const items = groupItemsMap.get(cat) || [];
    const total = items.reduce((sum, it) => sum + it.annualPaid, 0);
    return {
      category: cat,
      title: groupTemplates[cat].title,
      elsterLine: groupTemplates[cat].elsterLine,
      description: groupTemplates[cat].description,
      items,
      totalAnnual: total,
    };
  });

  return {
    groups,
    totalDeductibleAnnual,
    totalNonDeductibleAnnual,
    totalIncomeRelatedAnnual,
  };
}

export function generateTaxCsv(
  reportData: ReturnType<typeof getTaxReportData>,
  taxYear = new Date().getFullYear()
): string {
  const header = [
    "Steuer-Kategorie",
    "Elster / WISO Zeile",
    "Vertragstitel",
    "Versicherungsnehmer",
    "Policennummer",
    `Gezahlter Jahresbeitrag ${taxYear} (EUR)`,
    "Abzugsfähigkeit",
  ];

  const rows: string[][] = [header];

  for (const grp of reportData.groups) {
    for (const it of grp.items) {
      rows.push([
        grp.title.replace(/^\d+\.\s*/, ""),
        grp.elsterLine,
        it.contract.title,
        it.policyHolderName.replace(/[^\w\säöüÄÖÜß-]/g, "").trim(),
        it.contract.policy_number || "Nicht hinterlegt",
        it.annualPaid.toFixed(2).replace(".", ","),
        it.deductibleShareText,
      ]);
    }
  }

  return rows
    .map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")
    )
    .join("\r\n");
}


