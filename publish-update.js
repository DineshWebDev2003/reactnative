#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 TNHappyKids Over-the-Air Update Publisher');
console.log('=============================================\n');

function publishUpdate() {
  try {
    console.log('📦 Publishing update to Expo...');
    execSync('expo publish', { stdio: 'inherit' });
    console.log('\n✅ Update published successfully!');
    console.log('\n📱 Your users will receive the update automatically when they open the app.');
    console.log('\n💡 Note: This update will be available immediately without app store review.');
  } catch (error) {
    console.error('❌ Failed to publish update:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you are logged in: expo login');
    console.log('2. Check your internet connection');
    console.log('3. Verify your project is configured correctly');
  }
}

function showHelp() {
  console.log('Available commands:');
  console.log('  publish    - Publish an over-the-air update');
  console.log('  help       - Show this help message');
  console.log('\nUsage: node publish-update.js <command>');
  console.log('Example: node publish-update.js publish');
}

const command = process.argv[2];

switch (command) {
  case 'publish':
    publishUpdate();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.log('❌ Unknown command. Use "help" to see available commands.');
    showHelp();
} 