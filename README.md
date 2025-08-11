# ReviewInn 🏨✨

A comprehensive review platform for professionals, companies, places, and products. Built with modern web technologies and designed for scalability and user experience.

## 🌟 Key Features

- **Multi-Category Reviews** - Professionals, Companies, Places, Products  
- **Creator Management** - Edit/delete functionality for content creators
- **Social Features** - Comments, reactions, and review sharing
- **Advanced Search** - Multi-faceted search with intelligent filters
- **User Profiles** - Comprehensive profiles with badges and statistics
- **Review Circles** - Connect with trusted reviewers
- **Real-time Features** - Live notifications and updates

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- PostgreSQL 13+
- Redis 6+

### Environment Setup
1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment**:
   Edit `.env` file with your settings:
   - Database credentials
   - API keys (ImgBB for image uploads)
   - Email settings (optional)
   - JWT secrets

3. **Start the application**:
   ```bash
   # Start all services
   ./run.sh
   
   # Or start individually:
   # Backend
   cd reviewinn-backend && python main.py
   
   # Frontend  
   cd reviewinn-frontend && npm run dev
   ```

### Environment Configuration

The project uses a **single root `.env` file** for all environment variables:

```
reviewinn/
├── .env                    # Single environment file for all services
├── .env.production        # Production overrides
├── reviewinn-backend/     # Backend application
├── reviewinn-frontend/    # Frontend application
└── ...
```

**Key Benefits:**
- ✅ **Centralized Management**: All environment variables in one place
- ✅ **Docker Compatible**: Works seamlessly with container setup
- ✅ **Development Friendly**: Easy to manage and update
- ✅ **Team Collaboration**: Single source of truth for configuration

**Environment Variables Include:**
- Database configuration (PostgreSQL)
- Redis cache settings
- JWT security settings
- API configuration
- CORS settings
- Frontend configuration (VITE_*)
- ImgBB API keys for image uploads
- Email settings
- Rate limiting
- External service keys

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** for state management

### Backend
- **FastAPI** (Python) for API server
- **PostgreSQL** for primary database
- **Redis** for caching and sessions
- **JWT** for authentication

### Infrastructure
- **Docker** & Docker Compose
- **GitHub Actions** ready for CI/CD

## 🎯 Recent Features

### ✅ Creator Management System
- **Review Management**: Creators can edit and delete their own reviews
- **Entity Management**: Entity owners can edit and delete their entities  
- **Permission System**: Role-based access control for content management
- **Safety Features**: Multi-step confirmation for deletions

### ✅ Enhanced User Experience
- **Professional Modals**: Edit/delete interfaces with comprehensive forms
- **Toast Notifications**: Real-time feedback for all operations
- **Permission-based UI**: Management options only visible to authorized users
- **Consistent Design**: Unified styling across all management interfaces

## 📚 Documentation

- **Architecture**: [System Design & Architecture](docs/architecture/)
- **Deployment**: [Production Deployment Guide](docs/deployment/)
- **Development**: [Development Guides & Processes](docs/development/)
- **API**: [API Documentation](docs/api/)
- **Changelog**: [Recent Changes & Updates](docs/CHANGELOG.md)

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Development setup
- Code standards
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**ReviewInn** - *Where every review matters* ⭐ 