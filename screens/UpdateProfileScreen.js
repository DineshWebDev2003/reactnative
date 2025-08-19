import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function UpdateProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    profilePic: '🧑', // Default emoji for profile picture
  });
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`${BASE_URL}/get_users.php?id=${userId}`);
        const data = await response.json();
        if (data.success && data.users && data.users.length > 0) {
          const user = data.users[0];
          setProfile({
            name: user.name || '',
            email: user.email || '',
            mobile: user.mobile || '',
            profilePic: user.profile_image 
              ? { uri: `${BASE_URL}/${user.profile_image}` }
              : '🧑', // Default emoji for profile picture
          });
        }
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add your profile picture',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateProfile = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('name', profile.name);
      formData.append('email', profile.email);
      formData.append('mobile', profile.mobile);

      if (selectedImage) {
        const imageUri = selectedImage.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('profile_image', {
          uri: imageUri,
          name: filename,
          type: type,
        });
      }

      const response = await fetch(`${BASE_URL}/update_profile.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.log('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.title}>Update Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={showImagePicker} style={styles.imageContainer}>
          <Image 
            source={selectedImage ? { uri: selectedImage.uri } : profile.profilePic} 
            style={styles.profileImage} 
          />
          <View style={styles.imageOverlay}>
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.imageHint}>Tap to change profile picture</Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(text) => setProfile({ ...profile, name: text })}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={profile.email}
            onChangeText={(text) => setProfile({ ...profile, email: text })}
            placeholder="Enter your email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile</Text>
          <TextInput
            style={styles.input}
            value={profile.mobile}
            onChangeText={(text) => setProfile({ ...profile, mobile: text })}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.updateButton, loading && styles.updateButtonDisabled]} 
        onPress={updateProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.updateButtonText}>Update Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1a237e',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    color: '#666',
    fontSize: 14,
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  updateButton: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 