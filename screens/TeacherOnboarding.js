import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, TextInput, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../config';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function TeacherOnboarding() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};
  
  const [profilePic, setProfilePic] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfilePic(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfilePic(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!profilePic) {
      Alert.alert('Profile Picture Required', 'Please upload your profile picture to continue.');
      return;
    }
    if (!teacherName.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!branch.trim()) {
      Alert.alert('Branch Required', 'Please enter your assigned branch.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('teacherName', teacherName.trim());
      formData.append('branch', branch.trim());
      formData.append('profilePic', {
        uri: profilePic.uri,
        type: 'image/jpeg',
        name: 'teacher_profile.jpg',
      });
      console.log('Submitting to:', `${BASE_URL}/teacher_onboarding.php`);
      // Log FormData keys and values for debugging
      for (let pair of formData._parts || []) {
        console.log('FormData:', pair[0], pair[1]);
      }
      const response = await fetch(`${BASE_URL}/teacher_onboarding.php`, {
        method: 'POST',
        body: formData,
        // Do NOT set headers here! Let fetch set the Content-Type with the correct boundary.
      });
      const raw = await response.text();
      console.log('RAW RESPONSE:', raw);
      const data = JSON.parse(raw);
      if (data.success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.replace('TeacherDashboard') }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.log('Network error:', error);
      Alert.alert('Network Error', 'Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Teacher Profile Setup</Text>
            <Text style={styles.subtitle}>Complete your profile to access the dashboard</Text>
          </View>

          {/* Profile Picture Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Picture</Text>
            <View style={styles.profileContainer}>
              {profilePic ? (
                <Image source={{ uri: profilePic.uri }} style={styles.profilePic} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <MaterialIcons name="person" size={60} color="#a084ca" />
                  <Text style={styles.placeholderText}>Upload Profile Picture</Text>
                </View>
              )}
            </View>
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <MaterialIcons name="photo-library" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <MaterialIcons name="camera-alt" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Teacher Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teacher Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={teacherName}
              onChangeText={setTeacherName}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your assigned branch"
              value={branch}
              onChangeText={setBranch}
              placeholderTextColor="#999"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Updating Profile...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3e8ff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3e8ff',
  },
  content: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    minHeight: Dimensions.get('window').height - 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c3483',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#a084ca',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 15,
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  profilePic: {
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: (width * 0.32) / 2,
    borderWidth: 3,
    borderColor: '#a084ca',
    marginBottom: 8,
  },
  placeholderContainer: {
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: (width * 0.32) / 2,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a084ca',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#a084ca',
    textAlign: 'center',
    marginTop: 5,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a084ca',
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '100%',
    maxWidth: 400,
  },
  submitButton: {
    backgroundColor: '#a084ca',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#a084ca',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 