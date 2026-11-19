#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
out="$root/flutter/ui/test/goldens"
mkdir -p "$out"
docker build --platform linux/amd64 --tag xds-flutter-goldens "$root/flutter/scripts/golden-image"
docker run --rm --platform linux/amd64 \
  --mount "type=bind,source=$root,target=/source,readonly" \
  --mount "type=bind,source=$out,target=/output" \
  --mount type=volume,source=xds-flutter-golden-cache,target=/cache \
  xds-flutter-goldens
