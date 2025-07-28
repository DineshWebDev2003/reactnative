const fs = require('fs');

console.log('🧪 Testing TNHappyKids App');
console.log('==========================\n');

// Check essential files
const essentialFiles = [
  'package.json',
  'app.json',
  'App.js',
  'config.js',
  'babel.config.js',
  'metro.config.js',
  'eas.json'
];

console.log('📁 Checking essential files:');
let allFilesExist = true;
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check key directories
const directories = [
  'screens',
  'components',
  'assets',
  'backend',
  'api'
];

console.log('\n📂 Checking directories:');
directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json for critical dependencies
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const criticalDeps = ['expo', 'react', 'react-native', '@react-navigation/native'];
  
  console.log('\n📦 Checking critical dependencies:');
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
}

if (allFilesExist) {
  console.log('\n✅ App structure looks good!');
  console.log('\n🚀 Ready to start the app:');
  console.log('1. npm install (if not done)');
  console.log('2. npx expo start');
  console.log('3. Press "a" for Android or "i" for iOS');
} else {
  console.log('\n❌ Some files are missing. Please fix before starting.');
} 