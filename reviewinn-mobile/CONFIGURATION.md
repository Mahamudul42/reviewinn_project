# ReviewInn Mobile Configuration Guide

## Switching Between Mock Data and Real Backend API

The ReviewInn mobile app is configured to easily switch between using mock data (from your PostgreSQL database copy) and the real backend API.

### How to Switch

Open the file: `lib/config/app_config.dart`

```dart
class AppConfig {
  // Set this to true to use mock data, false to use real backend API
  static const bool useMockData = true;  // <-- Change this line

  // Set this to true to show debug info
  static const bool showDebugInfo = true;
}
```

### Options:

1. **Use Mock Data (Default)**:
   ```dart
   static const bool useMockData = true;
   ```
   - Uses local mock data from `lib/services/real_database_mock.dart`
   - Contains real data copied from your PostgreSQL database
   - Works offline, no backend required
   - Shows 3 reviews and 10 entities from your database

2. **Use Real Backend API**:
   ```dart
   static const bool useMockData = false;
   ```
   - Connects to your backend at `http://localhost:8000`
   - Uses the same API endpoints as your React frontend
   - Endpoint: `/api/v1/homepage/reviews`
   - Shows all 41 reviews from your live database
   - Automatically falls back to mock data if API fails

### Debug Mode

Control debug logging by changing:
```dart
static const bool showDebugInfo = true;  // true = show logs, false = hide logs
```

### Backend API Configuration

The backend API base URL is configured in: `lib/config/api_config.dart`

```dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:8000/api/v1';
  // ...
}
```

### Testing the Configuration

After changing the configuration:

1. Hot reload the app:
   - Press `R` in the terminal where Flutter is running
   - Or refresh your browser at `http://localhost:8080`

2. Check the console logs to verify which data source is being used:
   - With `useMockData = true`: You'll see "Loading reviews from database mock data..."
   - With `useMockData = false`: You'll see API requests to your backend

### Troubleshooting

**If reviews aren't showing:**
1. Check the console logs for errors
2. Verify `AppConfig.useMockData` is set correctly
3. If using API mode, ensure your backend is running at `http://localhost:8000`
4. Check that mock data exists in `lib/services/real_database_mock.dart`

**If backend API is slow:**
- The app automatically falls back to mock data if the API times out
- You can force mock mode by setting `useMockData = true`

### Current Data

**Mock Data includes:**
- 10 entities (universities, companies, restaurants from Bangladesh)
- 3 reviews with full content, ratings, pros/cons
- All data copied from your PostgreSQL database

**Real API provides:**
- All 41 reviews from your database
- Complete user and entity information
- Real-time updates
- Pagination support
