#!/bin/bash

# ReviewInn Mobile - Setup Script
# This script helps set up the Flutter mobile app

set -e

echo "🚀 ReviewInn Mobile Setup"
echo "========================="

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo ""
    echo "❌ Flutter is not installed!"
    echo ""
    echo "📦 To install Flutter on Linux:"
    echo ""
    echo "1. Run these commands:"
    echo "   cd ~"
    echo "   git clone https://github.com/flutter/flutter.git -b stable"
    echo ""
    echo "2. Add Flutter to your PATH by adding this line to ~/.bashrc:"
    echo "   export PATH=\"\$HOME/flutter/bin:\$PATH\""
    echo ""
    echo "3. Reload your shell:"
    echo "   source ~/.bashrc"
    echo ""
    echo "4. Run Flutter doctor:"
    echo "   flutter doctor"
    echo ""
    echo "5. Then run this script again!"
    echo ""
    exit 1
fi

echo "✅ Flutter is installed!"
echo ""

# Run flutter doctor
echo "🔍 Checking Flutter environment..."
flutter doctor
echo ""

# Check if project needs to be created
if [ ! -f "pubspec.yaml" ]; then
    echo "📱 Creating Flutter project..."
    flutter create . --org com.reviewinn --project-name reviewinn_mobile
    echo "✅ Flutter project created!"
else
    echo "✅ Flutter project already exists!"
fi

echo ""
echo "📦 Installing dependencies..."
flutter pub get

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Check available devices: flutter devices"
echo "2. Run the app: flutter run"
echo "3. Or run on specific device: flutter run -d <device-id>"
echo ""
echo "💡 Tips:"
echo "- Press 'r' to hot reload"
echo "- Press 'R' to hot restart"
echo "- Press 'q' to quit"
echo ""
