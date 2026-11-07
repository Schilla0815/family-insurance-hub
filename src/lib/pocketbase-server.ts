/**
 * Server-Side PocketBase Handler für Next.js
 * Kommuniziert direkt mit dem PocketBase-Container über das interne Docker-Netzwerk
 * oder über lokale Fallback-URLs (z.B. NAS IP 192.168.178.27).
 */

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

  const validMembers: Member[] = [];

  for (const m of rawMembers) {
    if (m.first_name === "__hub_settings__") {
      try {
        const parsed = JSON.parse(m.notes || "{}");
        if (parsed.claims) metaClaims = parsed.claims;
        if (parsed.milestoneOverrides) metaMilestones = parsed.milestoneOverrides;
        if (parsed.paperlessConfig) metaPaperless = parsed.paperlessConfig;
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

    validMembers.push({
      id: m.id,
      first_name: m.first_name,
      role: m.role || "Familienmitglied",
      birth_date: m.birth_date || "2000-01-01",
      avatar_color: m.avatar_color || "blue",
      avatar_emoji: m.avatar_emoji || "👤",
      notes: m.notes || undefined,
    });
  }

  const validProviders: InsurerProvider[] = rawProviders.map((p) => ({
    id: p.id,
    name: p.name,
    portal_url: p.portal_url || undefined,
    emergency_hotline: p.emergency_hotline || undefined,
    support_email: p.support_email || undefined,
    paperless_correspondent_id: p.paperless_correspondent_id || undefined,
    paperless_correspondent_name: p.paperless_correspondent_name || undefined,
  }));

  const validCategories: CatalogCategory[] = rawCategories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    type: c.type,
    priority_tier: c.priority_tier || undefined,
    group_label: c.group_label || "Allgemein",
    description: c.description || "",
    consumer_tip: c.consumer_tip || undefined,
    icon_name: c.icon_name || "ShieldCheck",
    is_visible: c.is_visible ?? true,
    sort_order: c.sort_order ?? 99,
  }));

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
      type: c.type,
      category_slug: c.category_slug,
      priority_override: c.priority_override || undefined,
      is_hidden: c.is_hidden ?? false,
      provider_id: c.provider_id || "",
      policy_holder_id: c.policy_holder_id || "",
      insured_member_ids: Array.isArray(c.insured_member_ids)
        ? c.insured_member_ids
        : [],
      policy_number: c.policy_number || "",
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
      cancellation_period_days: c.cancellation_period_days ?? 30,
      contract_end_date: c.contract_end_date || undefined,
      status: c.status || "active",
      emergency_group: (c.emergency_Group || c.emergency_group || "sonstige") as any,
      payment_method: c.payment_method || "SEPA-Lastschrift",
      notes: typeof extraNotes.originalNotes === "string" ? extraNotes.originalNotes : c.notes || "",
    };
  });

  const hasData =
    validMembers.length > 0 ||
    validProviders.length > 0 ||
    validContracts.length > 0;

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

/**
 * Schreibt Daten (Members, Providers, Categories, Contracts, Meta-Settings) in PocketBase.
 */
export async function pushToPocketBase(payload: SyncPayload): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
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
        const body = {
          first_name: mem.first_name,
          role: mem.role || "Familienmitglied",
          birth_date: mem.birth_date || "",
          avatar_color: mem.avatar_color || "blue",
          avatar_emoji: mem.avatar_emoji || "👤",
          notes: mem.notes || "",
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
          // Create new record (if id is 15 chars alphanumeric, PB accepts it, else let PB generate)
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
    if (payload.providers && Array.isArray(payload.providers)) {
      const existingRes = await fetch(
        `${baseUrl}/api/collections/insurers_providers/records?perPage=500`,
        { cache: "no-store" }
      ).then((r) => r.json());
      const existingMap = new Map<string, any>(
        (existingRes.items || []).map((p: any) => [p.id, p])
      );

      for (const prov of payload.providers) {
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
        const body = {
          slug: cat.slug,
          name: cat.name,
          type: cat.type,
          priority_tier: cat.priority_tier || "empfohlen",
          group_label: cat.group_label || "Allgemein",
          description: cat.description || "",
          consumer_tip: cat.consumer_tip || "",
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
          paperless_document_id: con.paperless_document_id,
          paperless_document_title: con.paperless_document_title,
        };

        const body: any = {
          title: con.title,
          type: con.type,
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
          cancellation_period_days: Number(con.cancellation_period_days) || 30,
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

    // 5. Sync Meta Settings (claims, milestones, paperlessConfig)
    if (
      payload.claims !== undefined ||
      payload.milestones !== undefined ||
      payload.paperlessConfig !== undefined
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
