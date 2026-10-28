# Family Insurance & Subscription Hub

## 1. Projektziel
Eine selbstgehostete Open-Source-Webanwendung zur ganzheitlichen Verwaltung aller Familienversicherungen und wiederkehrenden Abos mit relationalen Familien- und Versicherungsfeatures sowie einem frei per Ankreuzen konfigurierbaren Versicherungs- und Abo-Katalog. Das Projekt wird im Antigravity-Workspace entwickelt und per Docker auf dem lokalen NAS betrieben.

## 2. Architektur & Tech-Stack
* **Architektur:** Option A (Eigenständige All-in-One-Lösung mit `paperless-ngx`-Anbindung).
* **Backend & DB:** PocketBase (Go + SQLite embedded). Schlank, extrem geringer RAM-Verbrauch (<30 MB), integrierte Auth, REST-API.
* **Dokumenten-Management (Single Source of Truth):** `paperless-ngx` (läuft auf demselben NAS). Keine doppelte PDF-Ablage in PocketBase; der Zugriff auf Policen und Vertragsdokumente erfolgt über die `paperless-ngx` REST-API.
* **Frontend:** Next.js (App Router, React, TypeScript) mit Tailwind CSS und shadcn/ui. Vollständig responsiv: Feste Sidebar auf dem Desktop, daumenfreundliche Bottom-Navigation auf dem Smartphone, Drawer-Dialoge und PWA-Fähigkeit für die Installation auf dem Homescreen.
* **Hosting:** Docker Compose auf heimischem NAS (persistentes Volume für DB, direkte Netzwerk-Kommunikation mit `paperless-ngx`).

## 3. Klassifizierung & Katalog (Vorlagen zum Ein-/Ausblenden)

Um einen vollständigen Überblick zu behalten (inkl. Erkennung von Versorgungslücken oder Einsparpotenzialen), liefert die App einen vorkonfigurierten Katalog für **Versicherungen** (orientiert an Verbraucherschutz-Empfehlungen wie *Finanztip* / *Stiftung Warentest* / *Bund der Versicherten*) und **Sonstige Abos**. Jede Kategorie/Vorlage lässt sich individuell für den eigenen Haushalt **ein- oder ausblenden** (z. B. *Wohngebäude* ausblenden bei Miete, *Tierhalterhaftpflicht* ausblenden ohne Haustier).

### 3.1 Versicherungen (`type = insurance`)

#### 🔴 MUSS-Versicherungen (Gesetzliche Pflicht & Existenzschutz)
*Schützen vor dem finanziellen Ruin im Ernstfall – sollte jeder Haushalt bzw. jede betroffene Person besitzen:*
1. **Kranken- & Pflegeversicherung** (`kranken_pflege`) – Gesetzliche Pflicht für alle Familienmitglieder.
2. **Privathaftpflichtversicherung (Familientarif)** (`privathaftpflicht`) – Wichtigste freiwillige Versicherung; deckt existenzbedrohende Personen-, Sach- und Vermögensschäden Dritter ab.
3. **Berufsunfähigkeitsversicherung (BU)** (`berufsunfaehigkeit`) – Existenzsicherung der Hauptverdiener (alternativ Erwerbsunfähigkeits- oder Grundfähigkeitsversicherung).
4. **Kfz-Haftpflichtversicherung** (`kfz_haftpflicht`) – Gesetzliche Pflicht für jedes zugelassene Fahrzeug/Motorrad/E-Scooter.
5. **Risikolebensversicherung** (`risikoleben`) – **MUSS für Familien** mit Kindern oder laufendem Immobilienkredit zur Absicherung der Hinterbliebenen.
6. **Wohngebäudeversicherung (inkl. Elementarschaden)** (`wohngebaeude`) – **MUSS für Hausbesitzer**; schützt vor Feuer, Leitungswasser, Sturm/Hagel und Starkregen/Hochwasser.
7. **Hundehalter- / Pferdehalterhaftpflicht** (`tierhaftpflicht`) – **MUSS für Hund-/Pferdebesitzer** (in vielen Bundesländern gesetzliche Pflicht).
8. **Auslandsreisekrankenversicherung (Familientarif)** (`auslandskranken`) – Kostet ca. 20–30 €/Jahr für die ganze Familie, schützt vor extrem teuren Krankenrücktransporten und Behandlungen im Ausland.

#### 🟡 EMPFOHLENE / KANN-Versicherungen (Sinnvoll je nach Lebenslage & Vermögen)
*Schützen vor hohen, aber meist nicht existenzvernichtenden Kosten:*
9. **Hausratversicherung (ggf. inkl. Fahrraddiebstahl / Elementar)** (`hausrat`) – Sinnvoll bei hochwertiger Einrichtung; ersetzt den Neuwert bei Einbruch, Feuer oder Wasserschaden.
10. **Kfz-Kaskoversicherung (Teilkasko / Vollkasko)** (`kfz_kasko`) – Vollkasko für Neuwagen/finanzierte Autos (erste 3–5 Jahre), Teilkasko für mittelalte Fahrzeuge.
11. **Zahnzusatzversicherung** (`zahnzusatz`) – Sinnvoll zur Abfederung hoher Eigenanteile bei Zahnersatz oder Kieferorthopädie (Kinder).
12. **Rechtsschutzversicherung (Privat-, Berufs-, Verkehrs-, Wohnrecht)** (`rechtsschutz`) – Sinnvoll, wenn man das Kostenrisiko von Rechtsstreitigkeiten nicht aus Rücklagen tragen möchte.
13. **Kinderinvaliditäts- / Kinderunfallversicherung** (`kinderunfall`) – Sinnvoll zur Absicherung dauerhafter Unfall- oder Krankheitsfolgen bei Kindern.
14. **Pflegezusatzversicherung** (`pflegezusatz`) – Optional zur Schließung der Pflegelücke im Alter.
15. **Krankenhaus- / Ambulante Zusatzversicherung** (`krankenzusatz`) – Komfortschutz (Chefarzt, 1-/2-Bett-Zimmer, Heilpraktiker).

#### ⚪ Reine KANN- / Komfort-Versicherungen (Meist verzichtbar – hohes Einsparpotenzial)
*Deckungssummen sind oft niedrig, Beiträge im Verhältnis hoch:*
16. **Reiserücktritts- & Reiseabbruchversicherung** (`reiseruecktritt`) – Nur bei sehr teuren Familienreisen sinnvoll.
17. **Tierkranken- / Tier-OP-Versicherung** (`tierkranken`) – Kann sich bei teuren Tierarzt-OPs lohnen, alternativ eigenes Rücklagenkonto.
18. **Unfallversicherung (Erwachsene)** (`unfall_erwachsene`) – Greift nur bei Unfällen (nicht bei Krankheit); BU ist deutlich wichtiger.
19. **Geräte- / Handy- / Elektronik- / Brillenversicherung** (`geraete_brille`) – Fast immer verzichtbar; Schäden lassen sich meist günstiger selbst zahlen.
20. **Sterbegeld- / Kapitallebens- / Glas- / Reisegepäckversicherung** (`sonstige_kann`) – Von Verbraucherschützern in der Regel nicht empfohlen.

---

### 3.2 Sonstige Abos & Fixkosten (`type = subscription`)

Auch wiederkehrende Abos werden in **MUSS (Basis/Infrastruktur)** und **KANN (Freizeit/Komfort)** unterteilt, um im Haushalt sofort zu sehen, welche Kosten fix sind und welche bei Bedarf pausiert oder gekündigt werden können:

#### 🔴 MUSS-Abos (Essenzielle Haushalts- & Digital-Infrastruktur)
1. **Internet / Festnetz / Glasfaser** (`internet_festnetz`)
2. **Mobilfunkverträge (Familie & Kinder)** (`mobilfunk`)
3. **Rundfunkbeitrag (GEZ)** (`rundfunkbeitrag`)
4. **Energie & Versorgung (Strom / Gas / Wasser-Abschläge)** (`energie_versorgung`) – *optional einblendbar*
5. **Wichtige IT-Basis & Sicherheit (Passwort-Manager, Cloud-Backup / iCloud / Google One / Domain)** (`cloud_security`)
6. **ÖPNV / Mobilität (Deutschlandticket, Schulbus-Abo)** (`mobilitaet_oepnv`)

#### 🟢 KANN-Abos (Unterhaltung, Lifestyle & Komfort – Optimierungs-Kandidaten)
7. **Video-Streaming** (`video_streaming`) – z. B. Netflix, Disney+, WOW, Apple TV+, YouTube Premium.
8. **Musik- & Audio-Streaming** (`audio_streaming`) – z. B. Spotify Family, Apple Music, Audible, Tonies/Tigertones.
9. **Shopping & Liefer-Abos** (`shopping_delivery`) – z. B. Amazon Prime, Uber One, Kochboxen.
10. **Gaming-Abos** (`gaming`) – z. B. PlayStation Plus, Xbox Game Pass, Nintendo Switch Online.
11. **Software, Apps & KI-Tools** (`software_ai`) – z. B. Microsoft 365 Family, Adobe, ChatGPT Plus / Claude / Gemini.
12. **Nachrichten, Magazine & Weiterbildung** (`medien_bildung`) – z. B. Tageszeitung-Digitalabo, Readly, Lern-Apps (Anton, Duolingo Family).
13. **Sport, Fitness & Vereine** (`sport_verein`) – z. B. Fitnessstudio, Sportverein, Musikschule, ADAC-Mitgliedschaft.

---

## 4. Datenmodell (Kernentitäten)

### `members` (Familienmitglieder)
* `id` (PK)
* `first_name` (Text)
* `birth_date` (Date)
* `avatar` (File/Image)
* `notes` (Text)

### `insurers_providers` (Anbieter/Gesellschaften)
* `id` (PK)
* `name` (Text)
* `portal_url` (URL)
* `emergency_hotline` (Text)
* `support_email` (Email)
* `logo` (File/Image)
* `paperless_correspondent_id` (Number, optional – Verknüpfung zum Korrespondenten in `paperless-ngx`)

### `catalog_categories` (Katalog-Vorlagen für Versicherungen & Abos)
*Steuert die Standard-Übersicht, Klassifizierung und Sichtbarkeit im Haushalt:*
* `id` (PK)
* `slug` (Text, eindeutig, z. B. `privathaftpflicht`, `video_streaming`)
* `name` (Text, z. B. "Privathaftpflichtversicherung")
* `type` (Select: `insurance` | `subscription`)
* `priority_tier` (Select: `muss` | `empfohlen` | `kann`)
* `description` (Text – Kurzerklärung / Verbraucherschutz-Tipp, wann nötig)
* `is_visible` (Boolean – flexibel im Haushalt ein-/ausblendbar, z. B. "Für uns nicht relevant")
* `sort_order` (Number)

### `contracts` (Aktive Policen & Abonnements)
* `id` (PK)
* `title` (Text, z. B. "Familien-Haftpflicht Comfort" oder "Netflix Standard")
* `type` (Select: `insurance` | `subscription`)
* `category_id` (Relation -> `catalog_categories`)
* `priority_override` (Select optional: `muss` | `empfohlen` | `kann` – falls ein einzelner Vertrag vom Standard der Kategorie abweicht)
* `is_hidden` (Boolean – einzelner Vertrag kann in der Hauptansicht ein-/ausgeblendet werden)
* `provider_id` (Relation -> `insurers_providers`)
* `policy_holder_id` (Relation -> `members`, Versicherungsnehmer / Vertragsinhaber)
* `insured_members` (Relation multi -> `members`, mitversicherte / mitnutzende Personen)
* `policy_number` (Text – Vertrags-/Policennummer, dient gleichzeitig als Matching-Kriterium für `paperless-ngx`)
* `paperless_tag` (Text/Number, optional – spezifisches Tag oder Custom-Field-Filter in `paperless-ngx`)
* `cost` (Number)
* `billing_cycle` (Select: `monthly`, `quarterly`, `semi_annual`, `annual`)
* `next_payment_date` (Date)
* `deductible` (Number, Selbstbeteiligung in €)
* `coverage_amount` (Number/Text, Deckungssumme)
* `cancellation_period_days` (Number)
* `contract_end_date` (Date)
* `status` (Select: `active`, `cancelled`, `paused`)

## 5. Kernfeatures & Prioritäten
1. **MVP CRUD & Dashboard (mit MUSS/KANN-Filter):**
   - Monats- & Jahresbelastung (Gesamthaushalt + Filter pro Person).
   - Aufschlüsselung nach **MUSS-Fixkosten** vs. **KANN-Ausgaben** (zeigt sofort das monatliche Einsparpotenzial).
   - **Bedarfs-Checkliste & Ein-/Ausblend-Modus:** Zeigt alle relevanten Kategorien an (inkl. Hinweis, falls eine eingeblendete MUSS-Versicherung noch keinen aktiven Vertrag hat). Nicht benötigte Kategorien (z. B. Hundehaftpflicht ohne Hund) oder einzelne Verträge lassen sich per Toggle jederzeit ein- und ausblenden.
   - Kündigungs-Ampel (Tage bis Kündigungsfrist).
2. **Notfall- / Schadensansicht (Mobile):**
   - 1-Klick-Ansicht aller aktiven Versicherungen mit Policennummer, Selbstbeteiligung, Notfall-Telefonnummer und Schnellzugriff auf den aktuellen Versicherungsschein aus `paperless-ngx`.
3. **Paperless-ngx Integration (Single Source of Truth):**
   - Automatische Zuordnung aller Dokumente eines Vertrags über `paperless-ngx` Tags, Custom Fields oder die `policy_number` (Policennummer).
   - Sicherer Backend-Proxy (API-Token bleibt auf dem Server) für direkte PDF-Vorschau, Thumbnails und Downloads innerhalb der App.
   - Deep-Links zum direkten Öffnen des Dokuments bzw. der gefilterten Ansicht in `paperless-ngx`.
4. **Export & Backup:**
   - Tägliches Backup der SQLite-Datei auf NAS-Share.
