# Transit Ticket App - Regional Day Pass

A mobile transit ticket application built with React Native and Expo that displays an activated "live" regional day pass with a countdown timer.

## Features

### Core Functionality
- ✅ **24-Hour Countdown Timer**: Automatically starts when the app loads, counting down from 24:00:00
- ✅ **Animated Pulsing Ring**: Continuous pulsing gradient border (purple/violet to magenta) indicating an active ticket
- ✅ **Ticket Persistence**: Uses AsyncStorage to save activation time - ticket remains valid across app restarts
- ✅ **Expiration Handling**: Automatically expires after 24 hours and updates UI state
- ✅ **Brightness Boost**: "Show Ticket to Driver" button temporarily maximizes screen brightness for 10 seconds
- ✅ **Unique Ticket ID**: Generates and displays a unique ticket identifier
- ✅ **Warning Banner**: Reminds users not to close the screen while boarding

### Visual Design
- Clean, professional mobile UI matching transit app standards
- Large, readable countdown timer (HH:MM:SS format)
- Gradient circular validator with pulsing animation
- RTA branding with logo and colored chevrons
- Responsive layout optimized for mobile devices
- Warning banner with clear messaging

## Technical Stack

### Frontend
- **React Native** with **Expo** (v54)
- **TypeScript** for type safety
- **react-native-reanimated** (v4.1.1) - Smooth pulsing animations
- **react-native-svg** (v15.15.3) - Gradient circular borders
- **expo-linear-gradient** (v55.0.8) - Gradient effects
- **@react-native-async-storage/async-storage** (v3.0.1) - Ticket persistence
- **expo-brightness** (v55.0.8) - Screen brightness control

### Features Implementation

#### 1. Countdown Timer
- Starts at 24:00:00 when ticket is first activated
- Updates every second in real-time
- Persists across app restarts using AsyncStorage
- Automatically handles expiration

#### 2. Animation
- Continuous pulsing effect on circular ring
- Smooth fade in/out animation (1.5 second duration)
- Purple/violet to magenta gradient border
- Runs infinitely while ticket is active

#### 3. Persistence
- Saves activation timestamp to AsyncStorage
- Calculates remaining time on app restart
- Handles timezone changes gracefully
- Uses local device time

#### 4. Brightness Control
- Requests brightness permissions on first use
- Temporarily boosts to 100% brightness
- Auto-restores original brightness after 10 seconds
- Manual restore option by tapping button again

## How It Works

### Ticket Activation Flow
1. App opens and checks AsyncStorage for existing activation
2. If no active ticket found, automatically activates a new 24-hour pass
3. Countdown timer starts from 24:00:00
4. Expiration time is calculated and displayed
5. Unique ticket ID is generated

### Ticket States
- **Active**: Timer counting down, pulsing animation visible, full color
- **Expired**: Timer shows 00:00:00, expired state triggered

### Edge Cases Handled
- ✅ App restart with active ticket (resumes countdown)
- ✅ Countdown reaches zero (auto-expires)
- ✅ Timezone changes (uses local time)
- ✅ Brightness permissions denied (graceful fallback)

## File Structure

```
/app/frontend/
├── app/
│   └── index.tsx          # Main ticket display screen
├── app.json               # Expo configuration with permissions
├── package.json           # Dependencies
└── .env                   # Environment variables
```

## Key Components

### Main Screen (`app/index.tsx`)
- **Header**: RTA branding with subtitle
- **Animated Circle**: Pulsing gradient ring with logo
- **Timer Display**: Large countdown timer
- **Details Card**: Pass type, subtitle, expiration, ticket ID
- **Action Button**: Show to driver with brightness boost
- **Warning Banner**: Boarding reminder

## Permissions Required

### iOS (`infoPlist`)
- **NSPhotoLibraryUsageDescription**: "Adjust screen brightness for ticket display"

### Android
- **WRITE_SETTINGS**: For brightness control

## Running the App

### Web Preview
Visit: `https://ticket-countdown-1.preview.emergentagent.com`

### Mobile Testing
1. Install Expo Go app on your device
2. Scan the QR code from the terminal
3. App will load on your device

### Development
```bash
cd /app/frontend
yarn start
```

## Testing Checklist

- ✅ Timer counts down every second
- ✅ Timer persists across app restarts
- ✅ Pulsing animation runs smoothly
- ✅ Brightness boost works on button press
- ✅ UI is responsive on different screen sizes
- ✅ Warning banner displays correctly
- ✅ Ticket expires after 24 hours

## Future Enhancements (Optional)

- [ ] QR code generation for operator scanning
- [ ] Barcode display for legacy scanners
- [ ] Multiple ticket types (single ride, weekly pass)
- [ ] Ticket purchase flow
- [ ] Push notifications for expiration warnings
- [ ] Trip history
- [ ] Offline mode support

## Notes

- The app automatically activates a ticket on first load
- Tickets are valid for exactly 24 hours from activation
- Screenshot detection feature was removed for compatibility
- Brightness feature requires device permissions

## Support

For issues or questions about this implementation, refer to the code comments in `/app/frontend/app/index.tsx`.
