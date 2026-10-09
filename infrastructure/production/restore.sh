#!/usr/bin/env bash
set -euo pipefail
# Restores only into an explicitly named NEW database. Never overwrites nucleo.
: "${RESTORE_DATABASE:?Name a new restore database}"
: "${BACKUP_FILE:?Select the dump file}"
[[ "$RESTORE_DATABASE" =~ ^nucleo_restore_[a-zA-Z0-9_]+$ ]] || { echo "Use a new nucleo_restore_* database"; exit 1; }
compose=(docker compose -f /opt/nucleo/current/infrastructure/production/compose.yaml)
"${compose[@]}" exec -T postgres createdb -U nucleo "$RESTORE_DATABASE"
"${compose[@]}" exec -T postgres pg_restore -U nucleo -d "$RESTORE_DATABASE" --exit-on-error < "$BACKUP_FILE"
echo "Restore finished into the new database; validate before any production cutover."
