/**
 * Server-Side PocketBase Handler für Next.js
 * Kommuniziert direkt mit dem PocketBase-Container über das interne Docker-Netzwerk
 * oder über lokale Fallback-URLs (z.B. NAS IP 192.168.178.27).
 */

import fs from "fs";
import path from "path";
import {
  CatalogCategory,
  Contract,
  InsuranceClaim,
  InsurerProvider,
  Member,
  MilestoneOverride,
  PaperlessConfig,
  UserAccount,
} from "@/types/models";

const LOCAL_STORE_PATH = path.join(process.cwd(), "pb_data", "hub_local_store.json");

function readLocalFallbackStore(): SyncPayload | null {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const raw = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore read errors
  }
  return null;
}

function writeLocalFallbackStore(payload: SyncPayload): void {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const existing = readLocalFallbackStore() || {};
    const merged: SyncPayload = {
      ...existing,
      ...(payload.members !== undefined ? { members: payload.members } : {}),
      ...(payload.providers !== undefined ? { providers: payload.providers } : {}),
      ...(payload.categories !== undefined ? { categories: payload.categories } : {}),
      ...(payload.contracts !== undefined ? { contracts: payload.contracts } : {}),
      ...(payload.claims !== undefined ? { claims: payload.claims } : {}),
      ...(payload.milestones !== undefined ? { milestones: payload.milestones } : {}),
      ...(payload.paperlessConfig !== undefined ? { paperlessConfig: payload.paperlessConfig } : {}),
      ...(payload.users !== undefined ? { users: payload.users } : {}),
    };
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(merged, null, 2), "utf-8");
  } catch {
    // ignore write errors on read-only FS
  }
}

export function getPocketBaseInternalUrl(): string {
  if (
    process.env.POCKETBASE_INTERNAL_URL &&
    process.env.POCKETBASE_INTERNAL_URL.trim() !== ""
  ) {
    return process.env.POCKETBASE_INTERNAL_URL.replace(/\/+$/, "");
  }

  if (
    process.env.NEXT_PUBLIC_POCKETBASE_URL &&
    process.env.NEXT_PUBLIC_POCKETBASE_URL.trim() !== ""
  ) {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL.replace(/\/+$/, "");
  }

  // NAS default IP fallback
  return "http://192.168.178.27:8090";
}

export async function checkPocketBaseHealth(): Promise<{
  online: boolean;
  url: string;
  error?: string;
}> {
  const baseUrl = getPocketBaseInternalUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/api/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      return { online: true, url: baseUrl };
    }
    return { online: false, url: baseUrl, error: `HTTP ${res.status}` };
  } catch (err: unknown) {
    return {
      online: false,
      url: baseUrl,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface SyncPayload {
  members?: Member[];
  providers?: InsurerProvider[];
  categories?: CatalogCategory[];
  contracts?: Contract[];
  claims?: InsuranceClaim[];
  milestones?: Record<string, MilestoneOverride>;
  paperlessConfig?: PaperlessConfig;
  users?: UserAccount[];
}

/**
 * Holt alle Entitäten aus PocketBase (members, insurers_providers, catalog_categories, contracts)
 * sowie Meta-Einstellungen (Claims, Meilensteine, Paperless, Users) aus den speziellen System-Records.
 */
export async function pullFromPocketBase(): Promise<{
  hasData: boolean;
  data: SyncPayload;
}> {
  const baseUrl = getPocketBaseInternalUrl();

  const [membersRes, providersRes, categoriesRes, contractsRes] =
    await Promise.all([
      fetch(`${baseUrl}/api/collections/members/records?perPage=500`, {
        cache: "no-store",
      }).then((r) => r.json()),
      fetch(
        `${baseUrl}/api/collections/insurers_providers/records?perPage=500`,
        { cache: "no-store" }
      ).then((r) => r.json()),
      fetch(
        `${baseUrl}/api/collections/catalog_categories/records?perPage=500`,
        { cache: "no-store" }
      ).then((r) => r.json()),
      fetch(`${baseUrl}/api/collections/contracts/records?perPage=500`, {
        cache: "no-store",
      }).then((r) => r.json()),
    ]);

  const rawMembers: any[] = membersRes?.items || [];
  const rawProviders: any[] = providersRes?.items || [];
  const rawCategories: any[] = categoriesRes?.items || [];
  const rawContracts: any[] = contractsRes?.items || [];

  // Extract meta settings & user records from members collection
  let metaClaims: InsuranceClaim[] = [];
  let metaMilestones: Record<string, MilestoneOverride> = {};
  let metaPaperless: PaperlessConfig | undefined;
  let metaUsers: UserAccount[] | undefined;
  let providerMetaMap: Record<string, { customer_number?: string; category_focus?: string; notes?: string }> = {};

  const validMembers: Member[] = [];

  for (const m of rawMembers) {
    if (m.first_name === "__hub_settings__") {
      try {
        const parsed = JSON.parse(m.notes || "{}");
        if (parsed.claims) metaClaims = parsed.claims;
        if (parsed.milestoneOverrides) metaMilestones = parsed.milestoneOverrides;
        if (parsed.paperlessConfig) metaPaperless = parsed.paperlessConfig;
        if (parsed.providerMetaMap) providerMetaMap = parsed.providerMetaMap;
      } catch {}
      continue;
    }
    if (m.first_name === "__hub_users__") {
      try {
        const parsed = JSON.parse(m.notes || "[]");
        if (Array.isArray(parsed)) metaUsers = parsed;
      } catch {}
      continue;
    }

    let memberExtra: any = {};
    let memberNotes: string | undefined = m.notes || undefined;
    if (m.notes && m.notes.startsWith("{")) {
      try {
        memberExtra = JSON.parse(m.notes);
        if (typeof memberExtra.originalNotes === "string") {
          memberNotes = memberExtra.originalNotes || undefined;
        }
      } catch {}
    }

    validMembers.push({
      id: m.id,
      first_name: m.first_name,
      role: m.role || "Familienmitglied",
      birth_date: m.birth_date || "2000-01-01",
      avatar_color: m.avatar_color || "blue",
      avatar_emoji: m.avatar_emoji || "👤",
      notes: memberNotes,
      health_insurance: memberExtra.health_insurance || undefined,
      insurance_number: memberExtra.insurance_number || undefined,
      linked_user_id: memberExtra.linked_user_id || undefined,
    });
  }

  const validProviders: InsurerProvider[] = rawProviders.map((p) => {
    const pMeta = providerMetaMap[p.id] || {};
    return {
      id: p.id,
      name: p.name,
      portal_url: p.portal_url || undefined,
      emergency_hotline: p.emergency_hotline || undefined,
      support_email: p.support_email || undefined,
      customer_number: pMeta.customer_number || undefined,
      category_focus: (pMeta.category_focus as any) || undefined,
      notes: pMeta.notes || undefined,
      paperless_correspondent_id: p.paperless_correspondent_id || undefined,
      paperless_correspondent_name: p.paperless_correspondent_name || undefined,
    };
  });

  const validCategories: CatalogCategory[] = rawCategories.map((c) => {
    // Allow "contract" type stored via consumer_tip marker or direct
    const effectiveType =
      c.consumer_tip?.startsWith("__type:contract__")
        ? "contract"
        : c.type;
    const cleanTip = c.consumer_tip?.replace(/^__type:contract__\|?/, "") || undefined;

    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      type: effectiveType,
      priority_tier: c.priority_tier || undefined,
      group_label: c.group_label || "Allgemein",
      description: c.description || "",
      consumer_tip: cleanTip,
      icon_name: c.icon_name || "ShieldCheck",
      is_visible: c.is_visible ?? true,
      sort_order: c.sort_order ?? 99,
    };
  });

  const validContracts: Contract[] = rawContracts.map((c) => {
    let extraNotes: any = {};
    if (c.notes) {
      try {
        extraNotes = JSON.parse(c.notes);
      } catch {}
    }

    return {
      id: c.id,
      title: c.title,
      type: extraNotes.realType || c.type,
      category_slug: c.category_slug,
      priority_override: c.priority_override || undefined,
      is_hidden: c.is_hidden ?? false,
      provider_id: c.provider_id || "",
      policy_holder_id: c.policy_holder_id || "",
      insured_member_ids: Array.isArray(c.insured_member_ids)
        ? c.insured_member_ids
        : [],
      policy_number: c.policy_number || "",
      customer_number: extraNotes.customer_number || undefined,
      paperless_tag: c.paperless_tag || undefined,
      paperless_custom_query: c.paperless_custom_query || undefined,
      paperless_document_id:
        extraNotes.paperless_document_id !== undefined
          ? extraNotes.paperless_document_id
          : undefined,
      paperless_document_title:
        extraNotes.paperless_document_title || undefined,
      cost: c.cost ?? 0,
      billing_cycle: c.billing_cycle || "monthly",
      next_payment_date: c.next_payment_date || "2026-11-01",
      deductible: c.deductible ?? 0,
      coverage_amount: c.coverage_amount || undefined,
      contract_start_date: extraNotes.contract_start_date || undefined,
      initial_term_months:
        extraNotes.initial_term_months !== undefined
          ? Number(extraNotes.initial_term_months)
          : undefined,
      auto_renewal_months:
        extraNotes.auto_renewal_months !== undefined
          ? Number(extraNotes.auto_renewal_months)
          : undefined,
      notice_period_value:
        extraNotes.notice_period_value !== undefined
          ? Number(extraNotes.notice_period_value)
          : undefined,
      notice_period_unit: extraNotes.notice_period_unit || undefined,
      notice_period_after_initial_months:
        extraNotes.notice_period_after_initial_months !== undefined
          ? Number(extraNotes.notice_period_after_initial_months)
          : undefined,
      cancellation_terms_text: extraNotes.cancellation_terms_text || undefined,
      cancellation_period_days: c.cancellation_period_days ?? 30,
      contract_end_date: c.contract_end_date || undefined,
      custom_fields: Array.isArray(extraNotes.custom_fields)
        ? extraNotes.custom_fields
        : undefined,
      status: c.status || "active",
      emergency_group: (c.emergency_Group || c.emergency_group || "sonstige") as any,
      payment_method: c.payment_method || "SEPA-Lastschrift",
      notes:
        typeof extraNotes.originalNotes === "string"
          ? extraNotes.originalNotes
          : c.notes || "",
    };
  });

  const hasData =
    validMembers.length > 0 ||
    validProviders.length > 0 ||
    validContracts.length > 0;

  if (!hasData) {
    const localFallback = readLocalFallbackStore();
    if (
      localFallback &&
      ((localFallback.members && localFallback.members.length > 0) ||
        (localFallback.contracts && localFallback.contracts.length > 0))
    ) {
      return {
        hasData: true,
        data: localFallback,
      };
    }
  }

  return {
    hasData,
    data: {
      members: validMembers,
      providers: validProviders,
      categories: validCategories,
      contracts: validContracts,
      claims: metaClaims,
      milestones: metaMilestones,
      paperlessConfig: metaPaperless,
      users: metaUsers,
    },
  };
}

export function pullFromLocalStoreFallback(): {
  hasData: boolean;
  data: SyncPayload;
} {
  const local = readLocalFallbackStore();
  if (
    local &&
    ((local.members && local.members.length > 0) ||
      (local.providers && local.providers.length > 0) ||
      (local.contracts && local.contracts.length > 0))
  ) {
    return { hasData: true, data: local };
  }
  return { hasData: false, data: {} };
}

/**
 * Schreibt Daten (Members, Providers, Categories, Contracts, Meta-Settings) in PocketBase
 * sowie als Sicherheits-Kopie in ./pb_data/hub_local_store.json.
 */
export async function pushToPocketBase(payload: SyncPayload): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  // Always persist to local fallback file so data survives even if PB container is temporarily unreachable
  writeLocalFallbackStore(payload);

  const baseUrl = getPocketBaseInternalUrl();

  try {
    // 1. Sync Members
    if (payload.members && Array.isArray(payload.members)) {
      const existingRes = await fetch(
        `${baseUrl}/api/collections/members/records?perPage=500`,
        { cache: "no-store" }
      ).then((r) => r.json());
      const existingMap = new Map<string, any>(
        (existingRes.items || [])
          .filter((m: any) => !m.first_name.startsWith("__hub_"))
          .map((m: any) => [m.id, m])
      );

      for (const mem of payload.members) {
        const memberNotesPayload =
          mem.health_insurance || mem.insurance_number || mem.linked_user_id
            ? JSON.stringify({
                originalNotes: mem.notes || "",
                health_insurance: mem.health_insurance,
                insurance_number: mem.insurance_number,
                linked_user_id: mem.linked_user_id,
              })
            : mem.notes || "";

        const body = {
          first_name: mem.first_name,
          role: mem.role || "Familienmitglied",
          birth_date: mem.birth_date || "",
          avatar_color: mem.avatar_color || "blue",
          avatar_emoji: mem.avatar_emoji || "👤",
          notes: memberNotesPayload,
        };

        if (existingMap.has(mem.id)) {
          await fetch(
            `${baseUrl}/api/collections/members/records/${mem.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          existingMap.delete(mem.id);
        } else {
          const createBody: any = { ...body };
          if (/^[a-z0-9]{15}$/.test(mem.id)) {
            createBody.id = mem.id;
          }
          await fetch(`${baseUrl}/api/collections/members/records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createBody),
          });
        }
      }

      // Delete removed members
      for (const [id] of existingMap) {
        await fetch(`${baseUrl}/api/collections/members/records/${id}`, {
          method: "DELETE",
        });
      }
    }

    // 2. Sync Providers
    const providerMetaMap: Record<
      string,
      { customer_number?: string; category_focus?: string; notes?: string }
    > = {};

    if (payload.providers && Array.isArray(payload.providers)) {
      const existingRes = await fetch(
        `${baseUrl}/api/collections/insurers_providers/records?perPage=500`,
        { cache: "no-store" }
      ).then((r) => r.json());
      const existingMap = new Map<string, any>(
        (existingRes.items || []).map((p: any) => [p.id, p])
      );

      for (const prov of payload.providers) {
        if (prov.customer_number || prov.category_focus || prov.notes) {
          providerMetaMap[prov.id] = {
            customer_number: prov.customer_number,
            category_focus: prov.category_focus,
            notes: prov.notes,
          };
        }

        const body = {
          name: prov.name,
          portal_url: prov.portal_url || "",
          emergency_hotline: prov.emergency_hotline || "",
          support_email: prov.support_email || "",
          paperless_correspondent_id: prov.paperless_correspondent_id || 0,
          paperless_correspondent_name: prov.paperless_correspondent_name || "",
        };

        if (existingMap.has(prov.id)) {
          await fetch(
            `${baseUrl}/api/collections/insurers_providers/records/${prov.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          existingMap.delete(prov.id);
        } else {
          const createBody: any = { ...body };
          if (/^[a-z0-9]{15}$/.test(prov.id)) {
            createBody.id = prov.id;
          }
          await fetch(
            `${baseUrl}/api/collections/insurers_providers/records`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(createBody),
            }
          );
        }
      }

      for (const [id] of existingMap) {
        await fetch(
          `${baseUrl}/api/collections/insurers_providers/records/${id}`,
          { method: "DELETE" }
        );
      }
    }

    // 3. Sync Categories
    if (payload.categories && Array.isArray(payload.categories)) {
      const existingRes = await fetch(
        `${baseUrl}/api/collections/catalog_categories/records?perPage=500`,
        { cache: "no-store" }
      ).then((r) => r.json());
      const existingMap = new Map<string, any>(
        (existingRes.items || []).map((c: any) => [c.id, c])
      );

      for (const cat of payload.categories) {
        // PB schema enum for type only has ["insurance", "subscription"], so store "contract" marker in consumer_tip
        const pbType = cat.type === "insurance" ? "insurance" : "subscription";
        const encodedTip =
          cat.type === "contract"
            ? `__type:contract__|${cat.consumer_tip || ""}`
            : cat.consumer_tip || "";

        const body = {
          slug: cat.slug,
          name: cat.name,
          type: pbType,
          priority_tier: cat.priority_tier || "empfohlen",
          group_label: cat.group_label || "Allgemein",
          description: cat.description || "",
          consumer_tip: encodedTip,
          icon_name: cat.icon_name || "ShieldCheck",
          is_visible: cat.is_visible ?? true,
          sort_order: cat.sort_order ?? 99,
        };

        if (existingMap.has(cat.id)) {
          await fetch(
            `${baseUrl}/api/collections/catalog_categories/records/${cat.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          existingMap.delete(cat.id);
        } else {
          const createBody: any = { ...body };
          if (/^[a-z0-9]{15}$/.test(cat.id)) {
            createBody.id = cat.id;
          }
          await fetch(
            `${baseUrl}/api/collections/catalog_categories/records`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(createBody),
            }
          );
        }
      }
    }

    // 4. Sync Contracts
    if (payload.contracts && Array.isArray(payload.contracts)) {
      const existingRes = await fetch(
        `${baseUrl}/api/collections/contracts/records?perPage=500`,
        { cache: "no-store" }
      ).then((r) => r.json());
      const existingMap = new Map<string, any>(
        (existingRes.items || []).map((c: any) => [c.id, c])
      );

      for (const con of payload.contracts) {
        const extraData = {
          originalNotes: con.notes || "",
          realType: con.type,
          customer_number: con.customer_number,
          paperless_document_id: con.paperless_document_id,
          paperless_document_title: con.paperless_document_title,
          contract_start_date: con.contract_start_date,
          initial_term_months: con.initial_term_months,
          auto_renewal_months: con.auto_renewal_months,
          notice_period_value: con.notice_period_value,
          notice_period_unit: con.notice_period_unit,
          notice_period_after_initial_months:
            con.notice_period_after_initial_months,
          cancellation_terms_text: con.cancellation_terms_text,
          custom_fields: con.custom_fields,
        };

        const pbContractType =
          con.type === "insurance" ? "insurance" : "subscription";

        const body: any = {
          title: con.title,
          type: pbContractType,
          category_slug: con.category_slug,
          priority_override: con.priority_override || "",
          is_hidden: con.is_hidden ?? false,
          policy_number: con.policy_number || "",
          paperless_tag: con.paperless_tag || "",
          paperless_custom_query: con.paperless_custom_query || "",
          cost: Number(con.cost) || 0,
          billing_cycle: con.billing_cycle || "monthly",
          next_payment_date: con.next_payment_date || "",
          deductible: Number(con.deductible) || 0,
          coverage_amount: con.coverage_amount || "",
          cancellation_period_days: Number(con.cancellation_period_days) ?? 30,
          contract_end_date: con.contract_end_date || "",
          status: con.status || "active",
          emergency_Group: con.emergency_group || "sonstige",
          payment_method: con.payment_method || "SEPA-Lastschrift",
          notes: JSON.stringify(extraData),
        };

        // Validate relations if they exist on PB
        if (con.provider_id && /^[a-z0-9]{15}$/.test(con.provider_id)) {
          body.provider_id = con.provider_id;
        } else {
          body.provider_id = "";
        }

        if (con.policy_holder_id && /^[a-z0-9]{15}$/.test(con.policy_holder_id)) {
          body.policy_holder_id = con.policy_holder_id;
        } else {
          body.policy_holder_id = "";
        }

        if (Array.isArray(con.insured_member_ids)) {
          body.insured_member_ids = con.insured_member_ids.filter((id) =>
            /^[a-z0-9]{15}$/.test(id)
          );
        }

        if (existingMap.has(con.id)) {
          await fetch(
            `${baseUrl}/api/collections/contracts/records/${con.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          existingMap.delete(con.id);
        } else {
          const createBody: any = { ...body };
          if (/^[a-z0-9]{15}$/.test(con.id)) {
            createBody.id = con.id;
          }
          await fetch(`${baseUrl}/api/collections/contracts/records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createBody),
          });
        }
      }

      for (const [id] of existingMap) {
        await fetch(`${baseUrl}/api/collections/contracts/records/${id}`, {
          method: "DELETE",
        });
      }
    }

    // 5. Sync Meta Settings (claims, milestones, paperlessConfig, providerMetaMap)
    if (
      payload.claims !== undefined ||
      payload.milestones !== undefined ||
      payload.paperlessConfig !== undefined ||
      payload.providers !== undefined
    ) {
      const q = encodeURIComponent('first_name="__hub_settings__"');
      const searchRes = await fetch(
        `${baseUrl}/api/collections/members/records?filter=${q}`,
        { cache: "no-store" }
      ).then((r) => r.json());

      const existingRecord = searchRes?.items?.[0];
      let currentSettings: any = {};
      if (existingRecord?.notes) {
        try {
          currentSettings = JSON.parse(existingRecord.notes);
        } catch {}
      }

      if (payload.claims !== undefined) currentSettings.claims = payload.claims;
      if (payload.milestones !== undefined)
        currentSettings.milestoneOverrides = payload.milestones;
      if (payload.paperlessConfig !== undefined)
        currentSettings.paperlessConfig = payload.paperlessConfig;
      if (payload.providers !== undefined)
        currentSettings.providerMetaMap = providerMetaMap;

      const body = {
        first_name: "__hub_settings__",
        role: "__system__",
        notes: JSON.stringify(currentSettings),
      };

      if (existingRecord) {
        await fetch(
          `${baseUrl}/api/collections/members/records/${existingRecord.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
      } else {
        await fetch(`${baseUrl}/api/collections/members/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
    }

    // 6. Sync Users
    if (payload.users !== undefined && Array.isArray(payload.users)) {
      const q = encodeURIComponent('first_name="__hub_users__"');
      const searchRes = await fetch(
        `${baseUrl}/api/collections/members/records?filter=${q}`,
        { cache: "no-store" }
      ).then((r) => r.json());

      const existingRecord = searchRes?.items?.[0];
      const body = {
        first_name: "__hub_users__",
        role: "__system__",
        notes: JSON.stringify(payload.users),
      };

      if (existingRecord) {
        await fetch(
          `${baseUrl}/api/collections/members/records/${existingRecord.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
      } else {
        await fetch(`${baseUrl}/api/collections/members/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
    }

    return { success: true, message: "Erfolgreich mit PocketBase synchronisiert." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
