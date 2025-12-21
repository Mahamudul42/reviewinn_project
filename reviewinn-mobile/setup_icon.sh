#!/bin/bash

# ReviewInn App Icon Setup Script
# This script helps you set up your app icon

echo "🎨 ReviewInn App Icon Setup"
echo "=============================="
echo ""

# Check if SVG files exist
if [ -f "assets/icon/icon_template.svg" ]; then
    echo "✅ Found icon template files"
else
    echo "❌ Icon template files not found"
    exit 1
fi

echo ""
echo "📋 STEP 1: Convert SVG to PNG"
echo "You need to convert the SVG templates to PNG format (1024x1024px)"
echo ""
echo "Options:"
echo "  A) Online converter: https://convertio.co/svg-png/"
echo "  B) Use Inkscape (if installed):"
echo "     inkscape assets/icon/icon_template.svg -w 1024 -h 1024 -o assets/icon/app_icon.png"
echo "     inkscape assets/icon/icon_foreground_template.svg -w 1024 -h 1024 -o assets/icon/app_icon_foreground.png"
echo ""

# Check if converted PNG files exist
if [ -f "assets/icon/app_icon.png" ] && [ -f "assets/icon/app_icon_foreground.png" ]; then
    echo "✅ Icon PNG files found!"
    echo ""
    echo "📋 STEP 2: Generate app icons for all platforms"
    echo "Running: flutter pub get"
    flutter pub get
    
    echo ""
    echo "Running: flutter pub run flutter_launcher_icons"
    flutter pub run flutter_launcher_icons
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ App icons generated successfully!"
        echo ""
        echo "📱 Generated icons for:"
        echo "  - Android (all densities)"
        echo "  - iOS (all sizes)"
        echo "  - Web (favicon and PWA icons)"
        echo ""
        echo "🚀 Next steps:"
        echo "  1. Test on Android: flutter run -d android"
        echo "  2. Test on iOS: flutter run -d ios"
        echo "  3. Build release: flutter build apk --release"
        echo ""
    else
        echo "❌ Failed to generate icons. Check errors above."
        exit 1
    fi
else
    echo "⏭️  Skipping icon generation (PNG files not found)"
    echo ""
    echo "📝 To complete setup:"
    echo "  1. Convert icon_template.svg to app_icon.png (1024x1024px)"
    echo "  2. Convert icon_foreground_template.svg to app_icon_foreground.png (1024x1024px)"
    echo "  3. Run this script again"
    echo ""
    echo "💡 Quick online conversion:"
    echo "   Visit: https://convertio.co/svg-png/"
    echo "   Upload: assets/icon/icon_template.svg"
    echo "   Download: Rename to app_icon.png"
    echo ""
fi

echo "📚 For more details, see: assets/icon/README.md"
echo ""
