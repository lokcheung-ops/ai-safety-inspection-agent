#!/bin/sh

set -eu

input="generated/work-package-1/pdfs/form3a-five-week-combined.pdf"
output_dir="tmp/pdfs/gate4c"

command -v pdfinfo >/dev/null
command -v pdftoppm >/dev/null
test "$(pdfinfo "$input" | awk '/^Pages:/ {print $2}')" = "20"

rm -rf "$output_dir"
mkdir -p "$output_dir"
pdftoppm -png -r 120 "$input" "$output_dir/page" >/dev/null 2>&1
test "$(find "$output_dir" -type f -name 'page-*.png' | wc -l | tr -d ' ')" = "20"

printf 'Rendered 20 Gate 4C pages to %s\n' "$output_dir"
