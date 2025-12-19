# ReviewInn Mobile - Development Guide

Quick guide for running and testing your Flutter mobile app.

## 🚀 Quick Start Script

We've created a convenient `run-dev.sh` script for you!

### Interactive Menu Mode

Simply run:
```bash
./run-dev.sh
```

This shows an interactive menu with all options.

### Command Line Mode

Run specific commands directly:

```bash
# Hot reload (fastest - preserves state)
./run-dev.sh reload
./run-dev.sh r

# Hot restart (slower - resets state)
./run-dev.sh restart
./run-dev.sh R

# Start web server on http://localhost:8085
./run-dev.sh web
./run-dev.sh w

# Start on Chrome (better debugging)
./run-dev.sh chrome
./run-dev.sh c

# Build APK for Android
./run-dev.sh apk
./run-dev.sh build

# Clean and get dependencies
./run-dev.sh clean

# Open browser to localhost:8085
./run-dev.sh open
./run-dev.sh o

# Show help
./run-dev.sh help
```

## 📱 Development Workflow

### 1. First Time Setup

```bash
cd reviewinn-mobile
flutter pub get
```

### 2. Start Development Server

**Option A: Web Browser** (Recommended for quick testing)
```bash
./run-dev.sh web
```
Then open: http://localhost:8085

**Option B: Chrome** (Better DevTools)
```bash
./run-dev.sh chrome
```

**Option C: Physical Android Device**
```bash
# Connect device via USB, enable USB debugging
flutter devices  # Check device is detected
flutter run      # Run on connected device
```

### 3. Make Code Changes

Edit files in VS Code or your editor.

### 4. See Updates

**If server is already running:**
```bash
# In another terminal:
./run-dev.sh reload    # Fast refresh
./run-dev.sh restart   # Full restart (if needed)

# OR press 'r' in the terminal where Flutter is running
```

**If server is not running:**
```bash
./run-dev.sh web
```

### 5. Build for Production

```bash
# Build APK
./run-dev.sh apk

# APK will be at:
# build/app/outputs/flutter-apk/app-release.apk

# Transfer to Android phone to install
```

## 🔥 Hot Reload vs Hot Restart

### Hot Reload (`r`)
- **Fast** (~1-2 seconds)
- **Preserves app state**
- Use for: UI changes, widget updates, styling

### Hot Restart (`R`)
- **Slower** (~5-10 seconds)
- **Resets app state**
- Use for: Adding dependencies, changing `initState()`, global variables

### Full Restart
- **Slowest**
- Required for: New dependencies in `pubspec.yaml`, native code changes

## 🌐 Testing on Different Platforms

### Web Browser
```bash
./run-dev.sh web
# Open http://localhost:8085
```

### Chrome (Best debugging experience)
```bash
./run-dev.sh chrome
```

### Android Emulator
```bash
# Start emulator from Android Studio first
flutter run
```

### Physical Android Device
```bash
# 1. Enable Developer Options on phone
# 2. Enable USB Debugging
# 3. Connect via USB
# 4. Allow USB debugging prompt
flutter devices  # Should show your device
flutter run
```

## 🛠️ Troubleshooting

### Port 8085 Already in Use
```bash
# Kill existing Flutter processes
pkill -f "flutter run"

# Or use a different port
flutter run -d web-server --web-port 8090
```

### Hot Reload Not Working
```bash
# Do a hot restart instead
./run-dev.sh restart

# Or full restart
pkill -f "flutter run"
./run-dev.sh web
```

### Build Errors
```bash
# Clean and rebuild
./run-dev.sh clean
./run-dev.sh web
```

### Changes Not Appearing
1. Check if hot reload succeeded (look for errors in terminal)
2. Try hot restart (`R`)
3. If still not working, full restart:
   ```bash
   pkill -f "flutter run"
   ./run-dev.sh web
   ```

## 📂 Project Structure

```
reviewinn-mobile/
├── lib/
│   ├── main.dart              # App entry point
│   ├── screens/               # All screens
│   │   ├── home_feed_screen.dart
│   │   ├── entities_screen.dart
│   │   ├── groups_screen.dart
│   │   └── profile_screen.dart
│   ├── widgets/               # Reusable components
│   │   ├── entity_card.dart
│   │   ├── beautiful_review_card.dart
│   │   └── premium_bottom_nav.dart
│   ├── providers/             # State management
│   │   ├── review_provider.dart
│   │   ├── entity_provider.dart
│   │   └── auth_provider.dart
│   ├── models/                # Data models
│   ├── services/              # API & mock data
│   │   ├── api_service.dart
│   │   └── real_database_mock.dart
│   └── config/                # App configuration
│       ├── app_config.dart    # Toggle mock data
│       └── app_theme.dart     # Theme colors
└── run-dev.sh                 # This script!
```

## ⚙️ Configuration

### Toggle Mock Data

Edit `lib/config/app_config.dart`:

```dart
class AppConfig {
  static const bool useMockData = true;  // Use mock data
  // static const bool useMockData = false;  // Use real API
}
```

After changing, hot restart (`R`) to apply changes.

## 🎨 Features Implemented

✅ **Pagination** - Reviews load 15 at a time
✅ **Infinite Scroll** - Auto-load when scrolling to bottom
✅ **Group Reviews** - Support for group-only and mixed reviews
✅ **Entity Cards** - Unified component across all screens
✅ **Bottom Navigation** - Fixed overflow issues
✅ **Mock Data** - 20 diverse reviews with comments
✅ **Hot Reload** - Fast development workflow

## 📝 Common Tasks

### Add New Mock Reviews
Edit: `lib/services/real_database_mock.dart`

### Change Theme Colors
Edit: `lib/config/app_theme.dart`

### Add New Screen
1. Create file in `lib/screens/`
2. Add route in navigation
3. Hot restart to see changes

### Update Dependencies
```bash
# Edit pubspec.yaml
flutter pub get
# Full restart required
```

## 🔗 URLs

- **Web Development**: http://localhost:8085
- **Alternative Port**: http://localhost:8090 (if 8085 is busy)

## 💡 Pro Tips

1. **Keep terminal visible** - See errors and reload status
2. **Use hot reload liberally** - Press `r` after every change
3. **Browser DevTools** - Right-click → Inspect for debugging
4. **Flutter DevTools** - Run `flutter pub global activate devtools` for advanced debugging
5. **VSCode Extension** - Install "Flutter" extension for better development experience

## 📱 Next Steps

1. Start the dev server: `./run-dev.sh web`
2. Open browser: http://localhost:8085
3. Make changes to code
4. Hot reload: `./run-dev.sh reload`
5. See instant updates! 🎉

---

**Need Help?**
- Flutter Docs: https://docs.flutter.dev/
- Run `./run-dev.sh help` for commands
