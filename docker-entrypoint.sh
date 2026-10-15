#!/bin/sh
set -e

# If the SQLite database does not exist, copy from the pre-seeded template
if [ ! -f /app/prisma/dev.db ] && [ -f /app/prisma-template/dev.db ]; then
  echo "=> Initializing SQLite database from pre-seeded template..."
  mkdir -p /app/prisma
  cp /app/prisma-template/dev.db /app/prisma/dev.db
fi

exec "$@"
