# ReviewInn - Comprehensive Project Documentation

**Version**: 1.0.0  
**Last Updated**: July 16, 2025  
**Tech Stack**: FastAPI + PostgreSQL + React + TypeScript + Docker  

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Patterns](#architecture--design-patterns)
3. [Backend (FastAPI + Python)](#backend-fastapi--python)
4. [Frontend (React + TypeScript + Vite)](#frontend-react--typescript--vite)
5. [Database Schema](#database-schema)
6. [Environment Configuration](#environment-configuration)
7. [API Documentation](#api-documentation)
8. [Development Workflow](#development-workflow)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Database Management & Protection](#database-management--protection)
11. [Security Considerations](#security-considerations)
12. [Future Roadmap](#future-roadmap)
13. [Change Log](#change-log)

---

## Project Overview

**ReviewInn** is a modern, full-stack review platform that allows users to submit, search, and interact with reviews for various entities (companies, products, services, etc.). The platform features real-time messaging, notifications, gamification, and social features.

### Core Features
- 🔐 **User Authentication & Authorization** (JWT-based)
- 📝 **Review Management** (CRUD, reactions, comments)
- 🏢 **Entity Management** (Companies, products, services)
- 💬 **Real-time Messaging** (WebSocket-based)
- 🔔 **Notification System** (Real-time, categorized)
- 🏆 **Gamification** (Badges, levels, achievements)
- 🔍 **Advanced Search** (Full-text, filters, sorting)
- 👥 **Social Features** (Review circles, user connections)
- 📊 **Analytics & Insights** (User behavior, entity performance)

### Business Logic
- Users can review entities with ratings, comments, and media
- Real-time interaction through reactions and comments
- Gamification system to encourage quality content
- Review circle system for trusted reviewer networks
- Advanced moderation and flagging system

---

## Architecture & Design Patterns

### Overall Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │────│  FastAPI REST   │────│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
    ┌─────────┐              ┌─────────┐              ┌─────────┐
    │  Vite   │              │  Redis  │              │ Docker  │
    │  (Dev)  │              │ (Cache) │              │(Deploy) │
    └─────────┘              └─────────┘              └─────────┘
```

### Design Patterns Used

1. **Backend Patterns**:
   - **Repository Pattern**: Data access abstraction (`repositories/`)
   - **Service Layer Pattern**: Business logic separation (`services/`)
   - **Dependency Injection**: FastAPI's built-in DI system
   - **Domain-Driven Design**: Partial implementation (`domains/` structure)
   - **Command Query Responsibility Segregation (CQRS)**: Read/write operations separation

2. **Frontend Patterns**:
   - **Atomic Design**: Component hierarchy (atoms, molecules, organisms)
   - **Feature-Based Architecture**: Organized by business features
   - **Custom Hooks Pattern**: Reusable logic extraction
   - **Context API Pattern**: Global state management
   - **Compound Component Pattern**: Complex UI components

3. **Data Patterns**:
   - **Active Record Pattern**: SQLAlchemy ORM models
   - **Data Transfer Object (DTO)**: Pydantic schemas
   - **Connection Pooling**: Database optimization

---

## Backend (FastAPI + Python)

### Project Structure
```
reviewsite-backend/
├── main.py                 # FastAPI application entry point
├── database.py            # Database configuration & connection
├── core/                  # Core application configuration
│   ├── config.py         # Application settings (Pydantic)
│   ├── auth_dependencies.py # Authentication middleware
│   └── responses.py      # Standardized API responses
├── models/               # SQLAlchemy ORM models (Main)
│   ├── user.py          # User model & relationships
│   ├── entity.py        # Entity model (companies, products)
│   ├── review.py        # Review model & ratings
│   ├── comment.py       # Comment model & reactions
│   ├── notification.py  # Notification system
│   └── ...              # Other domain models
├── schemas/             # Pydantic models for API
│   ├── user.py         # User request/response schemas
│   ├── entity.py       # Entity schemas
│   ├── review.py       # Review schemas
│   └── ...             # Other schemas
├── routers/            # FastAPI route handlers
│   ├── auth.py        # Authentication endpoints
│   ├── users.py       # User management
│   ├── entities.py    # Entity CRUD
│   ├── reviews.py     # Review operations
│   ├── notifications.py # Notification endpoints
│   └── ...            # Other route modules
├── services/          # Business logic layer
│   ├── auth_service.py        # Authentication logic
│   ├── user_service.py        # User operations
│   ├── entity_service.py      # Entity operations
│   ├── notification_service.py # Notification management
│   └── ...                    # Other services
├── repositories/      # Data access layer
│   ├── user_repository.py     # User data access
│   ├── entity_repository.py   # Entity data access
│   └── ...                    # Other repositories
├── domains/          # Domain-driven design structure (Future)
│   ├── auth/         # Authentication domain
│   ├── entities/     # Entity management domain
│   ├── reviews/      # Review management domain
│   └── messaging/    # Messaging & notifications domain
└── migrations/       # Database migration scripts
```

### Key Backend Components

1. **Authentication System**:
   - JWT-based authentication with access/refresh tokens
   - Password hashing using bcrypt
   - Role-based access control (RBAC)
   - Session management with Redis

2. **Database Layer**:
   - PostgreSQL with SQLAlchemy ORM
   - Connection pooling and session management
   - Database migrations with Alembic
   - Optimistic locking for critical operations

3. **API Layer**:
   - RESTful API design with FastAPI
   - Automatic OpenAPI documentation
   - Request/response validation with Pydantic
   - Rate limiting and CORS configuration

4. **Business Logic**:
   - Service layer for business operations
   - Repository pattern for data access
   - Event-driven architecture for notifications
   - Caching with Redis

### Database Connection Configuration
```python
# database.py
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://...")
engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Connection pooling settings
POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", 10))
MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", 20))
POOL_TIMEOUT = int(os.getenv("DATABASE_POOL_TIMEOUT", 30))
```

---

## Frontend (React + TypeScript + Vite)

### Project Structure
```
reviewsite-frontend/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Main app component & routing
│   ├── api/                  # API layer
│   │   ├── auth.ts          # Authentication API
│   │   ├── httpClient.ts    # HTTP client configuration
│   │   ├── config.ts        # API endpoints configuration
│   │   └── services/        # API service modules
│   │       ├── entityService.ts
│   │       ├── reviewService.ts
│   │       ├── notificationService.ts
│   │       └── ...
│   ├── components/          # Reusable components
│   │   ├── ProtectedRoute.tsx
│   │   └── ...
│   ├── shared/             # Shared UI components
│   │   ├── atoms/          # Basic UI elements
│   │   ├── molecules/      # Composed components
│   │   ├── organisms/      # Complex components
│   │   └── layouts/        # Page layouts
│   ├── features/           # Feature-based organization
│   │   ├── auth/          # Authentication features
│   │   ├── entities/      # Entity management
│   │   ├── reviews/       # Review features
│   │   ├── messaging/     # Real-time messaging
│   │   ├── notifications/ # Notification features
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   └── ...
│   ├── types/             # TypeScript type definitions
│   │   ├── index.ts       # Main type exports
│   │   ├── api.ts         # API response types
│   │   └── ...
│   └── styles/            # Global styles & themes
├── public/                # Static assets
└── package.json          # Dependencies & scripts
```

### Key Frontend Components

1. **State Management**:
   - Context API for global state
   - Custom hooks for local state
   - Real-time updates via WebSocket

2. **Routing**:
   - React Router v6 with protected routes
   - Lazy loading for code splitting
   - Authentication-based navigation

3. **UI Architecture**:
   - Atomic design methodology
   - Responsive design with Tailwind CSS
   - Component composition patterns

4. **API Integration**:
   - Axios-based HTTP client
   - Request/response interceptors
   - Error handling and retry logic

---

## Database Schema

### Core Entities

1. **Users Table**:
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    avatar TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Entities Table**:
```sql
CREATE TABLE entities (
    entity_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image_url TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. **Reviews Table**:
```sql
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES entities(entity_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    overall_rating DECIMAL(3,2) NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 5),
    price_rating DECIMAL(3,2),
    quality_rating DECIMAL(3,2),
    service_rating DECIMAL(3,2),
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. **Notifications Table**:
```sql
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships & Indexes

```sql
-- Key relationships
CREATE INDEX idx_reviews_entity_id ON reviews(entity_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- Full-text search indexes
CREATE INDEX idx_entities_search ON entities USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_reviews_search ON reviews USING gin(to_tsvector('english', title || ' ' || content));
```

---

## Environment Configuration

### Single .env File (Root Level)
```bash
# Application Settings
COMPOSE_PROJECT_NAME=reviewsite
APP_NAME=Review Platform API
APP_VERSION=1.0.0
DEBUG=true
ENVIRONMENT=development

# Security (PRODUCTION: Change these!)
SECRET_KEY=reviewsite-dev-secret-key-a8f9c2e4b7d6f1e3a5c9b8e2f4d7a6c3b9e5f8a2d1c4e7b0
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database Configuration
POSTGRES_USER=review_user
POSTGRES_PASSWORD=ReviewInn2024!SecurePass#Dev
POSTGRES_DB=review_platform
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://review_user:ReviewInn2024!SecurePass#Dev@db:5432/review_platform
DATABASE_URL_LOCAL=postgresql://review_user:ReviewInn2024!SecurePass#Dev@localhost:5432/review_platform

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_AUTH_BASE_URL=http://localhost:8000/api/v1/auth
VITE_ENVIRONMENT=development

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=300

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000
```

---

## API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/login          # User login
POST /api/v1/auth/register       # User registration
POST /api/v1/auth/refresh        # Token refresh
GET  /api/v1/auth/me            # Current user info
POST /api/v1/auth/logout        # User logout
```

### Entity Endpoints
```
GET    /api/v1/entities          # List entities with filters
POST   /api/v1/entities          # Create new entity
GET    /api/v1/entities/{id}     # Get entity details
PUT    /api/v1/entities/{id}     # Update entity
DELETE /api/v1/entities/{id}     # Delete entity
GET    /api/v1/entities/search   # Search entities
```

### Review Endpoints
```
GET    /api/v1/reviews           # List reviews with pagination
POST   /api/v1/reviews           # Create new review
GET    /api/v1/reviews/recent    # Get recent reviews
GET    /api/v1/reviews/{id}      # Get review details
PUT    /api/v1/reviews/{id}      # Update review
DELETE /api/v1/reviews/{id}      # Delete review
POST   /api/v1/reviews/{id}/react # Add reaction to review
```

### Notification Endpoints
```
GET    /api/v1/notifications           # List user notifications
GET    /api/v1/notifications/summary   # Get notification summary
PATCH  /api/v1/notifications/{id}      # Mark as read/unread
DELETE /api/v1/notifications/{id}      # Delete notification
POST   /api/v1/notifications/mark-all-read # Mark all as read
```

### Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2025-07-16T04:18:01.826112"
}
```

---

## Development Workflow

### Getting Started
```bash
# 1. Clone the repository
git clone <repository-url>
cd reviewsite

# 2. Start with Docker Compose
docker compose up -d

# 3. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Development Commands
```bash
# Backend development
cd reviewsite-backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend development
cd reviewsite-frontend
npm install
npm run dev

# Database operations
docker compose exec db psql -U review_user -d review_platform

# Run tests
pytest  # Backend tests
npm test  # Frontend tests
```

### Code Style & Standards
- **Backend**: Black formatter, flake8 linter, type hints with mypy
- **Frontend**: ESLint, Prettier, TypeScript strict mode
- **Commit Messages**: Conventional commits format
- **Documentation**: Inline comments, README updates

---

## Deployment & Infrastructure

### Docker Configuration
```yaml
# docker-compose.yml structure
services:
  db:          # PostgreSQL database
  redis:       # Redis cache
  backend:     # FastAPI application
  frontend:    # React application
  admin:       # Django admin panel (optional)
```

### Production Considerations
1. **Security**: Update all secrets, enable HTTPS, configure WAF
2. **Scaling**: Load balancer, horizontal scaling, CDN
3. **Monitoring**: Application metrics, error tracking, health checks
4. **Backup**: Database backups, disaster recovery plan
5. **CI/CD**: Automated testing, deployment pipeline

---

## Database Management & Protection

### Database Credentials & Access
```
POSTGRES_USER=review_user
POSTGRES_PASSWORD=ReviewInn2024!SecurePass#Dev
POSTGRES_DB=review_platform
POSTGRES_HOST=db (in Docker) / localhost (local development)
POSTGRES_PORT=5432
```

### ⚠️ CRITICAL: Database Protection Guidelines

#### NEVER DELETE DATABASE DATA ACCIDENTALLY
1. **Always Backup Before Major Changes**: Run backup scripts before any database modifications
2. **Use Staging Environment**: Test all changes in staging before production
3. **Volume Protection**: Never run `docker-compose down -v` unless you want to DELETE ALL DATA
4. **Regular Backups**: Implement automated daily backups to prevent data loss

#### Database Management Commands
```bash
# SAFE: Restart containers without data loss
docker-compose restart

# SAFE: Stop containers (preserves data)
docker-compose down

# ⚠️ DANGEROUS: Removes volumes and ALL DATA
docker-compose down -v

# SAFE: View database logs
docker-compose logs db

# Backup database (RECOMMENDED before any changes)
docker exec postgres_db pg_dump -U review_user -d review_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database from backup
docker exec -i postgres_db psql -U review_user -d review_platform < backup_file.sql
```

#### Data Population & Testing
- **Sample Data Script**: `/database/bangladesh_data_population.sql`
- **Users Created**: 25+ realistic Bangladesh-focused users
- **Entities**: 27 restaurants, products, and services across Bangladesh
- **Reviews**: 60+ comprehensive reviews with realistic content
- **Circles**: 10 community circles with proper memberships
- **Notifications**: Comprehensive notification system with real activity

#### Bangladesh Data Context
The sample data includes:
- **Restaurants**: Dhaka and Chittagong-based authentic restaurants
- **Products**: Traditional items (Jamdani sarees, Rajshahi silk, tea)
- **Technology**: Local brands (Walton, Singer Bangladesh)
- **Services**: Financial services (bKash, Nagad), ride-sharing (Pathao)
- **Users**: Diverse professionals from different districts of Bangladesh
- **Content**: All reviews and interactions in Bengali/English mix for authenticity

#### Data Recovery Process
If data is accidentally lost:
1. Check Docker volumes: `docker volume ls`
2. Restore from latest backup if available
3. Re-run data population script: `/database/bangladesh_data_population.sql`
4. User account recovery: Use password reset functionality

### Database Monitoring
```bash
# Check database status
docker-compose exec db psql -U review_user -d review_platform -c "SELECT version();"

# Monitor database size
docker-compose exec db psql -U review_user -d review_platform -c "SELECT pg_size_pretty(pg_database_size('review_platform'));"

# Check active connections
docker-compose exec db psql -U review_user -d review_platform -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Security Considerations

### Implemented Security Measures
1. **Authentication**: JWT tokens with expiration
2. **Authorization**: Route-based access control
3. **Data Validation**: Pydantic schemas, input sanitization
4. **SQL Injection**: SQLAlchemy ORM prevents SQL injection
5. **CORS**: Configured allowed origins
6. **Rate Limiting**: API endpoint rate limits
7. **Password Security**: Bcrypt hashing

### Security Checklist
- [ ] **Production Secrets**: Change all default passwords/keys
- [ ] **HTTPS**: Enable SSL/TLS in production
- [ ] **Database**: Secure database access, encrypted connections
- [ ] **Monitoring**: Security event logging and monitoring
- [ ] **Updates**: Regular dependency updates and security patches

---

## Future Roadmap

### Planned Features
1. **Enhanced Gamification**: Advanced achievement system
2. **AI Integration**: AI-powered review summarization
3. **Mobile App**: React Native mobile application
4. **Advanced Analytics**: Business intelligence dashboard
5. **Microservices**: Service decomposition for scalability
6. **Real-time Features**: Live review updates, collaborative editing

### Technical Improvements
1. **Caching Strategy**: Redis-based caching layer
2. **Search Enhancement**: Elasticsearch integration
3. **Performance**: Database query optimization
4. **Testing**: Comprehensive test coverage
5. **Documentation**: Auto-generated API docs

---

## Change Log

### Version 1.0.0 (July 16, 2025)
#### Added
- ✅ **Environment Consolidation**: Single .env file in root
- ✅ **Security Improvements**: Stronger default passwords and secrets
- ✅ **Code Cleanup**: Removed duplicate model files from domains
- ✅ **API Enhancement**: Added `/api/v1/reviews/recent` endpoint
- ✅ **Authentication**: Enhanced route protection for all pages
- ✅ **Import Fixes**: Updated all broken imports after cleanup

#### Fixed
- ✅ **422 Error**: Fixed `/api/v1/reviews/recent` endpoint validation
- ✅ **Duplicate Files**: Removed redundant models in domains structure
- ✅ **Import Errors**: Fixed broken imports after file cleanup
- ✅ **Security**: Updated weak default credentials

#### Security
- ✅ **Secrets**: Updated SECRET_KEY with stronger value
- ✅ **Passwords**: Changed default database password
- ✅ **Environment**: Consolidated to single .env file

#### Architecture
- ✅ **Models**: Standardized on main models directory
- ✅ **Imports**: Fixed all import statements after cleanup
- ✅ **Structure**: Maintained domain structure for future use

### Maintenance Notes
- **Next Review**: August 16, 2025
- **Documentation Updates**: Update this file with any code changes
- **Security Review**: Quarterly security assessment required
- **Performance Review**: Monthly performance monitoring

---

## Development Guidelines

### Making Changes
1. **Read This Documentation**: Always review current architecture
2. **Follow Patterns**: Use existing patterns and conventions
3. **Update Documentation**: Update this file with any significant changes
4. **Test Changes**: Ensure all tests pass before deployment
5. **Security Review**: Consider security implications of changes

### Adding New Features
1. **Design First**: Plan the feature architecture
2. **Database Changes**: Create migration scripts
3. **API Design**: Follow RESTful conventions
4. **Frontend Integration**: Maintain component hierarchy
5. **Documentation**: Update API docs and this file

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance implications considered

---

**📝 Note**: This documentation should be updated whenever significant changes are made to the codebase. Keep it current to maintain project clarity and development efficiency.

**🔗 Quick Links**:
- [Frontend URL](http://localhost:5173)
- [Backend API](http://localhost:8000)
- [API Documentation](http://localhost:8000/docs)
- [Database Admin](http://localhost:8001) (if Django admin is running)

**👥 Team**: This documentation serves as the single source of truth for the ReviewInn project architecture, design decisions, and development guidelines.