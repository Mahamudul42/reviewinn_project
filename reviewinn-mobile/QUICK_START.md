# 🚀 Quick Start - API Integration

## Ready to Connect Your Mobile App to FastAPI Backend!

### ✅ What's Been Implemented

Your mobile app now has **production-grade infrastructure**:

1. ✅ **Environment Configuration** - Switch between dev/staging/prod
2. ✅ **Retry Logic** - Automatic retry with exponential backoff
3. ✅ **Comprehensive Logging** - Know exactly what's happening
4. ✅ **Error Handling** - User-friendly error messages
5. ✅ **Form Validation** - Prevent bad data
6. ✅ **Build Automation** - Easy deployment
7. ✅ **Network Utilities** - Connectivity checks, debounce, throttle

---

## 🏃 Start API Integration (3 Steps)

### Step 1: Start Your Backend
```bash
cd ../reviewinn-backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Verify Backend is Running
```bash
# Test in browser or curl
curl http://localhost:8000/api/v1/
```

### Step 3: Run Mobile App
```bash
cd reviewinn-mobile

# Using VS Code: Press F5 → Select "Dev (Real API - Localhost)"

# Or in terminal:
flutter run --dart-define=ENVIRONMENT=dev --dart-define=USE_MOCK_DATA=false --dart-define=API_URL=http://localhost:8000/api/v1
```

---

## 📱 Testing on Physical Device

If using a real phone/tablet:

1. Find your computer's IP address:
   ```bash
   # Linux/Mac
   ip addr | grep 192.168
   
   # Or
   ifconfig | grep 192.168
   ```

2. Run app with your IP:
   ```bash
   flutter run --dart-define=ENVIRONMENT=dev --dart-define=USE_MOCK_DATA=false --dart-define=API_URL=http://192.168.1.100:8000/api/v1
   ```
   *(Replace 192.168.1.100 with your actual IP)*

---

## 🔍 Monitor Logs

Your console will show:
- 🌐 **API Requests** - Method, endpoint, body
- 🌐 **API Responses** - Status code, preview
- ⚡ **Performance** - Request duration
- ❌ **Errors** - Detailed error info
- 👤 **User Actions** - What users are doing

Example output:
```
🌍 Environment: dev
🔗 API Base URL: http://localhost:8000/api/v1
📊 Mock Data: false
🔧 Logging Enabled: true
⏱️  Connection Timeout: 60s
🔄 Max Retries: 1

🌐 API Request: POST /auth-production/login
⚡ Performance: POST /auth-production/login took 245ms
🌐 API Response: 200 /auth-production/login
✅ SUCCESS: Login successful
```

---

## 🧪 Test These Features

1. **Authentication**
   - [ ] Login with test account
   - [ ] Register new account
   - [ ] Logout

2. **Reviews**
   - [ ] Fetch homepage reviews
   - [ ] View review details
   - [ ] Post a new review
   - [ ] Like/unlike a review

3. **Entities**
   - [ ] Browse entities
   - [ ] View entity details
   - [ ] Search entities

4. **Profile**
   - [ ] View profile
   - [ ] Edit profile
   - [ ] Upload avatar

---

## 🐛 Troubleshooting

### "Connection refused"
**Fix:** Backend not running or wrong URL
```bash
# Check backend
curl http://localhost:8000/api/v1/

# On physical device, use computer IP
flutter run --dart-define=API_URL=http://192.168.1.100:8000/api/v1
```

### "CORS error"
**Fix:** Add CORS middleware to FastAPI
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### "401 Unauthorized"
**Fix:** Token issue
- Check if login returns token
- Verify token is saved in StorageService
- Check Authorization header in API calls

### App crashes
**Fix:** Check logs for exact error
- Model mismatch (JSON structure different)
- Missing null checks
- API endpoint not found

---

## 📚 Important Files

```
lib/
├── config/
│   ├── environment.dart      ← Environment management
│   └── api_config.dart        ← API endpoints
├── utils/
│   ├── logger.dart            ← Logging utilities
│   ├── network_utils.dart     ← Network helpers
│   ├── validators.dart        ← Form validation
│   └── constants.dart         ← App constants
├── services/
│   ├── api_service.dart       ← HTTP client
│   └── auth_service.dart      ← Authentication
└── providers/
    ├── auth_provider.dart     ← Auth state
    ├── review_provider.dart   ← Reviews state
    └── entity_provider.dart   ← Entities state
```

---

## 🎯 Next Steps After API Works

1. **Persistence** - Add sqflite for offline support
2. **Caching** - Cache API responses
3. **Analytics** - Firebase Analytics
4. **Crash Reporting** - Crashlytics
5. **Notifications** - FCM push notifications

---

## 📖 Full Documentation

- **Detailed Guide:** `API_INTEGRATION_GUIDE.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Build Script:** `./build.sh --help`

---

## 💪 You're Ready!

Everything is in place. Just:
1. Start backend
2. Run mobile app
3. Watch the logs
4. Test features

**The infrastructure will handle:**
- Network failures (automatic retry)
- Errors (user-friendly messages)
- Logging (detailed console output)
- Different environments (dev/staging/prod)

Good luck! 🚀
