#!/bin/sh

set -eu

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
temporary_checkout=$(mktemp -d "${TMPDIR:-/tmp}/gate4b-clean.XXXXXX")
trap 'rm -rf "$temporary_checkout"' EXIT HUP INT TERM

tar \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./.pnpm-store' \
  -C "$repository_root" \
  -cf - . | tar -C "$temporary_checkout" -xf -

test ! -e "$temporary_checkout/node_modules"
rm -f "$temporary_checkout/generated/work-package-1/normalized-data.xlsx"
rm -f "$temporary_checkout/generated/work-package-1/normalized-data.xlsx.inspect.ndjson"

cd "$temporary_checkout"
CI=true corepack pnpm install --frozen-lockfile
test ! -e node_modules/@oai/artifact-tool
CI=true corepack pnpm generate:gate4b
CI=true corepack pnpm test:gate4b
