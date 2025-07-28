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
        switch ((role || '').toLowerCase()) {
          case 'administration':
            navigation.replace('AdministrationDashboard');
            break;
          case 'franchisee':
            navigation.replace('FranchiseeDashboard');
            break;
          case 'teacher':
            navigation.replace('TeacherDashboard');
            break;
          case 'tuition_teacher':
            navigation.replace('TuitionTeacherDashboard');
            break;
          case 'parent':
            navigation.replace('ParentDashboard');
            break;
          case 'tuition_student':
            navigation.replace('TuitionStudentDashboard');
            break;
          default:
            navigation.replace('Login');
        }
      }, 2000); // 2 seconds splash
      
      return () => clearTimeout(timer);
    };

    storeRoleAndNavigate();
  }, [role]);

  return <AnimatedSplashScreen />;
} 