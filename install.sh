#!/bin/bash
# Oracle Skills Installer — downloads pre-built binary or falls back to bunx
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
#
# Options:
#   ORACLE_SKILLS_VERSION=v1.6.6  Pin to specific version
#   ORACLE_SKILLS_USE_BUNX=1      Force bunx mode (skip binary)

set -e

echo "🔮 Oracle Skills Installer"
echo ""

# ── Platform detection ──────────────────────────────────────

detect_platform() {
  local os arch
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)

  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) echo ""; return ;;
  esac

  case "$os" in
    darwin|linux) echo "${os}-${arch}" ;;
    *) echo "" ;;
  esac
}

PLATFORM=$(detect_platform)

# ── Version detection ───────────────────────────────────────

if [ -z "$ORACLE_SKILLS_VERSION" ]; then
  echo "🔍 Fetching latest version..."
  ORACLE_SKILLS_VERSION=$(curl -s https://api.github.com/repos/Soul-Brews-Studio/oracle-skills-cli/releases/latest 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4)
fi

if [ -z "$ORACLE_SKILLS_VERSION" ]; then
  echo "⚠️  Could not detect latest version, using v2.0.0"
  ORACLE_SKILLS_VERSION="v2.0.0"
fi

echo "📦 Version: $ORACLE_SKILLS_VERSION"

# ── Prerequisites ───────────────────────────────────────────

# Check & install Claude Code
if ! command -v claude &> /dev/null; then
  echo "📦 Installing Claude Code..."
  curl -fsSL https://claude.ai/install.sh | bash
else
  echo "✓ Claude Code installed"
fi

# Check & install ghq
if ! command -v ghq &> /dev/null; then
  echo "📦 Installing ghq..."
  if command -v brew &> /dev/null; then
    brew install ghq
  elif command -v go &> /dev/null; then
    go install github.com/x-motemen/ghq@latest
  else
    echo "⚠️  Please install ghq manually: brew install ghq"
  fi
else
  echo "✓ ghq installed"
fi

# ── Install method: binary or bunx ─────────────────────────
#
# Unified UX: `oracle-skills` always works.
#   Binary users → native binary at ~/.oracle-skills/bin/oracle-skills (fast)
#   bunx users   → wrapper script at same path, delegates to bunx (same command)

INSTALL_DIR="$HOME/.oracle-skills/bin"
BINARY_NAME="oracle-skills-${PLATFORM}"
BINARY_URL="https://github.com/Soul-Brews-Studio/oracle-skills-cli/releases/download/${ORACLE_SKILLS_VERSION}/${BINARY_NAME}"
PKG_SPEC="oracle-skills@github:Soul-Brews-Studio/oracle-skills-cli#${ORACLE_SKILLS_VERSION}"

ensure_path() {
  mkdir -p "$INSTALL_DIR"
  local path_line="export PATH=\"$INSTALL_DIR:\$PATH\""
  for rc in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.profile"; do
    if [ -f "$rc" ] && ! grep -q "oracle-skills/bin" "$rc"; then
      echo "" >> "$rc"
      echo "# Oracle Skills CLI" >> "$rc"
      echo "$path_line" >> "$rc"
    fi
  done
  export PATH="$INSTALL_DIR:$PATH"
}

try_binary_install() {
  if [ -z "$PLATFORM" ]; then
    return 1
  fi

  echo "🔧 Downloading binary for ${PLATFORM}..."
  mkdir -p "$INSTALL_DIR"

  if curl -fsSL "$BINARY_URL" -o "$INSTALL_DIR/oracle-skills" 2>/dev/null; then
    chmod +x "$INSTALL_DIR/oracle-skills"
    echo "✓ Binary installed: $INSTALL_DIR/oracle-skills"
    ensure_path
    return 0
  else
    echo "⚠️  Binary not available for ${PLATFORM}, falling back to bunx"
    return 1
  fi
}

ensure_bun() {
  if ! command -v bun &> /dev/null; then
    echo "📦 Installing bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
  else
    echo "✓ bun installed"
  fi
}

install_bunx_wrapper() {
  ensure_bun

  echo "📦 Installing bunx wrapper..."
  mkdir -p "$INSTALL_DIR"

  # Create a wrapper script that delegates to bunx
  cat > "$INSTALL_DIR/oracle-skills" << WRAPPER
#!/bin/bash
# Oracle Skills CLI — bunx wrapper (v${ORACLE_SKILLS_VERSION#v})
# Upgrade to native binary: curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
exec bunx --bun ${PKG_SPEC} "\$@"
WRAPPER
  chmod +x "$INSTALL_DIR/oracle-skills"
  echo "✓ Wrapper installed: $INSTALL_DIR/oracle-skills"
  ensure_path
}

# ── Install ─────────────────────────────────────────────────

INSTALL_MODE=""

if [ "$ORACLE_SKILLS_USE_BUNX" = "1" ]; then
  install_bunx_wrapper
  INSTALL_MODE="bunx"
elif try_binary_install; then
  INSTALL_MODE="binary"
else
  install_bunx_wrapper
  INSTALL_MODE="bunx"
fi

# Run skill installation (symlinks, hooks, etc.)
"$INSTALL_DIR/oracle-skills" install -g -y

echo ""
if [ "$INSTALL_MODE" = "binary" ]; then
  echo "✨ Done! (native binary — fast mode)"
else
  echo "✨ Done! (bunx wrapper — re-run installer to upgrade to native binary)"
fi
echo ""
echo "Run 'oracle-skills --version' to verify."
echo ""
echo "Now:"
echo ""
echo "1. Restart Claude Code"
echo "2. Copy this prompt to the fresh Claude:"
echo ""
echo "─────────────────────────────────────────"
cat << 'PROMPT'
Set timezone to GMT+7 and setup Oracle permissions:

```bash
export TZ='Asia/Bangkok'
```

Then setup permissions:

```bash
mkdir -p .claude && cat > .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(gh:*)", "Bash(ghq:*)", "Bash(git:*)",
      "Bash(bun:*)", "Bash(bunx:*)", "Bash(mkdir:*)", "Bash(ln:*)",
      "Bash(rg:*)", "Bash(date:*)", "Bash(ls:*)", "Bash(tree:*)",
      "Bash(curl:*)", "Bash(du:*)", "Bash(wc:*)",
      "Bash(bash)", "Bash(source ~/.bashrc)",
      "Bash(export PATH=\"$HOME/.bun/bin:$PATH\")",
      "Bash(*ψ/*)", "Bash(*psi/*)",
      "Skill(learn)", "Skill(trace)", "Skill(awaken)",
      "Skill(rrr)", "Skill(recap)", "Skill(project)"
    ]
  }
}
EOF
```

Then run: /awaken
PROMPT
echo "─────────────────────────────────────────"
