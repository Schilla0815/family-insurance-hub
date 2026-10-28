export type UserRole = "admin" | "member";

export interface UserAccount {
  id: string;
  username: string; // Kleinbuchstaben, eindeutig
  displayName: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string; // ISO
  lastLoginAt?: string; // ISO
}

export type ContractType = "insurance" | "subscription";

export type PriorityTier = "muss" | "empfohlen" | "kann";

export type BillingCycle = "monthly" | "quarterly" | "semi_annual" | "annual";

export type ContractStatus = "active" | "paused" | "cancelled";

export type EmergencyGroup =
  | "kfz"
  | "reise_gesundheit"
  | "haus_wohnen"
  | "haftpflicht_recht"
  | "sonstige";

export type TrafficLightState = "green" | "yellow" | "red" | "none";

export type ClaimStatus = "reported" | "under_review" | "settled" | "rejected";

export interface InsuranceClaim {
  id: string;
  contract_id: string;
  title: string;
  incident_date: string; // YYYY-MM-DD
  reported_date: string; // YYYY-MM-DD
  claim_number?: string; // Schadensnummer / Aktenzeichen der Versicherung
  status: ClaimStatus;
  claimed_amount?: number; // Geforderte Summe in €
  settled_amount?: number; // Regulierte / erstattete Summe in €
  deductible_applied?: number; // Selbstbeteiligung in €
  description?: string;
  notes?: string;
  paperless_doc_ids?: number[];
}

export interface Member {
  id: string;
  first_name: string;
  role: string;
  birth_date: string; // YYYY-MM-DD
  avatar_color: string;
  avatar_emoji: string;
  notes?: string;
}

export interface InsurerProvider {
  id: string;
  name: string;
  portal_url?: string;
  emergency_hotline?: string;
  support_email?: string;
  paperless_correspondent_id?: number;
  paperless_correspondent_name?: string;
  category_focus?: ContractType;
}

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  type: ContractType;
  priority_tier?: PriorityTier;
  consumer_tip?: string;
  group_label: string; // Thematische Gruppe, z. B. "Haus, Wohnen & Haftung"
  description: string;
  icon_name: string;
  is_visible: boolean; // Per Ankreuzen (Checkbox) frei ein- und ausblendbar
  sort_order: number;
}

export interface Contract {
  id: string;
  title: string;
  type: ContractType;
  category_slug: string;
  priority_override?: PriorityTier | "";
  is_hidden: boolean; // Einzelnen Vertrag per Checkbox/Toggle ein-/ausblenden
  provider_id: string;
  policy_holder_id: string;
  insured_member_ids: string[];
  policy_number: string; // Gleichzeitig Matching-Key für paperless-ngx
  paperless_tag?: string; // Spezifisches Tag in paperless-ngx
  paperless_custom_query?: string; // Optionaler Suchbegriff für paperless-ngx
  paperless_document_id?: number; // Fest verknüpftes Hauptdokument (gepinnte ID aus paperless-ngx)
  paperless_document_title?: string; // Titel des fest verknüpften Dokuments (zur schnellen Offline-/Cache-Anzeige)
  cost: number;
  billing_cycle: BillingCycle;
  next_payment_date: string; // YYYY-MM-DD
  deductible?: number; // Selbstbeteiligung in €
  coverage_amount?: string; // Deckungssumme
  cancellation_period_days?: number; // Kündigungsfrist in Tagen
  contract_end_date?: string; // YYYY-MM-DD
  status: ContractStatus;
  emergency_group?: EmergencyGroup;
  payment_method?: string;
  notes?: string;
}

export interface PaperlessDocument {
  id: number;
  title: string;
  created: string; // YYYY-MM-DD
  added: string;
  correspondent_name?: string;
  document_type_name?: string;
  tags: string[];
  archive_serial_number?: number | null;
  policy_number_matched?: string;
  page_count?: number;
  file_size_kb?: number;
  summary_excerpt?: string;
  is_demo?: boolean;
}

export interface PaperlessConfig {
  url: string;
  publicUrl: string;
  token: string;
  autoMatchByPolicyNumber: boolean;
  autoMatchByTag: boolean;
  autoMatchByCorrespondent: boolean;
}

export interface CancellationInfo {
  state: TrafficLightState;
  daysUntilNoticeDeadline: number | null;
  noticeDeadlineDate: string | null;
  daysUntilContractEnd: number | null;
  label: string;
  shortLabel: string;
}

export type MilestoneStatus = "action_needed" | "covered" | "dismissed";

export interface FamilyMilestone {
  id: string; // e.g. "kfo_dental-mem_mia"
  template_key: string;
  member_id: string;
  target_age: number;
  current_age: number;
  due_date: string; // YYYY-MM-DD
  months_until_due: number;
  title: string;
  category_name: string;
  category_slug?: string;
  icon_name: string;
  description: string;
  recommendation: string;
  status: MilestoneStatus;
  linked_contract_id?: string;
  custom_notes?: string;
  is_custom_override?: boolean;
}

export interface MilestoneOverride {
  id: string;
  status?: MilestoneStatus;
  linked_contract_id?: string;
  custom_notes?: string;
  custom_target_age?: number;
}

export type TaxDeductibleCategory =
  | "health_basic"
  | "liability"
  | "disability_life_accident"
  | "health_supplementary"
  | "income_related_expense"
  | "non_deductible";

export interface TaxReportItem {
  contract: Contract;
  taxCategory: TaxDeductibleCategory;
  categoryLabel: string;
  elsterLineHint: string;
  annualPaid: number;
  deductibleShareText: string;
  policyHolderName: string;
}

export interface TaxReportGroup {
  category: TaxDeductibleCategory;
  title: string;
  elsterLine: string;
  description: string;
  items: TaxReportItem[];
  totalAnnual: number;
}
