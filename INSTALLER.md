# One-Click Linux Installer

This document explains the one-click installer for FDM Monster on Linux systems.

## Overview

The one-click installer (`install.sh`) provides a Bun-style installation experience for FDM Monster on Linux. Users can install FDM Monster with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/fdm-monster/fdm-monster/main/install.sh | bash
```

## Features

### Automatic Detection
- Detects OS and architecture (x86_64, ARM64, ARMv7)
- Identifies available installation methods (Docker or Node.js)
- Checks for required dependencies

### Installation Methods

#### Docker (Recommended)
When Docker is available:
- Pulls the latest `fdmmonster/fdm-monster` image
- Creates a container with proper volume mounts
- Configures auto-restart
- Sets up port forwarding (default: 4000)

#### Native (Node.js + Yarn)
When Docker is not available:
- Clones the repository to `~/.fdm-monster`
- Installs dependencies with Yarn
- Builds the application
- Creates a systemd service (if available)
- Configures auto-start on boot

### Data Management
- All data stored in `~/.fdm-monster-data/`
  - Database files in `database/`
  - Logs, uploads, thumbnails in `media/`
- Data persists across updates and reinstalls

### Management Script
Creates `~/.local/bin/fdm-monster` with commands:
- `start` - Start FDM Monster
- `stop` - Stop FDM Monster
- `restart` - Restart FDM Monster
- `logs` - View logs
- `update` - Update to latest version
- `uninstall` - Remove FDM Monster completely

## Script Sections

### 1. Banner and Helper Functions
- Colorful ASCII art banner
- Print functions for success, error, warning, info messages

### 2. Platform Detection
- Detects Linux/Darwin
- Identifies architecture (amd64, arm64, armv7)
- Validates supported platforms

### 3. Dependency Checking
- Checks for Docker (preferred)
  - Validates Docker daemon is running
  - Checks user permissions
  - Offers to add user to docker group
- Falls back to Node.js/Yarn check
  - Validates Node.js version 18+
  - Checks for Yarn installation

### 4. Docker Installation
- Creates data directories
- Stops/removes existing container
- Pulls latest image
- Starts container with proper configuration

### 5. Native Installation
- Clones or updates repository
- Installs production dependencies
- Builds application
- Creates symlinks to data directories

### 6. Service Management
- Creates systemd service for native installations
- Configures auto-start on boot
- Sets up proper restart policies

### 7. Management Scripts
- Creates wrapper script in `~/.local/bin/`
- Adds to PATH if needed
- Provides unified interface for both Docker and native installations

### 8. Health Check
- Waits for service to be ready
- Tests HTTP endpoint
- Provides feedback on startup status

## Testing the Installer

### Local Testing

1. **Test with Docker:**
   ```bash
   # Make script executable
   chmod +x install.sh
   
   # Run locally
   ./install.sh
   ```

2. **Test without Docker:**
   ```bash
   # Stop Docker temporarily
   sudo systemctl stop docker
   
   # Run installer (will use Node.js method)
   ./install.sh
   
   # Restart Docker
   sudo systemctl start docker
   ```

3. **Test from URL (after pushing to GitHub):**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/fdm-monster/fdm-monster/main/install.sh | bash
   ```

### Testing on Different Platforms

- **Ubuntu/Debian**: Test with Docker and without
- **Fedora/CentOS**: Test with Docker and without
- **Raspberry Pi OS**: Test on Pi 3B+, 4, and 5
- **Arch Linux**: Validate systemd service creation

## Security Considerations

### Running Piped Scripts
Users should be aware that piping to bash can be dangerous. We mitigate this by:
- Using HTTPS (fsSL flags)
- Hosting on GitHub (trusted platform)
- Making the script readable and auditable
- Not requiring sudo until necessary
- Validating inputs and dependencies

### Best Practices
1. Users can review the script first:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/fdm-monster/fdm-monster/main/install.sh > install.sh
   less install.sh
   bash install.sh
   ```

2. Script checks:
   - Does not run as root
   - Validates all dependencies before modification
   - Uses `set -e` to exit on errors
   - Provides clear error messages

## Deployment

### GitHub Release
1. Push `install.sh` to the `main` branch
2. Make it executable in the repository:
   ```bash
   git update-index --chmod=+x install.sh
   ```

3. Update documentation to reference the install command

### Domain Alias (Optional)
For a shorter URL, you could set up:
```bash
curl -fsSL https://get.fdm-monster.net | bash
```

This would require:
1. Registering domain or subdomain
2. Setting up redirect to GitHub raw URL
3. Ensuring HTTPS is enabled

## Documentation

The installer is documented in:
- **Main README**: Quick install command in installation methods section
- **Docs Site**: Comprehensive guide at `/docs/installing/one-click-linux.mdx`
- **This file**: Technical details for maintainers

## Maintenance

### Updating the Installer

When updating the installer:
1. Test changes locally first
2. Test on multiple Linux distributions
3. Verify both Docker and native paths
4. Update documentation if behavior changes
5. Test the update command with existing installations

### Version Compatibility

The installer always pulls:
- **Docker**: Latest image tag
- **Native**: Main branch

For specific versions, users should use Docker directly:
```bash
docker run -d --name fdm-monster -p 4000:4000 \
  fdmmonster/fdm-monster:2.0.0
```

## Future Enhancements

Possible improvements:
- [ ] Support for custom installation directories
- [ ] Interactive mode for configuration options
- [ ] Support for macOS
- [ ] Automatic backup before updates
- [ ] Health check and diagnostic commands
- [ ] Multi-instance support
- [ ] Custom port selection during install
- [ ] Environment variable configuration
- [ ] SSL/TLS certificate setup
- [ ] Reverse proxy configuration helpers

## Troubleshooting

Common issues and solutions:

### Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### Port Already in Use
```bash
# Find what's using port 4000
sudo lsof -i :4000
# Kill the process or choose different port
```

### systemd Not Available
- Script gracefully handles this
- Users can manually start: `node ~/.fdm-monster/dist/index.js`

### Node.js Version Too Old
```bash
# Install Node.js 18+ via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Support

Users experiencing issues should:
1. Check the documentation: https://docs.fdm-monster.net
2. View logs: `fdm-monster logs`
3. Join Discord: https://discord.gg/mwA8uP8CMc
4. Open GitHub issue: https://github.com/fdm-monster/fdm-monster/issues

