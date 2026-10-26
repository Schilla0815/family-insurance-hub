/// <reference path="../pb_data/types.d.ts" />
/**
 * Automatische PocketBase Initial-Migration für Family Insurance & Subscription Hub
 * Erstellt die 4 Kern-Collections: members, insurers_providers, catalog_categories, contracts
 */
migrate((db) => {
  const dao = new Dao(db);

  // 1. members (Familienmitglieder)
  const members = new Collection({
    id: "col_members001",
    name: "members",
    type: "base",
    system: false,
    schema: [
      { name: "first_name", type: "text", required: true },
      { name: "role", type: "text", required: false },
      { name: "birth_date", type: "date", required: false },
      { name: "avatar_color", type: "text", required: false },
      { name: "avatar_emoji", type: "text", required: false },
      { name: "notes", type: "text", required: false }
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  });
  dao.saveCollection(members);

  // 2. insurers_providers (Anbieter & Versicherungsgesellschaften)
  const providers = new Collection({
    id: "col_provider01",
    name: "insurers_providers",
    type: "base",
    system: false,
    schema: [
      { name: "name", type: "text", required: true },
      { name: "portal_url", type: "url", required: false },
      { name: "emergency_hotline", type: "text", required: false },
      { name: "support_email", type: "email", required: false },
      { name: "paperless_correspondent_id", type: "number", required: false },
      { name: "paperless_correspondent_name", type: "text", required: false }
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  });
  dao.saveCollection(providers);

  // 3. catalog_categories (Katalog-Vorlagen für Versicherungen & Abos nach MUSS / EMPFOHLEN / KANN)
  const catalog = new Collection({
    id: "col_catalog001",
    name: "catalog_categories",
    type: "base",
    system: false,
    schema: [
      { name: "slug", type: "text", required: true },
      { name: "name", type: "text", required: true },
      { name: "type", type: "select", required: true, options: { maxSelect: 1, values: ["insurance", "subscription"] } },
      { name: "priority_tier", type: "select", required: true, options: { maxSelect: 1, values: ["muss", "empfohlen", "kann"] } },
      { name: "group_label", type: "text", required: false },
      { name: "description", type: "text", required: false },
      { name: "consumer_tip", type: "text", required: false },
      { name: "icon_name", type: "text", required: false },
      { name: "is_visible", type: "bool", required: false },
      { name: "sort_order", type: "number", required: false }
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  });
  dao.saveCollection(catalog);

  // 4. contracts (Policen & Abonnements)
  const contracts = new Collection({
    id: "col_contract01",
    name: "contracts",
    type: "base",
    system: false,
    schema: [
      { name: "title", type: "text", required: true },
      { name: "type", type: "select", required: true, options: { maxSelect: 1, values: ["insurance", "subscription"] } },
      { name: "category_slug", type: "text", required: true },
      { name: "priority_override", type: "select", required: false, options: { maxSelect: 1, values: ["muss", "empfohlen", "kann"] } },
      { name: "is_hidden", type: "bool", required: false },
      { name: "provider_id", type: "relation", required: false, options: { collectionId: "col_provider01", maxSelect: 1 } },
      { name: "policy_holder_id", type: "relation", required: false, options: { collectionId: "col_members001", maxSelect: 1 } },
      { name: "insured_member_ids", type: "relation", required: false, options: { collectionId: "col_members001", maxSelect: 10 } },
      { name: "policy_number", type: "text", required: false },
      { name: "paperless_tag", type: "text", required: false },
      { name: "paperless_custom_query", type: "text", required: false },
      { name: "cost", type: "number", required: true },
      { name: "billing_cycle", type: "select", required: true, options: { maxSelect: 1, values: ["monthly", "quarterly", "semi_annual", "annual"] } },
      { name: "next_payment_date", type: "text", required: false },
      { name: "deductible", type: "number", required: false },
      { name: "coverage_amount", type: "text", required: false },
      { name: "cancellation_period_days", type: "number", required: false },
      { name: "contract_end_date", type: "text", required: false },
      { name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["active", "cancelled", "paused"] } },
      { name: "emergency_Group", type: "text", required: false },
      { name: "notes", type: "text", required: false },
      { name: "payment_method", type: "text", required: false }
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  });
  dao.saveCollection(contracts);
}, (db) => {
  const dao = new Dao(db);
  ["contracts", "catalog_categories", "insurers_providers", "members"].forEach((name) => {
    try {
      const col = dao.findCollectionByNameOrId(name);
      if (col) dao.deleteCollection(col);
    } catch (_) {}
  });
});
