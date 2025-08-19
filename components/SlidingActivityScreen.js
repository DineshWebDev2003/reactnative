import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SlidingActivityScreen({ activities, title = "Kids Activities", showDownload = true }) {
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));

  const filteredActivities = activities || [];

  // --- Filter activities to only show today's posters ---
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todaysActivities = filteredActivities.filter(activity => {
    if (!activity || !activity.created_at) return false;
    const activityDate = new Date(activity.created_at);
    // Compare date part only
    return activityDate.toISOString().slice(0, 10) === todayStr;
  });

  // Auto-slide functionality with fade transition
  useEffect(() => {
    if (todaysActivities.length > 1) {
      const interval = setInterval(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Change image
          setCurrentActivityIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % todaysActivities.length;
            return nextIndex;
          });
          // Fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      }, 20000); // 20 seconds

      return () => clearInterval(interval);
    }
  }, [todaysActivities, fadeAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 20000, // 20 seconds per slide
      useNativeDriver: false,
    }).start();
    return () => progressAnim.setValue(0);
  }, [currentActivityIndex]);

  // Handle progress bar tap
  const handleProgressBarTap = (index) => {
    if (index !== currentActivityIndex) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change image
        setCurrentActivityIndex(index);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleDownload = async (url) => {
    try {
      const fileName = `activity_${Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      const response = await FileSystem.downloadAsync(url, fileUri);
      
      if (response.status === 200) {
        await Sharing.shareAsync(fileUri, { mimeType: 'image/jpeg', dialogTitle: 'Download Activity Image' });
      } else {
        Alert.alert('Error', 'Failed to download image');
      }
    } catch (error) {
      console.log('Download error:', error);
      Alert.alert('Error', 'Failed to download image');
    }
  };

  if (todaysActivities.length === 0) {
    return (
      <View style={{ marginTop: 12, marginBottom: 12 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#e75480', marginBottom: 8 }}>{title}</Text>
        <Text style={{ color: '#888' }}>No activities posted yet.</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 12, marginBottom: 12 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#e75480', marginBottom: 8 }}>{title}</Text>
      <View style={{ width: '100%', alignItems: 'center', marginBottom: 12 }}>
        <View style={[styles.customProgressBar, { width: '90%', height: 8, borderRadius: 6, backgroundColor: '#e0e0e0', flexDirection: 'row', overflow: 'hidden', position: 'relative' }]}> 
          {todaysActivities.map((_, index) => (
            <TouchableOpacity key={index} onPress={() => handleProgressBarTap(index)} style={{ flex: 1, height: '100%', position: 'relative' }}>
              <View style={{
                backgroundColor: '#bdbdbd',
                height: '100%',
                borderRadius: 6,
                marginHorizontal: index === 0 ? 0 : 2,
              }} />
              {index === currentActivityIndex && (
                <Animated.View style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: '#4F46E5',
                  borderRadius: 6,
                }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.singleFrameContainer}>
        <Animated.View style={[styles.singleFrame, { opacity: fadeAnim }]}> 
          {todaysActivities[currentActivityIndex] && (
            <TouchableOpacity style={styles.frameContent} activeOpacity={0.8} onPress={() => {
              setCurrentActivityIndex((prev) => (prev + 1) % todaysActivities.length);
            }}>
              <Image 
                source={{ uri: BASE_URL + '/' + todaysActivities[currentActivityIndex].image_path }} 
                style={styles.frameImage} 
                resizeMode="cover" 
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  singleFrameContainer: {
    width: '100%',
    height: 337.5, // 4:5 ratio (width: 270, height: 337.5)
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 10,
  },
  customProgressBar: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 0,
  },
  singleFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  frameContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  frameImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  frameDownloadBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 8,
  },
}); 