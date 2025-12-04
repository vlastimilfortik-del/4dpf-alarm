# 4 DPF Alarm - React Native Mobile App

## Overview
4 DPF Alarm is an ultra-simple mobile application for VAG group vehicles focused on DPF (Diesel Particulate Filter) regeneration monitoring via Bluetooth OBD-II connectivity. The app is designed to be "blonde-proof" - extremely simple to use with no complex features.

## Current State
- **Version**: 1.0.0
- **Platform**: React Native with Expo SDK 54
- **Design**: Dark slate gray theme with cyan/blue accents
- **Language**: Czech UI (Cs)

## Core Features
1. **Sound Toggle** - Single large button with speaker icon (blue = ON, gray crossed = OFF)
2. **Bluetooth Connection** - Auto-connect to OBD-II adapter after first pairing
3. **DPF Alert Overlay** - Red blinking full-screen alert during regeneration
4. **Sound Alert** - Audio notification plays once when regeneration starts

## Design Philosophy
- Ultra-simple, single-screen interface
- No unnecessary features or data collection
- No vehicle modification capabilities
- Automatic OBD-II connection without user intervention
- Alert displays over all other apps (maps, calls, music, etc.)

## Project Architecture

### Directory Structure
```
/
├── App.tsx                    # Root component with ErrorBoundary
├── app.json                   # Expo configuration
├── screens/
│   └── HomeScreen.tsx         # Main (only) screen
├── components/
│   ├── Card.tsx               # Card container with elevation
│   ├── DPFAlertOverlay.tsx    # Blinking red regeneration alert
│   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   ├── ErrorFallback.tsx      # Error fallback UI
│   ├── Screen*.tsx            # Safe area helpers
│   ├── ThemedText.tsx         # Themed text component
│   └── ThemedView.tsx         # Themed view component
├── constants/
│   └── theme.ts               # Design tokens (colors, spacing)
├── utils/
│   ├── storage.ts             # AsyncStorage persistence
│   └── sound.ts               # DPF alert sound (MP3)
├── hooks/
│   └── useTheme.ts            # Theme hook
└── assets/
    ├── images/icon.png        # App icon
    └── sounds/dpf_alert.mp3   # Alert sound file
```

### Main Screen Features
1. **App Logo & Title** - "4 DPF Alarm" header with app icon
2. **Sound Toggle Button** - Large pressable button with speaker icon
   - Blue background + speaker icon = Sound ON
   - Gray background + crossed speaker = Sound OFF
3. **Connection Status Card** - Shows OBD-II connection state
   - Green dot = Connected
   - Red dot = Disconnected
   - Bluetooth settings button
4. **Start/Stop Button** - Green/Red button to control monitoring
5. **Version Info** - Footer with version number

### Design System
- **Background**: #3D4451 (dark slate gray)
- **Cards**: #4A5568 with border
- **Primary (buttons/accents)**: #2D8BC9 (cyan blue)
- **Success**: #38A169 (green)
- **Error/Alert**: #E53935 (red)
- **Text**: #FFFFFF (primary), #9A9A9A (secondary)

### Alert Overlay Behavior
- Shows blinking red rectangle during DPF regeneration
- Text: "AKTIVNI REGENERACE DPF" / "NEVYPINEJTE MOTOR"
- Sound plays ONCE at regeneration start
- Overlay blinks throughout regeneration duration
- Must display over other apps (system overlay)

## Running the App

### Development
```bash
npm run dev   # Start Expo development server
```

### Testing
- **Web**: View in browser at localhost:8081
- **Mobile**: Scan QR code with Expo Go app

## User Preferences
- Dark theme enforced
- Sound notifications toggle (saved to AsyncStorage)
- Haptic feedback for interactions

## Technical Notes
- Single-screen architecture (no tab navigation)
- Uses expo-audio for MP3 playback
- Uses expo-haptics for tactile feedback
- AsyncStorage for local persistence
- No data collection or analytics
- No vehicle modification capabilities
- Secure against common attack vectors

## Google Play Ready Features
- Privacy-compliant (no data collection)
- Proper permissions for Bluetooth OBD-II
- Portrait orientation locked
- Dark theme enforced
- Czech localization

## Bundle Identifier
- iOS: com.vagdiagnostics.app
- Android: com.vagdiagnostics.app
- **DO NOT CHANGE** after initial EAS build

## Recent Changes
- Simplified to single-screen interface
- Removed tab navigation completely
- Removed brand selection, diagnostics, history screens
- Large sound toggle button with visual feedback
- Integrated settings directly into main screen
- Czech UI text throughout
