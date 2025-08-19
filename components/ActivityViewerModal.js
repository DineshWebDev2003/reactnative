import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const ActivityViewerModal = ({ visible, imageUrl, onClose }) => {
  const handleDownload = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Download is not available on the web.');
      return;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required to save images.');
      return;
    }

    try {
      const fileUri = FileSystem.documentDirectory + imageUrl.split('/').pop();
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
      await MediaLibrary.createAssetAsync(uri);
      Alert.alert('Success', 'Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download image.');
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={32} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: imageUrl }} style={styles.fullscreenImage} resizeMode="contain" />
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <MaterialIcons name="file-download" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 15
  },
});

export default ActivityViewerModal;
