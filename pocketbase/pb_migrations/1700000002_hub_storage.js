/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 1700000002_hub_storage.js
 * Erstellt die 'hub_store' Collection für universelle, geräteübergreifende Synchronisation
 * aller Daten (Verträge, Mitglieder, Kategorien, Anbieter, Schäden, Meilensteine, Paperless-Config und Benutzer).
 */
migrate((db) => {
  const dao = new Dao(db);

  try {
    const existing = dao.findCollectionByNameOrId("hub_store");
    if (existing) {
      return;
    }
  } catch (_) {
    // Collection existiert noch nicht, fahre fort
  }

  const hubStore = new Collection({
    id: "col_hub_store01",
    name: "hub_store",
    type: "base",
    system: false,
    schema: [
      {
        name: "key",
        type: "text",
        required: true,
        unique: true,
        options: {
          min: 1,
          max: 100,
          pattern: ""
        }
      },
      {
        name: "data",
        type: "json",
        required: false,
        options: {}
      }
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  });

  dao.saveCollection(hubStore);
}, (db) => {
  const dao = new Dao(db);
  try {
    const col = dao.findCollectionByNameOrId("hub_store");
    if (col) {
      dao.deleteCollection(col);
    }
  } catch (_) {}
});
