#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${BACKUP_DIR:?Set BACKUP_DIR on an encrypted backup volume}"
mkdir -p "$BACKUP_DIR"
backup="$BACKUP_DIR/nucleo-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose -f /opt/nucleo/current/infrastructure/production/compose.yaml exec -T postgres pg_dump -U nucleo -d nucleo -Fc > "$backup"
test -s "$backup"
docker compose -f /opt/nucleo/current/infrastructure/production/compose.yaml exec -T postgres pg_restore --list < "$backup" > /dev/null
sha256sum "$backup" > "$backup.sha256"
echo "Backup created and archive checked. Perform a restore drill before relying on it."
