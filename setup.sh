#!/bin/bash

# Crypto Dashboard Setup Script
# This script installs all necessary dependencies for the TypeScript web app and Go backend

set -e  # Exit on any error

echo "🚀 Setting up Crypto Dashboard Development Environment"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS or Linux
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_status "Detected OS: $MACHINE"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ====================================================
# STEP 1: Install System Dependencies
# ====================================================

print_status "Installing system dependencies..."

if [[ "$MACHINE" == "Mac" ]]; then
    # Check if Homebrew is installed
    if ! command_exists brew; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for this session
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            export PATH="/opt/homebrew/bin:$PATH"
        elif [[ -f "/usr/local/bin/brew" ]]; then
            export PATH="/usr/local/bin:$PATH"
        fi
    else
        print_success "Homebrew already installed"
    fi
    
    # Update Homebrew
    print_status "Updating Homebrew..."
    brew update

elif [[ "$MACHINE" == "Linux" ]]; then
    # Update package manager
    if command_exists apt-get; then
        print_status "Updating apt package manager..."
        sudo apt-get update
    elif command_exists yum; then
        print_status "Updating yum package manager..."
        sudo yum update -y
    elif command_exists pacman; then
        print_status "Updating pacman package manager..."
        sudo pacman -Sy
    fi
fi

# ====================================================
# STEP 2: Install Node.js and pnpm
# ====================================================

print_status "Setting up Node.js environment..."

# Install Node.js if not present
if ! command_exists node; then
    print_status "Installing Node.js..."
    
    if [[ "$MACHINE" == "Mac" ]]; then
        brew install node
    elif [[ "$MACHINE" == "Linux" ]]; then
        # Install Node.js via NodeSource repository for most recent LTS
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        if command_exists apt-get; then
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            sudo yum install -y nodejs npm
        fi
    fi
else
    NODE_VERSION=$(node --version)
    print_success "Node.js already installed: $NODE_VERSION"
fi

# Install pnpm if not present
if ! command_exists pnpm; then
    print_status "Installing pnpm..."
    npm install -g pnpm
else
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm already installed: $PNPM_VERSION"
fi

# ====================================================
# STEP 3: Install Go
# ====================================================

print_status "Setting up Go environment..."

if ! command_exists go; then
    print_status "Installing Go..."
    
    if [[ "$MACHINE" == "Mac" ]]; then
        brew install go
    elif [[ "$MACHINE" == "Linux" ]]; then
        # Download and install Go
        GO_VERSION="1.24.5"  # Match the version in go.mod
        wget -c "https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O go.tar.gz
        sudo rm -rf /usr/local/go
        sudo tar -xzf go.tar.gz -C /usr/local
        rm go.tar.gz
        
        # Add Go to PATH
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.zshrc 2>/dev/null || true
        export PATH=$PATH:/usr/local/go/bin
    fi
else
    GO_VERSION=$(go version)
    print_success "Go already installed: $GO_VERSION"
fi

# Verify Go installation
if command_exists go; then
    print_success "Go is properly installed"
    go version
else
    print_error "Go installation failed. Please install Go manually."
    exit 1
fi

# ====================================================
# STEP 4: Install Frontend Dependencies
# ====================================================

print_status "Installing frontend dependencies..."

# Navigate to project root and install dependencies
if [[ -f "package.json" ]]; then
    print_status "Installing Node.js dependencies with pnpm..."
    pnpm install
    print_success "Frontend dependencies installed successfully"
else
    print_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

# ====================================================
# STEP 5: Install Backend Dependencies
# ====================================================

print_status "Installing backend dependencies..."

# Navigate to API directory and install Go dependencies
if [[ -d "api" ]]; then
    cd api
    
    if [[ -f "go.mod" ]]; then
        print_status "Installing Go dependencies..."
        go mod download
        go mod tidy
        print_success "Backend dependencies installed successfully"
    else
        print_error "go.mod not found in api directory"
        exit 1
    fi
    
    cd ..
else
    print_error "api directory not found"
    exit 1
fi

# ====================================================
# STEP 6: Environment Setup
# ====================================================

print_status "Setting up environment configuration..."

# Check if .env file exists in api directory
if [[ ! -f "api/.env" ]]; then
    print_warning "No .env file found in api directory"
    print_status "Creating example .env file..."
    
    cat > api/.env.example << 'EOF'
# Database Configuration
NEON_DEV_PASS=postgresql://user:password@host:5432/database?sslmode=require

# Server Configuration
PORT=8080

# Environment
NODE_ENV=development
EOF
    
    print_warning "Please copy api/.env.example to api/.env and configure your database connection:"
    print_warning "  cp api/.env.example api/.env"
    print_warning "  Edit api/.env with your Neon database connection string"
else
    print_success "Environment file already exists"
fi

# ====================================================
# STEP 7: Additional Tools (Optional)
# ====================================================

print_status "Installing optional development tools..."

# Install useful development tools
if [[ "$MACHINE" == "Mac" ]]; then
    # Install useful tools via Homebrew
    if ! command_exists jq; then
        print_status "Installing jq for JSON processing..."
        brew install jq
    fi
    
    if ! command_exists curl; then
        print_status "Installing curl..."
        brew install curl
    fi
elif [[ "$MACHINE" == "Linux" ]]; then
    if command_exists apt-get; then
        if ! command_exists jq; then
            sudo apt-get install -y jq
        fi
        if ! command_exists curl; then
            sudo apt-get install -y curl
        fi
    fi
fi

# ====================================================
# STEP 8: Verification
# ====================================================

print_status "Verifying installation..."

echo ""
echo "📋 Installation Summary:"
echo "======================="

# Check Node.js
if command_exists node; then
    print_success "Node.js: $(node --version)"
else
    print_error "Node.js: Not installed"
fi

# Check pnpm
if command_exists pnpm; then
    print_success "pnpm: $(pnpm --version)"
else
    print_error "pnpm: Not installed"
fi

# Check Go
if command_exists go; then
    print_success "Go: $(go version | cut -d' ' -f3)"
else
    print_error "Go: Not installed"
fi

# Check if dependencies are installed
if [[ -d "node_modules" ]]; then
    print_success "Frontend dependencies: Installed"
else
    print_error "Frontend dependencies: Not installed"
fi

if [[ -f "api/go.sum" ]]; then
    print_success "Backend dependencies: Installed"
else
    print_error "Backend dependencies: Not installed"
fi

# ====================================================
# STEP 9: Next Steps
# ====================================================

echo ""
print_status "🎉 Setup complete!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Configure your database connection:"
echo "   - Copy api/.env.example to api/.env"
echo "   - Edit api/.env with your Neon database connection string"
echo ""
echo "2. Start the development servers:"
echo "   Frontend: pnpm dev (runs on http://localhost:3000)"
echo "   Backend:  cd api && chmod +x scripts/dev.sh && ./scripts/dev.sh (runs on http://localhost:8080)"
echo ""
echo "3. Verify everything works:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend Health: http://localhost:8080/api/health"
echo ""
echo "📚 For more information, see:"
echo "   - Frontend: package.json scripts"
echo "   - Backend: api/README.md"
echo ""

# Make sure the dev script is executable
if [[ -f "api/scripts/dev.sh" ]]; then
    chmod +x api/scripts/dev.sh
    print_success "Made api/scripts/dev.sh executable"
fi

print_success "All done! Happy coding! 🚀"
