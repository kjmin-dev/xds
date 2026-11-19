#!/bin/bash
set -euo pipefail

# Honor the template's mise checksum. A scaffold pins the same version in mise.toml
# and can record baselines before it has generated a mise.lock of its own.
read -r version archive digest < <(python3 - <<'PY'
from pathlib import Path
import json
import tomllib
import urllib.request
root = Path('/source')
version = tomllib.loads((root / 'mise.toml').read_text())['tools']['flutter']
config = root / 'mise.lock'
locked = tomllib.loads(config.read_text()).get('tools', {}).get('flutter', []) if config.is_file() else []
for entry in locked:
    platform = entry.get('platforms.linux-x64')
    if entry['version'] == version and platform:
        print(version, platform['url'], platform['checksum'].removeprefix('sha256:'))
        break
else:
    base = 'https://storage.googleapis.com/flutter_infra_release/releases'
    with urllib.request.urlopen(base + '/releases_linux.json') as response:
        releases = json.load(response)['releases']
    entry = next(r for r in releases if r['version'] == version and r['channel'] == 'stable' and r.get('dart_sdk_arch','x64') == 'x64')
    print(version, base + '/' + entry['archive'], entry['sha256'])
PY
)
export FLUTTER_ROOT="/cache/flutter-$version-$digest"
export PUB_CACHE=/cache/pub
export CI=true
if [[ ! -f "$FLUTTER_ROOT/.golden-sdk-$digest" ]]; then
    temp=$(mktemp -d /cache/install.XXXXXXXX)
    trap 'rm -rf "$temp"' EXIT
    curl --fail --location --silent --show-error --retry 3 "$archive" -o "$temp/sdk.tar.xz"
    echo "$digest  $temp/sdk.tar.xz" | sha256sum --check
    tar -xJf "$temp/sdk.tar.xz" -C "$temp"
    touch "$temp/flutter/.golden-sdk-$digest"
    mv "$temp/flutter" "$FLUTTER_ROOT"
fi
export PATH="$FLUTTER_ROOT/bin:$PATH"
git config --global --add safe.directory "$FLUTTER_ROOT"
mkdir -p /work/flutter/{app,ui}
cd /work/flutter
# Keep tool state out of the host checkout; its package_config contains host paths.
cp /source/flutter/pubspec* .
cp /source/flutter/app/pubspec.yaml app/
cp -R /source/flutter/app/lib app/
cp /source/flutter/ui/{pubspec.yaml,dart_test.yaml} ui/
# Pub validates each native plugin declaration even for host widget tests.
tar -C /source/flutter/ui --exclude=.gradle --exclude=.cxx --exclude=build --exclude=Pods \
  -cf - lib test android ios | tar -xf - -C ui
mkdir -p ui/test/goldens
flutter pub get --enforce-lockfile
cd ui
flutter test --update-goldens --tags golden test/goldens_test.dart
for golden in test/goldens/*.png; do
    destination="/output/${golden##*/}"
    cp "$golden" "$destination"
    chown --reference=/output "$destination"
done
