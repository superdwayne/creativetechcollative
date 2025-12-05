#!/usr/bin/env bash
set -euo pipefail

log() { printf "[setup] %s\n" "$*"; }
die() { printf "[setup][error] %s\n" "$*" >&2; exit 1; }

PLAYGROUND_DIR="$HOME/Documents/Playground"
TARGET_DIR="$PLAYGROUND_DIR/lens-mcp"

BREW_BIN="$(command -v brew || true)"
PY311="${PY311:-}"

ensure_brew() {
  if [[ -z "$BREW_BIN" ]]; then
    die "Homebrew not found. Install from https://brew.sh then re-run."
  fi
}

find_python311() {
  if [[ -n "$PY311" && -x "$PY311" ]]; then
    echo "$PY311"
    return 0
  fi
  # Common locations
  for p in /opt/homebrew/bin/python3.11 /usr/local/opt/python@3.11/bin/python3.11 /usr/local/bin/python3.11 /opt/homebrew/opt/python@3.11/bin/python3.11; do
    if [[ -x "$p" ]]; then
      echo "$p"; return 0
    fi
  done
  echo ""
}

install_python311() {
  ensure_brew
  log "Installing Python 3.11 via Homebrew (python@3.11)"
  "$BREW_BIN" install python@3.11
}

ensure_python311() {
  local p
  p="$(find_python311)"
  if [[ -z "$p" ]]; then
    install_python311
    p="$(find_python311)"
  fi
  [[ -n "$p" ]] || die "Could not locate python3.11 after install."
  echo "$p"
}

create_or_update_venv() {
  local py311="$1"
  mkdir -p "$TARGET_DIR"
  cd "$TARGET_DIR"
  log "Using Python: $py311 ($("$py311" -V))"
  log "Creating/upgrading venv at $TARGET_DIR/.venv"
  "$py311" -m venv .venv
  ./.venv/bin/python -m pip install --upgrade pip setuptools wheel
  # Core deps
  ./.venv/bin/pip install websockets
  # MCP SDKs (try official first, fallback to fastmcp)
  if ! ./.venv/bin/pip install mcp; then
    log "Falling back to fastmcp"
    ./.venv/bin/pip install fastmcp || die "Failed to install an MCP SDK (mcp/fastmcp)."
  fi
}

update_claude_config() {
  cd "$TARGET_DIR"
  log "Updating Claude Desktop MCP config"
  ./.venv/bin/python install_claude_config.py
}

main() {
  log "Setting up Lens MCP environment in $TARGET_DIR"
  local py311
  py311="$(ensure_python311)"
  create_or_update_venv "$py311"
  update_claude_config
  log "Setup complete. Next steps:"
  echo "- Restart Claude Desktop"
  echo "- In MCP panel 'lens': run connect() then status()"
}

main "$@"

