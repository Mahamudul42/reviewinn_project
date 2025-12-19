# ReviewInn Mobile App (Flutter)

This is the Flutter mobile application for the ReviewInn project.

## Prerequisites

### 1. Install Flutter

#### For Linux:
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y curl git unzip xz-utils zip libglu1-mesa

# Download Flutter
cd ~
git clone https://github.com/flutter/flutter.git -b stable

# Add Flutter to PATH (add these lines to your ~/.bashrc or ~/.zshrc)
export PATH="$HOME/flutter/bin:$PATH"

# Reload your shell configuration
source ~/.bashrc  # or source ~/.zshrc

# Verify installation
flutter doctor
```

#### For macOS:
```bash
# Download Flutter SDK
cd ~
git clone https://github.com/flutter/flutter.git -b stable

# Add to PATH
export PATH="$HOME/flutter/bin:$PATH"

# Verify
flutter doctor
```

#### For Windows:
1. Download Flutter SDK from: https://docs.flutter.dev/get-started/install/windows
2. Extract to C:\src\flutter
3. Add C:\src\flutter\bin to your PATH
4. Run `flutter doctor` in Command Prompt

### 2. Install Android Studio (for Android development)
- Download from: https://developer.android.com/studio
- Install Android SDK and Android emulator
- Run `flutter doctor --android-licenses` to accept licenses

### 3. Install VS Code Extensions (Optional but recommended)
- Flutter
- Dart

## Quick Start

### Step 1: Create Flutter Project
Once Flutter is installed, run:
```bash
cd reviewinn-mobile
flutter create .
```

### Step 2: Install Dependencies
```bash
flutter pub get
```

### Step 3: Run the App

#### On Android Emulator:
```bash
# Start Android emulator from Android Studio or command line
# Then run:
flutter run
```

#### On iOS Simulator (macOS only):
```bash
# Open iOS Simulator
open -a Simulator

# Run the app
flutter run
```

#### On Chrome (Web):
```bash
flutter run -d chrome
```

#### On Physical Device:
1. Enable USB debugging on your Android device
2. Connect via USB
3. Run: `flutter run`

### Step 4: Check Available Devices
```bash
flutter devices
```

## Project Structure (After Creation)

```
reviewinn-mobile/
├── android/           # Android-specific code
├── ios/              # iOS-specific code
├── lib/              # Main Dart code
│   ├── main.dart    # Entry point
│   ├── screens/     # App screens
│   ├── widgets/     # Reusable widgets
│   ├── services/    # API services
│   └── models/      # Data models
├── test/            # Tests
├── assets/          # Images, fonts, etc.
└── pubspec.yaml     # Dependencies
```

## Backend Connection

The mobile app will connect to your existing ReviewInn backend:
- **Development**: http://localhost:8000
- **Production**: Your production URL

## Development Commands

```bash
# Run in debug mode
flutter run

# Run in release mode
flutter run --release

# Build APK for Android
flutter build apk

# Build for iOS (macOS only)
flutter build ios

# Run tests
flutter test

# Format code
flutter format .

# Analyze code
flutter analyze
```

## Hot Reload

Flutter supports hot reload during development:
- Press `r` in the terminal to hot reload
- Press `R` to hot restart
- Press `q` to quit

## Next Steps

1. Install Flutter following the instructions above
2. Run `flutter doctor` to verify installation
3. Run `flutter create .` in this directory
4. Start building your ReviewInn mobile app!

## Common Issues

### Flutter not found
- Make sure Flutter is in your PATH
- Restart your terminal after installation

### Android licenses not accepted
```bash
flutter doctor --android-licenses
```

### No devices available
- Start an emulator from Android Studio
- Or connect a physical device with USB debugging enabled

## Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [Flutter Cookbook](https://docs.flutter.dev/cookbook)
- [Dart Language Tour](https://dart.dev/guides/language/language-tour)
- [Flutter YouTube Channel](https://www.youtube.com/c/flutterdev)
