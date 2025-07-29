import React, { useEffect } from 'react';
import AnimatedSplashScreen from './AnimatedSplashScreen';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PostLoginSplashScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { role } = route.params || {};

  useEffect(() => {
    const storeRoleAndNavigate = async () => {
      // Store the role in AsyncStorage
      if (role) {
        await AsyncStorage.setItem('role', role.toLowerCase());
        console.log('Stored role in AsyncStorage:', role.toLowerCase());
      }
      
      const timer = setTimeout(() => {
        console.log('Navigating with role:', role);
        const roleLower = (role || '').toLowerCase();
        console.log('Processing role:', roleLower);
        switch (roleLower) {
          case 'administration':
            console.log('Navigating to AdministrationDashboard');
            navigation.replace('AdministrationDashboard');
            break;
          case 'franchisee':
            console.log('Navigating to FranchiseeDashboard');
            navigation.replace('FranchiseeDashboard');
            break;
          case 'teacher':
            console.log('Navigating to TeacherDashboard');
            navigation.replace('TeacherDashboard');
            break;
          case 'tuition_teacher':
            console.log('Navigating to TuitionTeacherDashboard');
            navigation.replace('TuitionTeacherDashboard');
            break;
          case 'parent':
            console.log('Navigating to ParentDashboard');
            navigation.replace('ParentDashboard');
            break;
          case 'tuition_student':
            console.log('Navigating to TuitionStudentDashboard');
            navigation.replace('TuitionStudentDashboard');
            break;
          default:
            console.log('Unknown role, navigating to Login');
            navigation.replace('Login');
        }
      }, 2000); // 2 seconds splash
      
      return () => clearTimeout(timer);
    };

    storeRoleAndNavigate();
  }, [role]);

  return <AnimatedSplashScreen />;
} 