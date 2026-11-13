#!/bin/sh
# Installs the xds command-line tool.
#
#   curl -fsSL https://raw.githubusercontent.com/kjmin-dev/xds/main/install.sh | sh
#
# Environment:
#   XDS_VERSION        the release to install, such as 0.1.0 (default: the latest)
#   XDS_INSTALL_DIR    where the binary goes (default: $HOME/.local/bin)
#   XDS_DOWNLOAD_BASE  where the archives are, instead of the GitHub release: a URL, or a
#                      local directory, which is how this script is tested

set -eu

REPOSITORY="kjmin-dev/xds"

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'xds install: %s\n' "$*" >&2
  exit 1
}

has() {
  command -v "$1" >/dev/null 2>&1
}

# The Rust target of the binary that runs on this machine.
detect_target() {
  os="$(uname -s)"
  arch="$(uname -m)"
  case "$arch" in
    arm64 | aarch64) arch="aarch64" ;;
    x86_64 | amd64) arch="x86_64" ;;
    *) fail "there is no xds build for the $arch architecture. Builds exist for arm64 and x86_64." ;;
  esac
  case "$os" in
    Darwin) say "$arch-apple-darwin" ;;
    # Statically linked against musl, so one build runs on every distribution.
    Linux) say "$arch-unknown-linux-musl" ;;
    MINGW* | MSYS* | CYGWIN* | Windows_NT)
      fail "this installer does not cover Windows. Install with npm instead: npm install --global xds-cli"
      ;;
    *) fail "there is no xds build for $os. Builds exist for macOS and Linux; Windows installs with npm (npm install --global xds-cli)." ;;
  esac
}

# download <url> <file>
download() {
  if has curl; then
    curl --fail --silent --show-error --location --output "$2" "$1"
  elif has wget; then
    wget --quiet --output-document="$2" "$1"
  else
    fail "curl or wget is needed to download xds."
  fi
}

# sha256 <file>: prints the checksum of the file.
sha256() {
  if has sha256sum; then
    sha256sum "$1" | cut -d ' ' -f 1
  elif has shasum; then
    shasum -a 256 "$1" | cut -d ' ' -f 1
  elif has openssl; then
    openssl dgst -sha256 "$1" | sed 's/^.*= *//'
  else
    fail "sha256sum, shasum or openssl is needed to verify the download."
  fi
}

main() {
  target="$(detect_target)"
  archive="xds-$target.tar.gz"
  install_dir="${XDS_INSTALL_DIR:-$HOME/.local/bin}"
  version="${XDS_VERSION:-latest}"

  if [ -n "${XDS_DOWNLOAD_BASE:-}" ]; then
    base="${XDS_DOWNLOAD_BASE%/}"
    # curl reads a local directory through a file:// URL.
    case "$base" in
      /*) base="file://$base" ;;
    esac
  elif [ "$version" = "latest" ]; then
    base="https://github.com/$REPOSITORY/releases/latest/download"
  else
    base="https://github.com/$REPOSITORY/releases/download/v${version#v}"
  fi

  work="$(mktemp -d)"
  trap 'rm -rf "$work"' EXIT

  say "Downloading $archive ($version)"
  download "$base/$archive" "$work/$archive" || fail "could not download $base/$archive"
  download "$base/$archive.sha256" "$work/$archive.sha256" ||
    fail "could not download $base/$archive.sha256"

  # The file holds "<checksum>  <name>", as sha256sum writes it.
  expected="$(cut -d ' ' -f 1 <"$work/$archive.sha256")"
  actual="$(sha256 "$work/$archive")"
  if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
    fail "the checksum of $archive does not match. Expected $expected, got $actual. Nothing was installed."
  fi

  tar -xzf "$work/$archive" -C "$work"
  [ -f "$work/xds" ] || fail "$archive does not contain the xds binary."

  mkdir -p "$install_dir"
  # Moved into place in one step, so an xds that is running is never half replaced.
  cp "$work/xds" "$install_dir/.xds.new"
  chmod 755 "$install_dir/.xds.new"
  mv -f "$install_dir/.xds.new" "$install_dir/xds"

  say "Installed $("$install_dir/xds" --version) to $install_dir/xds"

  case ":$PATH:" in
    *":$install_dir:"*) say "Run 'xds --help' to get started." ;;
    *)
      say ""
      say "$install_dir is not on your PATH. Add it by putting this line in your shell's startup"
      case "${SHELL:-}" in
        */zsh) say "file (~/.zshrc):" ;;
        */bash) say "file (~/.bashrc, or ~/.bash_profile on macOS):" ;;
        */fish) say "file (~/.config/fish/config.fish; in fish, use: fish_add_path $install_dir):" ;;
        *) say "file:" ;;
      esac
      say ""
      say "  export PATH=\"$install_dir:\$PATH\""
      say ""
      say "Then open a new terminal and run 'xds --help'."
      ;;
  esac
}

# Everything is inside functions and this is the last line, so a download that was cut short
# runs nothing.
main "$@"
