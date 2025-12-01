# VAG Diagnostics - React Native Mobile App

## Overview
VAG Diagnostics is a mobile diagnostic application for VAG group vehicles (Volkswagen, Audi, Skoda, Seat, Cupra) focused on DPF (Diesel Particulate Filter) regeneration monitoring and Bluetooth OBD-II connectivity.

## Current State
- **Version**: 1.0.0
- **Platform**: React Native with Expo SDK 54
- **Design**: Dark theme with blue accents following iOS 26 liquid glass design principles

## Project Architecture

### Directory Structure
```
/
├── App.tsx                    # Root component with navigation and error boundary
├── app.json                   # Expo configuration
├── navigation/
│   ├── MainTabNavigator.tsx   # Bottom tab navigation (3 tabs)
│   ├── HomeStackNavigator.tsx # Home tab stack
│   ├── DiagnosticsStackNavigator.tsx # Diagnostics tab stack
│   ├── SettingsStackNavigator.tsx # Settings tab stack
│   └── screenOptions.ts       # Shared screen options
├── screens/
│   ├── HomeScreen.tsx         # Vehicle selection and status dashboard
│   ├── DiagnosticsScreen.tsx  # DPF regeneration simulator
│   ├── SettingsScreen.tsx     # User preferences and settings
│   ├── BluetoothPairingScreen.tsx # Bluetooth device pairing
│   └── VehicleDetailScreen.tsx # Vehicle history details
├── components/
│   ├── Button.tsx             # Primary button component
│   ├── Card.tsx               # Card container with elevation
│   ├── CircularProgress.tsx   # Animated circular progress indicator
│   ├── FloatingActionButton.tsx # FAB for quick actions
│   ├── StatusCard.tsx         # Status display card
│   ├── VehicleBrandCard.tsx   # Vehicle brand selection card
│   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   ├── ErrorFallback.tsx      # Error fallback UI
│   └── Screen*.tsx            # Safe area scroll view helpers
├── constants/
│   ├── theme.ts               # Design tokens (colors, spacing, typography)
│   └── vehicles.ts            # Vehicle brand definitions
├── utils/
│   └── storage.ts             # AsyncStorage persistence layer
└── hooks/
    ├── useTheme.ts            # Theme hook (dark mode)
    └── useScreenInsets.ts     # Safe area insets helper
```

### Key Features
1. **Vehicle Selection**: Choose from 5 VAG brands with visual selection
2. **DPF Regeneration**: Animated progress with temperature monitoring
3. **Haptic Feedback**: Tactile feedback at milestones (25%, 50%, 75%, 100%)
4. **Sound Notifications**: Configurable audio alerts
5. **Bluetooth Pairing**: OBD-II adapter connection (mock UI on web)
6. **Data Persistence**: AsyncStorage for settings and history
7. **Error Boundary**: Graceful crash recovery

### Design System
- **Background Colors**: #0A0E1A (root), #141B2D (cards)
- **Primary Blue**: #2E7FFF
- **Accent Cyan**: #00B4FF
- **Success Green**: #00C853
- **Warning Yellow**: #FFB300
- **Error Red**: #FF3B30

## Running the App

### Development
```bash
npm run dev   # Start Expo development server
```

### Testing
- **Web**: View in browser at localhost:8081
- **Mobile**: Scan QR code with Expo Go app

## User Preferences
- Dark theme is enforced across the entire app
- Sound notifications are enabled by default
- Haptic feedback is used for key interactions

## Recent Changes
- Initial MVP implementation with all core screens
- AsyncStorage persistence for all settings
- Consistent haptic feedback across interactions
- Platform-specific handling for web vs native

## Technical Notes
- Uses React Navigation 7 for navigation
- Reanimated 3 for animations
- expo-haptics for tactile feedback
- react-native-svg for circular progress
- AsyncStorage for local data persistence
