#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 TNHappyKids Build Check Script');
console.log('=====================================\n');

// Check for required files
const requiredFiles = [
  'package.json',
  'app.json',
  'babel.config.js',
  'metro.config.js',
  'eas.json',
  'App.js',
  'config.js'
];

console.log('📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n⚠️  Missing files: ${missingFiles.join(', ')}`);
  console.log('Please create these files before building.');
}

// Check package.json dependencies
console.log('\n📦 Checking package.json...');
if (fs.existsSync('package.json')) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDeps = [
      'expo',
      'react',
      'react-native',
      '@react-navigation/native',
      '@react-navigation/stack'
    ];
    
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length > 0) {
      console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
    } else {
      console.log('✅ All required dependencies found');
    }
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
  }
}

// Check for screens directory
console.log('\n📱 Checking screens directory...');
if (fs.existsSync('screens')) {
  console.log('✅ screens directory exists');
  
  // List some key screens
  const keyScreens = [
    'AnimatedSplashScreen.js',
    'LoginScreen.js',
    'ParentDashboard.js',
    'TeacherDashboard.js'
  ];
  
  keyScreens.forEach(screen => {
    if (fs.existsSync(`screens/${screen}`)) {
      console.log(`✅ ${screen}`);
    } else {
      console.log(`❌ ${screen} - MISSING`);
    }
  });
} else {
  console.log('❌ screens directory missing');
}

// Check for assets
console.log('\n🖼️  Checking assets...');
if (fs.existsSync('assets')) {
  console.log('✅ assets directory exists');
  
  const requiredAssets = [
    'icon.png',
    'splash-icon.png',
    'adaptive-icon.png',
    'favicon.png'
  ];
  
  requiredAssets.forEach(asset => {
    if (fs.existsSync(`assets/${asset}`)) {
      console.log(`✅ ${asset}`);
    } else {
      console.log(`❌ ${asset} - MISSING`);
    }
  });
} else {
  console.log('❌ assets directory missing');
}

console.log('\n🚀 Build Check Complete!');
console.log('\nNext steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Start development: npm start');
console.log('3. Build for production: npm run build:android or npm run build:ios');
console.log('4. Publish updates: npm run publish'); 