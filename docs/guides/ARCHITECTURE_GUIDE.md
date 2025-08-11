# ReviewInn Platform - Architecture Guide

**Version**: 2.0.0  
**Last Updated**: 2024-07-14  
**Status**: Modular Architecture Implementation

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [System Architecture](#system-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Domain Organization](#domain-organization)
7. [Configuration Management](#configuration-management)
8. [Development Guidelines](#development-guidelines)
9. [Deployment Strategy](#deployment-strategy)
10. [Future Roadmap](#future-roadmap)

---

## Overview

ReviewInn is a modern review platform built with a domain-driven, modular architecture that emphasizes scalability, maintainability, and developer experience. The platform allows users to review entities (businesses, professionals, products, places) with sophisticated features including real-time messaging, gamification, and social features.

### Key Features
- **Entity Management**: CRUD for businesses, professionals, products, places
- **Review System**: Comprehensive reviews with ratings, reactions, and comments
- **Real-time Messaging**: WebSocket-based messaging system
- **Gamification**: Badges, progress tracking, and analytics
- **Social Features**: Review circles, user connections, notifications
- **Search & Discovery**: Advanced search with analytics and trending

### Technology Stack

**Backend**:
- FastAPI (Python 3.11+)
- PostgreSQL (Database)
- Redis (Caching & Sessions)
- SQLAlchemy (ORM)
- Pydantic (Data Validation)
- WebSockets (Real-time Communication)

**Frontend**:
- React 19+ with TypeScript
- Vite (Build Tool)
- TailwindCSS (Styling)
- React Router (Navigation)
- Recharts (Analytics)

**Infrastructure**:
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Environment-based Configuration

---

## Architecture Principles

### 1. Domain-Driven Design (DDD)
- **Clear Domain Boundaries**: Each domain has its own models, services, repositories, and routers
- **Ubiquitous Language**: Consistent terminology across code and documentation
- **Bounded Contexts**: Domains are independently deployable and maintainable

### 2. Separation of Concerns
- **Layered Architecture**: Clear separation between presentation, business logic, and data access
- **Single Responsibility**: Each component has a single, well-defined purpose
- **Interface Segregation**: Depend on abstractions, not concretions

### 3. Scalability & Performance
- **Horizontal Scaling**: Stateless services with external state management
- **Caching Strategy**: Multi-level caching with Redis
- **Database Optimization**: Connection pooling and query optimization

### 4. Maintainability & Testing
- **Modular Structure**: Easy to understand, modify, and test
- **Dependency Injection**: Loose coupling and testability
- **Comprehensive Documentation**: Code, API, and architecture documentation

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Load Balancer                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    API Gateway / Nginx                      │
└─────────────┬─────────────────────────────┬─────────────────┘
              │                             │
┌─────────────▼──────────────┐    ┌─────────▼─────────────────┐
│     Frontend Application   │    │    Backend API Service    │
│    (React + TypeScript)    │    │     (FastAPI + Python)    │
│                            │    │                           │
│  ┌─────────────────────┐   │    │  ┌─────────────────────┐  │
│  │   Domain Modules    │   │    │  │   Domain Modules    │  │
│  │                     │   │    │  │                     │  │
│  │ • Auth              │   │    │  │ • Auth              │  │
│  │ • Entities          │   │    │  │ • Entities          │  │
│  │ • Reviews           │   │    │  │ • Reviews           │  │
│  │ • Messaging         │   │    │  │ • Messaging         │  │
│  │ • Gamification      │   │    │  │ • Gamification      │  │
│  │ • Discovery         │   │    │  │ • Discovery         │  │
│  └─────────────────────┘   │    │  └─────────────────────┘  │
│                            │    │                           │
│  ┌─────────────────────┐   │    │  ┌─────────────────────┐  │
│  │  Shared Components  │   │    │  │ Shared Infrastructure│  │
│  │                     │   │    │  │                     │  │
│  │ • UI Components     │   │    │  │ • Database          │  │
│  │ • Services          │   │    │  │ • Cache             │  │
│  │ • Types             │   │    │  │ • Events            │  │
│  │ • Utils             │   │    │  │ • Config            │  │
│  └─────────────────────┘   │    │  └─────────────────────┘  │
└────────────────────────────┘    └───────────┬───────────────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          │                   │                   │
              ┌───────────▼──────────┐ ┌──────▼──────┐ ┌─────────▼──────────┐
              │     PostgreSQL       │ │    Redis    │ │   External APIs    │
              │    (Primary DB)      │ │  (Cache)    │ │                    │
              │                      │ │             │ │ • Email Service    │
              │ • User Data          │ │ • Sessions  │ │ • Search Engine    │
              │ • Entities           │ │ • Cache     │ │ • File Storage     │
              │ • Reviews            │ │ • Queue     │ │ • Analytics        │
              │ • Messages           │ │             │ │                    │
              └──────────────────────┘ └─────────────┘ └────────────────────┘
```

---

## Backend Architecture

### Directory Structure

```
reviewsite-backend/
├── main.py                     # Application entry point
├── main_modular.py            # New modular entry point
│
├── domains/                   # Domain-specific modules
│   ├── auth/                  # Authentication & Authorization
│   │   ├── models/           # User, Session, etc.
│   │   ├── services/         # AuthService, TokenService
│   │   ├── repositories/     # UserRepository
│   │   ├── schemas/          # Pydantic schemas
│   │   └── routers/          # API endpoints
│   │
│   ├── entities/             # Entity Management
│   │   ├── models/           # Entity, Category, etc.
│   │   ├── services/
│   │   │   ├── entity_management.py
│   │   │   ├── entity_analytics.py
│   │   │   └── entity_search.py
│   │   ├── repositories/     # EntityRepository
│   │   ├── schemas/          # Entity schemas
│   │   └── routers/          # Entity endpoints
│   │
│   ├── reviews/              # Review System
│   │   ├── models/           # Review, Comment, Reaction
│   │   ├── services/         # ReviewService, CommentService
│   │   ├── repositories/     # ReviewRepository
│   │   ├── schemas/          # Review schemas
│   │   └── routers/          # Review endpoints
│   │
│   ├── messaging/            # Real-time Messaging
│   │   ├── models/           # Message, Conversation
│   │   ├── services/         # MessagingService, WebSocketService
│   │   ├── repositories/     # MessageRepository
│   │   ├── schemas/          # Message schemas
│   │   └── routers/          # Messaging endpoints
│   │
│   ├── gamification/         # Badges & Progress
│   │   ├── models/           # Badge, Progress, Analytics
│   │   ├── services/         # BadgeService, ProgressService
│   │   ├── repositories/     # BadgeRepository
│   │   ├── schemas/          # Gamification schemas
│   │   └── routers/          # Gamification endpoints
│   │
│   └── discovery/            # Search & Analytics
│       ├── models/           # SearchAnalytics, ViewTracking
│       ├── services/         # SearchService, AnalyticsService
│       ├── repositories/     # SearchRepository
│       ├── schemas/          # Search schemas
│       └── routers/          # Search endpoints
│
├── shared/                   # Shared Infrastructure
│   ├── infrastructure/
│   │   ├── database/         # Database connection, base models
│   │   ├── cache/           # Redis implementation
│   │   ├── search/          # Search engine abstraction
│   │   └── messaging/       # Event bus, WebSocket manager
│   │
│   ├── common/              # Common utilities
│   │   ├── exceptions/      # Custom exceptions
│   │   ├── validators/      # Custom validators
│   │   ├── utils/          # Utility functions
│   │   └── events.py       # Domain events
│   │
│   └── interfaces/          # Service & Repository interfaces
│       ├── repositories.py  # Repository contracts
│       └── services.py     # Service contracts
│
├── config/                  # Configuration Management
│   ├── environments/
│   │   ├── base.py         # Base configuration
│   │   ├── development.py  # Development settings
│   │   └── production.py   # Production settings
│   └── settings.py         # Configuration factory
│
├── migrations/             # Database migrations
└── database/              # Database schemas and setup
```

### Domain Organization

#### 1. Authentication Domain (`domains/auth/`)
**Responsibilities**:
- User registration and login
- JWT token management
- Session management
- Password reset and verification
- Social authentication (future)

**Key Services**:
- `AuthService`: User authentication and authorization
- `TokenService`: JWT token generation and validation
- `SessionService`: User session management

#### 2. Entities Domain (`domains/entities/`)
**Responsibilities**:
- CRUD operations for entities (businesses, professionals, etc.)
- Entity categorization and metadata
- Entity analytics and view tracking
- Entity search and filtering

**Key Services**:
- `EntityManagementService`: Core CRUD operations
- `EntityAnalyticsService`: View tracking and trending
- `EntitySearchService`: Search and filtering logic

#### 3. Reviews Domain (`domains/reviews/`)
**Responsibilities**:
- Review creation and management
- Rating calculations and aggregations
- Comments and reactions on reviews
- Review moderation and reporting

**Key Services**:
- `ReviewService`: Review CRUD and business logic
- `CommentService`: Comment management
- `RatingService`: Rating calculations and aggregations

#### 4. Messaging Domain (`domains/messaging/`)
**Responsibilities**:
- Real-time messaging between users
- Conversation management
- Message notifications
- WebSocket connection management

**Key Services**:
- `MessagingService`: Message CRUD and delivery
- `ConversationService`: Conversation management
- `WebSocketService`: Real-time communication
- `NotificationService`: Message notifications

#### 5. Gamification Domain (`domains/gamification/`)
**Responsibilities**:
- Badge system and achievements
- User progress tracking
- Weekly engagement analytics
- Daily tasks and goals

**Key Services**:
- `BadgeService`: Badge creation and awarding
- `ProgressService`: User progress tracking
- `AnalyticsService`: Engagement analytics

#### 6. Discovery Domain (`domains/discovery/`)
**Responsibilities**:
- Search functionality across entities and reviews
- Trending content identification
- Search analytics and optimization
- Content recommendation (future)

**Key Services**:
- `SearchService`: Multi-faceted search functionality
- `TrendingService`: Trending content algorithms
- `RecommendationService`: Content recommendations (future)

### Service Layer Architecture

#### Interface-Driven Design
All services implement well-defined interfaces (`shared/interfaces/services.py`) that:
- Define clear contracts for service methods
- Enable easy testing with mock implementations
- Support dependency injection and inversion of control
- Allow for service composition and decoration

#### Service Implementation Pattern
```python
class EntityManagementService(IEntityService):
    def __init__(
        self,
        entity_repo: IEntityRepository,
        cache_service: ICacheService,
        event_bus: IEventBus
    ):
        self._entity_repo = entity_repo
        self._cache = cache_service
        self._events = event_bus
    
    async def create_entity(self, data: Dict[str, Any]) -> Entity:
        # 1. Validate input
        # 2. Business logic
        # 3. Persist data
        # 4. Update cache
        # 5. Publish events
        # 6. Return result
```

#### Cross-Cutting Concerns
- **Caching**: Implemented consistently across all services
- **Logging**: Structured logging with correlation IDs
- **Error Handling**: Domain-specific exceptions with consistent structure
- **Events**: Domain events for cross-service communication
- **Validation**: Pydantic schemas for input/output validation

---

## Frontend Architecture

### Current Structure (To Be Modularized)

```
reviewsite-frontend/src/
├── features/                  # Feature-based organization
│   ├── auth/                 # Authentication features
│   ├── entities/             # Entity management
│   ├── reviews/              # Review system
│   ├── messaging/            # Real-time messaging
│   ├── profile/              # User profiles
│   └── circle/               # Review circles
│
├── shared/                   # Shared components
│   ├── atoms/               # Basic UI components
│   ├── molecules/           # Composite components
│   ├── organisms/           # Complex components
│   └── layouts/             # Layout components
│
├── api/                     # API service layer
│   ├── services/            # Domain services
│   └── config.ts           # API configuration
│
├── types/                   # TypeScript type definitions
├── hooks/                   # Custom React hooks
└── utils/                   # Utility functions
```

### Planned Modular Structure

```
reviewsite-frontend/src/
├── domains/                  # Domain-based organization
│   ├── auth/
│   │   ├── components/      # Auth-specific components
│   │   ├── hooks/          # Auth-specific hooks
│   │   ├── services/       # Auth API services
│   │   ├── types/          # Auth type definitions
│   │   └── utils/          # Auth utilities
│   │
│   ├── entities/
│   │   ├── components/
│   │   │   ├── entity-management/
│   │   │   ├── entity-display/
│   │   │   └── entity-search/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── [other domains...]
│
├── shared/                  # Shared infrastructure
│   ├── components/
│   │   ├── ui/             # Basic UI components
│   │   ├── layout/         # Layout components
│   │   └── business/       # Reusable business components
│   │
│   ├── hooks/              # Shared custom hooks
│   ├── services/
│   │   ├── api/            # Core API infrastructure
│   │   ├── cache/          # Client-side caching
│   │   └── utils/          # Utility services
│   │
│   ├── types/              # Shared type definitions
│   └── constants/          # Application constants
│
└── app/                    # Application-level code
    ├── router/             # Application routing
    ├── store/              # Global state management
    └── providers/          # App-level providers
```

---

## Configuration Management

### Environment-Based Configuration

The application uses a sophisticated configuration system that adapts to different environments:

#### Configuration Hierarchy
1. **Base Configuration** (`config/environments/base.py`)
   - Common settings shared across all environments
   - Security defaults and application constants

2. **Environment-Specific Configuration**
   - **Development** (`config/environments/development.py`): Relaxed security, debug logging
   - **Production** (`config/environments/production.py`): Strict security, optimized performance
   - **Staging**: Uses production configuration with specific overrides

3. **Environment Variables** (`.env` file)
   - Sensitive data and deployment-specific values
   - Loaded automatically based on environment

#### Configuration Features
- **Type Safety**: Pydantic validation for all configuration values
- **Environment Detection**: Automatic environment detection with overrides
- **Feature Flags**: Enable/disable features based on environment
- **Security Profiles**: Different security settings per environment
- **Caching**: Configuration values are cached for performance

#### Usage Example
```python
from config.settings import get_settings

settings = get_settings()  # Returns environment-appropriate config
if settings.ENABLE_MESSAGING:
    # Initialize messaging features
```

---

## Development Guidelines

### Code Organization Principles

#### 1. Domain Boundaries
- **Keep domains isolated**: No direct imports between domains
- **Use events for communication**: Domains communicate via domain events
- **Shared code goes in shared/**: Common functionality belongs in shared modules

#### 2. Service Layer Rules
- **One responsibility per service**: Each service should have a single, clear purpose
- **Interface-first design**: Define interfaces before implementation
- **Dependency injection**: Services receive dependencies through constructor injection
- **Async by default**: All service methods should be async for scalability

#### 3. Data Flow Patterns
```
Router → Service → Repository → Database
   ↓        ↓         ↓
Schema   Events    Cache
```

#### 4. Error Handling Strategy
- **Domain-specific exceptions**: Each domain defines its own exception types
- **Consistent error responses**: All APIs return errors in the same format
- **Logging and monitoring**: All errors are logged with appropriate context

#### 5. Testing Strategy
- **Unit tests**: Test individual services and repositories
- **Integration tests**: Test domain interactions and API endpoints
- **End-to-end tests**: Test complete user workflows
- **Mock external dependencies**: Use interfaces to mock external services

### Naming Conventions

#### Files and Directories
- **Domains**: Lowercase with underscores (e.g., `user_management`)
- **Python files**: Lowercase with underscores (e.g., `entity_service.py`)
- **Classes**: PascalCase (e.g., `EntityManagementService`)
- **Functions/methods**: Snake_case (e.g., `create_entity`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

#### API Design
- **Endpoints**: RESTful with resource nouns (e.g., `/api/v1/entities`)
- **HTTP methods**: Standard REST verbs (GET, POST, PUT, DELETE)
- **Response format**: Consistent JSON structure with `success`, `data`, `message`

### Code Quality Standards

#### Code Style
- **Black**: Code formatting
- **isort**: Import organization
- **flake8**: Linting and style checking
- **mypy**: Type checking

#### Documentation
- **Docstrings**: All public methods and classes must have docstrings
- **Type hints**: All function parameters and return values must be typed
- **API documentation**: OpenAPI/Swagger documentation generated automatically
- **Architecture documentation**: Keep this document updated with changes

---

## Deployment Strategy

### Docker Architecture

#### Multi-Stage Builds
- **Build stage**: Install dependencies and compile assets
- **Runtime stage**: Minimal runtime environment
- **Development stage**: Includes development tools and hot-reload

#### Service Architecture
```yaml
services:
  backend:        # FastAPI application
  frontend:       # React application with Nginx
  db:            # PostgreSQL database
  redis:         # Redis cache and sessions
  admin:         # Django admin panel
```

#### Environment Configuration
- **Development**: All services run locally with hot-reload
- **Production**: Optimized builds with health checks and restart policies
- **Staging**: Production-like environment for testing

### Scaling Considerations

#### Horizontal Scaling
- **Stateless services**: All application state stored externally
- **Load balancing**: Multiple backend instances behind load balancer
- **Database scaling**: Read replicas and connection pooling

#### Performance Optimization
- **Caching strategy**: Multi-level caching with Redis
- **Database optimization**: Proper indexing and query optimization
- **CDN integration**: Static asset delivery via CDN

---

## Future Roadmap

### Phase 1: Foundation (Current)
- ✅ Domain-driven architecture implementation
- ✅ Modular service organization
- ✅ Configuration management
- ✅ Basic documentation

### Phase 2: Advanced Patterns (Next 2 months)
- 🔄 Frontend modularization
- 🔄 Event-driven architecture
- 🔄 CQRS implementation for read/write separation
- 🔄 Message queue integration

### Phase 3: Scalability (Next 4 months)
- 📋 Microservice extraction
- 📋 API gateway implementation
- 📋 Service mesh integration
- 📋 Advanced monitoring and observability

### Phase 4: Intelligence (Next 6 months)
- 📋 Machine learning recommendations
- 📋 Advanced analytics and insights
- 📋 Real-time personalization
- 📋 Automated content moderation

---

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd reviewsite

# Start with Docker Compose
docker compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Development Setup
```bash
# Backend development
cd reviewsite-backend
pip install -r requirements.txt
uvicorn main_modular:app --reload

# Frontend development
cd reviewsite-frontend
npm install
npm run dev
```

---

## Support and Contribution

### Architecture Questions
For questions about the architecture or implementation details, refer to:
1. This documentation (primary source)
2. Code comments and docstrings
3. API documentation at `/docs`

### Making Changes
When making architectural changes:
1. Update this documentation
2. Update relevant code comments
3. Run the full test suite
4. Update API documentation if needed

### Code Review Guidelines
- Ensure changes follow domain boundaries
- Verify proper error handling and logging
- Check for proper testing coverage
- Validate configuration management
- Review for security implications

---

**Document Status**: Living Document - Updated with each architectural change  
**Next Review**: Monthly or with major releases  
**Maintainer**: Development Team  
**Last Updated**: 2024-07-14