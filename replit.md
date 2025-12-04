# 4 DPF Alarm - React Native Mobile App

## Overview
4 DPF Alarm is an ultra-simple mobile application for VAG group vehicles focused on DPF (Diesel Particulate Filter) regeneration monitoring via Bluetooth OBD-II connectivity. The app is designed to be "blonde-proof" - extremely simple to use with no complex features.

## Current State
- **Version**: 1.0.0
- **Platform**: React Native with Expo SDK 54
- **Design**: Dark slate gray theme with cyan/blue accents (#2D8BC9)
- **Language**: Czech UI (Cs)
- **Build**: EAS Build configured for APK generation

## Core Features
1. **Sound Toggle** - Small round button in header (blue = ON, gray crossed = OFF)
2. **Bluetooth Connection** - Auto-connect to OBD-II adapter with device scanning
3. **DPF Alert Overlay** - Compact red blinking alert during regeneration
4. **Sound Alert** - Audio notification plays once when regeneration starts
5. **VAG Brands Display** - Informational list of supported brands (VW, Audi, Škoda, Seat, Cupra)

## Design Philosophy
- Ultra-simple, single-screen interface
- No unnecessary features or data collection
- No vehicle modification capabilities
- Automatic OBD-II connection without user intervention
- Alert displays during regeneration (compact height for map visibility)

## Project Architecture

### Directory Structure
```
/
├── App.tsx                    # Root component with ErrorBoundary
├── app.json                   # Expo configuration with BLE plugin
├── eas.json                   # EAS Build configuration
├── screens/
│   └── HomeScreen.tsx         # Main (only) screen with OBD-II integration
├── components/
│   ├── Card.tsx               # Card container with elevation
│   ├── DPFAlertOverlay.tsx    # Compact blinking red alert
│   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   ├── ErrorFallback.tsx      # Error fallback UI
│   ├── Screen*.tsx            # Safe area helpers
│   ├── ThemedText.tsx         # Themed text component
│   └── ThemedView.tsx         # Themed view component
├── services/
│   ├── bluetooth/
│   │   └── BleManager.ts      # Bluetooth Low Energy manager
│   └── obd/
│       ├── index.ts           # Service exports
│       ├── ELM327.ts          # ELM327 AT commands
│       ├── VAGProtocol.ts     # VAG-specific DPF reading (VW TP 2.0)
│       └── DPFMonitor.ts      # Main monitoring orchestrator
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

### OBD-II Communication Stack
1. **BleManager** - Handles Bluetooth Low Energy scanning, connection, and data transfer
2. **ELM327** - Initializes adapter with AT commands, handles protocol selection
3. **VAGProtocol** - Reads VAG-specific measuring blocks for DPF data
4. **DPFMonitor** - Orchestrates connection flow and regeneration detection

### Main Screen Features
1. **App Logo & Title** - "4 DPF Alarm" header with app icon
2. **Header Buttons** - Small round sound toggle and settings buttons
3. **Connection Status Card** - Shows OBD-II connection state
   - Blue background = Connected
   - Gray background = Disconnected
   - Click to scan for devices
4. **Start/Stop Button** - Green/Red button to control monitoring
5. **VAG Brands List** - 3+2 layout, muted colors
6. **Version Info** - Footer with version number

### Design System
- **Background**: #3D4451 (dark slate gray)
- **Cards**: #4A5568 with border
- **Primary (buttons/accents)**: #2D8BC9 (cyan blue)
- **Success**: #00C853 (green)
- **Error/Alert**: #E53935 (red)
- **Text**: #FFFFFF (primary), #A0A8B8 (secondary)

### Alert Overlay Behavior
- Compact height (about 2/3 of original) to allow map visibility
- Text: "AKTIVNÍ REGENERACE DPF" / "NEVYPÍNEJTE MOTOR"
- Sound plays ONCE at regeneration start
- Overlay blinks throughout regeneration duration
- Dismissible with X button

## Running the App

### Development
```bash
npm run dev   # Start Expo development server
```

### Testing
- **Web**: View in browser at localhost:8081 (BLE not available)
- **Mobile**: Scan QR code with Expo Go app (simulated only)
- **Real OBD-II**: Requires EAS development build

### Building APK
```bash
npx eas build --platform android --profile preview
```

## Technical Notes
- Single-screen architecture (no tab navigation)
- Uses react-native-ble-plx for Bluetooth (native build required)
- Uses expo-audio for MP3 playback
- Uses expo-haptics for tactile feedback
- AsyncStorage for local persistence
- No data collection or analytics
- VAG-specific protocol (not standard OBD-II PIDs)

## OBD-II Protocol Notes
- VAG vehicles use proprietary CAN commands for DPF data
- Standard OBD-II PIDs (Mode 01/06) don't reliably return DPF status
- App implements VW TP 2.0 protocol via ELM327 raw CAN mode
- Supported adapters: OBDLink, Carista, Vgate iCar, and quality ELM327 v1.4+

## Temperature-Based Regeneration Detection
For older vehicles that don't send regeneration status byte:
- **DPF Temperature Threshold**: 550°C (active regen detected)
- **Exhaust Temperature Threshold**: 450°C (active regen detected)
- **Normal Max Temperature**: 400°C (regen ends when below this)
- **Rapid Rise Detection**: >50°C/min rise + temp above 400°C
- **Temperature History**: Tracks last 10 readings for trend analysis
- **Fallback PIDs**: Uses OBD-II PIDs 0x7C (DPF temp) and 0x78 (EGT) if VAG commands fail

## Bundle Identifier
- iOS: com.vagdiagnostics.app
- Android: com.vagdiagnostics.app
- **DO NOT CHANGE** after initial EAS build

## Recent Changes (Dec 2024)
- Implemented real Bluetooth OBD-II communication stack
- Added device scanning modal with OBD adapter detection
- Connection status card now turns blue when connected
- Compact DPF alert overlay (reduced height by 1/3)
- Small round header buttons for sound and settings
- VAG brands displayed as informational list
- EAS Build configuration for Android APK
- Platform-safe BLE code (graceful fallback on web)
