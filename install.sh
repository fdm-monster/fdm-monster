#!/bin/bash
# FDM Monster One-Click Installer for Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/fdm-monster/fdm-monster/main/install.sh | bash

set -e

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# Configuration
NODE_VERSION="24.12.0"
NPM_PACKAGE="@fdm-monster/server"
INSTALL_DIR="$HOME/.fdm-monster"
DATA_DIR="$HOME/.fdm-monster-data"
DEFAULT_PORT=4000

# Helper functions
print_banner() {
    echo -e "${BLUE}"
    cat << "EOF"
    ___________ __  ___   __  ___                 __
   / ____/ __ \/  |/  /  /  |/  /___  ____  _____/ /____  _____
  / /_  / / / / /|_/ /  / /|_/ / __ \/ __ \/ ___/ __/ _ \/ ___/
 / __/ / /_/ / /  / /  / /  / / /_/ / / / (__  ) /_/  __/ /
/_/   /_____/_/  /_/  /_/  /_/\____/_/ /_/____/\__/\___/_/

EOF
    echo -e "${NC}${GREEN}FDM Monster One-Click Installer${NC}\n${BLUE}https://fdm-monster.net${NC}\n"
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}!${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Do not run as root"
        exit 1
    fi
}

detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    [[ ! "$OS" =~ ^(linux|darwin) ]] && { print_error "Unsupported OS: $OS"; exit 1; }
    OS="linux"

    case $ARCH in
        x86_64|amd64) ARCH="x64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        armv7l) ARCH="armv7l" ;;
        *) print_error "Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    print_success "Detected platform: $OS/$ARCH"
}

install_nodejs() {
    print_info "Installing Node.js $NODE_VERSION..."

    local NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${OS}-${ARCH}.tar.xz"
    local NODE_DIR="$INSTALL_DIR/nodejs"

    mkdir -p "$NODE_DIR"
    curl -fsSL "$NODE_URL" | tar -xJ -C "$NODE_DIR" --strip-components=1

    export PATH="$NODE_DIR/bin:$PATH"

    print_success "Node.js $NODE_VERSION installed"
}

ensure_nodejs() {
    if command -v node &> /dev/null; then
        local CURRENT_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$CURRENT_VERSION" -ge 22 ]; then
            print_success "Node.js $(node -v) detected"
            return 0
        fi
        print_warning "Node.js $CURRENT_VERSION too old, installing Node.js 24..."
    fi

    install_nodejs

    # Persist PATH for future sessions
    local SHELL_RC="$HOME/.bashrc"
    [ -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.zshrc"
    grep -q "$INSTALL_DIR/nodejs/bin" "$SHELL_RC" 2>/dev/null || \
        echo "export PATH=\"$INSTALL_DIR/nodejs/bin:\$PATH\"" >> "$SHELL_RC"
}

setup_yarn() {
    print_info "Setting up Yarn via corepack..."

    # Enable corepack
    corepack enable

    # Prepare yarn latest
    corepack prepare yarn@stable --activate

    print_success "Yarn $(yarn --version) ready"
}

install_fdm_monster() {
    print_info "Installing $NPM_PACKAGE..."

    mkdir -p "$INSTALL_DIR" "$DATA_DIR/media" "$DATA_DIR/database"
    cd "$INSTALL_DIR"

    # Create package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        cat > package.json << EOF
{
  "name": "fdm-monster-install",
  "private": true,
  "packageManager": "yarn@stable",
  "dependencies": {
    "$NPM_PACKAGE": "latest"
  }
}
EOF
    fi

    # Install the package
    yarn install --production

    print_success "$NPM_PACKAGE installed"
}

create_systemd_service() {
    if ! command -v systemctl &> /dev/null; then
        print_warning "systemd not available, service won't auto-start on boot"
        return
    fi

    print_info "Creating systemd service..."

    local SERVICE_FILE="/etc/systemd/system/fdm-monster.service"
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=FDM Monster - 3D Printer Farm Manager
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DATA_DIR
Environment="NODE_ENV=production"
Environment="SERVER_PORT=$DEFAULT_PORT"
ExecStart=$INSTALL_DIR/nodejs/bin/node $INSTALL_DIR/node_modules/$NPM_PACKAGE/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable fdm-monster
    sudo systemctl start fdm-monster

    print_success "systemd service created and started"
}


create_cli_wrapper() {
    print_info "Creating CLI wrapper..."

    local BIN_DIR="$HOME/.local/bin"
    mkdir -p "$BIN_DIR"

    # Copy this script to become the CLI
    cp "$0" "$BIN_DIR/fdm-monster" 2>/dev/null || curl -fsSL https://raw.githubusercontent.com/fdm-monster/fdm-monster/feat/one-script-install/install.sh -o "$BIN_DIR/fdm-monster"
    chmod +x "$BIN_DIR/fdm-monster"

    # Create short alias
    cp "$BIN_DIR/fdm-monster" "$BIN_DIR/fdmm"
    chmod +x "$BIN_DIR/fdmm"

    # Add to PATH if needed
    if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
        local SHELL_RC="$HOME/.bashrc"
        [ -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.zshrc"
        echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$SHELL_RC"
        export PATH="$PATH:$BIN_DIR"
    fi

    print_success "CLI created at $BIN_DIR/fdm-monster (alias: fdmm)"
}

# CLI command handler
handle_command() {
    case "$1" in
        start)
            if command -v systemctl &> /dev/null; then
                sudo systemctl start fdm-monster
            else
                cd "$DATA_DIR"
                nohup "$INSTALL_DIR/nodejs/bin/node" "$INSTALL_DIR/node_modules/$NPM_PACKAGE/dist/index.js" > "$DATA_DIR/media/logs/fdm-monster.log" 2>&1 &
                echo "FDM Monster started (PID: $!)"
            fi
            ;;
        stop)
            if command -v systemctl &> /dev/null; then
                sudo systemctl stop fdm-monster
            else
                pkill -f "$NPM_PACKAGE/dist/index.js" || echo "FDM Monster not running"
            fi
            ;;
        restart)
            if command -v systemctl &> /dev/null; then
                sudo systemctl restart fdm-monster
            else
                $0 stop && sleep 2 && $0 start
            fi
            ;;
        logs)
            if command -v systemctl &> /dev/null; then
                journalctl -u fdm-monster -f
            else
                tail -f "$DATA_DIR/media/logs/fdm-monster.log"
            fi
            ;;
        update)
            local VERSION="${2:-latest}"
            print_info "Updating FDM Monster to version $VERSION..."
            $0 stop
            cd "$INSTALL_DIR"
            yarn add "$NPM_PACKAGE@$VERSION" --production
            $0 start
            print_success "Updated to version $VERSION"
            ;;
        uninstall)
            print_warning "Uninstalling FDM Monster..."
            $0 stop
            if command -v systemctl &> /dev/null; then
                sudo systemctl disable fdm-monster 2>/dev/null || true
                sudo rm -f /etc/systemd/system/fdm-monster.service
                sudo systemctl daemon-reload
            fi
            rm -rf "$INSTALL_DIR" "$DATA_DIR"
            rm -f "$HOME/.local/bin/fdm-monster" "$HOME/.local/bin/fdmm"
            print_success "FDM Monster uninstalled"
            ;;
        *)
            echo "FDM Monster CLI"
            echo ""
            echo "Usage: fdm-monster {start|stop|restart|logs|update [version]|uninstall}"
            echo "Alias: fdmm"
            echo ""
            echo "Commands:"
            echo "  start           - Start FDM Monster"
            echo "  stop            - Stop FDM Monster"
            echo "  restart         - Restart FDM Monster"
            echo "  logs            - View logs"
            echo "  update [ver]    - Update to latest or specified version"
            echo "  uninstall       - Remove FDM Monster"
            echo ""
            echo "Examples:"
            echo "  fdmm update              # Update to latest"
            echo "  fdmm update 1.2.3        # Update to specific version"
            exit 1
            ;;
    esac
}

wait_for_service() {
    print_info "Waiting for FDM Monster to start..."

    for i in {1..30}; do
        if curl -s "http://localhost:$DEFAULT_PORT" > /dev/null 2>&1; then
            print_success "FDM Monster is ready!"
            return 0
        fi
        sleep 2
    done

    print_warning "Service did not respond within 60 seconds"
    print_info "Check logs with: fdm-monster logs"
}

print_instructions() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${BLUE}Access FDM Monster at:${NC} ${GREEN}http://localhost:$DEFAULT_PORT${NC}"
    echo ""
    echo -e "  ${BLUE}Management commands:${NC} ${YELLOW}(use 'fdm-monster' or 'fdmm')${NC}"
    echo -e "    ${YELLOW}fdmm start${NC}             - Start FDM Monster"
    echo -e "    ${YELLOW}fdmm stop${NC}              - Stop FDM Monster"
    echo -e "    ${YELLOW}fdmm restart${NC}           - Restart FDM Monster"
    echo -e "    ${YELLOW}fdmm logs${NC}              - View logs"
    echo -e "    ${YELLOW}fdmm update [version]${NC}  - Update to latest or specified version"
    echo -e "    ${YELLOW}fdmm uninstall${NC}         - Remove FDM Monster"
    echo ""
    echo -e "  ${BLUE}Data directory:${NC} $DATA_DIR"
    echo -e "  ${BLUE}Install directory:${NC} $INSTALL_DIR"
    echo ""
    echo -e "  ${BLUE}Documentation:${NC} https://docs.fdm-monster.net"
    echo -e "  ${BLUE}Discord:${NC} https://discord.gg/mwA8uP8CMc"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Main function - handles both install and CLI commands
main() {
    # If called with a command argument, handle it as CLI
    if [ $# -gt 0 ]; then
        handle_command "$@"
        exit $?
    fi

    # Otherwise, run installer
    print_banner
    check_root
    detect_platform
    ensure_nodejs
    setup_yarn
    install_fdm_monster
    create_systemd_service
    create_cli_wrapper
    wait_for_service
    print_instructions
}

# Run main function with all arguments
main "$@"

