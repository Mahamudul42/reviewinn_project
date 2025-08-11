# Production Deployment Guide

## Overview

This guide covers the production deployment configuration for ReviewInn with proper CORS and environment setup.

### Production URLs
- **Frontend**: https://reviewinn.com
- **Backend API**: https://api.reviewinn.com
- **Admin Panel**: https://admin.reviewinn.com

## Frontend Configuration

### Environment Files

The frontend now supports environment-specific configuration:

- `.env.development` - Development settings
- `.env.production` - Production settings

### Key Configuration Variables

```bash
# Production Frontend (.env.production)
VITE_NODE_ENV=production
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.reviewinn.com/api/v1
VITE_API_TIMEOUT=30000
VITE_FRONTEND_URL=https://reviewinn.com
VITE_ADMIN_URL=https://admin.reviewinn.com
VITE_ENABLE_DEBUG=false
VITE_ENABLE_SECURE_COOKIES=true
```

### Dynamic API URL Resolution

The frontend automatically detects the environment and configures the correct API endpoint:

1. **Environment Variable**: Uses `VITE_API_BASE_URL` if set
2. **Hostname Detection**: Falls back to detecting the current hostname
3. **Development Fallback**: Defaults to localhost for development

## Backend Configuration

### Environment Files

- `.env.development` - Development settings
- `.env.production` - Production settings

### Production Backend Settings

```bash
# Production Backend (.env.production)
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000

# CORS - Production Domains Only
CORS_ORIGINS=https://reviewinn.com,https://www.reviewinn.com,https://admin.reviewinn.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD

# Security
SECRET_KEY=your-super-secret-production-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
POSTGRES_HOST=your-db-host
POSTGRES_DB=reviewinn_prod
POSTGRES_USER=reviewinn_user
POSTGRES_PASSWORD=your-secure-password

# Redis Cache
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
```

## CORS Configuration

### Production CORS Features

✅ **Strict Origin Control**: Only allows requests from production domains  
✅ **Preflight Request Handling**: Proper OPTIONS request handling  
✅ **Credential Support**: Secure cookie and authentication support  
✅ **Security Headers**: Complete security header implementation  
✅ **Environment-Aware**: Different configs for dev/staging/production  

### Allowed Origins

**Production**: 
- `https://reviewinn.com`
- `https://www.reviewinn.com` 
- `https://admin.reviewinn.com`

**Development**:
- `http://localhost:3000`
- `http://localhost:5173-5177`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173-5177`

### CORS Headers Handled

- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Credentials`
- `Access-Control-Expose-Headers`
- `Access-Control-Max-Age`

## Deployment Steps

### 1. Frontend Deployment

```bash
# Build for production
cd reviewsite-frontend
npm ci
npm run build

# Deploy dist/ folder to CDN/static hosting
# Configure environment variables in hosting platform
```

### 2. Backend Deployment

```bash
# Setup production environment
cd reviewsite-backend
cp .env.production .env

# Update environment variables with actual production values
# Deploy to your server/container platform
```

### 3. Environment Variables Setup

**Frontend (Build Time)**:
```bash
VITE_API_BASE_URL=https://api.reviewinn.com/api/v1
VITE_FRONTEND_URL=https://reviewinn.com
VITE_APP_ENV=production
```

**Backend (Runtime)**:
```bash
ENVIRONMENT=production
CORS_ORIGINS=https://reviewinn.com,https://www.reviewinn.com,https://admin.reviewinn.com
SECRET_KEY=your-production-secret
DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Testing CORS Configuration

### Health Check Endpoint

Test CORS configuration using the health check endpoint:

```bash
# Test from allowed origin
curl -H "Origin: https://reviewinn.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.reviewinn.com/health/cors

# Should return 204 with proper CORS headers
```

### Expected Response Headers

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://reviewinn.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
Access-Control-Allow-Headers: Accept, Content-Type, Authorization, ...
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## Security Features

### Production Security Measures

1. **Strict CORS**: Only production domains allowed
2. **Secure Cookies**: HTTPOnly, Secure, SameSite cookies in production
3. **HTTPS Only**: All production traffic over HTTPS
4. **Token Expiry**: Shorter token expiration in production
5. **Rate Limiting**: Production-appropriate rate limits
6. **Header Validation**: Strict header validation

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| CORS Origins | Permissive (localhost) | Strict (reviewinn.com only) |
| Token Expiry | 60 minutes | 15 minutes |
| Debug Mode | Enabled | Disabled |
| Rate Limits | 1000/hour | 100/hour |
| Secure Cookies | Disabled | Enabled |

## Troubleshooting

### Common CORS Issues

1. **Origin not allowed**: Check `CORS_ORIGINS` environment variable
2. **Preflight failure**: Verify OPTIONS method is allowed
3. **Credentials issue**: Ensure `CORS_CREDENTIALS=true`
4. **Missing headers**: Check `Access-Control-Expose-Headers`

### Debug Commands

```bash
# Check backend CORS health
curl -v https://api.reviewinn.com/health/cors

# Test preflight request
curl -H "Origin: https://reviewinn.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.reviewinn.com/api/v1/entities

# Check frontend API configuration
# Open browser console on https://reviewinn.com
console.log(window.API_CONFIG?.BASE_URL)
```

## Monitoring

### Health Checks

- **Frontend**: Check if static assets load from CDN
- **Backend**: Monitor `/health/cors` endpoint
- **API**: Monitor `/api/v1/health` endpoint
- **Database**: Monitor connection health

### Logging

The backend logs CORS requests in production:
- Origin validation results
- Preflight request handling
- CORS header setting
- Failed origin attempts

## Support

For deployment issues, check:
1. Environment variable configuration
2. DNS settings for domains
3. SSL certificate validity
4. CORS header responses
5. Browser network tab for CORS errors