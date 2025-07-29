import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function AnimatedSplashScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Prevent multiple navigation attempts
    if (hasNavigated.current) {
      console.log('AnimatedSplashScreen: Already navigated, skipping...');
      return;
    }
    
    console.log('AnimatedSplashScreen: Starting animation...');
    
    const checkAuthAndNavigate = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const userToken = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('role');
        
        console.log('AnimatedSplashScreen: Auth check - userId:', userId, 'userToken:', userToken, 'role:', role);
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }).start(() => {
          console.log('AnimatedSplashScreen: Animation completed');
          
          setTimeout(() => {
            if (hasNavigated.current) {
              console.log('AnimatedSplashScreen: Navigation already happened, skipping...');
              return;
            }
            
            hasNavigated.current = true;
            
            if (userId && userToken) {
              console.log('AnimatedSplashScreen: User is authenticated, navigating to PostLoginSplash');
              navigation.replace('PostLoginSplash', { role: role || 'administration' });
            } else {
              console.log('AnimatedSplashScreen: User not authenticated, navigating to Login');
              navigation.replace('Login');
            }
          }, 1800);
        });
      } catch (error) {
        console.error('AnimatedSplashScreen: Auth check error:', error);
        // Fallback to Login on error
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }).start(() => {
            setTimeout(() => {
              navigation.replace('Login');
            }, 1800);
          });
        }
      }
    };
    
    checkAuthAndNavigate();
  }, [navigation]);

  // Simple emoji icons instead of vector icons
  const icons = [
    { icon: "✏️", x: 80, y: -50, delay: 100 },
    { icon: "📚", x: -90, y: 60, delay: 200 },
    { icon: "💬", x: 90, y: 70, delay: 300 },
    { icon: "🖊️", x: 0, y: 90, delay: 400 },
  ];

  return (
    <View style={styles.root}>
      {/* Colorful Gradient Background */}
      <LinearGradient
        colors={["#f3e8ff", "#ffe0e3", "#e0f7fa", "#fffde7"]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Colorful Blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
      {/* Animated Content */}
      <Animated.View style={[styles.centered, { opacity: fadeAnim }]}> 
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            onError={(error) => {
              console.log('Logo loading error:', error);
            }}
          />
        </View>
        <Text style={styles.title}>TN Happy Kids</Text>
        <Text style={styles.subtitle}>Empowering Early Education</Text>
        <View style={styles.iconRow}>
          {icons.map((item, idx) => (
            <View key={idx} style={[styles.iconContainer, { transform: [{ translateX: item.x / 2 }, { translateY: item.y / 2 }] }]}>
              <Text style={styles.iconText}>{item.icon}</Text>
            </View>
          ))}
        </View>
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    width: '100%',
  },
  logoContainer: {
    backgroundColor: '#fff',
    borderRadius: 60,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#a084ca',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  logo: {
    width: 100, // Adjust size as needed
    height: 100, // Adjust size as needed
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 28,
  },
  blob: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.3,
  },
  blob1: {
    width: 200,
    height: 200,
    backgroundColor: '#ff9a9e',
    top: -100,
    right: -100,
  },
  blob2: {
    width: 150,
    height: 150,
    backgroundColor: '#a8edea',
    bottom: -75,
    left: -75,
  },
  blob3: {
    width: 100,
    height: 100,
    backgroundColor: '#ffecd2',
    top: '50%',
    right: -50,
  },
}); 