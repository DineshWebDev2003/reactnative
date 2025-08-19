import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, Image, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions, SafeAreaView
} from 'react-native';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function StatusViewer({ status, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  const currentUpdate = status?.updates[currentIndex];

  useEffect(() => {
    if (!currentUpdate) return;

    const timer = setTimeout(() => {
      handleNext();
    }, currentUpdate.type === 'video' ? 15000 : 5000); // Longer for video, shorter for image

    return () => clearTimeout(timer);
  }, [currentIndex, status]);

  const handleNext = () => {
    if (currentIndex < status.updates.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsLoading(true);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLoading(true);
    }
  };

  const handleDownload = async () => {
    if (!currentUpdate) return;
    try {
      const fileUri = FileSystem.documentDirectory + currentUpdate.url.split('/').pop();
      Alert.alert('Downloading', 'Your file is being downloaded.');
      await FileSystem.downloadAsync(currentUpdate.url, fileUri);
      Alert.alert('Success', 'File downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download the file.');
    }
  };

  if (!status) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={!!status}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <View style={styles.progressContainer}>
                {status.updates.map((_, index) => (
                    <View key={index} style={[styles.progressBar, { backgroundColor: index <= currentIndex ? '#fff' : 'rgba(255,255,255,0.5)' }]} />
                ))}
            </View>
            <View style={styles.userInfo}>
                <Image source={{ uri: status.thumbnail_url }} style={styles.avatar} />
                <Text style={styles.branchName}>{status.branch_name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {isLoading && <ActivityIndicator size="large" color="#fff" style={styles.loader} />}
          {currentUpdate.type === 'image' ? (
            <Image
              source={{ uri: currentUpdate.url }}
              style={styles.media}
              resizeMode="contain"
              onLoadEnd={() => setIsLoading(false)}
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: currentUpdate.url }}
              style={styles.media}
              useNativeControls={false}
              resizeMode="contain"
              isLooping
              onLoad={() => {
                setIsLoading(false);
                videoRef.current?.playAsync();
              }}
            />
          )}
        </View>

        <View style={styles.footer}>
            <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
                <MaterialIcons name="skip-previous" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
                <MaterialIcons name="file-download" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.navButton}>
                <MaterialIcons name="skip-next" size={32} color="#fff" />
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, padding: 10, paddingTop: 20 },
  progressContainer: { flexDirection: 'row', height: 3, marginBottom: 10 },
  progressBar: { flex: 1, height: '100%', borderRadius: 2, marginHorizontal: 2 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  branchName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeButton: { position: 'absolute', top: 25, right: 10 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  media: { width: width, height: height * 0.8 },
  loader: { position: 'absolute' },
  footer: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  navButton: { padding: 10 },
  downloadButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30 },
});