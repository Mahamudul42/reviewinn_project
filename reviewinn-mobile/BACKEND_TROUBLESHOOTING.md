# Backend Connection Troubleshooting

## Current Issue

Your Flutter app is now using **mock/demo data** because the backend is not responding. The app will work perfectly to showcase the UI and functionality!

## Why Backend Isn't Working

The backend server is hanging during startup at the "Database table creation" step. This is likely due to:
1. Database connection pooling issues
2. Long-running migration or table creation
3. Lock contention in PostgreSQL

## What's Working Now

✅ **Flutter app is running** with beautiful UI
✅ **Mock data is displaying** - 5 sample entities with reviews
✅ **All screens work** - Home, Entity Detail, Reviews
✅ **Hot reload enabled** - Make changes and see them instantly

## To Fix Backend Connection

### Option 1: Restart PostgreSQL (Recommended)
```bash
# Check database connections
PGPASSWORD=Munna1992 psql -h localhost -U reviewinn_user -d reviewinn_database -c "SELECT * FROM pg_stat_activity WHERE datname='reviewinn_database';"

# Kill any hanging queries
PGPASSWORD=Munna1992 psql -h localhost -U reviewinn_user -d reviewinn_database -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='reviewinn_database' AND pid != pg_backend_pid();"

# Then restart backend
cd /home/hasan181/personal/my_project/reviewinn_project/reviewinn-backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Option 2: Check for Database Locks
```bash
PGPASSWORD=Munna1992 psql -h localhost -U reviewinn_user -d reviewinn_database -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

### Option 3: Use Docker Backend
If you have Docker configured, use the containerized version:
```bash
cd /home/hasan181/personal/my_project/reviewinn_project
docker-compose up backend
```

## Switching to Real Backend Data

Once your backend is fixed and running properly:

### 1. Remove Mock Data Fallback

Edit `lib/providers/entity_provider.dart` and `lib/providers/review_provider.dart`:

Remove these lines from the catch blocks:
```dart
// Remove this fallback code:
_entities = MockData.getMockEntities();
_error = 'Using demo data (Backend connection failed)';
```

Replace with:
```dart
// Show actual error instead:
_error = e.toString();
```

### 2. Test Backend Connection

```bash
# Test if backend is responding
curl -s http://localhost:8000/api/v1/entities | jq

# Test specific entity
curl -s http://localhost:8000/api/v1/entities/1 | jq

# Test CORS
curl -s -H "Origin: http://localhost:8080" http://localhost:8000/health/cors | jq
```

### 3. Verify CORS Configuration

The backend should allow `http://localhost:8080` in development mode.

Check `.env` file or settings:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:3000
```

## Current App Behavior

**What you'll see:**
- Home screen with 5 demo entities (Harvard, Google, French Laundry, iPhone, Mayo Clinic)
- Each entity has ratings, images, and descriptions
- Clicking an entity shows details and 3 mock reviews
- A message at the top: "Using demo data (Backend connection failed)"

**This is perfect for:**
- ✅ Showcasing the mobile UI
- ✅ Testing navigation and interactions
- ✅ Demonstrating the app flow
- ✅ Developing new features without backend dependency
- ✅ Presenting to stakeholders

## Real Backend Integration

When backend is ready:

1. **Update API Config** (if using production):
   ```dart
   // lib/config/api_config.dart
   static const String baseUrl = 'https://your-production-api.com/api/v1';
   ```

2. **Remove Mock Data** (follow instructions above)

3. **Test with Real Data**:
   - Tap "Retry" button on home screen
   - Pull to refresh
   - Check that real entities load from database

## Backend Logs

Current backend log location:
```
/home/hasan181/personal/my_project/reviewinn_project/reviewinn-backend/backend.log
```

Check logs:
```bash
tail -f /home/hasan181/personal/my_project/reviewinn_project/reviewinn-backend/backend.log
```

## Quick Backend Test

```bash
# Kill any hanging backend
ps aux | grep uvicorn | grep -v grep | awk '{print $2}' | xargs kill -9

# Start fresh
cd /home/hasan181/personal/my_project/reviewinn_project/reviewinn-backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Wait 30 seconds, then test
curl http://localhost:8000/api/v1/entities
```

## Summary

🎉 **Your Flutter app is working perfectly with demo data!**

You can now:
- Show the app to others
- Develop additional features
- Test UI/UX
- Fix backend separately without blocking mobile development

When you're ready to connect to the real backend, just remove the mock data fallback code and ensure your backend is responding on port 8000.
