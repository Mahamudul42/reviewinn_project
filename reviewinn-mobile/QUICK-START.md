# 🚀 ReviewInn Mobile - Quick Start

## Fastest Way to See Updates

### 1. Start Flutter (One Time)
```bash
cd /home/hasan181/personal/my_project/reviewinn_project/reviewinn-mobile
./run-dev.sh web
```

Keep this terminal open! You'll see:
```
lib/main.dart is being served at http://0.0.0.0:8085

Flutter run key commands.
r Hot reload. 🔥🔥🔥
R Hot restart.
h List all available interactive commands.
```

### 2. Open Browser
Visit: **http://localhost:8085**

### 3. Make Code Changes
Edit any file in VS Code (e.g., `lib/config/app_theme.dart`)

### 4. See Updates Instantly
**Go back to the Flutter terminal** and press:
- **`r`** - Hot reload (1-2 seconds) ⚡
- **`R`** - Hot restart (5-10 seconds) if hot reload doesn't work

That's it! Changes appear immediately.

---

## Alternative: Two Terminal Workflow

### Terminal 1 (Left) - Flutter Running
```bash
./run-dev.sh web
# Keep this running, press 'r' here after changes
```

### Terminal 2 (Right) - Your Work
```bash
# Edit files
# Commit changes
# Run other commands
```

When you make changes, switch to Terminal 1 and press `r`.

---

## Commands Reference

In the **Flutter terminal** (where it's running):
```
r  - Hot reload (fast!)
R  - Hot restart
h  - Help
q  - Quit
```

From **any terminal**:
```bash
./run-dev.sh          # Interactive menu
./run-dev.sh web      # Start server
./run-dev.sh chrome   # Start on Chrome
./run-dev.sh apk      # Build APK
```

---

## Pro Tips

1. **Keyboard Focus**: Keep Flutter terminal visible, press `r` after each change
2. **VSCode Split**: Open terminal in VSCode split view for easy access
3. **Browser DevTools**: F12 for debugging
4. **Save + Reload**: Make it a habit - Ctrl+S (save), then `r` (reload)

---

## Example Workflow

```bash
# 1. Start Flutter
./run-dev.sh web

# 2. Edit app_theme.dart (change a color)
# 3. Press 'r' in Flutter terminal
# 4. See instant update in browser!
```

---

## Troubleshooting

**Q: Pressed 'r' but nothing happened?**
- Try `R` (capital R) for hot restart
- Check for errors in Flutter terminal

**Q: Changes not showing?**
1. Press `R` (hot restart)
2. If still not working, press `q` to quit
3. Run `./run-dev.sh web` again

**Q: Port already in use?**
```bash
pkill -f "flutter run"
./run-dev.sh web
```

---

## Build Production APK

```bash
./run-dev.sh apk

# APK location:
# build/app/outputs/flutter-apk/app-release.apk
```

Transfer to your Android phone and install!

---

## Need More Help?

- Full guide: `cat DEV-GUIDE.md`
- All commands: `./run-dev.sh help`
- Interactive menu: `./run-dev.sh`
