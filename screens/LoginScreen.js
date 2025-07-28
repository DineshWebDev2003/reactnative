import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Animated, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../config';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureAnim] = useState(new Animated.Value(0));
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if biometric authentication is available (DISABLED)
    /*
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
      // If user previously logged in, prompt for biometric
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken && compatible && enrolled) {
        const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Login with fingerprint or device password' });
        if (result.success) {
          // Auto-login (navigate to dashboard or set user context)
          navigation.replace('AdministrationDashboard'); // or ParentDashboard/FranchiseeDashboard based on user role
        }
      }
    })();
    */
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    // Animate secure icon
    Animated.sequence([
      Animated.timing(secureAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(secureAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(async () => {
      try {
        const response = await fetch(`${BASE_URL}/login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrMobile: email, password: password }),
        });
        const data = await response.json();
        if (data.success && data.user && data.user.role) {
          await AsyncStorage.setItem('userId', String(data.user.id)); // Store userId for chat and other features
          // Store user role for later use
          await AsyncStorage.setItem('role', data.user.role.toLowerCase());
          console.log('Stored user ID:', data.user.id, 'and role:', data.user.role.toLowerCase());
          // Store credentials for camera fetch if parent
          if (data.user.role.toLowerCase() === 'parent') {
            await AsyncStorage.setItem('email', data.user.email || '');
            await AsyncStorage.setItem('mobile', data.user.mobile || '');
            await AsyncStorage.setItem('password', password);
          }
          // Map backend role to dashboard screen
          let dashboard = '';
          switch (data.user.role.toLowerCase()) {
            case 'administration': dashboard = 'AdministrationDashboard'; break;
            case 'franchisee': dashboard = 'FranchiseeDashboard'; break;
            case 'teacher':
              if (!data.user.onboarding_complete) {
                navigation.replace('TeacherOnboarding', { userId: data.user.id });
                return;
              } else {
                dashboard = 'TeacherDashboard'; // Change to 'TuitionTeacherDashboard' if you have a separate screen
              }
              break;
            case 'tuition_teacher':
              if (!data.user.onboarding_complete) {
                navigation.replace('TeacherOnboarding', { userId: data.user.id });
                return;
              } else {
                dashboard = 'TuitionTeacherDashboard';
              }
              break;
            case 'parent':
              if (!data.user.onboarding_complete) {
                navigation.replace('ParentOnboarding', { userId: data.user.id });
                return;
              } else {
                dashboard = 'ParentDashboard'; // Change to 'TuitionStudentDashboard' if you have a separate screen
              }
              break;
            case 'tuition_student':
              dashboard = 'TuitionStudentDashboard';
              break;
            default: dashboard = 'AdministrationDashboard'; break;
          }
          navigation.replace('PostLoginSplash', { role: data.user.role.toLowerCase() });
          await AsyncStorage.setItem('userToken', 'true');
        } else {
          Alert.alert('Login Failed', data.message || 'Invalid credentials. Please try again.');
        }
      } catch (error) {
        console.error('Login error:', error);
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/forgot_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });
      const data = await response.json();
      Alert.alert('Password Reset', data.message || 'If the email exists, you will receive reset instructions.');
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.bgAnimation} />
      <View style={styles.centeredWrapper}>
        <View style={styles.glassContainer}>
          <View style={styles.innerContainer}>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <Text style={styles.welcome}>Welcome to TN Happy Kids</Text>
            <BlurView intensity={20} style={styles.blurContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email or Mobile"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Login Button and Forgot Password Grouped */}
              <View style={styles.loginGroup}>
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                  <Text style={styles.loginText}>🔐 Login</Text>
                  <Animated.View style={{
                    marginLeft: 8,
                    transform: [{ scale: secureAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
                    opacity: secureAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] })
                  }}>
                    <Text style={{ fontSize: 22 }}>🔒</Text>
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 12 }}>
                  <Text style={{ color: '#4F46E5', textAlign: 'center' }}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7', // pastel yellow
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgAnimation: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 192, 203, 0.1)', // pastel pink overlay
    zIndex: 0,
  },
  centeredWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassContainer: {
    width: '92%',
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  innerContainer: {
    width: '90%',
    backgroundColor: 'rgba(173, 216, 230, 0.25)', // baby blue
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  logo: {
    width: 100, // Adjust size as needed
    height: 100, // Adjust size as needed
    marginBottom: 16,
  },
  welcome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  blurContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
    color: '#666',
  },
  loginGroup: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 