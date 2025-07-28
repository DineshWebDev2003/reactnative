# TNHappyKids App

A React Native/Expo application for managing kids' activities, attendance, and communication between parents, teachers, and administrators.

## Features

- **Multi-role Support**: Parents, Teachers, Administrators, Franchisees
- **Attendance Management**: Mark and track student attendance
- **Activity Feed**: Share and view kids' activities
- **Chat System**: Real-time messaging between users
- **Homework Management**: Assign and submit homework
- **Wallet System**: Manage fees and payments
- **Camera Integration**: Live camera feeds for parents
- **ID Card System**: Virtual ID cards for students
- **Income/Expense Tracking**: Financial management for administrators

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd v10
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

## Configuration

### Environment Setup

1. **Update API Configuration**
   - Edit `config.js` to set your backend API URL
   - Ensure your backend server is running and accessible

2. **Expo Configuration**
   - Update `app.json` with your app details
   - Configure bundle identifiers for iOS and Android
   - Set up your Expo account and project

### EAS Build Configuration

1. **Login to EAS**
   ```bash
   eas login
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Update eas.json** with your project settings

## Building and Publishing

### Development Build

```bash
# For Android
npm run build:android

# For iOS
npm run build:ios
```

### Production Build

```bash
# Build for production
eas build --platform all --profile production
```

### Publishing Updates

```bash
# Publish to Expo
npm run publish

# Or using EAS
eas update --branch production --message "Update description"
```

## Project Structure

```
v10/
├── api/                    # API endpoints
├── assets/                 # Images, icons, and static files
├── backend/                # PHP backend files
├── components/             # Reusable React components
├── screens/                # Screen components
├── utils/                  # Utility functions
├── App.js                  # Main app component
├── config.js               # Configuration file
├── package.json            # Dependencies
├── app.json                # Expo configuration
├── eas.json                # EAS build configuration
├── babel.config.js         # Babel configuration
└── metro.config.js         # Metro bundler configuration
```

## Key Dependencies

- **Expo SDK 50**: Core Expo functionality
- **React Navigation**: Navigation between screens
- **Expo Camera**: Camera functionality
- **Expo Image Picker**: Image selection
- **React Native Paper**: UI components
- **AsyncStorage**: Local data storage
- **Expo Linear Gradient**: Gradient backgrounds
- **Expo Blur**: Blur effects

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npm run clean
   # or
   expo r -c
   ```

2. **Build failures**
   - Check all dependencies are installed
   - Verify Expo and EAS CLI versions
   - Ensure proper configuration in app.json and eas.json

3. **Camera permissions**
   - Ensure proper permissions are configured in app.json
   - Test on physical device (camera doesn't work in simulator)

4. **Navigation issues**
   - Verify all screen components are properly exported
   - Check navigation setup in App.js

### Build Commands

```bash
# Clean and restart
npm run clean

# Prebuild (if using bare workflow)
npm run prebuild

# Start development server
npm start

# Build for specific platform
npm run build:android
npm run build:ios
```

## Deployment

### Android

1. **Generate APK/AAB**
   ```bash
   eas build --platform android --profile production
   ```

2. **Upload to Google Play Console**
   - Download the generated AAB file
   - Upload to Google Play Console
   - Follow Google Play Store guidelines

### iOS

1. **Generate IPA**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Upload to App Store Connect**
   - Download the generated IPA file
   - Upload to App Store Connect
   - Follow Apple App Store guidelines

## Support

For issues and questions:
- Check the troubleshooting section
- Review Expo documentation
- Contact the development team

## License

This project is proprietary software for TNHappyKids. 