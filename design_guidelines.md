# Design Guidelines: VAG Vehicle DPF Diagnostic App

## Architecture Decisions

### Authentication
**No Authentication Required**
- The app is a single-user diagnostic tool for vehicle maintenance
- Data stored locally via AsyncStorage
- **Profile/Settings Screen Required**:
  - User avatar selection (generate 3 automotive-themed preset avatars: mechanic wrench, car outline, diagnostic tool icon)
  - Display name field (default: "Mechanic" or "Vehicle Owner")
  - Preferences: sound enabled/disabled, default vehicle brand, units (metric/imperial)

### Navigation
**Tab Navigation (3 tabs)**
- **Home** (left): Vehicle selection and current status dashboard
- **Diagnostics** (center): DPF regeneration simulator and active diagnostics
- **Settings** (right): User profile, preferences, Bluetooth device management

**Additional Modal Screens**:
- Bluetooth device pairing (full-screen modal)
- DPF regeneration in progress (modal with real-time status)
- Vehicle information details (push screen)

### Screen Specifications

#### 1. Home Screen (Vehicle Dashboard)
- **Purpose**: Select vehicle and view quick status overview
- **Layout**:
  - Transparent header with app title "VAG Diagnostics"
  - Scrollable content
  - Top safe area inset: headerHeight + Spacing.xl
  - Bottom safe area inset: tabBarHeight + Spacing.xl
- **Components**:
  - Vehicle brand selector (5 horizontal cards: VW, Audi, Škoda, Seat, Cupra)
  - Status cards showing: DPF level, last regeneration, Bluetooth connection status
  - Quick action button: "Start DPF Regeneration" (floating, bottom-right)

#### 2. Diagnostics Screen (DPF Regeneration)
- **Purpose**: Monitor and control DPF regeneration process
- **Layout**:
  - Default header with title "DPF Regeneration"
  - Non-scrollable content with centered progress indicator
  - Top safe area inset: Spacing.xl
  - Bottom safe area inset: tabBarHeight + Spacing.xl
- **Components**:
  - Large circular progress indicator (animated)
  - Temperature gauge
  - Real-time status text
  - Start/Stop button (centered below progress)
  - Sound toggle (header right button)

#### 3. Settings Screen
- **Purpose**: Configure app preferences and manage Bluetooth
- **Layout**:
  - Default header with title "Settings"
  - Scrollable form
  - Top safe area inset: Spacing.xl
  - Bottom safe area inset: tabBarHeight + Spacing.xl
- **Components**:
  - Profile section (avatar, name field)
  - Bluetooth device list (connected/available)
  - Sound preferences toggle
  - Default vehicle selector
  - App info footer

#### 4. Bluetooth Pairing Modal
- **Purpose**: Scan and connect to OBD-II Bluetooth adapter
- **Layout**:
  - Modal with close button (header left)
  - Scrollable list of devices
  - Cancel button (header right)
- **Components**:
  - Scanning indicator
  - Device list with signal strength icons
  - "Scan Again" button

## Design System

### Color Palette
**Primary Colors**:
- Background Dark: `#0A0E1A` (deep navy black)
- Background Card: `#141B2D` (dark blue-grey)
- Primary Blue: `#2E7FFF` (diagnostic blue)
- Accent Blue: `#00B4FF` (bright cyan for active states)

**Status Colors**:
- Success Green: `#00C853` (regeneration complete)
- Warning Yellow: `#FFB300` (DPF level medium)
- Error Red: `#FF3B30` (critical DPF level)
- Neutral Grey: `#8E8E93` (disabled/inactive)

**Text Colors**:
- Primary Text: `#FFFFFF`
- Secondary Text: `#A0A0A8`
- Disabled Text: `#5A5A5F`

### Typography
- **Headers**: System Bold, 28pt (screen titles)
- **Subheaders**: System Semibold, 20pt (section titles)
- **Body**: System Regular, 16pt (status text, labels)
- **Caption**: System Regular, 14pt (secondary info)
- **Data Display**: System Mono, 24pt (temperature, percentages)

### Visual Design
- **Icons**: Use Feather icons from @expo/vector-icons for all UI elements
  - Bluetooth: `bluetooth`
  - Settings: `settings`
  - Home: `home`
  - Diagnostics: `activity`
  - Sound: `volume-2` / `volume-x`
- **Vehicle Brand Logos**: Generate minimalist, monochrome versions of VAG brand logos (5 assets total)
- **Avatar Presets**: Generate 3 automotive-themed avatars in circular format, matching the dark blue aesthetic
- **Cards**: Use rounded corners (12px radius), subtle border (1px, opacity 0.1, white)
- **Buttons**:
  - Primary action: Solid Primary Blue background with white text
  - Secondary action: Transparent with Primary Blue border and text
  - Destructive: Solid Error Red background with white text
- **Floating Action Button**:
  - Background: Primary Blue
  - Icon: White
  - Shadow: shadowOffset (0, 2), shadowOpacity 0.10, shadowRadius 2
- **Progress Indicators**:
  - Circular: Stroke width 8px, Primary Blue active, Background Card inactive
  - Linear: Height 6px, rounded caps
- **Touch Feedback**: All interactive elements scale to 0.96 on press with 150ms duration

### Interaction Design
- **Vehicle Selection**: Horizontal scroll with snap-to-center behavior
- **DPF Regeneration**:
  - Animated progress ring (0-100%)
  - Haptic feedback at 25%, 50%, 75%, 100%
  - Sound notification on completion (with cooldown mechanism)
- **Bluetooth Scanning**: Pull-to-refresh gesture on device list
- **Status Cards**: Tap to expand for detailed information

### Accessibility
- All interactive elements minimum 44x44pt touch target
- High contrast maintained (4.5:1 ratio minimum for body text)
- Dynamic Type support for text scaling
- VoiceOver labels for all diagnostic data
- Haptic feedback for critical actions (start/stop regeneration)
- Sound must have visual alternative (progress percentage, text status)

### Safe Area Handling
- **With Tab Bar**: Bottom inset = tabBarHeight + 24px
- **Transparent Header**: Top inset = headerHeight + 24px
- **Default Header**: Top inset = 24px
- **Floating Button**: Bottom = tabBarHeight + 16px, Right = 16px