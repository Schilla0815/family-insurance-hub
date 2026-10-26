# 🚀 Docker NAS Deployment Guide

Diese Anleitung zeigt dir Schritt für Schritt, wie du den **Family Insurance & Subscription Hub** auf deinem NAS (z. B. **Synology DSM / Container Manager**, **QNAP Container Station**, **unRAID**, **TrueNAS SCALE**, **Portainer** oder generischem **Debian/Ubuntu Linux**) per Docker Compose betreibst.

---

## 📦 Komponenten des Stacks

Der Docker-Stack besteht aus 3 perfekt aufeinander abgestimmten Containern:

1. **`family-hub-web` (Port 3000):**
   * Produktions-Container mit schlankem Next.js Standalone Node.js 22 Image.
   * Verbindet sich im Browser automatisch mit der Host-IP deines NAS auf Port 8090.
   * Beinhaltet den sicheren Backend-Proxy für Paperless-ngx.
2. **`family-hub-pocketbase` (Port 8090):**
   * Multi-Architektur PocketBase Image (unterstützt Intel/AMD x86_64 und ARM64 wie Realtek oder Raspberry Pi).
   * Automatische Migration des Datenbankschemas beim ersten Start.
   * Persistente Speicherung der SQLite-Datenbank unter `./pb_data`.
3. **`family-hub-backup`:**
   * Schlanker Alpine-Container mit Cron-Dienst.
   * Erstellt täglich um 03:00 Uhr nachts ein komprimiertes SQLite-Online-Backup (`.db.gz`) im Ordner `./backups`.
   * Löscht alte Backups automatisch nach der eingestellten Retention (Standard: 30 Tage).

---

## 🛠️ Schritt 1: Dateien auf das NAS übertragen

Erstelle auf deinem NAS im Docker-Verzeichnis einen Ordner (z. B. `/volume1/docker/family-hub/`).

Kopiere den gesamten Projektordner auf dein NAS – entweder per:
* **Git:**
  ```bash
  cd /volume1/docker/
  git clone <dein-repo-url> family-hub
  cd family-hub
  ```
* **Oder per Netzwerkfreigabe (SMB / File Station):**
  Kopiere den Projektordner `FamilyVersicherungsApp` in dein NAS Docker-Verzeichnis.
  *(Hinweis: `.dockerignore` verhindert automatisch, dass lokale Windows-`node_modules` oder Caches mit in den Container gebaut werden).*

---

## ⚙️ Schritt 2: `.env` Datei anlegen

Kopiere die Vorlage `.env.example` zu `.env`:

```bash
cp .env.example .env
```

Passe die Werte in `.env` an:
```env
# Optional: Nur erforderlich bei externem Domain-Routing oder Reverse Proxy (z. B. Nginx / Traefik / Synology Reverse Proxy).
# Im lokalen Heimnetzwerk verbindet sich die App automatisch mit der IP deines NAS auf Port 8090!
# NEXT_PUBLIC_POCKETBASE_URL=http://192.168.178.50:8090

# Paperless-ngx Verbindung
PAPERLESS_URL=http://192.168.178.50:8000
NEXT_PUBLIC_PAPERLESS_PUBLIC_URL=http://192.168.178.50:8000
PAPERLESS_TOKEN=dein_geheimer_paperless_api_token
```

---

## 🚀 Schritt 3: Stack starten

### Option A: Über die SSH-Konsole (Empfohlen)

Navigiere in das Projektverzeichnis und führe aus:

```bash
docker compose up -d --build
```

### Option B: Über Synology Container Manager GUI

1. Öffne im Synology DSM den **Container Manager**.
2. Gehe auf **Projekt** -> **Erstellen**.
3. Gib dem Projekt einen Namen (z. B. `family-hub`).
4. Wähle den Pfad aus, in dem die Dateien liegen (z. B. `/docker/family-hub`).
5. Wähle **Vorhandene docker-compose.yml verwenden**.
6. Klicke auf **Weiter** und **Projekt erstellen**. Das Image wird automatisch gebaut und gestartet.

---

## 🌐 Zugriff auf die Oberflächen

Nach dem Start erreichst du die Dienste unter der IP deines NAS:

| Dienst | URL | Beschreibung |
|---|---|---|
| **Family Hub App** | `http://<DEINE-NAS-IP>:3000` | Hauptanwendung (Katalog, Policen, Notfallansicht, Einstellungen) |
| **PocketBase Admin UI** | `http://<DEINE-NAS-IP>:8090/_/` | Datenbank-Dashboard (beim 1. Aufruf Admin-Account anlegen) |
| **PocketBase API** | `http://<DEINE-NAS-IP>:8090/api/` | REST-Endpunkte |

---

## 💾 Datensicherung & Backups

* **Live-Datenbank:** Liegt im Ordner `./pb_data/data.db` auf deinem NAS.
* **Automatische Backups:** Werden täglich um 03:00 Uhr im Ordner `./backups/` als `family_hub_YYYY-MM-DD_HH-MM-SS.db.gz` abgelegt.
* **Manuelles Backup sofort auslösen:**
  ```bash
  docker exec -it family-hub-backup /backup.sh
  ```

---

## 📋 Nützliche Befehle

* **Logs ansehen:**
  ```bash
  docker compose logs -f web
  docker compose logs -f pocketbase
  ```
* **Status prüfen:**
  ```bash
  docker compose ps
  ```
* **Stack stoppen:**
  ```bash
  docker compose down
  ```
* **Neu bauen nach Code-Änderungen:**
  ```bash
  docker compose up -d --build
  ```
