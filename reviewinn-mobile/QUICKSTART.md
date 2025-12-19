# 🚀 Quick Start Guide - ReviewInn Mobile

## Current Status
✅ Flutter is installed
✅ Web support enabled
✅ App is ready to run

## 🎯 How to Run Your App

### Method 1: Using the Quick Run Script (Recommended)
```bash
cd /home/hasan181/personal/my_project/reviewinn_project/reviewinn-mobile
./run.sh
```

Then open your browser to: **http://localhost:8080**

### Method 2: Manual Command
```bash
cd /home/hasan181/personal/my_project/reviewinn_project/reviewinn-mobile
export CHROME_EXECUTABLE=/usr/bin/chromium-browser
flutter run -d web-server --web-port=8080
```

Then open: **http://localhost:8080**

### Method 3: Custom Port
```bash
./run.sh 3000  # Use port 3000 instead
```

Then open: **http://localhost:3000**

## 📱 Available Devices

Check what devices you have:
```bash
flutter devices
```

You should see:
- **Web Server** (current setup) - Access via http://localhost:8080
- **Linux Desktop** - Native Linux app: `flutter run -d linux`

## 🔥 Development Tips

While the app is running:
- Press **'r'** - Hot reload (instant updates)
- Press **'R'** - Hot restart (full restart)
- Press **'q'** - Quit the app
- Press **'h'** - Help menu

## 🛠️ Common Commands

```bash
# Run on web server (current setup)
flutter run -d web-server --web-port=8080

# Run as Linux desktop app
flutter run -d linux

# Build for production
flutter build web

# Check for issues
flutter doctor

# Install new packages
flutter pub get

# Update packages
flutter pub upgrade
```

## 📂 Project Structure

```
lib/
├── main.dart        # Main entry point (currently a demo counter app)
├── screens/         # Create your app screens here
├── widgets/         # Reusable widgets
├── services/        # API services (to connect to ReviewInn backend)
└── models/          # Data models
```

## 🎨 Next Steps

1. **View the current demo app** at http://localhost:8080
2. **Customize lib/main.dart** to build your ReviewInn interface
3. **Connect to backend** - Update API endpoints to your ReviewInn backend
4. **Add features** - Reviews, ratings, user profiles, etc.

## 🔗 Connect to ReviewInn Backend

Your ReviewInn backend is likely running at:
- Development: `http://localhost:8000`
- Production: Your production URL

To connect the mobile app to your backend:
1. Install http package: `flutter pub add http`
2. Create API service in `lib/services/api_service.dart`
3. Make API calls to your backend endpoints

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill the process using port 8080
lsof -ti:8080 | xargs kill -9

# Or use a different port
./run.sh 3001
```

### Can't see Chrome in devices list
```bash
export CHROME_EXECUTABLE=/usr/bin/chromium-browser
flutter devices
```

### App won't start
```bash
# Clean and rebuild
flutter clean
flutter pub get
./run.sh
```

## 📱 Current Demo App

The app currently shows a simple counter demo. This is Flutter's default template.

**What you can do:**
- Click the "+" button to increment counter
- See Flutter's hot reload in action (change text in lib/main.dart and press 'r')
- Explore the Material Design components

**What to build next:**
- ReviewInn home screen
- Entity listing page
- Review display and submission
- User authentication
- Rating system
- Search functionality

## 🎓 Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Material Design Components](https://flutter.dev/docs/development/ui/widgets/material)
- [HTTP Networking](https://docs.flutter.dev/cookbook/networking/fetch-data)
- [State Management](https://docs.flutter.dev/development/data-and-backend/state-mgmt)
