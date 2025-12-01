# 4 DPF Alarm - React Native Mobile App

## Overview
4 DPF Alarm is a mobile diagnostic application for VAG group vehicles (Volkswagen, Audi, Skoda, Seat, Cupra) focused on DPF (Diesel Particulate Filter) regeneration monitoring with Bluetooth OBD-II connectivity.

## Current State
- **Version**: 1.0.0
- **Platform**: React Native with Expo SDK 54
- **Design**: Dark gray theme with cyan/blue accents
- **Language**: Czech UI

## Project Architecture

### Directory Structure
```
/
├── App.tsx                    # Root component with navigation and error boundary
├── app.json                   # Expo configuration (app name: 4 DPF Alarm)
├── navigation/
│   ├── MainTabNavigator.tsx   # Bottom tab navigation
│   ├── HomeStackNavigator.tsx # Home tab stack
│   ├── DiagnosticsStackNavigator.tsx # Diagnostics tab stack
│   └── SettingsStackNavigator.tsx # Settings tab stack
├── screens/
│   ├── HomeScreen.tsx         # Main screen with brand selection, monitoring
│   ├── DiagnosticsScreen.tsx  # DPF regeneration simulation
│   └── SettingsScreen.tsx     # User preferences
├── components/
│   ├── BrandButton.tsx        # Vehicle brand selection button
│   ├── Button.tsx             # Primary button component
│   ├── Card.tsx               # Card container with elevation
│   ├── CircularProgress.tsx   # Animated circular progress
│   ├── DPFAlertOverlay.tsx    # Blinking red regeneration alert
│   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   └── Screen*.tsx            # Safe area helpers
├── constants/
│   └── theme.ts               # Design tokens (colors, spacing)
├── utils/
│   ├── storage.ts             # AsyncStorage persistence
│   └── sound.ts               # DPF alert sound (MP3)
└── assets/
    ├── images/icon.png        # App icon (blue 4 with DPF)
    └── sounds/dpf_alert.mp3   # Alert sound file
```

### Key Features
1. **Vehicle Selection**: 5 VAG brands in 2 rows (3+2 layout)
2. **DPF Monitoring**: Simulated OBD-II connection monitoring
3. **Regeneration Alert**: Red blinking overlay with "AKTIVNI REGENERACE DPF"
4. **Sound Alert**: MP3 plays once at regeneration start
5. **Haptic Feedback**: Vibration at key moments
6. **Czech Localization**: All UI text in Czech

### Design System
- **Background**: #1A1A1A (dark gray)
- **Cards**: #2D2D2D with #4A4A4A border
- **Primary (buttons)**: #2DBADE (cyan blue)
- **Alert Red**: #E53935
- **Text**: #FFFFFF (primary), #9A9A9A (secondary)

### Alert Overlay Behavior
- Shows blinking red rectangle during regeneration
- Text: "AKTIVNI REGENERACE DPF" / "NEVYPINEJTE MOTOR"
- Sound plays ONCE at start
- Overlay blinks throughout regeneration

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
- Sound notifications enabled by default
- Haptic feedback for interactions

## Recent Changes
- Complete UI redesign to match provided mockups
- Added custom app icon (blue 4 with DPF)
- Implemented blinking red alert overlay
- Added custom MP3 sound for alerts
- Czech localization for all UI elements
- Brand buttons in 2-row layout (3+2)

## Technical Notes
- Uses React Navigation 7 for navigation
- Reanimated 3 for animations (blinking effect)
- expo-audio for MP3 playback
- expo-haptics for tactile feedback
- AsyncStorage for local persistence
