import React, { useState, useEffect } from 'react';
import AnimatedSplashScreen from './screens/AnimatedSplashScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';

import AdminDashboardTabs from './screens/AdminDashboardTabs';
import FranchiseeTabNavigator from './screens/FranchiseeTabNavigator';
import TeacherDashboard from './screens/TeacherDashboard';
import ParentDashboard from './screens/ParentDashboard';
import AllCamerasScreen from './screens/AllCamerasScreen';
import StudentsListScreen from './screens/StudentsListScreen';
import AssignUser from './screens/AssignUser';
import ManageStaff from './screens/ManageStaff';
import EditUser from './screens/EditUser';
import ManageUsers from './screens/ManageUsers';
import ChatScreen from './screens/ChatScreen';
import ChatListScreen from './screens/ChatListScreen';
import ParentOnboarding from './screens/ParentOnboarding';
import TeacherOnboarding from './screens/TeacherOnboarding';
import MarkAttendanceV2 from './screens/MarkAttendanceV2';
import CameraFullscreen from './screens/CameraFullscreen';
import WalletScreen from './screens/WalletScreen';
import AssignFeeScreen from './screens/AssignFeeScreen';
import PostLoginSplashScreen from './screens/PostLoginSplashScreen';
import MessageParentsScreen from './screens/MessageParentsScreen';
import PostActivityScreen from './screens/PostActivityScreen';
import UpdateProfileScreen from './screens/UpdateProfileScreen';
import TuitionTeacherDashboard from './screens/TuitionTeacherDashboard';
import TuitionStudentDashboard from './screens/TuitionStudentDashboard';
import AttendanceReport from './screens/AttendanceReport';
import ActivityListScreen from './screens/ActivityListScreen';
import HomeworkScreen from './screens/HomeworkScreen';
import KidsActivityFeed from './screens/KidsActivityFeed';
import IDCardListScreen from './screens/IDCardListScreen';
import BulkUploadWebScreen from './screens/BulkUploadWebScreen';
import InvoiceGeneratorScreen from './screens/InvoiceGeneratorScreen';
import StaffAttendanceScreen from './screens/StaffAttendanceScreen';
import ManageBranchesScreen from './screens/ManageBranchesScreen';
import IncomeExpense from './screens/IncomeExpense';
import { LogBox, Alert, Linking, Platform, View, Text, TouchableOpacity, Modal } from 'react-native';

// Global Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // You can log error info here
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 18 }}>Something went wrong.</Text>
          <Text style={{ color: '#333', marginTop: 10 }}>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const Stack = createStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [latestVersionInfo, setLatestVersionInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch('https://app.tnhappykids.in/backend/uploads/app_versions/latest_version.json');
        const data = await res.json();
        const currentVersion = '1.0.0'; // Set to a value different from the backend JSON version
        if (data.version && data.version !== currentVersion) {
          setNewVersionAvailable(true);
          setLatestVersionInfo(data);
          setShowUpdateModal(true);
        }
      } catch (e) {
        // Ignore errors
      }
    }
    checkVersion();
  }, []);

  if (showSplash) {
    return <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Add global error handler
  LogBox.ignoreAllLogs(); // Optional: ignore yellow box warnings
  if (!global.ErrorUtils._customHandler) {
    const defaultHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      Alert.alert('App Error', error.message);
      if (defaultHandler) defaultHandler(error, isFatal);
    });
    global.ErrorUtils._customHandler = true;
  }

  // Defensive: check for default avatar asset
  try {
    require('./assets/Avartar.png');
  } catch (e) {
    Alert.alert('Asset Error', 'Default avatar image is missing. Please add Avartar.png to the assets folder.');
  }

  // Add global unhandledrejection handler
  if (typeof global !== 'undefined' && global.process && typeof global.process.on === 'function') {
    global.process.on('unhandledRejection', (reason, promise) => {
      Alert.alert('Unhandled Promise Rejection', reason?.message || String(reason));
    });
  }

  return (
    <ErrorBoundary>
      <Modal
        visible={showUpdateModal && newVersionAvailable && !!latestVersionInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={{
          flex: 1, justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '85%', alignItems: 'center'
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#1a237e', marginBottom: 8 }}>
              New Version Available: {latestVersionInfo?.version}
            </Text>
            <Text style={{ color: '#1a237e', marginBottom: 12 }}>
              {latestVersionInfo?.description}
            </Text>
            <Text style={{ color: '#333', marginBottom: 16 }}>
              {latestVersionInfo?.changelog}
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#4caf50', borderRadius: 6, padding: 12, marginBottom: 10, width: '100%', alignItems: 'center' }}
              onPress={() => Linking.openURL('https://app.tnhappykids.in/backend/' + latestVersionInfo.file)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Install</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 4, alignItems: 'center' }}
              onPress={() => setShowUpdateModal(false)}
            >
              <Text style={{ color: '#e53935', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdministrationDashboard" component={AdminDashboardTabs} options={{ headerShown: false }} />
        <Stack.Screen name="IDCardList" component={IDCardListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FranchiseeDashboard" component={FranchiseeTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="AllCamerasScreen" component={AllCamerasScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AssignUser" component={AssignUser} options={{ headerShown: false }} />
        <Stack.Screen name="ManageStaff" component={ManageStaff} options={{ headerShown: false }} />
        <Stack.Screen name="EditUser" component={EditUser} options={{ headerShown: false }} />
        <Stack.Screen name="ManageUsers" component={ManageUsers} options={{ headerShown: false }} />
        <Stack.Screen name="StaffAttendance" component={StaffAttendanceScreen} options={{ headerShown: true, title: 'Staff Attendance' }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChatListScreen" component={ChatListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ParentOnboarding" component={ParentOnboarding} options={{ headerShown: false }} />
        <Stack.Screen name="TeacherOnboarding" component={TeacherOnboarding} options={{ headerShown: false }} />
          <Stack.Screen name="MarkAttendanceV2" component={MarkAttendanceV2} options={{ headerShown: false }} />
        <Stack.Screen name="CameraFullscreen" component={CameraFullscreen} options={{ headerShown: false }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AssignFee" component={AssignFeeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostLoginSplash" component={PostLoginSplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MessageParentsScreen" component={MessageParentsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostActivity" component={PostActivityScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UpdateProfileScreen" component={UpdateProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TuitionTeacherDashboard" component={TuitionTeacherDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="TuitionStudentDashboard" component={TuitionStudentDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="AttendanceReport" component={AttendanceReport} options={{ headerShown: false }} />
        <Stack.Screen name="ActivityListScreen" component={ActivityListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HomeworkScreen" component={HomeworkScreen} options={{ headerShown: false }} />
        <Stack.Screen name="KidsActivityFeed" component={KidsActivityFeed} options={{ headerShown: false }} />
        <Stack.Screen name="BulkUploadWeb" component={BulkUploadWebScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StudentsListScreen" component={StudentsListScreen} />
        <Stack.Screen name="BranchInvoiceListScreen" component={require('./screens/BranchInvoiceListScreen').default} options={{ headerShown: true, title: 'Branch Invoices' }} />
        <Stack.Screen name="InvoiceDetailScreen" component={require('./screens/InvoiceDetailScreen').default} options={{ headerShown: true, title: 'Invoice Details' }} />
        <Stack.Screen name="InvoiceGeneratorScreen" component={InvoiceGeneratorScreen} options={{ headerShown: true, title: 'Invoice Generator' }} />
        <Stack.Screen name="ManageBranches" component={ManageBranchesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="IncomeExpense" component={IncomeExpense} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
    </ErrorBoundary>
  );
} 