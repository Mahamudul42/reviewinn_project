#!/bin/bash

# ReviewInn GitHub Migration Script
# This script helps migrate your local ReviewInn project to GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if git is installed
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
}

# Function to clean up unnecessary files
cleanup_project() {
    print_header "Cleaning Up Project"
    
    # Remove log files
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name "*.pid" -type f -delete 2>/dev/null || true
    
    # Remove backup files
    find . -name "*.backup" -type f -delete 2>/dev/null || true
    find . -name "*.bak" -type f -delete 2>/dev/null || true
    
    # Remove temporary files
    find . -name "*.tmp" -type f -delete 2>/dev/null || true
    find . -name "*.temp" -type f -delete 2>/dev/null || true
    
    # Remove node_modules if present (will be reinstalled)
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove Python cache
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -type f -delete 2>/dev/null || true
    
    # Remove build artifacts
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    
    print_status "Project cleaned up successfully!"
}

# Function to initialize git repository
init_git() {
    print_header "Initializing Git Repository"
    
    if [ -d ".git" ]; then
        print_warning "Git repository already exists. Skipping initialization."
        return
    fi
    
    git init
    git branch -M main
    print_status "Git repository initialized with main branch"
}

# Function to create initial commit
create_initial_commit() {
    print_header "Creating Initial Commit"
    
    # Add all files
    git add .
    
    # Check if there are any changes to commit
    if git diff --staged --quiet; then
        print_warning "No changes to commit"
        return
    fi
    
    # Create initial commit
    git commit -m "Initial commit: ReviewInn platform

✨ Features:
- Multi-category review system (Professionals, Companies, Places, Products)
- Creator edit/delete functionality for entities and reviews
- Advanced search and filtering
- User profiles with gamification
- Review circles and social features
- Real-time notifications
- Image upload and optimization
- Mobile-responsive design

🛠️ Tech Stack:
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + PostgreSQL + Redis
- Infrastructure: Docker + Docker Compose

🚀 Ready for production deployment"
    
    print_status "Initial commit created successfully!"
}

# Function to add GitHub remote
add_github_remote() {
    print_header "Adding GitHub Remote"
    
    echo "Please provide your GitHub repository URL:"
    echo "Example: https://github.com/yourusername/reviewinn.git"
    read -p "GitHub Repository URL: " GITHUB_URL
    
    if [ -z "$GITHUB_URL" ]; then
        print_error "GitHub URL cannot be empty"
        exit 1
    fi
    
    # Add remote origin
    git remote add origin "$GITHUB_URL"
    print_status "GitHub remote added: $GITHUB_URL"
}

# Function to push to GitHub
push_to_github() {
    print_header "Pushing to GitHub"
    
    print_status "Pushing to GitHub repository..."
    git push -u origin main
    
    print_status "🎉 Successfully pushed to GitHub!"
    echo ""
    echo "Your ReviewInn project is now available on GitHub!"
    echo "Next steps:"
    echo "1. Set up GitHub Actions for CI/CD"
    echo "2. Configure branch protection rules"
    echo "3. Add collaborators if needed"
    echo "4. Set up deployment pipeline"
}

# Function to create .env.example
create_env_example() {
    print_header "Creating Environment Template"
    
    if [ ! -f ".env.example" ]; then
        cat > .env.example << 'EOF'
# Database Configuration
POSTGRES_USER=reviewinn_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=reviewinn_database
DATABASE_URL=postgresql://reviewinn_user:your_secure_password_here@db:5432/reviewinn_database

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# JWT Configuration
JWT_SECRET_KEY=your_super_secret_jwt_key_here_change_in_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=ReviewInn
VITE_APP_VERSION=1.0.0

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@reviewinn.com

# External Services (Optional)
IMGBB_API_KEY=your_imgbb_api_key_here
GOOGLE_ANALYTICS_ID=your_ga_id_here

# Production Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
EOF
        print_status "Created .env.example template"
    else
        print_warning ".env.example already exists"
    fi
}

# Main execution
main() {
    print_header "ReviewInn GitHub Migration"
    
    # Check prerequisites
    check_git
    
    # Clean up project
    cleanup_project
    
    # Create environment template
    create_env_example
    
    # Initialize git
    init_git
    
    # Create initial commit
    create_initial_commit
    
    # Add GitHub remote
    add_github_remote
    
    # Push to GitHub
    push_to_github
    
    print_header "Migration Complete!"
    echo ""
    echo "🎉 Your ReviewInn project has been successfully migrated to GitHub!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Update your .env file with actual values"
    echo "2. Test the application: ./run.sh start"
    echo "3. Set up development workflow with your team"
    echo "4. Configure CI/CD pipeline"
    echo "5. Plan production deployment"
    echo ""
    echo "🔗 Your repository is now available at: $GITHUB_URL"
}

# Run the migration
main