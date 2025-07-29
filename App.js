import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';


// Import all screens
import AnimatedSplashScreen from './screens/AnimatedSplashScreen';
import LoginScreen from './screens/LoginScreen';
import PostLoginSplashScreen from './screens/PostLoginSplashScreen';
import ParentDashboard from './screens/ParentDashboard';
import TeacherDashboard from './screens/TeacherDashboard';
import TuitionStudentDashboard from './screens/TuitionStudentDashboard';
import TuitionTeacherDashboard from './screens/TuitionTeacherDashboard';
import FranchiseeDashboard from './screens/FranchiseeDashboard';
import AdministrationDashboard from './screens/AdministrationDashboard';
import ParentOnboarding from './screens/ParentOnboarding';
import TeacherOnboarding from './screens/TeacherOnboarding';
import UpdateProfileScreen from './screens/UpdateProfileScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import ActivityListScreen from './screens/ActivityListScreen';
import PostActivityScreen from './screens/PostActivityScreen';
import KidsActivityFeed from './screens/KidsActivityFeed';
import MarkAttendance from './screens/MarkAttendance';
import AttendanceReport from './screens/AttendanceReport';
import HomeworkScreen from './screens/HomeworkScreen';
import WalletScreen from './screens/WalletScreen';
import IncomeExpense from './screens/IncomeExpense';
import ManageUsers from './screens/ManageUsers';
import ManageStaff from './screens/ManageStaff';
import AssignUser from './screens/AssignUser';
import EditUser from './screens/EditUser';
import AssignFeeScreen from './screens/AssignFeeScreen';
import IDCardListScreen from './screens/IDCardListScreen';
import VirtualIDCard from './components/VirtualIDCard';
import AllCamerasScreen from './screens/AllCamerasScreen';
import CameraFullscreen from './screens/CameraFullscreen';
import MessageParentsScreen from './screens/MessageParentsScreen';
import BulkUploadWebScreen from './screens/BulkUploadWebScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaProvider>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Something went wrong!</Text>
            <Text style={styles.errorMessage}>Please restart the app or contact support if the problem persists.</Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => this.setState({ hasError: false })}
            >
              <Text style={styles.errorButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaProvider>
      );
    }

    return this.props.children;
  }
}

// Main App Component
export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // For Expo SDK 50, vector icons should work without explicit font loading
    setFontsLoaded(true);
  }, []);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Stack.Navigator 
              initialRouteName="Splash"
              screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                cardStyleInterpolator: ({ current, layouts }) => {
                  return {
                    cardStyle: {
                      transform: [
                        {
                          translateX: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [layouts.screen.width, 0],
                          }),
                        },
                      ],
                    },
                  };
                },
              }}
            >
              <Stack.Screen name="Splash" component={AnimatedSplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="PostLoginSplash" component={PostLoginSplashScreen} />
              <Stack.Screen name="ParentOnboarding" component={ParentOnboarding} />
              <Stack.Screen name="TeacherOnboarding" component={TeacherOnboarding} />
              <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
              <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
              <Stack.Screen name="TuitionStudentDashboard" component={TuitionStudentDashboard} />
              <Stack.Screen name="TuitionTeacherDashboard" component={TuitionTeacherDashboard} />
              <Stack.Screen name="FranchiseeDashboard" component={FranchiseeDashboard} />
              <Stack.Screen name="AdministrationDashboard" component={AdministrationDashboard} />
              <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
              <Stack.Screen name="ChatList" component={ChatListScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="ActivityList" component={ActivityListScreen} />
              <Stack.Screen name="PostActivity" component={PostActivityScreen} />
              <Stack.Screen name="KidsActivityFeed" component={KidsActivityFeed} />
              <Stack.Screen name="MarkAttendance" component={MarkAttendance} />
              <Stack.Screen name="AttendanceReport" component={AttendanceReport} />
              <Stack.Screen name="Homework" component={HomeworkScreen} />
              <Stack.Screen name="Wallet" component={WalletScreen} />
              <Stack.Screen name="IncomeExpense" component={IncomeExpense} />
              <Stack.Screen name="ManageUsers" component={ManageUsers} />
              <Stack.Screen name="ManageStaff" component={ManageStaff} />
              <Stack.Screen name="AssignUser" component={AssignUser} />
              <Stack.Screen name="EditUser" component={EditUser} />
              <Stack.Screen name="AssignFee" component={AssignFeeScreen} />
              <Stack.Screen name="IDCardList" component={IDCardListScreen} />
              <Stack.Screen name="VirtualIDCard" component={VirtualIDCard} />
              <Stack.Screen name="AllCameras" component={AllCamerasScreen} />
              <Stack.Screen name="CameraFullscreen" component={CameraFullscreen} />
              <Stack.Screen name="MessageParents" component={MessageParentsScreen} />
              <Stack.Screen name="BulkUpload" component={BulkUploadWebScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 