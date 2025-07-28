const fs = require('fs');

console.log('🔍 TNHappyKids Build Check');
console.log('==========================\n');

// Check essential files
const files = ['package.json', 'app.json', 'App.js', 'config.js'];
let allGood = true;

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allGood = false;
  }
});

if (allGood) {
  console.log('\n✅ Project structure looks good!');
  console.log('\nNext steps:');
  console.log('1. npm install');
  console.log('2. npm start');
  console.log('3. For production: npm run build:android or npm run build:ios');
} else {
  console.log('\n❌ Some files are missing. Please fix before building.');
} 