const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Screen Components');
console.log('==============================\n');

const screens = [
  'AnimatedSplashScreen',
  'LoginScreen',
  'PostLoginSplashScreen',
  'ParentDashboard',
  'TeacherDashboard',
  'TuitionStudentDashboard',
  'TuitionTeacherDashboard',
  'FranchiseeDashboard',
  'AdministrationDashboard',
  'ParentOnboarding',
  'TeacherOnboarding',
  'UpdateProfileScreen',
  'ChatListScreen',
  'ChatScreen',
  'ActivityListScreen',
  'PostActivityScreen',
  'KidsActivityFeed',
  'MarkAttendance',
  'AttendanceReport',
  'HomeworkScreen',
  'WalletScreen',
  'IncomeExpense',
  'ManageUsers',
  'ManageStaff',
  'AssignUser',
  'EditUser',
  'AssignFeeScreen',
  'IDCardListScreen',
  'AllCamerasScreen',
  'CameraFullscreen',
  'MessageParentsScreen',
  'BulkUploadWebScreen'
];

const components = [
  'VirtualIDCard'
];

let allGood = true;

console.log('📱 Checking Screen Components:');
screens.forEach(screen => {
  const filePath = `screens/${screen}.js`;
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${screen}.js`);
  } else {
    console.log(`❌ ${screen}.js - MISSING`);
    allGood = false;
  }
});

console.log('\n🧩 Checking Component Files:');
components.forEach(component => {
  const filePath = `components/${component}.js`;
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${component}.js`);
  } else {
    console.log(`❌ ${component}.js - MISSING`);
    allGood = false;
  }
});

if (allGood) {
  console.log('\n✅ All screen and component files exist!');
  console.log('\n🚀 Your app should now start without component errors.');
} else {
  console.log('\n❌ Some files are missing. Please create them before building.');
}

console.log('\n💡 Next steps:');
console.log('1. Run: npm install (if not done already)');
console.log('2. Run: npx expo start');
console.log('3. Test the app on your device'); 