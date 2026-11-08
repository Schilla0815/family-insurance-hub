"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import PocketBase from "pocketbase";
import {
  CatalogCategory,
  Contract,
  ContractType,
  InsuranceClaim,
  InsurerProvider,
  Member,
  MilestoneOverride,
  PaperlessConfig,
  PaperlessDocument,
} from "@/types/models";
import {
  INITIAL_CATALOG_CATEGORIES,
  INITIAL_CLAIMS,
  INITIAL_CONTRACTS,
  INITIAL_MEMBERS,
  INITIAL_PROVIDERS,
} from "@/lib/seed-data";

const STORAGE_KEYS = {
  members: "fhub_members_v1",
  providers: "fhub_providers_v1",
  categories: "fhub_categories_v2",
  contracts: "fhub_contracts_v2",
  claims: "fhub_claims_v1",
  milestones: "fhub_milestone_overrides_v1",
  paperless: "fhub_paperless_cfg_v1",
};

const DEFAULT_PAPERLESS_CONFIG: PaperlessConfig = {
  url: process.env.NEXT_PUBLIC_PAPERLESS_PUBLIC_URL || "http://192.168.178.50:8000",
  publicUrl:
    process.env.NEXT_PUBLIC_PAPERLESS_PUBLIC_URL || "http://192.168.178.50:8000",
  token: "",
  autoMatchByPolicyNumber: true,
  autoMatchByTag: true,
  autoMatchByCorrespondent: true,
};

const CONTRACT_DEFAULT_SLUGS = new Set([
  "internet_festnetz",
  "mobilfunk",
  "rundfunkbeitrag",
  "energie_versorgung",
  "mobilitaet_oepnv",
  "sport_verein",
]);

function normalizeCategories(cats: CatalogCategory[]): CatalogCategory[] {
  return cats.map((cat) => {
    if (CONTRACT_DEFAULT_SLUGS.has(cat.slug) && cat.type === "subscription") {
      return { ...cat, type: "contract" as ContractType };
    }
    return cat;
  });
}

function normalizeContracts(cons: Contract[]): Contract[] {
  return cons.map((con) => {
    if (CONTRACT_DEFAULT_SLUGS.has(con.category_slug) && con.type === "subscription") {
      return { ...con, type: "contract" as ContractType };
    }
    return con;
  });
}

export interface PdfPreviewTarget {
  document: PaperlessDocument;
  contract?: Contract;
}

export interface ContractModalDraft {
  contract?: Contract;
  preselectedCategorySlug?: string;
  preselectedType?: ContractType;
}

interface HubContextValue {
  hydrated: boolean;
  pocketbaseConnected: boolean;
  pocketbaseUrl: string;
  members: Member[];
  providers: InsurerProvider[];
  categories: CatalogCategory[];
  categoriesMap: Map<string, CatalogCategory>;
  contracts: Contract[];
  claims: InsuranceClaim[];
  paperlessConfig: PaperlessConfig;

  // Global Filter State (for Family Member selection across views)
  selectedMemberId: string | "all";
  setSelectedMemberId: (id: string | "all") => void;

  // Visibility Controls (Ankreuzen / Ein- & Ausblenden)
  toggleCategoryVisibility: (slug: string) => void;
  setAllCategoriesVisibility: (
    visible: boolean,
    typeFilter?: ContractType
  ) => void;
  saveCategory: (
    category: Omit<CatalogCategory, "id"> & { id?: string }
  ) => CatalogCategory;
  deleteCategory: (slug: string) => void;
  toggleContractVisibility: (contractId: string) => void;

  // CRUD Operations
  saveContract: (contract: Omit<Contract, "id"> & { id?: string }) => Contract;
  deleteContract: (contractId: string) => void;
  saveClaim: (claim: Omit<InsuranceClaim, "id"> & { id?: string }) => InsuranceClaim;
  deleteClaim: (claimId: string) => void;

  // Family Milestones Radar Overrides
  milestoneOverrides: Record<string, MilestoneOverride>;
  saveMilestoneOverride: (
    milestoneId: string,
    override: Partial<MilestoneOverride>
  ) => void;
  resetMilestoneOverride: (milestoneId: string) => void;

  saveMember: (member: Omit<Member, "id"> & { id?: string }) => void;
  deleteMember: (memberId: string) => void;
  saveProvider: (
    provider: Omit<InsurerProvider, "id"> & { id?: string }
  ) => InsurerProvider;
  deleteProvider: (providerId: string) => void;
  updatePaperlessConfig: (cfg: Partial<PaperlessConfig>) => void;

  // Backup & Restore
  exportBackupJson: (includeSecrets?: boolean) => string;
  exportContractsCsv: () => string;
  downloadDatabaseBackup: (format?: "json" | "csv") => void;
  importBackupJson: (rawJson: string) => { ok: boolean; message: string };
  resetToDemoDefaults: () => void;
  clearAllData: () => void;

  // Global Modals & Drawers
  backupModalOpen: boolean;
  setBackupModalOpen: (open: boolean) => void;

  calendarExportModalOpen: boolean;
  setCalendarExportModalOpen: (open: boolean) => void;

  taxReportModalOpen: boolean;
  setTaxReportModalOpen: (open: boolean) => void;

  emergencyBinderModalOpen: boolean;
  setEmergencyBinderModalOpen: (open: boolean) => void;

  contractModalDraft: ContractModalDraft | null;
  openContractModal: (draft?: ContractModalDraft) => void;
  closeContractModal: () => void;

  detailContractId: string | null;
  openContractDetail: (contractId: string) => void;
  closeContractDetail: () => void;

  cancellationModalContractId: string | null;
  openCancellationModal: (contractId: string) => void;
  closeCancellationModal: () => void;

  pdfPreviewTarget: PdfPreviewTarget | null;
  openPdfPreview: (target: PdfPreviewTarget) => void;
  closePdfPreview: () => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const HubContext = createContext<HubContextValue | null>(null);

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [pocketbaseConnected, setPocketbaseConnected] = useState(false);
  const pocketbaseUrl =
    process.env.NEXT_PUBLIC_POCKETBASE_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:8090`
      : "http://localhost:8090");

  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [providers, setProviders] =
    useState<InsurerProvider[]>(INITIAL_PROVIDERS);
  const [categories, setCategories] = useState<CatalogCategory[]>(
    INITIAL_CATALOG_CATEGORIES
  );
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [claims, setClaims] = useState<InsuranceClaim[]>(INITIAL_CLAIMS);
  const [milestoneOverrides, setMilestoneOverrides] = useState<
    Record<string, MilestoneOverride>
  >({});
  const [paperlessConfig, setPaperlessConfig] = useState<PaperlessConfig>(
    DEFAULT_PAPERLESS_CONFIG
  );

  const [selectedMemberId, setSelectedMemberId] = useState<string | "all">("all");
  const [contractModalDraft, setContractModalDraft] =
    useState<ContractModalDraft | null>(null);
  const [detailContractId, setDetailContractId] = useState<string | null>(null);
  const [cancellationModalContractId, setCancellationModalContractId] =
    useState<string | null>(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [calendarExportModalOpen, setCalendarExportModalOpen] = useState(false);
  const [taxReportModalOpen, setTaxReportModalOpen] = useState(false);
  const [emergencyBinderModalOpen, setEmergencyBinderModalOpen] = useState(false);
  const [pdfPreviewTarget, setPdfPreviewTarget] =
    useState<PdfPreviewTarget | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Global keyboard shortcut Cmd/Ctrl + K for Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const syncReadyRef = React.useRef(false);

  // Load initial state from LocalStorage & optionally check PocketBase health
  useEffect(() => {
    let localMembers = INITIAL_MEMBERS;
    let localProviders = INITIAL_PROVIDERS;
    let localCategories = INITIAL_CATALOG_CATEGORIES;
    let localContracts = INITIAL_CONTRACTS;
    let localClaims = INITIAL_CLAIMS;
    let localMilestones: Record<string, MilestoneOverride> = {};
    let localPaperless = DEFAULT_PAPERLESS_CONFIG;

    try {
      const rawMembers = localStorage.getItem(STORAGE_KEYS.members);
      if (rawMembers) {
        localMembers = JSON.parse(rawMembers);
        setMembers(localMembers);
      }

      const rawProviders = localStorage.getItem(STORAGE_KEYS.providers);
      if (rawProviders) {
        localProviders = JSON.parse(rawProviders);
        setProviders(localProviders);
      }

      const rawCategories = localStorage.getItem(STORAGE_KEYS.categories);
      if (rawCategories) {
        const parsed: CatalogCategory[] = JSON.parse(rawCategories);
        if (parsed.length >= INITIAL_CATALOG_CATEGORIES.length) {
          localCategories = normalizeCategories(parsed);
          setCategories(localCategories);
        }
      }

      const rawContracts = localStorage.getItem(STORAGE_KEYS.contracts);
      if (rawContracts) {
        localContracts = normalizeContracts(JSON.parse(rawContracts));
        setContracts(localContracts);
      }

      const rawClaims = localStorage.getItem(STORAGE_KEYS.claims);
      if (rawClaims) {
        localClaims = JSON.parse(rawClaims);
        setClaims(localClaims);
      }

      const rawMilestones = localStorage.getItem(STORAGE_KEYS.milestones);
      if (rawMilestones) {
        localMilestones = JSON.parse(rawMilestones);
        setMilestoneOverrides(localMilestones);
      }

      const rawPaperless = localStorage.getItem(STORAGE_KEYS.paperless);
      if (rawPaperless) {
        localPaperless = {
          ...DEFAULT_PAPERLESS_CONFIG,
          ...JSON.parse(rawPaperless),
        };
        setPaperlessConfig(localPaperless);
      }
    } catch {
      // Ignore storage access errors
    } finally {
      setHydrated(true);
    }

    // Check PocketBase connection & pull central multi-device data asynchronously
    fetch("/api/hub/sync")
      .then((r) => r.json())
      .then((res) => {
        if (res.connected) {
          setPocketbaseConnected(true);
          // If PocketBase / persistent NAS store contains data, adopt it as single source of truth
          if (res.hasData && res.data) {
            if (res.data.members?.length) setMembers(res.data.members);
            if (res.data.providers?.length) setProviders(res.data.providers);
            if (res.data.categories?.length) {
              setCategories(normalizeCategories(res.data.categories));
            }
            if (res.data.contracts) {
              setContracts(normalizeContracts(res.data.contracts));
            }
            if (res.data.claims) setClaims(res.data.claims);
            if (res.data.milestones) setMilestoneOverrides(res.data.milestones);
            if (res.data.paperlessConfig) {
              setPaperlessConfig((prev) => ({
                ...prev,
                ...res.data.paperlessConfig,
              }));
            }
            setTimeout(() => {
              syncReadyRef.current = true;
            }, 250);
          } else {
            // Server is empty (first launch on NAS) -> push current local state once to initialize persistent DB
            syncReadyRef.current = true;
            fetch("/api/hub/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                members: localMembers,
                providers: localProviders,
                categories: localCategories,
                contracts: localContracts,
                claims: localClaims,
                milestones: localMilestones,
                paperlessConfig: localPaperless,
              }),
            }).catch(() => {});
          }
        } else {
          setPocketbaseConnected(false);
          syncReadyRef.current = true;
        }
      })
      .catch(() => {
        setPocketbaseConnected(false);
        syncReadyRef.current = true;
      });
  }, [pocketbaseUrl]);

  // Push updates to central PocketBase / persistent store (debounced)
  useEffect(() => {
    if (!hydrated || !syncReadyRef.current) return;

    const timer = setTimeout(() => {
      fetch("/api/hub/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members,
          providers,
          categories,
          contracts,
          claims,
          milestones: milestoneOverrides,
          paperlessConfig,
        }),
      }).catch(() => {
        // Silent network failure fallback to local storage
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [
    hydrated,
    members,
    providers,
    categories,
    contracts,
    claims,
    milestoneOverrides,
    paperlessConfig,
  ]);

  // Persist changes to LocalStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(members));
    } catch {}
  }, [members, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.providers, JSON.stringify(providers));
    } catch {}
  }, [providers, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
    } catch {}
  }, [categories, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.contracts, JSON.stringify(contracts));
    } catch {}
  }, [contracts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.claims, JSON.stringify(claims));
    } catch {}
  }, [claims, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.milestones,
        JSON.stringify(milestoneOverrides)
      );
    } catch {}
  }, [milestoneOverrides, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.paperless,
        JSON.stringify(paperlessConfig)
      );
    } catch {}
  }, [paperlessConfig, hydrated]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, CatalogCategory>();
    for (const c of categories) {
      map.set(c.slug, c);
    }
    return map;
  }, [categories]);

  const toggleCategoryVisibility = useCallback((slug: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, is_visible: !c.is_visible } : c))
    );
  }, []);

  const setAllCategoriesVisibility = useCallback(
    (visible: boolean, typeFilter?: ContractType) => {
      setCategories((prev) =>
        prev.map((c) => {
          if (typeFilter && c.type !== typeFilter) return c;
          return { ...c, is_visible: visible };
        })
      );
    },
    []
  );

  const saveCategory = useCallback(
    (input: Omit<CatalogCategory, "id"> & { id?: string }): CatalogCategory => {
      const slug =
        input.slug && input.slug.trim() !== ""
          ? input.slug.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
          : input.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const id =
        input.id && input.id.trim() !== ""
          ? input.id
          : `cat_${Date.now().toString(36)}`;
      const record: CatalogCategory = {
        ...input,
        id,
        slug,
        is_visible: input.is_visible ?? true,
        sort_order: input.sort_order ?? 99,
        group_label: input.group_label || "Eigene Kategorien",
        icon_name: input.icon_name || (input.type === "insurance" ? "Shield" : "Layers"),
      };

      setCategories((prev) => {
        const existsIndex = prev.findIndex(
          (c) => c.slug === slug || (input.id && c.id === input.id)
        );
        if (existsIndex >= 0) {
          const next = [...prev];
          next[existsIndex] = record;
          return next;
        }
        return [...prev, record];
      });
      showToast(`Kategorie „${record.name}“ gespeichert`);
      return record;
    },
    [showToast]
  );

  const deleteCategory = useCallback(
    (slug: string) => {
      setCategories((prev) => prev.filter((c) => c.slug !== slug));
      showToast("Kategorie entfernt");
    },
    [showToast]
  );

  const toggleContractVisibility = useCallback(
    (contractId: string) => {
      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId ? { ...c, is_hidden: !c.is_hidden } : c
        )
      );
      showToast("Sichtbarkeit des Vertrags angepasst");
    },
    [showToast]
  );

  const saveContract = useCallback(
    (input: Omit<Contract, "id"> & { id?: string }): Contract => {
      const id =
        input.id && input.id.trim() !== ""
          ? input.id
          : `con_${Date.now().toString(36)}`;
      const record: Contract = {
        ...input,
        id,
      };

      setContracts((prev) => {
        const exists = prev.some((c) => c.id === id);
        return exists
          ? prev.map((c) => (c.id === id ? record : c))
          : [record, ...prev];
      });

      // Automatically unhide matching category if previously hidden
      setCategories((prev) =>
        prev.map((cat) =>
          cat.slug === record.category_slug && !cat.is_visible
            ? { ...cat, is_visible: true }
            : cat
        )
      );

      showToast(
        input.id
          ? `Vertrag „${record.title}“ aktualisiert`
          : `Vertrag „${record.title}“ neu angelegt`
      );
      return record;
    },
    [showToast]
  );

  const deleteContract = useCallback(
    (contractId: string) => {
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      if (detailContractId === contractId) {
        setDetailContractId(null);
      }
      showToast("Vertrag gelöscht");
    },
    [detailContractId, showToast]
  );

  const saveClaim = useCallback(
    (input: Omit<InsuranceClaim, "id"> & { id?: string }): InsuranceClaim => {
      const id =
        input.id && input.id.trim() !== ""
          ? input.id
          : `clm_${Date.now().toString(36)}`;
      const record: InsuranceClaim = {
        ...input,
        id,
      };
      setClaims((prev) => {
        const exists = prev.some((c) => c.id === id);
        return exists
          ? prev.map((c) => (c.id === id ? record : c))
          : [record, ...prev];
      });
      showToast(`Schadensfall „${record.title}“ gespeichert`);
      return record;
    },
    [showToast]
  );

  const deleteClaim = useCallback(
    (claimId: string) => {
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      showToast("Schadensfall gelöscht");
    },
    [showToast]
  );

  const saveMilestoneOverride = useCallback(
    (milestoneId: string, override: Partial<MilestoneOverride>) => {
      setMilestoneOverrides((prev) => ({
        ...prev,
        [milestoneId]: {
          ...prev[milestoneId],
          id: milestoneId,
          ...override,
        },
      }));
      showToast("Meilenstein-Einstellung gespeichert");
    },
    [showToast]
  );

  const resetMilestoneOverride = useCallback(
    (milestoneId: string) => {
      setMilestoneOverrides((prev) => {
        const next = { ...prev };
        delete next[milestoneId];
        return next;
      });
      showToast("Meilenstein auf Standard zurückgesetzt");
    },
    [showToast]
  );

  const saveMember = useCallback(
    (input: Omit<Member, "id"> & { id?: string }) => {
      const id =
        input.id && input.id.trim() !== ""
          ? input.id
          : `mem_${Date.now().toString(36)}`;
      const record: Member = { ...input, id };
      setMembers((prev) => {
        const exists = prev.some((m) => m.id === id);
        return exists
          ? prev.map((m) => (m.id === id ? record : m))
          : [...prev, record];
      });
      showToast(`Familienmitglied „${record.first_name}“ gespeichert`);
    },
    [showToast]
  );

  const deleteMember = useCallback(
    (memberId: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      if (selectedMemberId === memberId) setSelectedMemberId("all");
      showToast("Familienmitglied entfernt");
    },
    [selectedMemberId, showToast]
  );

  const saveProvider = useCallback(
    (input: Omit<InsurerProvider, "id"> & { id?: string }) => {
      const id =
        input.id && input.id.trim() !== ""
          ? input.id
          : `prov_${Date.now().toString(36)}`;
      const record: InsurerProvider = { ...input, id };
      setProviders((prev) => {
        const exists = prev.some((p) => p.id === id);
        return exists
          ? prev.map((p) => (p.id === id ? record : p))
          : [...prev, record];
      });
      showToast(`Anbieter „${record.name}“ gespeichert`);
      return record;
    },
    [showToast]
  );

  const deleteProvider = useCallback(
    (providerId: string) => {
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
      showToast("Anbieter entfernt");
    },
    [showToast]
  );

  const updatePaperlessConfig = useCallback(
    (cfg: Partial<PaperlessConfig>) => {
      setPaperlessConfig((prev) => ({ ...prev, ...cfg }));
      showToast("Paperless-ngx Einstellungen gespeichert");
    },
    [showToast]
  );

  const exportBackupJson = useCallback(
    (includeSecrets = true) => {
      let usersData: unknown[] = [];
      try {
        const rawUsers = localStorage.getItem("family_hub_users_v1");
        if (rawUsers) usersData = JSON.parse(rawUsers);
      } catch {}

      const payload = {
        app: "Familien-Versicherungs-, Vertrags- & Abo-Hub",
        format: "FAMILY_HUB_DB_SNAPSHOT_V2",
        version: "2.0.0",
        exportedAt: new Date().toISOString(),
        stats: {
          membersCount: members.length,
          providersCount: providers.length,
          categoriesCount: categories.length,
          contractsCount: contracts.length,
          insurancesCount: contracts.filter((c) => c.type === "insurance").length,
          fixedContractsCount: contracts.filter((c) => c.type === "contract").length,
          subscriptionsCount: contracts.filter((c) => c.type === "subscription").length,
          claimsCount: claims.length,
        },
        members,
        providers,
        categories,
        contracts,
        claims,
        milestoneOverrides,
        users: usersData,
        paperlessConfig: includeSecrets
          ? paperlessConfig
          : {
              ...paperlessConfig,
              token: paperlessConfig.token ? "***REDACTED***" : "",
            },
      };
      return JSON.stringify(payload, null, 2);
    },
    [members, providers, categories, contracts, claims, milestoneOverrides, paperlessConfig]
  );

  const exportContractsCsv = useCallback(() => {
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "ID",
      "Typ",
      "Bezeichnung",
      "Kategorie",
      "Anbieter",
      "Kundennummer",
      "Policen-/Vertragsnummer",
      "Beitrag (EUR)",
      "Zahlungsweise",
      "Status",
      "Vertragsbeginn",
      "Mindestlaufzeit (Monate)",
      "Verlaengerung danach (Monate)",
      "Kuendigungsfrist",
      "Regelung / Konditionen",
      "Naechste Verlaengerung / Ablauf",
      "Zusatzfelder",
      "Notizen",
    ];

    const rows = contracts.map((con) => {
      const cat = categoriesMap.get(con.category_slug);
      const prov = providers.find((p) => p.id === con.provider_id);
      const typeLabel =
        con.type === "insurance"
          ? "Versicherung"
          : con.type === "contract"
          ? "Vertrag / Fixkosten"
          : "Abo";
      const custNo = con.customer_number || prov?.customer_number || "";
      const noticeStr = con.notice_period_value
        ? `${con.notice_period_value} ${
            con.notice_period_unit === "months"
              ? "Monat(e)"
              : con.notice_period_unit === "weeks"
              ? "Woche(n)"
              : "Tag(e)"
          }`
        : `${con.cancellation_period_days} Tage`;
      const customFieldsStr = (con.custom_fields || [])
        .map((f) => `${f.label}: ${f.value}`)
        .join(" | ");

      return [
        con.id,
        typeLabel,
        con.title,
        cat?.name || con.category_slug,
        prov?.name || con.provider_id,
        custNo,
        con.policy_number || "",
        String(con.cost).replace(".", ","),
        con.billing_cycle,
        con.status,
        con.contract_start_date || "",
        con.initial_term_months ?? "",
        con.auto_renewal_months ?? "",
        noticeStr,
        con.cancellation_terms_text || "",
        con.contract_end_date || "",
        customFieldsStr,
        con.notes || "",
      ]
        .map(escapeCsv)
        .join(";");
    });

    // Prefix UTF-8 BOM so Microsoft Excel opens umlauts and columns cleanly
    return "\uFEFF" + [headers.map(escapeCsv).join(";"), ...rows].join("\r\n");
  }, [contracts, categoriesMap, providers]);

  const downloadDatabaseBackup = useCallback(
    (format: "json" | "csv" = "json") => {
      const dateStr = new Date().toISOString().slice(0, 10);
      if (format === "csv") {
        const csv = exportContractsCsv();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `familien-vertraege-export-${dateStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("CSV-Tabellenexport heruntergeladen");
        return;
      }

      const json = exportBackupJson(true);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `familien-datenbank-sicherung-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Vollständige Datenbank-Sicherung (.json) heruntergeladen");
    },
    [exportBackupJson, exportContractsCsv, showToast]
  );

  const importBackupJson = useCallback(
    (rawJson: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(rawJson);
        if (!Array.isArray(parsed.contracts) || !Array.isArray(parsed.members)) {
          return {
            ok: false,
            message:
              "Ungültiges Backup-Format: Felder 'contracts' und 'members' fehlen.",
          };
        }
        setMembers(parsed.members);
        if (Array.isArray(parsed.providers)) setProviders(parsed.providers);
        if (Array.isArray(parsed.categories)) {
          setCategories(normalizeCategories(parsed.categories));
        }
        setContracts(normalizeContracts(parsed.contracts));
        if (Array.isArray(parsed.claims)) setClaims(parsed.claims);
        if (parsed.milestoneOverrides && typeof parsed.milestoneOverrides === "object") {
          setMilestoneOverrides(parsed.milestoneOverrides);
        }
        if (parsed.paperlessConfig && typeof parsed.paperlessConfig === "object") {
          setPaperlessConfig((prev) => ({
            ...prev,
            ...parsed.paperlessConfig,
            token:
              parsed.paperlessConfig.token &&
              parsed.paperlessConfig.token !== "***REDACTED***"
                ? parsed.paperlessConfig.token
                : prev.token,
          }));
        }
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          try {
            localStorage.setItem("family_hub_users_v1", JSON.stringify(parsed.users));
          } catch {}
        }
        showToast("Datenbank-Backup erfolgreich wiederhergestellt & synchronisiert");
        return { ok: true, message: "Datenbank-Backup erfolgreich importiert!" };
      } catch (e) {
        return {
          ok: false,
          message:
            e instanceof Error ? e.message : "JSON konnte nicht gelesen werden.",
        };
      }
    },
    [showToast]
  );

  const resetToDemoDefaults = useCallback(() => {
    setMembers(INITIAL_MEMBERS);
    setProviders(INITIAL_PROVIDERS);
    setCategories(INITIAL_CATALOG_CATEGORIES);
    setContracts(INITIAL_CONTRACTS);
    setClaims(INITIAL_CLAIMS);
    setMilestoneOverrides({});
    setSelectedMemberId("all");
    showToast("Standard-Familiendaten & Katalog wiederhergestellt");
  }, [showToast]);

  const clearAllData = useCallback(() => {
    setContracts([]);
    setClaims([]);
    setMilestoneOverrides({});
    setMembers([
      {
        id: "mem_self",
        first_name: "Ich",
        role: "Versicherungsnehmer",
        birth_date: "1990-01-01",
        avatar_color: "blue",
        avatar_emoji: "👤",
      },
    ]);
    setSelectedMemberId("all");
    showToast("Beispieldaten geleert – Du kannst jetzt deine echten Verträge erfassen!");
  }, [showToast]);

  const openContractModal = useCallback((draft?: ContractModalDraft) => {
    setContractModalDraft(draft ?? {});
  }, []);

  const closeContractModal = useCallback(() => {
    setContractModalDraft(null);
  }, []);

  const openContractDetail = useCallback((contractId: string) => {
    setDetailContractId(contractId);
  }, []);

  const closeContractDetail = useCallback(() => {
    setDetailContractId(null);
  }, []);

  const openCancellationModal = useCallback((contractId: string) => {
    setCancellationModalContractId(contractId);
  }, []);

  const closeCancellationModal = useCallback(() => {
    setCancellationModalContractId(null);
  }, []);

  const openPdfPreview = useCallback((target: PdfPreviewTarget) => {
    setPdfPreviewTarget(target);
  }, []);

  const closePdfPreview = useCallback(() => {
    setPdfPreviewTarget(null);
  }, []);

  const value = useMemo<HubContextValue>(
    () => ({
      hydrated,
      pocketbaseConnected,
      pocketbaseUrl,
      members,
      providers,
      categories,
      categoriesMap,
      contracts,
      claims,
      milestoneOverrides,
      saveMilestoneOverride,
      resetMilestoneOverride,
      paperlessConfig,
      selectedMemberId,
      setSelectedMemberId,
      toggleCategoryVisibility,
      setAllCategoriesVisibility,
      saveCategory,
      deleteCategory,
      toggleContractVisibility,
      saveContract,
      deleteContract,
      saveClaim,
      deleteClaim,
      saveMember,
      deleteMember,
      saveProvider,
      deleteProvider,
      updatePaperlessConfig,
      exportBackupJson,
      exportContractsCsv,
      downloadDatabaseBackup,
      importBackupJson,
      resetToDemoDefaults,
      clearAllData,
      backupModalOpen,
      setBackupModalOpen,
      contractModalDraft,
      openContractModal,
      closeContractModal,
      detailContractId,
      openContractDetail,
      closeContractDetail,
      cancellationModalContractId,
      openCancellationModal,
      closeCancellationModal,
      calendarExportModalOpen,
      setCalendarExportModalOpen,
      taxReportModalOpen,
      setTaxReportModalOpen,
      emergencyBinderModalOpen,
      setEmergencyBinderModalOpen,
      pdfPreviewTarget,
      openPdfPreview,
      closePdfPreview,
      commandPaletteOpen,
      setCommandPaletteOpen,
      toastMessage,
      showToast,
    }),
    [
      hydrated,
      pocketbaseConnected,
      pocketbaseUrl,
      members,
      providers,
      categories,
      categoriesMap,
      contracts,
      claims,
      milestoneOverrides,
      saveMilestoneOverride,
      resetMilestoneOverride,
      paperlessConfig,
      selectedMemberId,
      toggleCategoryVisibility,
      setAllCategoriesVisibility,
      saveCategory,
      deleteCategory,
      toggleContractVisibility,
      saveContract,
      deleteContract,
      saveClaim,
      deleteClaim,
      saveMember,
      deleteMember,
      saveProvider,
      deleteProvider,
      updatePaperlessConfig,
      exportBackupJson,
      exportContractsCsv,
      downloadDatabaseBackup,
      importBackupJson,
      resetToDemoDefaults,
      clearAllData,
      backupModalOpen,
      contractModalDraft,
      openContractModal,
      closeContractModal,
      detailContractId,
      openContractDetail,
      closeContractDetail,
      cancellationModalContractId,
      openCancellationModal,
      closeCancellationModal,
      calendarExportModalOpen,
      taxReportModalOpen,
      emergencyBinderModalOpen,
      pdfPreviewTarget,
      openPdfPreview,
      closePdfPreview,
      commandPaletteOpen,
      toastMessage,
      showToast,
    ]
  );

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub(): HubContextValue {
  const ctx = useContext(HubContext);
  if (!ctx) {
    throw new Error("useHub must be used within a HubProvider");
  }
  return ctx;
}
