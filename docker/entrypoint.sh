#!/bin/sh
set -e

PGHOST=${PGHOST:-postgres}
PGPORT=${PGPORT:-5432}
MONGO_HOST=${MONGO_HOST:-mongo}
MONGO_PORT=${MONGO_PORT:-27017}

until nc -z "$PGHOST" "$PGPORT"; do sleep 1; done
until nc -z "$MONGO_HOST" "$MONGO_PORT"; do sleep 1; done

npx prisma migrate deploy

if [ "${SEED:-false}" = "true" ]; then
  npm run seed
fi

if [ -f dist/server.js ]; then
  exec node dist/server.js
fi

npm run build || true
if [ -f dist/server.js ]; then
  exec node dist/server.js
fi

exec npx tsx src/server.ts
