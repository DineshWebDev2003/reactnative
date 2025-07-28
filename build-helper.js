#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 TNHappyKids Build Helper');
console.log('============================\n');

const commands = {
  '1': {
    name: 'Start Development Server',
    command: 'npm start',
    description: 'Start the development server for testing'
  },
  '2': {
    name: 'Build Android (Development)',
    command: 'npm run build:android',
    description: 'Build Android APK for testing'
  },
  '3': {
    name: 'Build iOS (Development)',
    command: 'npm run build:ios',
    description: 'Build iOS app for testing'
  },
  '4': {
    name: 'Build Production (Both Platforms)',
    command: 'eas build --platform all --profile production',
    description: 'Build production versions for both platforms'
  },
  '5': {
    name: 'Publish Update',
    command: 'npm run publish',
    description: 'Publish update to Expo'
  },
  '6': {
    name: 'Clean and Restart',
    command: 'npm run clean',
    description: 'Clear cache and restart'
  }
};

console.log('Available commands:');
Object.entries(commands).forEach(([key, cmd]) => {
  console.log(`${key}. ${cmd.name} - ${cmd.description}`);
});

console.log('\nTo run a command, use: node build-helper.js <number>');
console.log('Example: node build-helper.js 1');

const arg = process.argv[2];
if (arg && commands[arg]) {
  const selected = commands[arg];
  console.log(`\n🚀 Running: ${selected.name}`);
  console.log(`Command: ${selected.command}\n`);
  
  try {
    execSync(selected.command, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Command failed:', error.message);
  }
} else if (arg) {
  console.log(`❌ Invalid option: ${arg}`);
} else {
  console.log('\n💡 Tip: Run "node build-helper.js 1" to start development server');
} 