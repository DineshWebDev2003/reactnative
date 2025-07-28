import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Entypo, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import { ActionSheetIOS, Platform } from 'react-native';
import { BASE_URL } from '../config';

export default function KidsActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/get_activities.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activities) setActivities(data.activities);
        else setActivities([]);
        setLoading(false);
      })
      .catch(() => { setActivities([]); setLoading(false); });
  }, []);

  // --- Edit Activity Handler ---
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setEditTitle(activity.title || '');
    setEditDescription(activity.description || '');
  };

  const saveEditActivity = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/update_activity.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingActivity.id,
          title: editTitle,
          description: editDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActivities(acts => 
          acts.map(a => 
            a.id === editingActivity.id 
              ? { ...a, title: editTitle, description: editDescription }
              : a
          )
        );
        setEditingActivity(null);
        setEditTitle('');
        setEditDescription('');
        Alert.alert('Success', 'Activity updated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to update activity');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    }
  };

  // --- View Full Image Handler ---
  const handleViewFullImage = (activity) => {
    if (activity.image_path) {
      setSelectedImage(BASE_URL + '/' + activity.image_path);
      setShowImageModal(true);
    }
  };

  // --- Delete Activity Handler ---
  const handleDeleteActivity = (id) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${BASE_URL}/delete_activity.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          const data = await res.json();
          if (data.success) {
            setActivities(acts => acts.filter(a => a.id !== id));
          } else {
            Alert.alert('Error', data.message || 'Failed to delete activity.');
          }
        } catch (e) {
          Alert.alert('Error', 'Network error.');
        }
      }},
    ]);
  };

  // --- Overflow Menu Handler ---
  const handleOverflow = (activity) => {
    const options = [
      'Edit',
      activity.image_path ? 'View Full Image' : null,
      activity.image_path ? 'Download Image' : null,
      'Share',
      'Delete',
      'Cancel',
    ].filter(Boolean);
    const cancelButtonIndex = options.length - 1;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: options.indexOf('Delete'),
        },
        async (buttonIndex) => {
          if (options[buttonIndex] === 'Edit') {
            handleEditActivity(activity);
          } else if (options[buttonIndex] === 'View Full Image') {
            handleViewFullImage(activity);
          } else if (options[buttonIndex] === 'Download Image') {
            await handleDownloadImage(activity);
          } else if (options[buttonIndex] === 'Share') {
            await handleShare(activity);
          } else if (options[buttonIndex] === 'Delete') {
            handleDeleteActivity(activity.id);
          }
        }
      );
    } else {
      // Android: simple prompt
      Alert.alert('Options', '', [
        { text: 'Edit', onPress: () => handleEditActivity(activity) },
        ...(activity.image_path ? [{ text: 'View Full Image', onPress: () => handleViewFullImage(activity) }] : []),
        ...(activity.image_path ? [{ text: 'Download Image', onPress: () => handleDownloadImage(activity) }] : []),
        { text: 'Share', onPress: () => handleShare(activity) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteActivity(activity.id) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // --- Download Image Handler ---
  const handleDownloadImage = async (activity) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot save image without media library permission.');
        return;
      }
      const uri = BASE_URL + '/' + activity.image_path;
      const fileUri = FileSystem.documentDirectory + (activity.image_path.split('/').pop() || 'activity.jpg');
      await FileSystem.downloadAsync(uri, fileUri);
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('Download', asset, false);
      Alert.alert('Downloaded', 'Image saved to your device gallery.');
    } catch (e) {
      Alert.alert('Error', 'Failed to download image.');
    }
  };

  // --- Share Handler ---
  const handleShare = async (activity) => {
    try {
      let localUri = null;
      if (activity.image_path) {
        const uri = BASE_URL + '/' + activity.image_path;
        const fileUri = FileSystem.cacheDirectory + (activity.image_path.split('/').pop() || 'activity.jpg');
        await FileSystem.downloadAsync(uri, fileUri);
        localUri = fileUri;
      }
      if (localUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, { dialogTitle: 'Share Activity Image' });
      } else {
        // Fallback: copy description to clipboard
        await Clipboard.setStringAsync(activity.description || '');
        Alert.alert('Copied', 'Activity description copied to clipboard.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to share activity.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7fa', padding: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 16 }}>
        <Entypo name="star" size={22} color="#009688" style={{ marginRight: 8 }} />
        <Text style={{ fontWeight: 'bold', fontSize: 22, color: '#009688' }}>Kids Activity Feed</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#009688" style={{ marginTop: 32 }} />
      ) : activities.length === 0 ? (
        <Text style={{ color: '#888', fontSize: 16, marginTop: 32 }}>No activities posted yet.</Text>
      ) : (
        activities.map(activity => (
          <View key={activity.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, shadowColor: '#009688', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3, borderLeftWidth: 5, borderLeftColor: '#a084ca', position: 'relative' }}>
            {/* Overflow Icon - absolutely positioned top right */}
            <TouchableOpacity onPress={() => handleOverflow(activity)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
              <Entypo name="dots-three-vertical" size={20} color="#888" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {activity.image_path && (
                <TouchableOpacity onPress={() => handleViewFullImage(activity)}>
                  <Image source={{ uri: BASE_URL + '/' + activity.image_path }} style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 8 }} resizeMode="cover" />
                </TouchableOpacity>
              )}
              <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#a084ca', marginBottom: 2 }}>{activity.childName || activity.name || 'N/A'}</Text>
              <Text style={{ color: '#009688', fontSize: 13, marginBottom: 2 }}>{activity.branch || 'N/A'}</Text>
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>{activity.created_at ? new Date(activity.created_at).toLocaleString() : ''}</Text>
              <Text style={{ color: '#333', fontSize: 14 }}>{activity.description || ''}</Text>
            </View>
          </View>
        ))
      )}

      {/* Edit Activity Modal */}
      <Modal
        visible={editingActivity !== null}
        animationType="slide"
        onRequestClose={() => setEditingActivity(null)}
      >
        <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Edit Activity</Text>
            <TouchableOpacity onPress={() => setEditingActivity(null)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={{ backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15 }}
            placeholder="Activity Title"
            value={editTitle}
            onChangeText={setEditTitle}
          />
          
          <TextInput
            style={{ backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, minHeight: 100, textAlignVertical: 'top' }}
            placeholder="Activity Description"
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
          />
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#4caf50', padding: 15, borderRadius: 8, alignItems: 'center' }}
              onPress={saveEditActivity}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: '#f44336', padding: 15, borderRadius: 8, alignItems: 'center' }}
              onPress={() => setEditingActivity(null)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Image Modal */}
      <Modal
        visible={showImageModal}
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Activity Image</Text>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity onPress={() => handleShare({ image_path: selectedImage?.replace(BASE_URL + '/', '') })}>
                <MaterialIcons name="share" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={{ flex: 1, width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
} 