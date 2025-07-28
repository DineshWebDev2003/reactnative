# TNHappyKids App - Build and Publish Guide

## 🚀 Quick Start

Your TNHappyKids app is now properly configured and ready for building and publishing! Here's how to proceed:

## 📱 Development

1. **Start Development Server**
   ```bash
   npm start
   # or
   expo start
   ```

2. **Test on Device**
   - Scan the QR code with Expo Go app
   - Or press 'a' for Android or 'i' for iOS

## 🏗️ Building for Production

### Prerequisites
- Install EAS CLI: `npm install -g eas-cli`
- Login to Expo: `eas login`
- Configure EAS: `eas build:configure`

### Android Build

1. **Development Build (APK)**
   ```bash
   npm run build:android
   # or
   eas build --platform android --profile preview
   ```

2. **Production Build (AAB)**
   ```bash
   eas build --platform android --profile production
   ```

### iOS Build

1. **Development Build**
   ```bash
   npm run build:ios
   # or
   eas build --platform ios --profile preview
   ```

2. **Production Build**
   ```bash
   eas build --platform ios --profile production
   ```

## 📤 Publishing Updates

### Using Expo Updates (Recommended)

1. **Publish Update**
   ```bash
   npm run publish
   # or
   expo publish
   ```

2. **Using EAS Update**
   ```bash
   eas update --branch production --message "Bug fixes and improvements"
   ```

### Manual Build and Submit

1. **Build the app**
   ```bash
   eas build --platform all --profile production
   ```

2. **Download and submit to stores**
   - Android: Download AAB and upload to Google Play Console
   - iOS: Download IPA and upload to App Store Connect

## 🔧 Configuration Files

### app.json
- ✅ App name, version, and bundle identifiers
- ✅ Permissions for camera, location, etc.
- ✅ Splash screen and icon configuration
- ✅ Plugin configurations

### eas.json
- ✅ Build profiles for development and production
- ✅ Platform-specific configurations

### package.json
- ✅ All essential dependencies
- ✅ Compatible versions for Expo SDK 50
- ✅ Build and publish scripts

## 🛠️ Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clean and restart
   npm run clean
   npm start
   ```

2. **Dependency Issues**
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules
   npm install
   ```

3. **Metro Bundler Issues**
   ```bash
   # Clear cache
   expo r -c
   ```

### Build Commands Reference

```bash
# Development
npm start                    # Start development server
npm run clean               # Clear cache and restart

# Building
npm run build:android       # Build Android APK
npm run build:ios          # Build iOS app
eas build --platform all   # Build for both platforms

# Publishing
npm run publish            # Publish to Expo
eas update                 # Publish update via EAS
```

## 📋 Pre-Build Checklist

Before building for production, ensure:

- [ ] All dependencies are installed (`npm install`)
- [ ] App starts without errors (`npm start`)
- [ ] All screens are accessible
- [ ] Backend API is configured in `config.js`
- [ ] App icons and splash screen are in place
- [ ] Bundle identifiers are correct in `app.json`
- [ ] EAS project is configured (`eas build:configure`)

## 🎯 Next Steps

1. **Test the app thoroughly** on both Android and iOS
2. **Configure your backend** API endpoints
3. **Set up EAS project** for cloud builds
4. **Prepare store listings** with screenshots and descriptions
5. **Submit to app stores** following their guidelines

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Expo documentation
3. Check the build logs for specific error messages
4. Ensure all dependencies are compatible with Expo SDK 50

Your TNHappyKids app is now ready for production! 🎉 