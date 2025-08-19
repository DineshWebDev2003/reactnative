import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Animated, Dimensions, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BASE_URL } from '../config';

const stepLabels = [
  'Step 1',
  'Step 2',
  'Step 3',
  'Step 4',
  'Step 5',
];

export default function ParentOnboarding({ navigation, route }) {
  const [step, setStep] = useState(0);
  const [childPhoto, setChildPhoto] = useState(null);
  const [fatherPhoto, setFatherPhoto] = useState(null);
  const [motherPhoto, setMotherPhoto] = useState(null);
  const [guardianPhoto, setGuardianPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const userId = route?.params?.userId;

  // NEW caretaker names
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianName, setGuardianName] = useState('');

  const pickImage = async (setter) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setter(result.assets[0]);
    }
  };

  const uploadImages = async () => {
    if (!childPhoto || !fatherPhoto || !motherPhoto || !guardianPhoto) {
      Alert.alert('Error', 'Please upload all required photos.');
      return;
    }
    if (!fatherName || !motherName || !guardianName) {
      Alert.alert('Error', 'Please enter all caretaker names.');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'Missing user id.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('child_photo', {
      uri: childPhoto.uri,
      name: 'child.jpg',
      type: 'image/jpeg',
    });
    formData.append('father_photo', {
      uri: fatherPhoto.uri,
      name: 'father.jpg',
      type: 'image/jpeg',
    });
    formData.append('mother_photo', {
      uri: motherPhoto.uri,
      name: 'mother.jpg',
      type: 'image/jpeg',
    });
    formData.append('guardian_photo', {
      uri: guardianPhoto.uri,
      name: 'guardian.jpg',
      type: 'image/jpeg',
    });
    // append names
    formData.append('father_name', fatherName);
    formData.append('mother_name', motherName);
    formData.append('guardian_name', guardianName);
    try {
      const response = await fetch(`${BASE_URL}/parent_onboarding.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await response.json();
      setLoading(false);
      if (data.success) {
        Alert.alert('Success', 'Onboarding complete!');
        navigation.replace('ParentDashboard');
      } else {
        Alert.alert('Error', data.message || 'Upload failed.');
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Network error.');
    }
  };

  // Step content
  const stepContent = [
    {
      label: "Let's start with your child's photo!",
      icon: <MaterialCommunityIcons name="baby-face-outline" size={60} color="#FFB300" />,
      image: childPhoto,
      onPick: () => pickImage(setChildPhoto),
      next: () => childPhoto ? setStep(1) : Alert.alert('Please upload child photo.'),
    },
    {
      label: "Now, upload father's photo!",
      icon: <FontAwesome5 name="male" size={60} color="#42A5F5" />,
      image: fatherPhoto,
      onPick: () => pickImage(setFatherPhoto),
      next: () => fatherPhoto ? setStep(2) : Alert.alert('Please upload father photo.'),
      prev: () => setStep(0),
    },
    {
      label: "Next, upload mother's photo!",
      icon: <FontAwesome5 name="female" size={60} color="#E57373" />,
      image: motherPhoto,
      onPick: () => pickImage(setMotherPhoto),
      next: () => motherPhoto ? setStep(3) : Alert.alert('Please upload mother photo.'),
      prev: () => setStep(1),
    },
    {
      label: "Finally, upload guardian's photo!",
      icon: <Ionicons name="person" size={60} color="#66BB6A" />,
      image: guardianPhoto,
      onPick: () => pickImage(setGuardianPhoto),
      next: () => guardianPhoto ? setStep(4) : Alert.alert('Please upload guardian photo.'),
      prev: () => setStep(2),
    },
    {
      label: "All set! Confirm and upload.",
      icon: <MaterialCommunityIcons name="check-circle-outline" size={60} color="#AB47BC" />,
      prev: () => setStep(3),
      confirm: uploadImages,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Progress Stepper */}
      <View style={styles.progressContainer}>
        {stepLabels.map((label, i) => (
          <View key={i} style={styles.progressStepWrapper}>
            <View style={[styles.progressCircle, step === i && styles.activeProgressCircle, i < step && styles.completedProgressCircle]}>
              <Text style={[styles.progressText, (step === i || i < step) && styles.activeProgressText]}>{i + 1}</Text>
            </View>
            <Text style={[styles.progressLabel, step === i && styles.activeProgressLabel]}>{label}</Text>
            {i < stepLabels.length - 1 && <View style={[styles.progressLine, i < step && styles.completedProgressLine]} />}
          </View>
        ))}
      </View>
      {/* Step Content */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{stepContent[step].label}</Text>
        <View style={styles.iconContainer}>{stepContent[step].icon}</View>
        {step < 4 && (
          <TouchableOpacity style={styles.imagePicker} onPress={stepContent[step].onPick}>
            {stepContent[step].image ? (
              <Image source={{ uri: stepContent[step].image.uri }} style={styles.image} />
            ) : (
              <Ionicons name="camera" size={48} color="#aaa" />
            )}
          </TouchableOpacity>
        )}
        {/* Name inputs */}
        {step === 1 && (
          <TextInput
            style={styles.input}
            placeholder="Father Name"
            value={fatherName}
            onChangeText={setFatherName}
          />
        )}
        {step === 2 && (
          <TextInput
            style={styles.input}
            placeholder="Mother Name"
            value={motherName}
            onChangeText={setMotherName}
          />
        )}
        {step === 3 && (
          <TextInput
            style={styles.input}
            placeholder="Guardian Name"
            value={guardianName}
            onChangeText={setGuardianName}
          />
        )}
        {/* Navigation Buttons */}
        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity style={[styles.navButton, { backgroundColor: '#FFD54F' }]} onPress={stepContent[step].prev}>
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 4 && (
            <TouchableOpacity style={[styles.navButton, { backgroundColor: '#4FC3F7' }]} onPress={stepContent[step].next}>
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          )}
          {step === 4 && (
            <TouchableOpacity style={[styles.navButton, { backgroundColor: '#AB47BC' }]} onPress={stepContent[step].confirm} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.navButtonText}>Finish</Text>}
            </TouchableOpacity>
          )}
        </View>
        {/* Summary Images */}
        {step === 4 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Child</Text>
              <Image source={childPhoto ? { uri: childPhoto.uri } : null} style={styles.summaryImage} />
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Father</Text>
              <Image source={fatherPhoto ? { uri: fatherPhoto.uri } : null} style={styles.summaryImage} />
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Mother</Text>
              <Image source={motherPhoto ? { uri: motherPhoto.uri } : null} style={styles.summaryImage} />
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Guardian</Text>
              <Image source={guardianPhoto ? { uri: guardianPhoto.uri } : null} style={styles.summaryImage} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: width - 32,
    justifyContent: 'space-between',
  },
  progressStepWrapper: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeProgressCircle: {
    backgroundColor: '#FFD700',
  },
  completedProgressCircle: {
    backgroundColor: '#4FC3F7',
  },
  progressText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeProgressText: {
    color: '#fff',
  },
  progressLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  activeProgressLabel: {
    color: '#FF7043',
    fontWeight: 'bold',
  },
  progressLine: {
    position: 'absolute',
    top: 16,
    right: -width / (stepLabels.length * 2),
    width: width / stepLabels.length - 40,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    zIndex: 0,
  },
  completedProgressLine: {
    backgroundColor: '#4FC3F7',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: width - 48,
    shadowColor: '#FFD700',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF7043',
    marginBottom: 16,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  imagePicker: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFDE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD54F',
    overflow: 'hidden',
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  navButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginHorizontal: 8,
    marginTop: 8,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    width: '100%',
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  summaryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFDE7',
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
});