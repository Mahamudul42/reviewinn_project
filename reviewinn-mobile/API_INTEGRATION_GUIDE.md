# API Integration Guide

## Overview
This guide explains how to integrate your Flutter mobile app with the FastAPI backend.

## Environment Configuration

### 1. Development Setup

#### Using Mock Data (Default)
```bash
flutter run --dart-define=ENVIRONMENT=dev --dart-define=USE_MOCK_DATA=true
```

#### Using Real API (Localhost)
```bash
flutter run --dart-define=ENVIRONMENT=dev --dart-define=USE_MOCK_DATA=false --dart-define=API_URL=http://localhost:8000/api/v1
```

#### Using Real API (Network Device)
When testing on a physical device, use your computer's IP address:
```bash
flutter run --dart-define=ENVIRONMENT=dev --dart-define=USE_MOCK_DATA=false --dart-define=API_URL=http://192.168.1.100:8000/api/v1
```

**To find your IP address:**
- Linux/Mac: `ip addr` or `ifconfig`
- Windows: `ipconfig`

### 2. VS Code Launch Configurations

We've created 5 launch configurations in `.vscode/launch.json`:

1. **Dev (Mock Data)** - Uses mock data for development
2. **Dev (Real API - Localhost)** - Connects to localhost:8000
3. **Dev (Real API - Network)** - Connects to your IP address (update in file)
4. **Staging** - Connects to staging server
5. **Production** - Connects to production server

To use: Press F5 in VS Code and select a configuration.

### 3. Build Script

Use the build script for different environments:

```bash
# Development with mock data
./build.sh dev android

# Development with real API
./build.sh dev-api android

# Staging
./build.sh staging android

# Production
./build.sh prod all
```

## Backend Integration Checklist

### Before Starting API Integration:

- [ ] ✅ Environment configuration created
- [ ] ✅ Retry logic with exponential backoff implemented
- [ ] ✅ Network utilities for error handling
- [ ] ✅ Comprehensive logging system
- [ ] ✅ Validators for form inputs
- [ ] ✅ Constants file for app-wide values
- [ ] ✅ Error display widgets

### Phase 1: Backend Setup (Backend Team)

1. **Ensure CORS is configured** in FastAPI backend:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. **Verify API endpoints** match the mobile app:
   - Auth: `/api/v1/auth-production/login`, `/api/v1/auth-production/register`
   - Reviews: `/api/v1/reviews`, `/api/v1/homepage/reviews`
   - Entities: `/api/v1/entities`
   - User: `/api/v1/users/me`

3. **Test endpoints** with Postman/curl to ensure they work

### Phase 2: Mobile App Configuration (Your Task)

1. **Update Environment Configuration**

Edit `lib/config/environment.dart` if needed, but default values are set:
- Dev: `http://localhost:8000/api/v1`
- Staging: `https://staging-api.reviewinn.com/api/v1`
- Prod: `https://api.reviewinn.com/api/v1`

2. **Update API Endpoints**

Check `lib/config/api_config.dart` and ensure all endpoints match your backend:

```dart
// Current endpoints:
static const String login = '/auth-production/login';
static const String register = '/auth-production/register';
static const String reviews = '/reviews';
static const String entities = '/entities';
```

3. **Disable Mock Data**

In `lib/config/app_config.dart`:
```dart
static const bool useMockData = false; // Change to false
```

Or use environment variable (recommended):
```bash
flutter run --dart-define=USE_MOCK_DATA=false
```

### Phase 3: Testing Integration

1. **Start Your Backend**
```bash
cd reviewinn-backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. **Run Mobile App**
```bash
# On emulator (localhost works)
flutter run --dart-define=ENVIRONMENT=dev --dart-define=USE_MOCK_DATA=false

# On physical device (use your IP)
flutter run --dart-define=ENVIRONMENT=dev --dart-define=USE_MOCK_DATA=false --dart-define=API_URL=http://192.168.1.100:8000/api/v1
```

3. **Check Logs**

The app now logs all API requests/responses:
- 🌐 API Request: Method + Endpoint
- 🌐 API Response: Status Code + Preview
- ❌ Errors with full details
- ⚡ Performance metrics

4. **Test Core Flows**

Test these in order:
- [ ] App launches successfully
- [ ] Login with test credentials
- [ ] Fetch reviews (homepage)
- [ ] Fetch entities
- [ ] View entity details
- [ ] Post a review
- [ ] Update profile
- [ ] Logout

### Phase 4: Common Issues & Solutions

#### Issue: "Connection refused"
**Solution:** 
- Check if backend is running: `curl http://localhost:8000/api/v1`
- On physical device, use computer IP instead of localhost
- Ensure firewall allows connections

#### Issue: "CORS error"
**Solution:** Backend needs CORS middleware configured (see Phase 1)

#### Issue: "401 Unauthorized"
**Solution:**
- Check token storage in `StorageService`
- Verify `Authorization: Bearer <token>` header is sent
- Check backend token validation

#### Issue: "Timeout"
**Solution:**
- Backend might be slow, increase timeout in `Environment.dart`
- Check network connectivity
- Backend logs for slow queries

#### Issue: App crashes on API call
**Solution:**
- Check logs for exact error
- Verify JSON response structure matches model classes
- Add try-catch around API calls

### Phase 5: Production Deployment

1. **Update Production URLs**

In `lib/config/environment.dart`, set production API URL.

2. **Build Release APK**
```bash
./build.sh prod android
```

3. **Test on Real Devices**
- Test on different Android versions
- Test on slow networks (use Network throttling in Chrome DevTools)
- Test offline behavior

4. **Add Analytics & Monitoring**
- Firebase Analytics
- Crashlytics for error tracking
- Performance monitoring

## API Response Format

Your backend should follow this format:

### Success Response
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "detail": "Detailed error info"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "page_size": 15,
    "total": 100,
    "has_more": true
  }
}
```

## Network Utilities Features

### Automatic Retry
All GET requests automatically retry up to 3 times with exponential backoff:
```dart
// Automatic in ApiService
final response = await _api.get('/entities');
```

### Manual Retry Control
```dart
// Custom retry logic
await NetworkUtils.executeWithRetry(
  () => myApiCall(),
  maxRetries: 5,
  initialDelay: Duration(seconds: 2),
);
```

### Connectivity Check
```dart
// Check internet
bool hasInternet = await NetworkUtils.hasInternetConnection();

// Check API reachable
bool apiOnline = await NetworkUtils.isApiReachable();
```

### Error Messages
```dart
// User-friendly error messages
String message = NetworkUtils.getErrorMessage(error);
// "No internet connection. Please check your network."
```

### Debounce/Throttle
```dart
// Search debounce (500ms)
NetworkUtils.debounce(() {
  searchApi(query);
});

// Scroll throttle (200ms)
NetworkUtils.throttle(() {
  loadMore();
});
```

## Logging Features

```dart
import '../utils/logger.dart';

// Different log levels
Logger.info('User logged in', tag: 'Auth');
Logger.success('Review posted successfully');
Logger.warning('Cache is getting full');
Logger.error('API call failed', error: e, stackTrace: st);
Logger.debug('Internal state: $value');

// API logs (automatic in ApiService)
Logger.apiRequest('POST', '/reviews', body: data);
Logger.apiResponse(200, '/reviews');

// Performance tracking
final timer = Logger.startTimer('Load Reviews');
// ... do work ...
Logger.endTimer('Load Reviews', timer);

// User actions
Logger.userAction('Tapped Like', details: {'review_id': 123});

// Navigation
Logger.navigation('HomeScreen', 'ProfileScreen');
```

## Next Steps

1. **Run the app** with real API connection
2. **Monitor logs** for any errors
3. **Test all features** systematically
4. **Fix any model mismatches** between backend and mobile
5. **Implement missing API endpoints** (see TODOs in code)
6. **Add unit tests** for API integration
7. **Setup CI/CD** for automated builds

## Need Help?

Check the logs first - they're very detailed now. Common files to check:
- `lib/services/api_service.dart` - All API calls
- `lib/providers/*_provider.dart` - State management
- `lib/models/*_model.dart` - Data structures

Good luck with your integration! 🚀
