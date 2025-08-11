#!/bin/bash

# ReviewInn Project Restructuring Script
# This script organizes the messy root folder into a clean structure

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

# Create new directory structure
create_directories() {
    print_header "Creating Clean Directory Structure"
    
    # Create main directories
    mkdir -p docs/{architecture,deployment,development,api}
    mkdir -p scripts/{database,deployment,development}
    mkdir -p tools/{migration,debug,validation}
    mkdir -p data/{samples,migrations}
    mkdir -p .github/{workflows,templates}
    
    print_status "Created organized directory structure"
}

# Move documentation files
organize_documentation() {
    print_header "Organizing Documentation"
    
    # Architecture and system docs
    mv ARCHITECTURE_GUIDE.md docs/architecture/ 2>/dev/null || true
    mv MODULAR_ARCHITECTURE_PLAN.md docs/architecture/ 2>/dev/null || true
    mv PROJECT_DOCUMENTATION.md docs/architecture/ 2>/dev/null || true
    mv PROJECT_OVERVIEW.md docs/architecture/ 2>/dev/null || true
    mv CODING_STANDARDS.md docs/development/ 2>/dev/null || true
    
    # Deployment docs
    mv DEPLOYMENT_README.md docs/deployment/ 2>/dev/null || true
    mv DATABASE_POLICY.md docs/deployment/ 2>/dev/null || true
    mv IMAGE_OPTIMIZATION_SETUP.md docs/deployment/ 2>/dev/null || true
    
    # Development docs
    mv CONTENT_GATING_SYSTEM.md docs/development/ 2>/dev/null || true
    mv NOTIFICATION_SYSTEM_README.md docs/development/ 2>/dev/null || true
    mv BACKUP_SYSTEM.md docs/development/ 2>/dev/null || true
    
    # API docs
    mv API_ENDPOINT_FIXES.md docs/api/ 2>/dev/null || true
    
    # Feature-specific docs
    mv GIVE_REVIEW_IMPLEMENTATION.md docs/development/ 2>/dev/null || true
    mv GIVE_REVIEW_MODAL_FIX.md docs/development/ 2>/dev/null || true
    
    # Fix summaries - convert to single changelog
    cat > docs/CHANGELOG.md << 'EOF'
# ReviewInn Changelog

## Recent Major Changes

### Database & Categories
- Migrated to unified category system
- Fixed category questions and hierarchical display
- Enhanced entity-category relationships

### User Interface
- Implemented creator edit/delete functionality
- Added review management modals
- Enhanced entity cards with management actions
- Fixed entity card styling consistency

### Backend Improvements
- Updated API endpoints for better consistency
- Enhanced authentication and authorization
- Improved error handling across services

### Infrastructure
- Updated Docker configuration for reviewinn-* naming
- Enhanced backup and migration scripts
- Improved development workflow

## Previous Fixes
EOF
    
    # Append existing fix summaries to changelog
    for file in *_SUMMARY.md *_FIX_SUMMARY.md; do
        if [ -f "$file" ]; then
            echo -e "\n### $(basename "$file" .md | tr '_' ' ')" >> docs/CHANGELOG.md
            echo "- $(head -3 "$file" | tail -1)" >> docs/CHANGELOG.md
            rm "$file"
        fi
    done
    
    # Remove duplicate/outdated docs
    rm -f ENTITY_MODIFICATION_GUIDE.md ENTITY_REFACTORING_GUIDE.md 2>/dev/null || true
    rm -f DOCKER_FIX_SUMMARY.md BACKUP_CLEANUP_SUMMARY.md 2>/dev/null || true
    
    print_status "Documentation organized and consolidated"
}

# Move scripts and tools
organize_scripts() {
    print_header "Organizing Scripts and Tools"
    
    # Database scripts
    mv scripts/backup_database.sh scripts/database/ 2>/dev/null || true
    mv scripts/restore_database.sh scripts/database/ 2>/dev/null || true
    mv create_category_questions_table.sql scripts/database/ 2>/dev/null || true
    mv insert_*.sql scripts/database/ 2>/dev/null || true
    mv repopulate_data*.sql scripts/database/ 2>/dev/null || true
    mv simple_migration.sql scripts/database/ 2>/dev/null || true
    mv add_hierarchical_categories.sql scripts/database/ 2>/dev/null || true
    
    # Development scripts
    mv dev-manage.sh scripts/development/ 2>/dev/null || true
    mv fix-docker.sh scripts/development/ 2>/dev/null || true
    mv reviewinn-final-manager.sh scripts/development/ 2>/dev/null || true
    
    # Migration and setup tools
    mv category_migration.py tools/migration/ 2>/dev/null || true
    mv cleanup_old_categories.py tools/migration/ 2>/dev/null || true
    mv insert_categories*.py tools/migration/ 2>/dev/null || true
    mv fix_claimed_entities.py tools/migration/ 2>/dev/null || true
    mv populate_db.py tools/migration/ 2>/dev/null || true
    
    # Debug and validation tools
    mv debug-smartphones.js tools/debug/ 2>/dev/null || true
    mv test_db_connection.py tools/validation/ 2>/dev/null || true
    mv test_dynamic_rating.html tools/debug/ 2>/dev/null || true
    mv test_persistent_login.md tools/debug/ 2>/dev/null || true
    
    print_status "Scripts and tools organized"
}

# Move data files
organize_data() {
    print_header "Organizing Data Files"
    
    # Sample data
    mv category_structure.json data/samples/ 2>/dev/null || true
    mv reviewsite_category.json data/samples/ 2>/dev/null || true
    
    # Database data - merge with existing database folder
    if [ -d "database" ]; then
        mv database/* data/migrations/ 2>/dev/null || true
        rmdir database 2>/dev/null || true
    fi
    
    print_status "Data files organized"
}

# Clean up temporary and log files
cleanup_temp_files() {
    print_header "Cleaning Up Temporary Files"
    
    # Remove log files
    rm -f *.log 2>/dev/null || true
    rm -f *.pid 2>/dev/null || true
    rm -f test_server.log 2>/dev/null || true
    
    # Remove temporary files
    rm -f *.tmp 2>/dev/null || true
    rm -f *.temp 2>/dev/null || true
    
    # Clean up old backup files (keep recent ones in backups/)
    if [ -d "backups" ]; then
        find backups/ -name "reviewsite_*" -delete 2>/dev/null || true
        find backups/ -type f -mtime +7 -delete 2>/dev/null || true
    fi
    
    # Remove uploads directory from root (it should be in backend)
    if [ -d "uploads" ] && [ -d "reviewinn-backend/uploads" ]; then
        rm -rf uploads/
    fi
    
    print_status "Temporary files cleaned up"
}

# Create GitHub templates
create_github_templates() {
    print_header "Creating GitHub Templates"
    
    # Issue template
    cat > .github/templates/bug_report.md << 'EOF'
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
EOF

    # Feature request template
    cat > .github/templates/feature_request.md << 'EOF'
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
EOF

    # Pull request template
    cat > .github/templates/pull_request_template.md << 'EOF'
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## How Has This Been Tested?
Please describe the tests that you ran to verify your changes.

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
EOF

    print_status "GitHub templates created"
}

# Update main README with new structure
update_main_readme() {
    print_header "Updating Main README"
    
    # Add project structure section to README
    cat >> README.md << 'EOF'

## 📁 Project Structure

```
reviewinn/
├── 📱 Applications
│   ├── reviewinn-frontend/     # React + TypeScript frontend
│   ├── reviewinn-backend/      # FastAPI backend
│   └── reviewinn-admin/        # Django admin panel
├── 📚 Documentation
│   ├── docs/
│   │   ├── architecture/       # System architecture docs
│   │   ├── deployment/         # Deployment guides
│   │   ├── development/        # Development guides
│   │   ├── api/               # API documentation
│   │   └── CHANGELOG.md       # Project changelog
│   ├── README.md              # This file
│   └── CONTRIBUTING.md        # Contribution guidelines
├── 🛠️ Scripts & Tools
│   ├── scripts/
│   │   ├── database/          # Database management scripts
│   │   ├── deployment/        # Deployment scripts
│   │   └── development/       # Development helper scripts
│   └── tools/
│       ├── migration/         # Data migration tools
│       ├── debug/            # Debugging utilities
│       └── validation/       # Validation scripts
├── 📊 Data & Configuration
│   ├── data/
│   │   ├── samples/          # Sample data files
│   │   └── migrations/       # Database migrations
│   ├── backups/             # Database backups
│   ├── docker-compose.yml   # Docker services
│   ├── .env.example         # Environment template
│   └── .gitignore           # Git ignore rules
└── 🔧 Development
    ├── .github/             # GitHub templates and workflows
    ├── run.sh              # Main management script
    └── migrate-to-github.sh # GitHub migration helper
```
EOF

    print_status "README updated with new structure"
}

# Main execution
main() {
    print_header "ReviewInn Project Restructuring"
    
    echo "This script will reorganize your project structure for better maintainability."
    echo "It will:"
    echo "  • Move documentation to docs/ folder"
    echo "  • Organize scripts into scripts/ and tools/ folders"
    echo "  • Clean up temporary and log files"
    echo "  • Create GitHub templates"
    echo "  • Update project README"
    echo ""
    read -p "Continue with restructuring? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Restructuring cancelled."
        exit 0
    fi
    
    # Execute restructuring steps
    create_directories
    organize_documentation  
    organize_scripts
    organize_data
    cleanup_temp_files
    create_github_templates
    update_main_readme
    
    print_header "Restructuring Complete!"
    echo ""
    echo "🎉 Your project has been successfully reorganized!"
    echo ""
    echo "📋 What's been done:"
    echo "  ✅ Documentation moved to docs/ folder"
    echo "  ✅ Scripts organized into scripts/ and tools/"
    echo "  ✅ Data files moved to data/ folder" 
    echo "  ✅ Temporary files cleaned up"
    echo "  ✅ GitHub templates created"
    echo "  ✅ README updated with new structure"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Review the new structure: ls -la"
    echo "  2. Test the application: ./run.sh start"
    echo "  3. Commit changes: git add . && git commit -m 'refactor: organize project structure'"
    echo "  4. Push to GitHub: git push"
}

# Run the restructuring
main "$@"