#!/bin/bash
# FDM Monster One-Click Installer for Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/fdm-monster/fdm-monster/main/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$HOME/.fdm-monster"
DATA_DIR="$HOME/.fdm-monster-data"
SERVICE_NAME="fdm-monster"
REPO="fdm-monster/fdm-monster"
DEFAULT_PORT=4000

# Helper functions
print_banner() {
    echo -e "${BLUE}"
    cat << "EOF"
    ___________  __  ___   __  ___                 __
   / ____/ __ \/  |/  /  /  |/  /___  ____  _____/ /____  _____
  / /_  / / / / /|_/ /  / /|_/ / __ \/ __ \/ ___/ __/ _ \/ ___/
 / __/ / /_/ / /  / /  / /  / / /_/ / / / (__  ) /_/  __/ /
/_/   /_____/_/  /_/  /_/  /_/\____/_/ /_/____/\__/\___/_/

EOF
    echo -e "${NC}"
    echo -e "${GREEN}FDM Monster One-Click Installer${NC}"
    echo -e "${BLUE}https://fdm-monster.net${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root"
        exit 1
    fi
}

# Detect OS and architecture
detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case $OS in
        linux*) OS="linux" ;;
        darwin*) OS="darwin" ;;
        *)
            print_error "Unsupported operating system: $OS"
            exit 1
            ;;
    esac

    case $ARCH in
        x86_64|amd64) ARCH="amd64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        armv7l) ARCH="armv7" ;;
        *)
            print_error "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac

    print_success "Detected platform: $OS/$ARCH"
}

# Check for required dependencies
check_dependencies() {
    print_info "Checking for required dependencies..."

    local missing_deps=()

    # Check for Docker (preferred method)
    if command -v docker &> /dev/null; then
        INSTALL_METHOD="docker"
        print_success "Docker is installed"

        # Check if Docker daemon is running
        if ! docker info &> /dev/null; then
            print_error "Docker is installed but not running. Please start Docker and try again."
            exit 1
        fi

        # Check if user can run Docker without sudo
        if ! docker ps &> /dev/null; then
            print_warning "Docker requires sudo. Adding current user to docker group..."
            print_info "You may need to log out and back in for group changes to take effect"
            if [ "$OS" = "linux" ]; then
                sudo usermod -aG docker "$USER"
                print_warning "Please log out and log back in, then run this installer again"
                exit 0
            fi
        fi
        return 0
    fi

    # If no Docker, check for Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_warning "Node.js version $NODE_VERSION detected. FDM Monster requires Node.js 18 or higher"
            missing_deps+=("node (18+)")
        else
            print_success "Node.js $(node -v) is installed"
        fi
    fi

    # Check for yarn
    if ! command -v yarn &> /dev/null; then
        missing_deps+=("yarn")
    else
        print_success "Yarn $(yarn -v) is installed"
    fi

    if [ ${#missing_deps[@]} -eq 0 ]; then
        INSTALL_METHOD="native"
        return 0
    fi

    print_error "Missing required dependencies: ${missing_deps[*]}"
    print_info "Please install the missing dependencies or install Docker for easier setup:"
    echo ""
    echo "  Docker (recommended):"
    echo "    curl -fsSL https://get.docker.com | sh"
    echo ""
    echo "  Or install Node.js 18+ and Yarn:"
    echo "    # Visit https://nodejs.org/ for Node.js"
    echo "    npm install -g yarn"
    echo ""
    exit 1
}

# Install using Docker
install_docker() {
    print_info "Installing FDM Monster using Docker..."

    mkdir -p "$DATA_DIR/media" "$DATA_DIR/database"

    # Stop and remove existing container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${SERVICE_NAME}$"; then
        print_info "Stopping existing FDM Monster container..."
        docker stop "$SERVICE_NAME" &> /dev/null || true
        docker rm "$SERVICE_NAME" &> /dev/null || true
    fi

    # Pull latest image
    print_info "Pulling FDM Monster Docker image..."
    docker pull fdmmonster/fdm-monster:latest

    # Create and start container
    print_info "Starting FDM Monster container..."
    docker run -d \
        --name "$SERVICE_NAME" \
        -p "$DEFAULT_PORT:$DEFAULT_PORT" \
        -v "$DATA_DIR/media:/app/media" \
        -v "$DATA_DIR/database:/app/database" \
        --restart unless-stopped \
        fdmmonster/fdm-monster:latest

    print_success "FDM Monster Docker container started"
}

# Install natively (Node.js)
install_native() {
    print_info "Installing FDM Monster natively using Node.js..."

    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    # Clone or update repository
    if [ -d ".git" ]; then
        print_info "Updating existing installation..."
        git fetch origin
        git checkout main
        git pull origin main
    else
        print_info "Cloning FDM Monster repository..."
        git clone --depth 1 --branch main "https://github.com/$REPO.git" .
    fi

    # Install dependencies
    print_info "Installing dependencies (this may take a few minutes)..."
    yarn install --production

    # Build the application
    print_info "Building FDM Monster..."
    yarn build

    # Create data directories
    mkdir -p "$DATA_DIR/media" "$DATA_DIR/database"

    # Create symlinks to data directories
    ln -sf "$DATA_DIR/media" "$INSTALL_DIR/media"
    ln -sf "$DATA_DIR/database" "$INSTALL_DIR/database"

    print_success "FDM Monster installed successfully"
}

# Create systemd service (for native installation)
create_systemd_service() {
    if [ "$INSTALL_METHOD" != "native" ]; then
        return
    fi

    print_info "Creating systemd service..."

    local service_file="/etc/systemd/system/${SERVICE_NAME}.service"

    # Check if systemd is available
    if ! command -v systemctl &> /dev/null; then
        print_warning "systemd not available, skipping service creation"
        return
    fi

    # Create service file
    sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=FDM Monster - 3D Printer Farm Manager
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
Environment="NODE_ENV=production"
Environment="SERVER_PORT=$DEFAULT_PORT"
ExecStart=$(which node) $INSTALL_DIR/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    sudo systemctl start "$SERVICE_NAME"

    print_success "systemd service created and started"
}

# Create Docker systemd service (to auto-start on boot)
create_docker_systemd_service() {
    if [ "$INSTALL_METHOD" != "docker" ]; then
        return
    fi

    # Docker containers with --restart unless-stopped will auto-start
    # No additional systemd service needed
    print_success "Docker container configured to auto-start on boot"
}

# Create start/stop scripts
create_management_scripts() {
    print_info "Creating management scripts..."

    local bin_dir="$HOME/.local/bin"
    mkdir -p "$bin_dir"

    if [ "$INSTALL_METHOD" = "docker" ]; then
        # Docker management scripts
        cat > "$bin_dir/fdm-monster" << 'EOF'
#!/bin/bash
case "$1" in
    start)
        docker start fdm-monster
        ;;
    stop)
        docker stop fdm-monster
        ;;
    restart)
        docker restart fdm-monster
        ;;
    logs)
        docker logs -f fdm-monster
        ;;
    update)
        docker pull fdmmonster/fdm-monster:latest
        docker stop fdm-monster
        docker rm fdm-monster
        docker run -d \
            --name fdm-monster \
            -p 4000:4000 \
            -v "$HOME/.fdm-monster-data/media:/app/media" \
            -v "$HOME/.fdm-monster-data/database:/app/database" \
            --restart unless-stopped \
            fdmmonster/fdm-monster:latest
        ;;
    uninstall)
        docker stop fdm-monster
        docker rm fdm-monster
        docker rmi fdmmonster/fdm-monster:latest
        rm -rf "$HOME/.fdm-monster-data"
        rm "$HOME/.local/bin/fdm-monster"
        ;;
    *)
        echo "Usage: fdm-monster {start|stop|restart|logs|update|uninstall}"
        exit 1
        ;;
esac
EOF
    else
        # Native management scripts
        cat > "$bin_dir/fdm-monster" << EOF
#!/bin/bash
case "\$1" in
    start)
        systemctl start fdm-monster
        ;;
    stop)
        systemctl stop fdm-monster
        ;;
    restart)
        systemctl restart fdm-monster
        ;;
    logs)
        journalctl -u fdm-monster -f
        ;;
    update)
        systemctl stop fdm-monster
        cd "$INSTALL_DIR"
        git pull origin main
        yarn install --production
        yarn build
        systemctl start fdm-monster
        ;;
    uninstall)
        sudo systemctl stop fdm-monster
        sudo systemctl disable fdm-monster
        sudo rm /etc/systemd/system/fdm-monster.service
        sudo systemctl daemon-reload
        rm -rf "$INSTALL_DIR" "$DATA_DIR"
        rm "$HOME/.local/bin/fdm-monster"
        ;;
    *)
        echo "Usage: fdm-monster {start|stop|restart|logs|update|uninstall}"
        exit 1
        ;;
esac
EOF
    fi

    chmod +x "$bin_dir/fdm-monster"

    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$bin_dir:"* ]]; then
        echo "export PATH=\"\$PATH:$bin_dir\"" >> "$HOME/.bashrc"
        export PATH="$PATH:$bin_dir"
    fi

    print_success "Management script created at $bin_dir/fdm-monster"
}

# Wait for service to be ready
wait_for_service() {
    print_info "Waiting for FDM Monster to start..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$DEFAULT_PORT" > /dev/null 2>&1; then
            print_success "FDM Monster is ready!"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    print_warning "FDM Monster did not respond within 60 seconds"
    print_info "Check logs with: fdm-monster logs"
    return 1
}

# Print final instructions
print_instructions() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Installation Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${BLUE}Access FDM Monster at:${NC} ${GREEN}http://localhost:$DEFAULT_PORT${NC}"
    echo ""
    echo -e "  ${BLUE}Management commands:${NC}"
    echo -e "    ${YELLOW}fdm-monster start${NC}      - Start FDM Monster"
    echo -e "    ${YELLOW}fdm-monster stop${NC}       - Stop FDM Monster"
    echo -e "    ${YELLOW}fdm-monster restart${NC}    - Restart FDM Monster"
    echo -e "    ${YELLOW}fdm-monster logs${NC}       - View logs"
    echo -e "    ${YELLOW}fdm-monster update${NC}     - Update to latest version"
    echo -e "    ${YELLOW}fdm-monster uninstall${NC}  - Remove FDM Monster"
    echo ""
    echo -e "  ${BLUE}Installation method:${NC} $INSTALL_METHOD"
    echo -e "  ${BLUE}Data directory:${NC} $DATA_DIR"
    if [ "$INSTALL_METHOD" = "native" ]; then
        echo -e "  ${BLUE}Install directory:${NC} $INSTALL_DIR"
    fi
    echo ""
    echo -e "  ${BLUE}Documentation:${NC} https://docs.fdm-monster.net"
    echo -e "  ${BLUE}Discord:${NC} https://discord.gg/mwA8uP8CMc"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Main installation flow
main() {
    print_banner

    check_root
    detect_platform
    check_dependencies

    if [ "$INSTALL_METHOD" = "docker" ]; then
        install_docker
        create_docker_systemd_service
    else
        install_native
        create_systemd_service
    fi

    create_management_scripts
    wait_for_service
    print_instructions
}

# Run main function
main

