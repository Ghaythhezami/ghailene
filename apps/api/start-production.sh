#!/bin/sh
set -eu

npm run db:migrate -w @basmat-fan/api

if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  npm run db:seed -w @basmat-fan/api
elif [ -n "${ADMIN_EMAIL:-}" ] || [ -n "${ADMIN_PASSWORD:-}" ]; then
  echo "Set both ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap the administrator." >&2
  exit 1
fi

exec npm run start -w @basmat-fan/api
