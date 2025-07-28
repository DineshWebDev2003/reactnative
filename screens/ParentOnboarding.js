import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function ParentOnboarding({ route }) {
  const navigation = useNavigation();
  const { userId } = route.params || {};
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    childName: '',
    childAge: '',
    childClass: '',
    childPhoto: null,
    fatherName: '',
    fatherMobile: '',
    fatherPhoto: null,
    motherName: '',
    motherMobile: '',
    motherPhoto: null,
    guardianName: '',
    guardianMobile: '',
    guardianPhoto: null,
    address: '',
    emergencyContact: '',
    medicalInfo: '',
    allergies: '',
    specialNeeds: '',
    previousSchool: '',
    parentPhoto: null
  });

  const steps = [
    {
      title: "Child Information",
      description: "Let's start with your child's basic details",
      icon: "👶",
      fields: ['childName', 'childAge', 'childClass', 'childPhoto']
    },
    {
      title: "Father's Information", 
      description: "Tell us about the father",
      icon: "👨",
      fields: ['fatherName', 'fatherMobile', 'fatherPhoto']
    },
    {
      title: "Mother's Information",
      description: "Tell us about the mother", 
      icon: "👩",
      fields: ['motherName', 'motherMobile', 'motherPhoto']
    },
    {
      title: "Guardian Information",
      description: "Emergency contact person",
      icon: "👴",
      fields: ['guardianName', 'guardianMobile', 'guardianPhoto']
    },
    {
      title: "Contact & Address",
      description: "Where can we reach you?",
      icon: "🏠",
      fields: ['address', 'emergencyContact']
    },
    {
      title: "Medical Information",
      description: "Important health details",
      icon: "🏥",
      fields: ['medicalInfo', 'allergies', 'specialNeeds']
    },
    {
      title: "Previous Education",
      description: "Educational background",
      icon: "📚",
      fields: ['previousSchool']
    },
    {
      title: "Parent Photo",
      description: "Upload your photo",
      icon: "📸",
      fields: ['parentPhoto']
    },
    {
      title: "Review & Submit",
      description: "Review all information",
      icon: "✅",
      fields: []
    }
  ];

  const pickImage = async (fieldName) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          [fieldName]: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Here you would typically upload the data to your backend
      console.log('Submitting parent onboarding data:', formData);
      
      // Store the onboarding completion status
      await AsyncStorage.setItem('parentOnboardingComplete', 'true');
      
      Alert.alert(
        'Success!', 
        'Parent onboarding completed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('ParentDashboard')
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      Alert.alert('Error', 'Failed to submit onboarding data. Please try again.');
    }
  };

  const renderStepContent = () => {
    const currentStepData = steps[currentStep];
    
    switch (currentStep) {
      case 0: // Child Information
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Child's Full Name"
              value={formData.childName}
              onChangeText={(text) => setFormData(prev => ({...prev, childName: text}))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={formData.childAge}
              onChangeText={(text) => setFormData(prev => ({...prev, childAge: text}))}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Class/Grade"
              value={formData.childClass}
              onChangeText={(text) => setFormData(prev => ({...prev, childClass: text}))}
            />
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => pickImage('childPhoto')}
            >
              <Text style={styles.photoButtonText}>
                {formData.childPhoto ? '📷 Change Child Photo' : '📷 Add Child Photo'}
              </Text>
            </TouchableOpacity>
            
            {formData.childPhoto && (
              <Image source={{ uri: formData.childPhoto }} style={styles.previewImage} />
            )}
          </View>
        );
        
      case 1: // Father's Information
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Father's Full Name"
              value={formData.fatherName}
              onChangeText={(text) => setFormData(prev => ({...prev, fatherName: text}))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Father's Mobile Number"
              value={formData.fatherMobile}
              onChangeText={(text) => setFormData(prev => ({...prev, fatherMobile: text}))}
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => pickImage('fatherPhoto')}
            >
              <Text style={styles.photoButtonText}>
                {formData.fatherPhoto ? '📷 Change Father Photo' : '📷 Add Father Photo'}
              </Text>
            </TouchableOpacity>
            
            {formData.fatherPhoto && (
              <Image source={{ uri: formData.fatherPhoto }} style={styles.previewImage} />
            )}
          </View>
        );
        
      case 2: // Mother's Information
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Mother's Full Name"
              value={formData.motherName}
              onChangeText={(text) => setFormData(prev => ({...prev, motherName: text}))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Mother's Mobile Number"
              value={formData.motherMobile}
              onChangeText={(text) => setFormData(prev => ({...prev, motherMobile: text}))}
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => pickImage('motherPhoto')}
            >
              <Text style={styles.photoButtonText}>
                {formData.motherPhoto ? '📷 Change Mother Photo' : '📷 Add Mother Photo'}
              </Text>
            </TouchableOpacity>
            
            {formData.motherPhoto && (
              <Image source={{ uri: formData.motherPhoto }} style={styles.previewImage} />
            )}
          </View>
        );
        
      case 3: // Guardian Information
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Guardian's Full Name"
              value={formData.guardianName}
              onChangeText={(text) => setFormData(prev => ({...prev, guardianName: text}))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Guardian's Mobile Number"
              value={formData.guardianMobile}
              onChangeText={(text) => setFormData(prev => ({...prev, guardianMobile: text}))}
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => pickImage('guardianPhoto')}
            >
              <Text style={styles.photoButtonText}>
                {formData.guardianPhoto ? '📷 Change Guardian Photo' : '📷 Add Guardian Photo'}
              </Text>
            </TouchableOpacity>
            
            {formData.guardianPhoto && (
              <Image source={{ uri: formData.guardianPhoto }} style={styles.previewImage} />
            )}
          </View>
        );
        
      case 4: // Contact & Address
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Complete Address"
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({...prev, address: text}))}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Emergency Contact Number"
              value={formData.emergencyContact}
              onChangeText={(text) => setFormData(prev => ({...prev, emergencyContact: text}))}
              keyboardType="phone-pad"
            />
          </View>
        );
        
      case 5: // Medical Information
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Medical Information (if any)"
              value={formData.medicalInfo}
              onChangeText={(text) => setFormData(prev => ({...prev, medicalInfo: text}))}
              multiline
              numberOfLines={2}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Allergies (if any)"
              value={formData.allergies}
              onChangeText={(text) => setFormData(prev => ({...prev, allergies: text}))}
              multiline
              numberOfLines={2}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Special Needs (if any)"
              value={formData.specialNeeds}
              onChangeText={(text) => setFormData(prev => ({...prev, specialNeeds: text}))}
              multiline
              numberOfLines={2}
            />
          </View>
        );
        
      case 6: // Previous Education
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Previous School/Institution"
              value={formData.previousSchool}
              onChangeText={(text) => setFormData(prev => ({...prev, previousSchool: text}))}
              multiline
              numberOfLines={2}
            />
          </View>
        );
        
      case 7: // Parent Photo
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={() => pickImage('parentPhoto')}
            >
              <Text style={styles.photoButtonText}>
                {formData.parentPhoto ? '📷 Change Parent Photo' : '📷 Add Parent Photo'}
              </Text>
            </TouchableOpacity>
            
            {formData.parentPhoto && (
              <Image source={{ uri: formData.parentPhoto }} style={styles.previewImage} />
            )}
          </View>
        );
        
      case 8: // Review & Submit
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
            
            <ScrollView style={styles.reviewContainer}>
              <Text style={styles.reviewTitle}>📋 Review Your Information</Text>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>👶 Child Information</Text>
                <Text style={styles.reviewText}>Name: {formData.childName}</Text>
                <Text style={styles.reviewText}>Age: {formData.childAge}</Text>
                <Text style={styles.reviewText}>Class: {formData.childClass}</Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>👨 Father's Information</Text>
                <Text style={styles.reviewText}>Name: {formData.fatherName}</Text>
                <Text style={styles.reviewText}>Mobile: {formData.fatherMobile}</Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>👩 Mother's Information</Text>
                <Text style={styles.reviewText}>Name: {formData.motherName}</Text>
                <Text style={styles.reviewText}>Mobile: {formData.motherMobile}</Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>🏠 Contact Information</Text>
                <Text style={styles.reviewText}>Address: {formData.address}</Text>
                <Text style={styles.reviewText}>Emergency: {formData.emergencyContact}</Text>
              </View>
            </ScrollView>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Onboarding</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{currentStep + 1}/{steps.length}</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]} />
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>
      
      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < steps.length - 1 ? (
          <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={handleNext}>
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navButton, styles.submitButton]} onPress={handleSubmit}>
            <Text style={styles.navButtonText}>Submit ✅</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#eee',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  photoButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginTop: 8,
  },
  reviewContainer: {
    maxHeight: 400,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  reviewSection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  nextButton: {
    backgroundColor: '#4F46E5',
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 