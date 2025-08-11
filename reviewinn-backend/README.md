# Review Platform API - FastAPI Backend

A comprehensive FastAPI backend for the review platform supporting professionals, companies, places, and products.

## 🚀 Features

- **RESTful API**: Complete CRUD operations for all entities
- **Authentication**: JWT-based authentication with refresh tokens
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Search**: Advanced search with filters and pagination
- **Analytics**: Entity and user analytics
- **Gamification**: Points, badges, leaderboards
- **Real-time**: WebSocket support for notifications
- **Documentation**: Auto-generated API docs with Swagger/ReDoc

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL 12+
- Redis (for caching and background tasks)
- Node.js (for frontend)

## 🛠 Installation

### 1. Clone the repository
```bash
git clone <your-repo>
cd fastapi_backend
```

### 2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/review_platform

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_URL=redis://localhost:6379

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# External Services
ELASTICSEARCH_URL=http://localhost:9200
SENTRY_DSN=your-sentry-dsn

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 5. Database Setup
```bash
# Run the database improvements script
psql -U username -d review_platform -f database_improvements.sql

# Or use Alembic for migrations
alembic upgrade head
```

### 6. Run the application
```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🏗 Project Structure

```
fastapi_backend/
├── main.py                 # FastAPI application entry point
├── database.py             # Database configuration
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
├── models/                 # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py
│   ├── entity.py
│   ├── review.py
│   └── ...
├── schemas/                # Pydantic schemas
│   ├── __init__.py
│   ├── user.py
│   ├── entity.py
│   ├── review.py
│   └── ...
├── routers/                # API route handlers
│   ├── __init__.py
│   ├── auth.py
│   ├── entities.py
│   ├── reviews.py
│   ├── users.py
│   ├── search.py
│   ├── analytics.py
│   ├── notifications.py
│   └── gamification.py
├── services/               # Business logic
│   ├── __init__.py
│   ├── auth_service.py
│   ├── entity_service.py
│   ├── review_service.py
│   ├── user_service.py
│   └── ...
├── dependencies.py         # FastAPI dependencies
├── utils/                  # Utility functions
│   ├── __init__.py
│   ├── security.py
│   ├── email.py
│   └── ...
└── tests/                  # Test files
    ├── __init__.py
    ├── test_auth.py
    ├── test_entities.py
    └── ...
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile

### Entities
- `GET /entities` - List entities with pagination
- `POST /entities` - Create new entity
- `GET /entities/{id}` - Get entity by ID
- `PUT /entities/{id}` - Update entity
- `DELETE /entities/{id}` - Delete entity
- `GET /entities/{id}/related` - Get related entities
- `GET /entities/{id}/analytics` - Get entity analytics
- `POST /entities/search` - Search entities
- `POST /entities/compare` - Compare entities
- `GET /entities/trending` - Get trending entities
- `GET /entities/recent` - Get recent entities
- `GET /entities/top-rated` - Get top rated entities

### Reviews
- `GET /reviews` - List reviews with pagination
- `POST /reviews` - Create new review
- `GET /reviews/{id}` - Get review by ID
- `PUT /reviews/{id}` - Update review
- `DELETE /reviews/{id}` - Delete review
- `POST /reviews/{id}/vote` - Vote on review
- `POST /reviews/{id}/report` - Report review
- `GET /reviews/recent` - Get recent reviews
- `GET /reviews/trending` - Get trending reviews

### Users
- `GET /users` - List users with pagination
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `GET /users/{id}/profile` - Get user profile
- `GET /users/{id}/stats` - Get user statistics
- `POST /users/{id}/follow` - Follow user
- `DELETE /users/{id}/unfollow` - Unfollow user
- `GET /users/{id}/followers` - Get user followers
- `GET /users/{id}/following` - Get user following

### Search
- `GET /search` - Global search
- `GET /search/entities` - Search entities
- `GET /search/reviews` - Search reviews
- `GET /search/users` - Search users
- `GET /search/suggestions` - Get search suggestions

### Analytics
- `GET /analytics/dashboard` - Get dashboard analytics
- `GET /analytics/entities/{id}` - Get entity analytics
- `GET /analytics/users/{id}` - Get user analytics
- `GET /analytics/platform` - Get platform analytics

### Notifications
- `GET /notifications` - Get user notifications
- `POST /notifications/{id}/read` - Mark notification as read
- `POST /notifications/mark-all-read` - Mark all notifications as read

### Gamification
- `GET /gamification/daily-tasks` - Get daily tasks
- `POST /gamification/daily-tasks/{id}/complete` - Complete daily task
- `GET /gamification/badges` - Get user badges
- `GET /gamification/leaderboard` - Get leaderboard
- `GET /gamification/points` - Get user points

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. **Login**: Send credentials to `/auth/login`
2. **Access Token**: Use for API requests (expires in 30 minutes)
3. **Refresh Token**: Use to get new access token (expires in 7 days)

### Example Usage
```bash
# Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Use access token
curl -X GET "http://localhost:8000/entities" \
  -H "Authorization: Bearer <access_token>"
```

## 🗄 Database Schema

The backend uses the improved database schema with:

- **Users**: Authentication and profiles
- **Entities**: Professionals, companies, places, products
- **Reviews**: User reviews with ratings and reactions
- **Categories**: Hierarchical category system
- **Analytics**: User and entity analytics
- **Gamification**: Points, badges, leaderboards

## 🔄 Integration with React Frontend

### 1. Update React API Configuration
In your React app, update the API base URL:
```typescript
// src/api/config.ts
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api',
  AUTH_BASE_URL: 'http://localhost:8000/auth',
  // ... other config
};
```

### 2. Environment Variables
Create `.env` file in React app:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_AUTH_BASE_URL=http://localhost:8000/auth
```

### 3. CORS Configuration
The FastAPI backend is configured to allow requests from:
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_entities.py
```

### Test Structure
```bash
tests/
├── conftest.py           # Test configuration
├── test_auth.py         # Authentication tests
├── test_entities.py     # Entity tests
├── test_reviews.py      # Review tests
├── test_users.py        # User tests
└── ...
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t review-platform-api .

# Run container
docker run -p 8000:8000 review-platform-api
```

### Production Considerations
1. **Environment Variables**: Set production values
2. **Database**: Use production PostgreSQL instance
3. **Redis**: Configure for caching and background tasks
4. **HTTPS**: Use reverse proxy (nginx) with SSL
5. **Monitoring**: Configure Sentry for error tracking
6. **Logging**: Set up structured logging
7. **Rate Limiting**: Configure API rate limiting
8. **Backup**: Set up database backups

## 📊 Performance Optimization

1. **Database Indexing**: Proper indexes on frequently queried columns
2. **Caching**: Redis for frequently accessed data
3. **Pagination**: All list endpoints support pagination
4. **Connection Pooling**: SQLAlchemy connection pooling
5. **Background Tasks**: Celery for heavy operations
6. **CDN**: Use CDN for static assets

## 🔧 Development

### Code Formatting
```bash
# Format code
black .

# Sort imports
isort .

# Lint code
flake8 .
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Background Tasks
```bash
# Start Celery worker
celery -A app.celery worker --loglevel=info

# Start Celery beat (for scheduled tasks)
celery -A app.celery beat --loglevel=info

# Start Flower (monitoring)
celery -A app.celery flower
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run tests and linting
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the test files for usage examples 