import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function CameraFullscreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const cameraUrl = route.params?.cameraUrl;

  useEffect(() => {
    // Lock to landscape on mount
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    // Return to portrait on unmount
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  if (!cameraUrl) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#c00' }}>No camera URL provided.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={{ color: '#fff' }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <WebView
        source={{ uri: cameraUrl }}
        style={{ flex: 1 }}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
          navigation.goBack();
        }}
      >
        <Text style={{ color: '#fff', fontSize: 18 }}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#0008',
    padding: 10,
    borderRadius: 24,
    zIndex: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  }
});