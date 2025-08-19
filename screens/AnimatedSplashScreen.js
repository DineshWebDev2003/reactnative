import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Entypo, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AnimatedSplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
        toValue: 1,
      duration: 1200,
        useNativeDriver: true,
    }).start(() => {
      setTimeout(onFinish, 1800);
    });
  }, []);

  // Animated playful icons
  const icons = [
    { icon: <FontAwesome5 name="pencil-alt" size={28} color="#42A5F5" />, x: 80, y: -50, delay: 100 },
    { icon: <MaterialCommunityIcons name="book-open-page-variant" size={30} color="#AB47BC" />, x: -90, y: 60, delay: 200 },
    { icon: <Entypo name="chat" size={30} color="#FF7043" />, x: 90, y: 70, delay: 300 },
    { icon: <FontAwesome5 name="pen" size={28} color="#66BB6A" />, x: 0, y: 90, delay: 400 },
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
          <Image source={{ uri: 'https://app.tnhappykids.in/assets/splash-icon.png' }} style={styles.logo} />
        </View>
        <Text style={styles.title}>TN Happy Kids</Text>
        <Text style={styles.subtitle}>Empowering Early Education</Text>
        <View style={styles.iconRow}>
          {icons.map((item, idx) => (
            <View key={idx} style={{ marginHorizontal: 12, transform: [{ translateX: item.x / 2 }, { translateY: item.y / 2 }] }}>
              {item.icon}
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
    color: '#6c3483',
    marginBottom: 24,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Colorful blobs
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.32,
    zIndex: 1,
  },
  blob1: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: '#a084ca',
    top: -width * 0.2,
    left: -width * 0.2,
  },
  blob2: {
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: '#ffb6b9',
    bottom: -width * 0.15,
    right: -width * 0.1,
  },
  blob3: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: '#80deea',
    top: height * 0.6,
    left: width * 0.3,
  },
}); 