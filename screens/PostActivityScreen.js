import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { captureRef } from 'react-native-view-shot';

// Remove all references to require('../assets/frame_animals.png'), require('../assets/frame_toys.png'), require('../assets/frame_clouds.png'), require('../assets/frame_garden.png')
// Remove any KIDS_BACKGROUNDS array or similar variables
// Only use styled View backgrounds and emoji/icons for frames
// Remove the FRAMES array and all related code
// Only use the frameImages array for static banners
const frameImages = [
  require('../assets/1.png'),
  require('../assets/2.png'),
  require('../assets/3.png'),
  require('../assets/4.png'),
  require('../assets/5.png'),
  require('../assets/6.png'),
];

export default function PostActivityScreen({ navigation }) {
  const [kids, setKids] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);
  const [image, setImage] = useState(null);
  // Remove all state and logic related to FRAMES, selectedFrame, and frame selection
  // Only show a static banner using your placed image
  const [branch, setBranch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kidName, setKidName] = useState('');
  // Add state for activities and loading
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(0);
  const [selectedBgIdx, setSelectedBgIdx] = useState(0);
  const [activityText, setActivityText] = useState('');
  const postAreaRef = useRef();
  const [teacherBranch, setTeacherBranch] = useState('');
  const [manualBranch, setManualBranch] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userId').then(userId => {
      if (!userId) return;
      // Try both APIs for robustness
      fetch(`${BASE_URL}/get_students_for_teacher.php?teacher_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.students && data.students.length > 0) {
            setKids(data.students);
          } else {
            // fallback to parents API
            fetch(`${BASE_URL}/get_parents_for_teacher.php?teacher_id=${userId}`)
              .then(res => res.json())
              .then(data2 => {
                if (data2.success && data2.parents) {
                  setKids(data2.parents);
                } else {
                  setKids([]);
                }
              });
          }
        });
    });
    AsyncStorage.getItem('branch').then(branch => {
      if (branch) setTeacherBranch(branch);
    });
  }, []);

  // Set branch from selected kid or fallback to teacher's branch
  useEffect(() => {
    if (selectedKid) {
      if (selectedKid.branch) setBranch(selectedKid.branch);
      else if (selectedKid.branch_name) setBranch(selectedKid.branch_name);
      else if (selectedKid.class_branch) setBranch(selectedKid.class_branch);
      else if (teacherBranch) setBranch(teacherBranch);
    } else if (teacherBranch) {
      setBranch(teacherBranch);
    }
  }, [selectedKid, teacherBranch]);
  // Debug log for branch value
  console.log('Branch:', branch);
  // Debug log for selectedKid
  console.log('SelectedKid:', selectedKid);

  // Fetch activities for selected kid
  useEffect(() => {
    if (!selectedKid) return;
    setLoadingActivities(true);
    fetch(`${BASE_URL}/get_activities.php?kid_id=${selectedKid.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activities) setActivities(data.activities);
        else setActivities([]);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
  }, [selectedKid]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to select images.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera permissions to take a photo.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleKidSelect = (item) => {
    setSelectedKid(item);
    setKidName(item.childName || item.name || '');
    console.log('Selected kid:', item);
  };

  const handleSubmit = async () => {
    if (!selectedKid) {
      Alert.alert('Select a Kid', 'Please select a kid before posting.');
      return;
    }
    if (!activityText) {
      Alert.alert('Error', 'Please enter an activity description.');
      return;
    }
    setSubmitting(true);
    try {
      // Capture the post area as an image
      const uri = await captureRef(postAreaRef, { format: 'png', quality: 1 });
      let formData = new FormData();
      formData.append('kid_id', selectedKid.id);
      formData.append('branch', branch);
      formData.append('image', { uri, name: 'activity.png', type: 'image/png' });
      formData.append('description', activityText);
      let res = await fetch(`${BASE_URL}/post_activity.php`, { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
      let data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'Activity posted successfully!');
        setImage(null);
        setActivityText('');
      } else {
        Alert.alert('Error', data.message || 'Failed to post activity.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to capture or upload activity image.');
    } finally {
      setSubmitting(false);
    }
  };

  // Instagram-style card renderer
  const renderActivityCard = ({ item }) => {
    // 4:3 aspect ratio
    const cardWidth = 300;
    const cardHeight = 225;
    const imageSource = item.image_path ? { uri: BASE_URL + '/' + item.image_path } : require('../assets/Avartar.png');
    return (
      <View style={[styles.activityCard, { width: cardWidth, height: cardHeight }]}>
        <Image source={imageSource} style={styles.activityImage} resizeMode="cover" />
        {/* Frame overlay if present */}
        {item.frame && <Image source={{ uri: item.frame }} style={styles.activityFrame} resizeMode="cover" />}
        {/* Activity time badge */}
        {item.activity_time && (
          <View style={styles.activityBadge}>
            <Text style={styles.activityBadgeText}>{item.activity_time}</Text>
          </View>
        )}
        {/* Overlay bar for name/branch/class */}
        <View style={styles.activityOverlay}>
          <Text style={styles.activityKidName}>{item.childName || item.kid_name || ''}</Text>
          <Text style={styles.activityBranch}>{item.branch || ''}</Text>
          <Text style={styles.activityClass}>{item.childClass || ''}</Text>
        </View>
        {/* Description and date/time */}
        <View style={styles.activityDescBar}>
          {item.description ? <Text style={styles.activityDesc}>{item.description}</Text> : null}
          <Text style={styles.activityDate}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
        </View>
      </View>
    );
  };

  // Remove the FrameTemplate function
  // Remove the frame selection row (thumbnails)
  // Only display the banner using the first frame image as a static banner
  const logoImage = require('../assets/logo.png'); // Adjust path if needed
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={styles.title}>Post Daily Activity</Text>
      <Text style={styles.label}>Select Kid</Text>
      <>
        {kids.length === 0 ? (
          <Text style={{ color: '#888', textAlign: 'center', marginVertical: 16 }}>No kids assigned to you yet.</Text>
        ) : (
          <FlatList
            data={kids}
            horizontal
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleKidSelect(item)}
                style={[
                  styles.kidItem,
                  selectedKid?.id === item.id && styles.kidItemSelected,
                  { minWidth: 72, minHeight: 72, justifyContent: 'center', alignItems: 'center', borderWidth: selectedKid?.id === item.id ? 2 : 1, borderColor: selectedKid?.id === item.id ? '#a084ca' : '#eee' }
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.kidPhoto}>🧒</Text>
                <Text style={styles.kidName}>{item.childName || item.name}</Text>
              </TouchableOpacity>
            )}
            style={{ marginBottom: 12, minHeight: 90 }}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </>
      {selectedKid && (
        <View style={{marginBottom: 12}}>
          <Text style={styles.label}>Edit Kid Name</Text>
          <TextInput
            value={kidName}
            onChangeText={setKidName}
            style={styles.nameInput}
            placeholder="Enter kid's name"
          />
        </View>
      )}
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#e75480',
          borderRadius: 10,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
          backgroundColor: '#fff',
        }}
        placeholder="Enter branch name (optional)"
        value={manualBranch}
        onChangeText={setManualBranch}
      />
      <Text style={styles.label}>Select/Upload Image</Text>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}><Text>Pick Image</Text></TouchableOpacity>
        <TouchableOpacity style={styles.imageButton} onPress={takePhoto}><Text>Take Photo</Text></TouchableOpacity>
      </View>
      {image && (
        <Image source={{ uri: image }} style={{ width: 200, height: 200, borderRadius: 12, marginVertical: 10 }} />
      )}
      {/* Selectable background images row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {frameImages.map((img, idx) => (
          <TouchableOpacity key={idx} onPress={() => setSelectedBgIdx(idx)}>
            <Image
              source={img}
              style={{
                width: 48,
                height: 48,
                marginHorizontal: 6,
                borderWidth: selectedBgIdx === idx ? 3 : 0,
                borderColor: selectedBgIdx === idx ? '#e75480' : 'transparent',
                borderRadius: 10,
              }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Post area with selected background */}
      <View
        ref={postAreaRef}
        style={{ width: 320, height: 240, borderRadius: 16, marginBottom: 16, position: 'relative', overflow: 'hidden', alignSelf: 'center', backgroundColor: '#fff' }}
      >
        {/* Background image (4:3 ratio) */}
        <Image
          source={frameImages[selectedBgIdx]}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            zIndex: 0,
          }}
        />
        {/* Picked image (large, centered) */}
        {image && (
          <Image
            source={{ uri: image }}
            style={{
              position: 'absolute',
              width: 160,
              height: 160,
              top: 40,
              left: 80,
              borderRadius: 24,
              borderWidth: 4,
              borderColor: '#fff',
              zIndex: 1,
              backgroundColor: '#fff',
            }}
            resizeMode="cover"
          />
        )}
        {/* Logo (top left, moved down, higher zIndex) */}
        <Image
          source={logoImage}
          style={{ position: 'absolute', top: 32, left: 12, width: 40, height: 40, borderRadius: 8, zIndex: 10, backgroundColor: '#fff' }}
          resizeMode="contain"
        />
        {/* TN HappyKids Playschool (top center) */}
        <Text style={{ position: 'absolute', top: 18, left: 0, right: 0, textAlign: 'center', color: '#e75480', fontWeight: 'bold', fontSize: 16, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, paddingHorizontal: 8, zIndex: 2 }}>TN HappyKids Playschool</Text>
        {/* Branch name (centered, under TN HappyKids Playschool) */}
        <Text style={{ position: 'absolute', top: 46, left: 0, right: 0, textAlign: 'center', color: '#e75480', fontWeight: 'bold', fontSize: 15, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, paddingHorizontal: 8, zIndex: 2 }}>{manualBranch || branch || 'No Branch'}</Text>
        {/* Kid name (bottom left) */}
        <Text style={{ position: 'absolute', bottom: 18, left: 16, color: '#009688', fontWeight: 'bold', fontSize: 16, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, paddingHorizontal: 8, zIndex: 2 }}>{selectedKid ? selectedKid.childName : ''}</Text>
        {/* Activity name (bottom right) */}
        <Text style={{ position: 'absolute', bottom: 18, right: 16, color: '#a084ca', fontWeight: 'bold', fontSize: 16, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, paddingHorizontal: 8, zIndex: 2 }}>{activityText}</Text>
      </View>
      {/* Activity description input */}
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#e75480',
          borderRadius: 10,
          padding: 12,
          fontSize: 16,
          marginBottom: 18,
          backgroundColor: '#fff',
        }}
        placeholder="What activity?"
        value={activityText}
        onChangeText={setActivityText}
        multiline
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitButtonText}>{submitting ? 'Posting...' : 'Post Activity'}</Text>
      </TouchableOpacity>
      <Text style={styles.feedTitle}>Activity Feed</Text>
      {loadingActivities ? (
        <ActivityIndicator color="#a084ca" style={{ marginTop: 20 }} />
      ) : activities.length === 0 ? (
        <Text style={{ color: '#888', textAlign: 'center', marginVertical: 16 }}>No activities posted yet for this kid.</Text>
      ) : (
        <FlatList
          data={[...activities].reverse()} // most recent first
          renderItem={renderActivityCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 24 }}
          style={{ marginTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontWeight: 'bold', fontSize: 22, color: '#a084ca', marginBottom: 16, textAlign: 'center' },
  label: { fontWeight: 'bold', fontSize: 16, color: '#6c3483', marginBottom: 6 },
  kidItem: { alignItems: 'center', marginRight: 12, padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  kidItemSelected: { borderColor: '#a084ca', backgroundColor: '#f3e8ff' },
  kidPhoto: { width: 48, height: 48, borderRadius: 24, marginBottom: 4, backgroundColor: '#eee' },
  kidName: { fontSize: 13, color: '#333' },
  imageButton: { backgroundColor: '#e9d6f7', padding: 10, borderRadius: 8, marginRight: 8 },
  previewContainer: { alignItems: 'center', marginBottom: 12, position: 'relative' },
  previewImage: { width: 220, height: 220, borderRadius: 16 },
  frameOverlay: { position: 'absolute', width: 220, height: 220, borderRadius: 16, opacity: 0.7 },
  banner: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#a084ca', padding: 6, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  bannerText: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  frameItem: { marginRight: 10, borderWidth: 2, borderColor: '#eee', borderRadius: 8, padding: 2 },
  frameItemSelected: { borderColor: '#a084ca' },
  frameThumb: { width: 48, height: 48, borderRadius: 8 },
  submitButton: { backgroundColor: '#a084ca', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  nameInput: { backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#eee', fontSize: 16, marginBottom: 4 },
  nameOverlay: { position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' },
  nameOverlayText: { color: '#fff', fontWeight: 'bold', fontSize: 18, backgroundColor: 'rgba(160,132,202,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  activityImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  activityFrame: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18,
    opacity: 0.7,
    top: 0,
    left: 0,
  },
  activityBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#a084caee',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 2,
  },
  activityBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  activityOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 38,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  activityKidName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activityBranch: {
    color: '#e0d7f7',
    fontSize: 12,
  },
  activityClass: {
    color: '#f7b2ff',
    fontSize: 12,
  },
  activityDescBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  activityDesc: {
    color: '#6c3483',
    fontSize: 13,
    marginBottom: 2,
  },
  activityDate: {
    color: '#888',
    fontSize: 11,
    textAlign: 'right',
  },
  feedTitle: {
    fontWeight: 'bold',
    color: '#a084ca',
    fontSize: 18,
    marginBottom: 10,
    marginTop: 18,
  },
}); 