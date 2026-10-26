# Family Insurance & Subscription Hub

Selbstgehostete All-in-One Webanwendung zur ganzheitlichen Verwaltung aller **Familienversicherungen** und **wiederkehrenden Abonnements** – inklusive integriertem **MUSS / EMPFOHLEN / KANN Bedarfs-Kompass**, **mobiler Notfallansicht** und direkter **Paperless-ngx NAS-Integration** als Single Source of Truth für alle Policen-PDFs.

---

## Highlights & Features

* **MUSS / EMPFOHLEN / KANN Kompass (`/catalog`):**
  * Vorkonfigurierter Katalog mit **20 Versicherungs-** und **13 Abo-Kategorien** nach Empfehlungen von Verbraucherschützern (*Finanztip* / *Stiftung Warentest*).
  * Jede Kategorie und jeder Vertrag lässt sich individuell **ein- und ausblenden** (z. B. *Tierhalterhaftpflicht* ohne Haustier ausblenden).
  * Automatische Erkennung von **Versorgungslücken** bei eingeblendeten `MUSS`-Kategorien sowie Ausweis des monatlichen & jährlichen **KANN-Einsparpotenzials**.
* **Paperless-ngx Integration (`/api/paperless/*`):**
  * Keine doppelte PDF-Ablage in PocketBase.
  * Automatische Zuordnung aller Dokumente eines Vertrags über `policy_number` (Policennummer), `paperless_tag` oder Korrespondent.
  * Geschützter Backend-Proxy für **In-App PDF-Vorschau**, **Direkt-Download** und **Deep-Links** in deine `paperless-ngx`-Oberfläche.
* **Desktop- & Mobile-Optimierung (PWA-Ready):**
  * **Desktop:** Übersichtliche Sidebar, Schnellsuche (`Ctrl+K` / `⌘K`), Container-Query-basierte Sticky-Tabellen (`@container`).
  * **Mobile / Smartphone:** Daumenfreundliche Bottom-Navigation, Touch-Karten, native `<dialog closedby="any">` Overlays und installierbares Web-App-Manifest (`manifest.json`).
* **Mobile Notfall- & Schadensansicht (`/emergency`):**
  * 1-Klick-Anruf der Schaden-Hotlines (`tel:...`), 1-Klick Kopieren der Policennummer, Anzeige von Selbstbeteiligung, Geburtsdaten der Mitversicherten und Direktabruf des Versicherungsscheins.

---

## Schnellstart (Lokal)

```bash
npm install
npm run dev
```

Die App ist anschließend unter `http://localhost:3000` erreichbar.

---

## Betrieb auf dem NAS (Docker Compose)

1. `.env.example` nach `.env` kopieren und `PAPERLESS_URL` sowie `PAPERLESS_TOKEN` eintragen:
   ```bash
   cp .env.example .env
   ```
2. Container starten:
   ```bash
   docker compose up -d --build
   ```
   * **Web-App (Next.js):** `http://<NAS-IP>:3000`
   * **PocketBase Admin & API:** `http://<NAS-IP>:8090/_/`
   * **Automatisches SQLite-Backup:** Tägliches Backup nach `./backups` über den `family-hub-backup` Container.
