#!/bin/bash
# FDM Monster One-Click Installer for Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/fdm-monster/fdm-monster/main/install.sh | bash

set -e

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# Configuration
CLI_VERSION="1.0.1"
NODE_VERSION="24.12.0"
NPM_PACKAGE="@fdm-monster/server"
INSTALL_DIR="$HOME/.fdm-monster"
DATA_DIR="$HOME/.fdm-monster-data"
DEFAULT_PORT=4000
INSTALL_SCRIPT_URL="https://raw.githubusercontent.com/fdm-monster/fdm-monster/feat/one-script-install/install.sh"

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
  "dependencies": {}
}
EOF
    fi

    # Install the package
    YARN_NODE_LINKER=node-modules yarn add "$NPM_PACKAGE"

    print_success "$NPM_PACKAGE installed"
}

create_systemd_service() {
    if ! command -v systemctl &> /dev/null; then
        print_warning "systemd not available, service won't auto-start on boot"
        return
    fi

    print_info "Creating systemd service..."

    local SERVICE_FILE="/etc/systemd/system/fdm-monster.service"
    local DATABASE_PATH="$DATA_DIR/database"
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=FDM Monster - 3D Printer Farm Manager
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DATA_DIR
Environment="NODE_ENV=development"
Environment="SERVER_PORT=$DEFAULT_PORT"
Environment="DATABASE_PATH=$DATABASE_PATH"
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

    cp "$0" "$BIN_DIR/fdm-monster" 2>/dev/null || curl -fsSL "$INSTALL_SCRIPT_URL" -o "$BIN_DIR/fdm-monster"
    chmod +x "$BIN_DIR/fdm-monster"

    cp "$BIN_DIR/fdm-monster" "$BIN_DIR/fdmm"
    chmod +x "$BIN_DIR/fdmm"

    if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
        local SHELL_RC="$HOME/.bashrc"
        [ -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.zshrc"

        echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$SHELL_RC"

        print_success "CLI installed! To use immediately, copy and run:"
        echo ""
        echo -e "\033[1;32m    export PATH=\"\$PATH:$BIN_DIR\"\033[0m"
        echo ""
        print_info "(Or restart your terminal)"
    else
        print_success "CLI created at $BIN_DIR/fdm-monster (alias: fdmm)"
    fi
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
        status)
            if command -v systemctl &> /dev/null; then
                sudo systemctl status fdm-monster
            else
                if pgrep -f "$NPM_PACKAGE/dist/index.js" > /dev/null; then
                    print_success "FDM Monster is running (PID: $(pgrep -f "$NPM_PACKAGE/dist/index.js"))"
                    if curl -s "http://localhost:$DEFAULT_PORT" > /dev/null 2>&1; then
                        print_success "Service is responding at http://localhost:$DEFAULT_PORT"
                    else
                        print_warning "Process is running but not responding on port $DEFAULT_PORT"
                    fi
                else
                    print_error "FDM Monster is not running"
                    exit 1
                fi
            fi
            ;;
        logs)
            if command -v systemctl &> /dev/null; then
                journalctl -u fdm-monster -f
            else
                tail -f "$DATA_DIR/media/logs/fdm-monster.log"
            fi
            ;;
        upgrade)
            if [ -n "$2" ]; then
                # Check if version is below 2.0.0
                local MAJOR_VERSION=$(echo "$2" | cut -d'.' -f1)
                if [[ "$MAJOR_VERSION" =~ ^[0-9]+$ ]] && [ "$MAJOR_VERSION" -lt 2 ]; then
                    print_error "Cannot upgrade to version $2 - minimum supported version is 2.0.0"
                    exit 1
                fi

                print_info "Upgrading FDM Monster to version $2..."
                $0 stop
                cd "$INSTALL_DIR"
                YARN_NODE_LINKER=node-modules yarn add "$NPM_PACKAGE@$2"
                $0 start

                # Get installed version
                local INSTALLED_VERSION=$(node -p "require('./node_modules/$NPM_PACKAGE/package.json').version" 2>/dev/null || echo "unknown")
                print_success "Upgraded to version $INSTALLED_VERSION"
            else
                print_info "Upgrading FDM Monster to latest version..."
                $0 stop
                cd "$INSTALL_DIR"
                YARN_NODE_LINKER=node-modules yarn add "$NPM_PACKAGE"
                $0 start

                # Get installed version
                local INSTALLED_VERSION=$(node -p "require('./node_modules/$NPM_PACKAGE/package.json').version" 2>/dev/null || echo "unknown")
                print_success "Upgraded to version $INSTALLED_VERSION"
            fi
            ;;
        backup)
            local BACKUP_DIR="$HOME/.fdm-monster-backups"
            local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
            local BACKUP_FILE="$BACKUP_DIR/fdm-monster-$TIMESTAMP.tar.gz"

            mkdir -p "$BACKUP_DIR"

            if [ ! -d "$DATA_DIR" ]; then
                print_error "Data directory does not exist: $DATA_DIR"
                exit 1
            fi

            print_info "Backing up FDM Monster data..."
            tar -czf "$BACKUP_FILE" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")" 2>/dev/null

            if [ $? -eq 0 ]; then
                local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
                print_success "Backup created: $BACKUP_FILE ($SIZE)"
            else
                print_error "Backup failed"
                exit 1
            fi
            ;;
        update-cli)
            print_info "Updating FDM Monster CLI (current: v$CLI_VERSION)..."
            local BIN_DIR="$HOME/.local/bin"
            local TEMP_FILE="/tmp/fdm-monster-cli-update.sh"

            curl -fsSL "$INSTALL_SCRIPT_URL" -o "$TEMP_FILE"

            if [ $? -eq 0 ]; then
                # Extract new version from downloaded script
                local NEW_VERSION=$(grep '^CLI_VERSION=' "$TEMP_FILE" | cut -d'"' -f2)

                mv "$TEMP_FILE" "$BIN_DIR/fdm-monster"
                chmod +x "$BIN_DIR/fdm-monster"
                cp "$BIN_DIR/fdm-monster" "$BIN_DIR/fdmm"
                chmod +x "$BIN_DIR/fdmm"

                if [ -n "$NEW_VERSION" ]; then
                    print_success "CLI updated successfully to v$NEW_VERSION"
                else
                    print_success "CLI updated successfully"
                fi
            else
                print_error "Failed to download CLI update"
                exit 1
            fi
            ;;
        version|--version|-v)
            echo "FDM Monster CLI v$CLI_VERSION"
            ;;
        uninstall)
            print_warning "Uninstalling FDM Monster..."
            $0 stop
            if command -v systemctl &> /dev/null; then
                sudo systemctl disable fdm-monster 2>/dev/null || true
                sudo rm -f /etc/systemd/system/fdm-monster.service
                sudo systemctl daemon-reload
            fi

            # Remove install directory and CLI
            rm -rf "$INSTALL_DIR"
            rm -f "$HOME/.local/bin/fdm-monster" "$HOME/.local/bin/fdmm"

            # Ask about data directory
            echo ""
            echo -e "${YELLOW}Do you want to remove the data directory?${NC}"
            echo -e "  ${BLUE}Location:${NC} $DATA_DIR"
            echo -e "  ${BLUE}Contains:${NC} databases, logs, uploaded files"
            read -p "Remove data directory? [y/N]: " -n 1 -r
            echo ""

            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf "$DATA_DIR"
                print_success "FDM Monster uninstalled (including data)"
            else
                print_success "FDM Monster uninstalled (data preserved at $DATA_DIR)"
            fi
            ;;
        *)
            echo "FDM Monster CLI v$CLI_VERSION"
            echo ""
            echo "Usage: fdm-monster {start|stop|restart|status|logs|upgrade [version]|backup|update-cli|version|uninstall}"
            echo "Alias: fdmm"
            echo ""
            echo "Commands:"
            echo "  start           - Start FDM Monster"
            echo "  stop            - Stop FDM Monster"
            echo "  restart         - Restart FDM Monster"
            echo "  status          - Check if FDM Monster is running"
            echo "  logs            - View logs"
            echo "  upgrade [ver]   - Upgrade to latest or specified version"
            echo "  backup          - Backup data directory to ~/.fdm-monster-backups"
            echo "  update-cli      - Update the CLI tool itself"
            echo "  version         - Show CLI version"
            echo "  uninstall       - Remove FDM Monster"
            echo ""
            echo "Examples:"
            echo "  fdmm status              # Check status"
            echo "  fdmm backup              # Create backup"
            echo "  fdmm upgrade             # Upgrade to latest"
            echo "  fdmm upgrade 1.2.3       # Upgrade to specific version"
            echo "  fdmm update-cli          # Update CLI tool"
            echo "  fdmm version             # Show CLI version"
            exit 1
            ;;
    esac
}

wait_for_service() {
    print_info "Waiting for FDM Monster to start..."

    for i in {1..10}; do
        if curl -s "http://localhost:$DEFAULT_PORT" > /dev/null 2>&1; then
            print_success "FDM Monster is ready!"
            return 0
        fi
        sleep 1
    done

    print_warning "Service did not respond within 10 seconds"
    print_info "Checking service status..."
    echo ""

    if command -v systemctl &> /dev/null; then
        sudo systemctl status fdm-monster --no-pager
    else
        if pgrep -f "$NPM_PACKAGE/dist/index.js" > /dev/null; then
            print_info "Process is running (PID: $(pgrep -f "$NPM_PACKAGE/dist/index.js"))"
            print_info "Service may still be initializing"
        else
            print_error "Process is not running"
        fi
    fi

    echo ""
    print_info "Check logs with: fdm-monster logs"
}

get_network_addresses() {
    # Get all non-loopback IPv4 addresses
    if command -v ip &> /dev/null; then
        ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1'
    elif command -v ifconfig &> /dev/null; then
        ifconfig | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1'
    elif command -v hostname &> /dev/null; then
        hostname -I 2>/dev/null | tr ' ' '\n' | grep -v '^$'
    fi
}

print_instructions() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${BLUE}Access FDM Monster at:${NC}"
    echo -e "    ${GREEN}http://localhost:$DEFAULT_PORT${NC}"

    # Show network addresses if available
    local ADDRESSES=$(get_network_addresses)
    if [ -n "$ADDRESSES" ]; then
        while IFS= read -r addr; do
            [ -n "$addr" ] && echo -e "    ${GREEN}http://$addr:$DEFAULT_PORT${NC}"
        done <<< "$ADDRESSES"
    fi

    echo ""
    echo -e "  ${BLUE}Management commands:${NC} ${YELLOW}(use 'fdm-monster' or 'fdmm' - CLI v$CLI_VERSION)${NC}"
    echo -e "    ${YELLOW}fdmm start${NC}             - Start FDM Monster"
    echo -e "    ${YELLOW}fdmm stop${NC}              - Stop FDM Monster"
    echo -e "    ${YELLOW}fdmm restart${NC}           - Restart FDM Monster"
    echo -e "    ${YELLOW}fdmm status${NC}            - Check if FDM Monster is running"
    echo -e "    ${YELLOW}fdmm logs${NC}              - View logs"
    echo -e "    ${YELLOW}fdmm upgrade [version]${NC} - Upgrade to latest or specified version"
    echo -e "    ${YELLOW}fdmm backup${NC}            - Backup data directory"
    echo -e "    ${YELLOW}fdmm update-cli${NC}        - Update CLI tool"
    echo -e "    ${YELLOW}fdmm version${NC}           - Show CLI version"
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

