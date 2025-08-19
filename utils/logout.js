import AsyncStorage from '@react-native-async-storage/async-storage';

export const handleLogout = async (navigation) => {
  try {
    // Clear all stored data
    await AsyncStorage.multiRemove([
      'userId', 
      'role', 
      'email', 
      'mobile', 
      'password'
    ]);
    console.log('Logged out - cleared AsyncStorage');
    // Navigate to login
    navigation.replace('Login');
  } catch (error) {
    console.log('Error during logout:', error);
    // Still navigate to login even if clearing fails
    navigation.replace('Login');
  }
}; 