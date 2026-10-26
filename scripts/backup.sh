#!/bin/sh
# Tägliches Online-Backup der PocketBase SQLite Datenbank für das NAS
set -e

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/backups"
DB_FILE="/pb_data/data.db"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
  sqlite3 "$DB_FILE" ".backup '${BACKUP_DIR}/family_hub_${TIMESTAMP}.db'"
  gzip -f "${BACKUP_DIR}/family_hub_${TIMESTAMP}.db"
  echo "[Backup] Erfolgreich erstellt: family_hub_${TIMESTAMP}.db.gz"
  find "$BACKUP_DIR" -name "family_hub_*.db.gz" -mtime +"$RETENTION_DAYS" -delete
else
  echo "[Backup] Keine Datenbank unter $DB_FILE gefunden."
fi
