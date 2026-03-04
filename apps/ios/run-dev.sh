#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------
# Run TrainingiOS in the Xcode Simulator (dev mode)
#
# Usage:
#   ./run-dev.sh                  # uses default device
#   ./run-dev.sh "iPhone 17"      # pick a specific simulator
# -----------------------------------------------------------

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$PROJECT_DIR/TrainingiOS.xcodeproj"
SCHEME="TrainingiOS"
BUNDLE_ID="com.pborgen.training"
DEVICE="${1:-iPhone 17 Pro}"
CONFIG="Debug"

# ── 1. Generate Xcode project if needed ──
if [ ! -d "$PROJECT" ]; then
  echo "==> Generating Xcode project with xcodegen..."
  (cd "$PROJECT_DIR" && xcodegen generate)
fi

# ── 2. Find the simulator UDID ──
echo "==> Looking for simulator: $DEVICE"
UDID=$(xcrun simctl list devices available | grep "$DEVICE" | head -1 | grep -oE '[A-F0-9-]{36}')

if [ -z "$UDID" ]; then
  echo "ERROR: No simulator found matching '$DEVICE'"
  echo ""
  echo "Available iPhone simulators:"
  xcrun simctl list devices available | grep -i iphone
  exit 1
fi

echo "    Found: $DEVICE ($UDID)"

# ── 3. Boot the simulator ──
STATE=$(xcrun simctl list devices | grep "$UDID" | grep -o "(Booted)" || true)
if [ -z "$STATE" ]; then
  echo "==> Booting simulator..."
  xcrun simctl boot "$UDID"
fi
open -a Simulator

# ── 4. Build ──
echo "==> Building $SCHEME ($CONFIG) for simulator..."
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -destination "platform=iOS Simulator,id=$UDID" \
  build \
  2>&1 | tail -5

# ── 5. Find the built .app ──
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -path "*/Build/Products/$CONFIG-iphonesimulator/$SCHEME.app" -type d | head -1)

if [ -z "$APP_PATH" ]; then
  echo "ERROR: Could not find built .app bundle"
  exit 1
fi

echo "==> Installing app..."
xcrun simctl install "$UDID" "$APP_PATH"

echo "==> Launching $BUNDLE_ID..."
xcrun simctl launch "$UDID" "$BUNDLE_ID"

echo ""
echo "Done! App is running on $DEVICE."
echo "Tip: View logs with:  xcrun simctl spawn $UDID log stream --predicate 'subsystem == \"$BUNDLE_ID\"'"
