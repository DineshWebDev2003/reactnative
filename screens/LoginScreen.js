import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Animated, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../config';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
          await AsyncStorage.setItem('userRole', data.user.role.toLowerCase());
          if (data.user.branch) {
            await AsyncStorage.setItem('userBranch', data.user.branch);
          }
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
      } catch (e) {
        Alert.alert('Network Error', 'Could not connect to server.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email to reset password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/forgot_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        Alert.alert('Request Sent', 'Your request has been sent to the Founder for password reset.');
      } else {
        Alert.alert('Error', data.message || 'Failed to send request.');
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Network error.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.bgAnimation} />
      <View style={styles.centeredWrapper}>
        <BlurView intensity={80} tint="light" style={styles.glassContainer}>
          {/* Logo */}
          <Image source={{ uri: 'https://app.tnhappykids.in/assets/Avartar.png' }} style={styles.logo} />
          {/* Welcome Message */}
          <Text style={styles.welcome}>Welcome to TN Happy Kids – Empowering Early Education</Text>
          {/* Input Fields */}
          <TextInput
            style={styles.input}
            placeholder="Email or Mobile Number"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#333"
                style={{ marginLeft: 8 }}
              />
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
    paddingHorizontal: 16, // add side margin
  },
  glassContainer: {
    width: '88%', // slightly narrower for more side margin
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
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700', // gold
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#FFD700',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  loginText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d2d2d',
  },
  forgot: {
    color: '#3867d6',
    marginTop: 8,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  loginGroup: {
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
  },
  forgotButton: {
    marginTop: 10,
  },
}); 