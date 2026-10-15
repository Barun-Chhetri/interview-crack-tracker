#!/bin/sh
set -e

echo "=> Initializing application container..."

# If PostgreSQL DATABASE_URL is configured
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -qE '^postgres(ql)?://'; then
  echo "=> PostgreSQL configuration detected ($DB_HOST:$DB_PORT/$DB_NAME)..."
  (
    # Wait briefly for networking and then attempt push and seed
    sleep 2
    echo "=> Checking PostgreSQL schema and connectivity..."
    if prisma db push --schema=/app/prisma/schema.prisma --skip-generate; then
      echo "=> PostgreSQL schema synchronized successfully!"
      if [ -f /app/prisma/dist/seed.js ]; then
        echo "=> Verifying database seed data..."
        node /app/prisma/dist/seed.js 2>/dev/null || true
      fi
    else
      echo "=> NOTE: PostgreSQL on $DB_HOST:$DB_PORT is currently not accepting connections."
      echo "=> Next.js will connect automatically once the PostgreSQL container is started on the host."
    fi
  ) &
fi

exec "$@"
