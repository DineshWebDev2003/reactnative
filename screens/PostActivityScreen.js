import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { captureRef } from 'react-native-view-shot';
import { MaterialIcons } from '@expo/vector-icons';

// Use local frame images instead of external URLs
const frameImages = [
  require('../assets/frames/frame1.png'),
  require('../assets/frames/frame2.png'),
  require('../assets/frames/frame3.png'),
  require('../assets/frames/frame4.png'),
  require('../assets/frames/frame5.png'),
  require('../assets/frames/frame6.png'),
];

export default function PostActivityScreen({ navigation }) {
  const [kids, setKids] = useState([]);
  const [selectedKid, setSelectedKid] = useState(null);
  const [image, setImage] = useState(null);
  const [branch, setBranch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kidName, setKidName] = useState('');
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(0);
  const [selectedBgIdx, setSelectedBgIdx] = useState(0);
  const [activityText, setActivityText] = useState('🏃‍♂️ ');
  const postAreaRef = useRef();
  const [teacherBranch, setTeacherBranch] = useState('');
  const [manualBranch, setManualBranch] = useState('');

  const [publishing, setPublishing] = useState(false);
  const [activityName, setActivityName] = useState('🏃‍♂️ ');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    AsyncStorage.getItem('userId').then(userId => {
      console.log('👤 Teacher User ID:', userId);
      if (!userId) return;
      // Try both APIs for robustness
      fetch(`${BASE_URL}/get_students_for_teacher.php?teacher_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log('📚 Students API Response:', data);
          if (data.success && data.students && Array.isArray(data.students) && data.students.length > 0) {
            setKids(data.students.filter(item => item != null));
          } else {
            // fallback to parents API
            fetch(`${BASE_URL}/get_parents_for_teacher.php?teacher_id=${userId}`)
              .then(res => res.json())
              .then(data2 => {
                console.log('👨‍👩‍👧‍👦 Parents API Response:', data2);
                if (data2.success && data2.parents && Array.isArray(data2.parents)) {
                  setKids(data2.parents.filter(item => item != null));
                } else {
                  setKids([]);
                }
              });
          }
        });
    });
    
    // Load teacher's branch from API
    AsyncStorage.getItem('userId').then(userId => {
      if (userId) {
        // Fetch teacher's profile to get assigned branch
        fetch(`${BASE_URL}/get_teacher_profile.php?teacher_id=${userId}`)
          .then(res => res.json())
          .then(data => {
            console.log('👨‍🏫 Teacher Profile Response:', data);
            if (data.success && data.teacher && data.teacher.branch) {
              const teacherBranch = data.teacher.branch;
              setTeacherBranch(teacherBranch);
              setBranch(teacherBranch);
              console.log('✅ Teacher branch set from API:', teacherBranch);
            } else {
              console.log('❌ No branch found in teacher profile, trying AsyncStorage');
              // Fallback to AsyncStorage
              AsyncStorage.getItem('branch').then(branch => {
                if (branch) {
                  setTeacherBranch(branch);
                  setBranch(branch);
                  console.log('✅ Teacher branch set from AsyncStorage:', branch);
                } else {
                  console.log('❌ No branch found anywhere');
                }
              });
            }
          })
          .catch(error => {
            console.log('❌ Error fetching teacher profile:', error);
            // Fallback to AsyncStorage
            AsyncStorage.getItem('branch').then(branch => {
              if (branch) {
                setTeacherBranch(branch);
                setBranch(branch);
                console.log('✅ Teacher branch set from AsyncStorage fallback:', branch);
              }
            });
          });
      }
    });
  }, []);

  // Set branch from selected kid or fallback to teacher's branch
  useEffect(() => {
    console.log('🔄 Branch selection logic - selectedKid:', selectedKid?.name, 'teacherBranch:', teacherBranch);
    if (selectedKid) {
      // Priority: kid's branch data first
      if (selectedKid.branch && selectedKid.branch.trim()) {
        console.log('✅ Using kid.branch:', selectedKid.branch);
        setBranch(selectedKid.branch.trim());
      } else if (selectedKid.branch_name && selectedKid.branch_name.trim()) {
        console.log('✅ Using kid.branch_name:', selectedKid.branch_name);
        setBranch(selectedKid.branch_name.trim());
      } else if (selectedKid.class_branch && selectedKid.class_branch.trim()) {
        console.log('✅ Using kid.class_branch:', selectedKid.class_branch);
        setBranch(selectedKid.class_branch.trim());
      } else if (teacherBranch && teacherBranch.trim()) {
        console.log('✅ Using teacherBranch as fallback:', teacherBranch);
        setBranch(teacherBranch.trim());
      } else {
        console.log('❌ No branch data available from kid or teacher');
      }
    } else if (teacherBranch && teacherBranch.trim()) {
      console.log('✅ Using teacherBranch (no kid selected):', teacherBranch);
      setBranch(teacherBranch.trim());
    }
  }, [selectedKid, teacherBranch]);

  // Auto-set branch when teacher branch is loaded
  useEffect(() => {
    if (teacherBranch && !branch) {
      setBranch(teacherBranch);
    }
  }, [teacherBranch, branch]);

  // Auto-set branch immediately when teacher branch is available
  useEffect(() => {
    if (teacherBranch) {
      setBranch(teacherBranch);
    }
  }, [teacherBranch]);
  // Debug log for branch value
  console.log('📍 Current Branch State:', branch);
  console.log('📍 Current Teacher Branch:', teacherBranch);
  console.log('📍 Selected Kid:', selectedKid?.name || 'None');

  // Function to fetch activities
  const fetchActivities = () => {
    AsyncStorage.getItem('userId').then(userId => {
      if (!userId) {
        console.log('❌ No user ID found for fetching activities');
        return;
      }

      setLoadingActivities(true);
      // Fetch activities using teacher_id for better accuracy
      fetch(`${BASE_URL}/get_activities.php?teacher_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log('📚 Activities for Teacher Response:', data);
          if (data.success && data.activities && Array.isArray(data.activities)) {
            setActivities(data.activities.filter(item => item != null));
          } else {
            // If it fails or returns no activities, you might want to log it or handle it
            console.log('No activities found for this teacher or API error:', data.message);
            setActivities([]);
          }
        })
        .catch(error => {
          console.log('❌ Error fetching activities by teacher_id:', error);
          setActivities([]);
        })
        .finally(() => setLoadingActivities(false));
    });
  };

  // Fetch activities for all kids assigned to teacher
  useEffect(() => {
    fetchActivities();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permission to select images.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5], // Only allow 4:5 ratio
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permission to take photos.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5], // Only allow 4:5 ratio
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleKidSelect = (item) => {
    if (!item) {
      console.log('❌ handleKidSelect: item is null or undefined');
      return;
    }
    
    console.log('👶 Kid selected:', item);
    console.log('👶 Kid branch data:', {
      branch: item.branch,
      branch_name: item.branch_name,
      class_branch: item.class_branch
    });
    setSelectedKid(item);
    setKidName(item.childName || item.name || '');
    
    // Immediately set branch from kid's data
    if (item.branch) {
      console.log('✅ Setting branch from kid.branch:', item.branch);
      setBranch(item.branch);
    } else if (item.branch_name) {
      console.log('✅ Setting branch from kid.branch_name:', item.branch_name);
      setBranch(item.branch_name);
    } else if (item.class_branch) {
      console.log('✅ Setting branch from kid.class_branch:', item.class_branch);
      setBranch(item.class_branch);
    } else {
      console.log('❌ No branch data in kid, keeping current branch:', branch);
    }
  };

    const handleSubmit = async () => {
    if (!selectedKid) {
      Alert.alert('Error', 'Please select a kid first.');
      return;
    }
    if (!image) {
      Alert.alert('Error', 'Please select or take a photo first.');
      return;
    }
    if (!branch.trim()) {
      Alert.alert('Error', 'Please enter a branch name.');
      return;
    }

    setPublishing(true);
    try {
      // Capture the overlay area with all overlays
      const uri = await captureRef(postAreaRef, { format: 'jpg', quality: 0.95, width: Dimensions.get('window').width });
      if (!uri) {
        throw new Error('Failed to capture overlay image');
      }

      const formData = new FormData();
      formData.append('kid_id', selectedKid.id.toString());
      formData.append('branch', branch.trim());
      formData.append('frame', `frame${selectedBgIdx + 1}`);
      formData.append('activity_text', activityName || '🏃‍♂️ Activity');
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'activity.jpg',
      });

      console.log('📤 Submitting activity with data:', {
        kid_id: selectedKid.id,
        branch: branch.trim(),
        frame: `frame${selectedBgIdx + 1}`,
        image: image
      });

      let res = await fetch(`${BASE_URL}/post_activity.php`, { 
        method: 'POST', 
        body: formData,
        headers: { 
          'Content-Type': 'multipart/form-data' 
        } 
      });
      
      console.log('📥 Response status:', res.status);
      let data = await res.json();
      console.log('📥 Response data:', data);
      
      if (data.success) {
        Alert.alert('Success', 'Activity published successfully!');
        setImage(null);
        setKidName('');
        setActivityName('');
        setActivityDate(new Date().toISOString().slice(0, 10));
        setSelectedKid(null);
        setSelectedBgIdx(0); // Reset frame selection
        setActivityText('🏃‍♂️ '); // Reset activity text
        // Refresh activities list
        fetchActivities();
      } else {
        console.log('❌ Activity submission failed:', data);
        Alert.alert('Error', data.message || 'Failed to publish activity');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Failed to publish activity. Please check your internet connection and try again.');
    } finally {
      setPublishing(false);
    }
  };

  const renderActivityCard = ({ item }) => {
    // Add null checking for item
    if (!item) {
      console.log('❌ renderActivityCard: item is null or undefined');
      return null;
    }
    
    return (
    <View style={styles.activityCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.activityDate}>{new Date(item.created_at || Date.now()).toLocaleDateString()}</Text>
          <Text style={styles.activityTime}>{new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 22, marginRight: 6 }}>{(item.activity_text && item.activity_text.match(/^\p{Emoji}/u)) ? '' : '🏃‍♂️'}</Text>
        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{item.activity_text || '🏃‍♂️ Activity'}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, color: '#a084ca', fontWeight: 'bold' }}>📍 {item.branch || 'Unknown Branch'}</Text>
        <Text style={{ fontSize: 16, marginLeft: 10, color: '#333' }}>🧒 {item.childName || 'Unknown Kid'}</Text>
      </View>
      {item.image_path && (
        <View style={{ marginBottom: 8 }}>
          <Image 
            source={{ uri: `${BASE_URL}/${item.image_path}` }}
            style={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              resizeMode: 'cover',
            }}
            onError={(error) => {
              console.log('❌ Error loading activity image:', error);
            }}
          />
        </View>
      )}
      <Text style={styles.activityFrame}>Frame: {item.frame || 'Default'}</Text>
    </View>
  );
  };

  const logoImage = require('../assets/logo.png'); // Adjust path if needed
  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Daily Activity</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={[styles.label, { fontSize: 16, marginBottom: 4 }]}>👦 Select Kid</Text>
        <View style={{ backgroundColor: '#f8f8fa', borderRadius: 16, padding: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
          <FlatList
            data={kids.filter(item => item != null)}
            horizontal
            keyExtractor={item => item && item.id ? item.id.toString() : Math.random().toString()}
            renderItem={({ item }) => {
              if (!item) return null;
              return (
                <TouchableOpacity
                  onPress={() => handleKidSelect(item)}
                  style={[
                    styles.kidItem,
                    selectedKid?.id === item.id && styles.kidItemSelected,
                    {
                      minWidth: 72,
                      minHeight: 96,
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      borderWidth: selectedKid?.id === item.id ? 2 : 1,
                      borderColor: selectedKid?.id === item.id ? '#4CAF50' : '#eee',
                      marginHorizontal: 6,
                      padding: 6,
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      shadowColor: selectedKid?.id === item.id ? '#4CAF50' : '#000',
                      shadowOpacity: selectedKid?.id === item.id ? 0.10 : 0.04,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 4,
                      elevation: selectedKid?.id === item.id ? 3 : 1,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Image
                    source={
                      item.child_photo && item.child_photo !== 'null' && item.child_photo !== ''
                        ? { uri: `${BASE_URL}/${item.child_photo}` }
                        : require('../assets/Avartar.png')
                    }
                    style={{ width: 56, height: 56, borderRadius: 28, marginBottom: 6, borderWidth: selectedKid?.id === item.id ? 2 : 0, borderColor: '#4CAF50', backgroundColor: '#f0f0f0' }}
                  />
                  <Text style={[styles.kidName, { maxWidth: 64 }]} numberOfLines={1} ellipsizeMode="tail">{item.childName || item.name || 'Unknown'}</Text>
                </TouchableOpacity>
              );
            }}
            style={{ minHeight: 110 }}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 }}
            showsHorizontalScrollIndicator={false}
          />
        </View>
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
        
        {/* Activity Name Input */}
        <View style={{marginBottom: 12}}>
          <Text style={styles.label}>Activity Name</Text>
          <TextInput
            value={activityName}
            onChangeText={setActivityName}
            style={styles.nameInput}
            placeholder="🏃‍♂️ Enter activity name (e.g., Running race)"
          />
        </View>
        
                 {/* Activity Date Input */}
         <View style={{marginBottom: 12}}>
          <Text style={styles.label}>Activity Date</Text>
          <TextInput
            value={activityDate}
            onChangeText={setActivityDate}
            style={styles.nameInput}
            placeholder="YYYY-MM-DD"
          />
        </View>
        
        {/* Manual Branch Input (Fallback) */}
        <View style={{marginBottom: 12}}>
          <Text style={styles.label}>Branch Name (Auto-filled from teacher's assigned branch)</Text>
          <TextInput
            value={branch}
            onChangeText={setBranch}
            style={styles.nameInput}
            placeholder="Enter branch name if not auto-filled"
          />
        </View>
       
        <Text style={styles.label}>Select/Upload Image</Text>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}><Text style={styles.imageButtonText}>Pick Image</Text></TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}><Text style={styles.imageButtonText}>Take Photo</Text></TouchableOpacity>
        </View>

        <Text style={styles.label}>Select Frame</Text>
        {/* Selectable background images row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {frameImages.map((img, idx) => (
              <TouchableOpacity key={idx} onPress={() => setSelectedBgIdx(idx)}>
                <Image
                  source={img}
                  style={{
                    width: 120, // 4:3 ratio (120/90 = 4/3)
                    height: 90,
                    marginHorizontal: 6,
                    borderWidth: selectedBgIdx === idx ? 3 : 0,
                    borderColor: selectedBgIdx === idx ? '#4CAF50' : 'transparent',
                    borderRadius: 10,
                  }}
                />
              </TouchableOpacity>
            ))}
                     </ScrollView>
           
           {/* Post area with dynamic aspect ratio */}
         <View
           ref={postAreaRef}
           collapsable={false}
           style={{
             width: '100%', // Full screen width
             aspectRatio: 4/5, // Maintain 4:5 ratio, but fill width
             maxWidth: 400, // Optional: limit max width for tablets
             height: undefined, // Let aspectRatio control height
             borderRadius: 0, // Remove border radius for full fit
             marginBottom: 16,
             position: 'relative',
             overflow: 'hidden',
             alignSelf: 'stretch', // Stretch to container
             backgroundColor: 'transparent',
           }}
         >
          {/* Frame background */}
          <Image
            source={frameImages[selectedBgIdx]}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
          {/* Branch Name - Top Left */}
          <Text style={{
            position: 'absolute', top: 16, left: 16, fontSize: 14, fontWeight: 'bold', color: '#fff',
            textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
            backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: 120,
          }}>{branch || 'Branch Name'}</Text>
          {/* TN HappyKids - Top Right */}
          <Text style={{
            position: 'absolute', top: 16, right: 16, fontSize: 14, fontWeight: 'bold', color: '#fff',
            textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
            backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: 120,
          }}>TN HappyKids</Text>
          {/* Activity Name - Below TN HappyKids */}
          {activityName && (
            <Text style={{
              position: 'absolute', top: 50, right: 16, fontSize: 12, fontWeight: 'bold', color: '#fff',
              textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: 120,
            }}>{activityName}</Text>
          )}
          {/* Activity Date - Below Branch Name */}
          {activityDate && (
            <Text style={{
              position: 'absolute', top: 50, left: 16, fontSize: 12, color: '#fff', fontWeight: 'bold',
              textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
            }}>{new Date(activityDate).toLocaleDateString()}</Text>
          )}
          {/* Picked image overlay - Centered, 4:5 ratio */}
          {image && (
            <Image
              source={{ uri: image }}
              style={{
                position: 'absolute',
                width: 192, // 4:5 ratio (192x240)
                height: 240,
                top: 80,
                left: 64,
                borderRadius: 20,
                borderWidth: 4,
                borderColor: '#fff',
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
              resizeMode="cover"
            />
          )}
          {/* Logo - Bottom Left */}
          <Image
            source={logoImage}
            style={{
              position: 'absolute', bottom: 16, left: 16, width: 40, height: 40, resizeMode: 'contain',
              backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: 4,
            }}
          />
          {/* Kid name - Bottom Right */}
          <Text style={{
            position: 'absolute', bottom: 16, right: 16, fontSize: 16, fontWeight: 'bold', color: '#fff',
            textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2,
            backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, maxWidth: 120,
          }}>{kidName || 'Kid Name'}</Text>
        </View>
        

        
        {/* Publish Button */}
        <TouchableOpacity
          style={[styles.publishButton, publishing && styles.publishButtonDisabled]}
          onPress={handleSubmit}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="publish" size={20} color="#fff" />
          )}
          <Text style={styles.publishButtonText}>
            {publishing ? 'Publishing...' : 'Publish Activity'}
          </Text>
        </TouchableOpacity>
                 {/* Recent activities */}
         <View style={{ marginTop: 20 }}>
           <Text style={styles.label}>Recent Activities (All Kids)</Text>
            {loadingActivities ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : activities && activities.length > 0 ? (
              <FlatList
                data={activities.slice(0, 5).filter(item => item != null)}
                renderItem={renderActivityCard}
                keyExtractor={item => item && item.id ? item.id.toString() : Math.random().toString()}
                scrollEnabled={false}
                ListEmptyComponent={() => (
                  <Text style={{ color: '#888', textAlign: 'center' }}>No recent activities</Text>
                )}
              />
            ) : (
              <Text style={{ color: '#888', textAlign: 'center' }}>No recent activities</Text>
            )}
          </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  kidItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kidItemSelected: {
    backgroundColor: '#f0f8f0',
  },
  kidPhoto: {
    fontSize: 24,
  },
  kidName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  imageButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  activityKid: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
     activityText: {
     fontSize: 14,
     color: '#666',
   },
   activityTime: {
     fontSize: 12,
     color: '#888',
   },
   activityBranch: {
     fontSize: 12,
     color: '#666',
   },
   viewImageText: {
     fontSize: 14,
     color: '#4CAF50',
     fontWeight: 'bold',
   },
   activityFrame: {
     fontSize: 12,
     color: '#999',
     fontStyle: 'italic',
   },

  publishButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 