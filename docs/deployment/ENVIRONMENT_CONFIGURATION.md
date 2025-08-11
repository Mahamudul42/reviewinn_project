# 🔧 Environment Configuration - Industry Best Practices

This document outlines the **world-class environment configuration system** implemented for ReviewInn, following microservices industry standards.

## 🎯 Design Philosophy

### ✅ Current Approach (Recommended)
- **Hybrid Configuration**: Shared infrastructure + Service-specific configs
- **Security-First**: No secrets in git, proper separation of concerns
- **Scalable**: Each service has its own configuration
- **Environment-Specific**: Different configs for dev/staging/production
- **Docker-Optimized**: Proper env_file configuration for containers

### ❌ Previous Approach (Not Recommended)
- Single monolithic `.env` file
- All services see all variables (security risk)
- Hard to scale individual services
- Difficult to manage in different environments

---

## 🏗️ Directory Structure

```
reviewinn/
├── .env.shared                    # 🔧 Shared Infrastructure (DB, Redis, etc.)
├── .env.example                   # 📋 Complete Template & Documentation  
├── .env.development              # 🔧 Dev Environment Overrides
├── .env.production               # 🔧 Production Environment Overrides
├── reviewinn-backend/
│   ├── .env                      # 🎯 Backend-Specific Variables Only
│   ├── .env.example             # 📋 Backend Template
│   ├── .env.development         # 🔧 Backend Dev Overrides
│   └── .env.production          # 🔧 Backend Prod Overrides
├── reviewinn-frontend/
│   ├── .env                      # 🎯 Frontend-Specific Variables Only
│   ├── .env.example             # 📋 Frontend Template
│   ├── .env.development         # 🔧 Frontend Dev Overrides
│   └── .env.production          # 🔧 Frontend Prod Overrides
├── reviewinn-admin/
│   ├── .env                      # 🎯 Admin-Specific Variables Only
│   ├── .env.example             # 📋 Admin Template
│   ├── .env.development         # 🔧 Admin Dev Overrides
│   └── .env.production          # 🔧 Admin Prod Overrides
└── docker-compose.yml            # 🐳 Updated for Multiple Env Files
```

---

## 📋 Configuration Categories

### 🔧 Shared Infrastructure (`.env.shared`)
Variables shared across multiple services:
- **Database**: PostgreSQL connection details
- **Cache**: Redis configuration  
- **External APIs**: IMGBB, Google Analytics
- **Environment**: DEBUG, LOG_LEVEL

### 🎯 Service-Specific Configurations

#### Backend (`.env`)
- JWT & Security settings
- API configuration
- CORS settings
- File upload limits
- Rate limiting
- Email configuration

#### Frontend (`.env`)
- VITE environment variables
- API endpoints
- Feature flags
- Analytics settings
- UI configuration

#### Admin (`.env`)
- Django settings
- Admin panel configuration
- Authentication settings

---

## 🚀 Loading Order & Priority

Environment variables are loaded in this **priority order** (later overrides earlier):

1. **Shared Infrastructure** (`.env.shared`)
2. **Service-Specific** (`.env`)
3. **Environment-Specific** (`.env.development` or `.env.production`)
4. **System Environment Variables** (highest priority)

### Example Loading in Backend:
```python
# In database.py and settings.py
load_dotenv(dotenv_path=\"../.env.shared\")   # 1. Shared infrastructure
load_dotenv(dotenv_path=\".env\")             # 2. Service-specific (overrides shared)

# Pydantic Settings automatically loads:
# 3. Environment-specific files based on ENVIRONMENT variable
# 4. System environment variables (highest priority)
```

---

## 🐳 Docker Configuration

### docker-compose.yml
```yaml
services:
  backend:
    env_file:
      - .env.shared                    # Load shared config first
      - ./reviewinn-backend/.env       # Then service-specific (overrides shared)
    
  frontend:
    env_file:
      - .env.shared                    # Load shared config first  
      - ./reviewinn-frontend/.env      # Then service-specific (overrides shared)
      
  admin:
    env_file:
      - .env.shared                    # Load shared config first
      - ./reviewinn-admin/.env         # Then service-specific (overrides shared)
```

---

## 🔒 Security Best Practices

### ✅ DO
- **Never commit secrets** to git (use `.env.example` templates)
- Use **different secrets** for different environments
- Implement **proper access controls** (each service sees only what it needs)
- Use **external secret management** in production (AWS Secrets Manager, HashiCorp Vault)
- **Rotate secrets** regularly
- Use **strong, unique passwords** for each environment

### ❌ DON'T
- Don't commit `.env` files with real secrets
- Don't use the same secrets across environments
- Don't give all services access to all variables
- Don't use weak or default passwords
- Don't hardcode secrets in application code

---

## 🌍 Environment-Specific Configurations

### Development
```bash
# .env.development
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
POSTGRES_HOST=localhost          # Local database
REDIS_HOST=localhost            # Local Redis
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Production
```bash
# .env.production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
LOG_FORMAT=json
POSTGRES_HOST=prod-db-host      # Production database
REDIS_HOST=prod-redis-host      # Production Redis
VITE_API_BASE_URL=https://api.reviewinn.com/api/v1
```

---

## 🛠️ Setup Instructions

### 1. Initial Setup
```bash
# Copy example files to create your configuration
cp .env.example .env.shared
cp reviewinn-backend/.env.example reviewinn-backend/.env
cp reviewinn-frontend/.env.example reviewinn-frontend/.env
cp reviewinn-admin/.env.example reviewinn-admin/.env

# Update with your actual values (never commit real secrets!)
```

### 2. Development Setup
```bash
# Start with development configuration
docker-compose up -d

# Or override environment
ENVIRONMENT=development docker-compose up -d
```

### 3. Production Deployment
```bash
# Use production environment variables
ENVIRONMENT=production docker-compose up -d

# Or use external secret management
# AWS Secrets Manager, HashiCorp Vault, etc.
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. **Environment Variables Not Loading**
```bash
# Check loading order in backend
# Verify docker-compose.yml env_file paths
# Ensure file permissions are correct
```

#### 2. **Service-Specific Variables Not Working**
```bash
# Verify service-specific .env files exist
# Check that variables are properly prefixed (VITE_ for frontend)
# Rebuild Docker containers after changes
```

#### 3. **Database Connection Issues**
```bash
# Check POSTGRES_HOST in .env.shared
# Verify database container is healthy
# Ensure database URL format is correct
```

---

## 📊 Benefits of This Approach

### 🚀 **Scalability**
- Services can be deployed independently
- Easy to add new services
- Proper separation of concerns

### 🔒 **Security**
- Each service sees only what it needs
- No secrets in git repositories
- Environment-specific access controls

### 🛠️ **Maintainability**
- Clear organization of variables
- Self-documenting with `.env.example` files
- Easy to manage across environments

### 🐳 **DevOps Friendly**
- Docker-optimized configuration
- CI/CD pipeline ready
- Easy environment promotion

---

## 📚 Further Reading

- [Twelve-Factor App - Config](https://12factor.net/config)
- [Docker Environment Variables Best Practices](https://docs.docker.com/compose/environment-variables/)
- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Environment Variable Security Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## 🤝 Contributing

When adding new environment variables:

1. **Add to appropriate `.env.example` file**
2. **Document the variable's purpose**
3. **Use appropriate prefixes** (`VITE_` for frontend, service-specific for others)
4. **Never commit actual secrets**
5. **Update this documentation**

---

*This configuration follows industry best practices for microservices architecture and provides a solid foundation for scaling ReviewInn.*