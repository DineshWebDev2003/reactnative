import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Button, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

export default function MarkAttendance() {
  const navigation = useNavigation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({});
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningStudentId, setScanningStudentId] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);
  const [editingTime, setEditingTime] = useState({ studentId: null, type: null });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerValue, setPickerValue] = useState(new Date());

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'Teacher ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      const response = await fetch(`${BASE_URL}/get_students_for_teacher.php?teacherId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.students || []);
        // Initialize attendance data
        const initialAttendance = {};
        data.students.forEach(student => {
          initialAttendance[student.id] = {
            status: 'present', // default to present
            method: 'manual',
            time: new Date().toLocaleTimeString(),
          };
        });
        setAttendanceData(initialAttendance);
      } else {
        Alert.alert('Error', data.message || 'Failed to load students');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        time: new Date().toLocaleTimeString(),
      }
    }));
  };

  const updateMethod = (studentId, method) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        method,
      }
    }));
  };

  // QR Scanner logic using expo-camera
  const openQRScanner = async (studentId) => {
    setScanningStudentId(studentId);
    const { status } = await requestPermission();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is required to scan QR codes.');
      setShowQRScanner(false);
      return;
    }
    setScanned(false);
    setShowQRScanner(true);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    // Find the student object by scanningStudentId
    const student = students.find(s => s.id === scanningStudentId);
    // Compare QR code data to student.student_id
    if (data && student && data === student.student_id) {
      updateMethod(scanningStudentId, 'qr');
      updateAttendance(scanningStudentId, 'present');
      setShowQRScanner(false);
      setScanningStudentId(null);
      Alert.alert('Success', 'Attendance marked via QR!');
    } else {
      Alert.alert('QR Mismatch', 'Scanned QR does not match this student.');
      setTimeout(() => setScanned(false), 1500); // allow retry
    }
  };

  // Update recognizeFace to send photo to backend and handle match result
  const recognizeFace = async (studentId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is required for face recognition.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });
    if (!result.cancelled) {
      // Send to backend for face match
      try {
        const response = await fetch(`${BASE_URL}/face_match.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, image: result.base64 }),
        });
        const data = await response.json();
        if (data.success && data.match) {
          // Prompt for who dropped/picked up
          Alert.alert(
            'Who dropped/picked up?',
            'Select the person:',
            [
              { text: 'Father', onPress: () => markSendOff(studentId, 'father', data.matchType) },
              { text: 'Mother', onPress: () => markSendOff(studentId, 'mother', data.matchType) },
              { text: 'Other', onPress: () => markSendOff(studentId, 'other', data.matchType) },
            ]
          );
        } else {
          Alert.alert('Face Not Recognized', 'Could not match the face to a parent.');
        }
      } catch (e) {
        Alert.alert('Error', 'Face recognition failed.');
      }
    }
  };

  const markSendOff = (studentId, sendOff, matchType) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        method: 'face',
        status: 'present',
        send_off: sendOff,
        matchType,
        time: new Date().toLocaleTimeString(),
      }
    }));
  };

  const takeAttendancePhoto = async (studentId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is required to take a photo.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.cancelled) {
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          photo: result.uri,
          method: 'photo',
        }
      }));
    }
  };

  // Helper to format time
  const formatTime = (date) => {
    if (!date) return '-';
    if (typeof date === 'string' && date.includes(':')) return date;
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleMarkTime = (studentId, type) => {
    const now = new Date();
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [type]: formatTime(now),
        status: 'present',
      }
    }));
  };

  const handleEditTime = (studentId, type) => {
    setEditingTime({ studentId, type });
    setPickerValue(new Date());
    setShowTimePicker(true);
  };

  const onTimePicked = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    const { studentId, type } = editingTime;
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [type]: formatTime(selectedDate),
      }
    }));
    setShowTimePicker(false);
  };

  const submitAttendance = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const attendanceRecords = Object.keys(attendanceData).map(studentId => ({
        studentId,
        teacherId: userId,
        in_time: attendanceData[studentId].in_time,
        out_time: attendanceData[studentId].out_time,
        status: attendanceData[studentId].status,
        method: attendanceData[studentId].method,
        send_off: attendanceData[studentId].send_off,
        date: new Date().toISOString().split('T')[0],
      }));
      const response = await fetch(`${BASE_URL}/mark_attendance.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: attendanceRecords }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Attendance marked successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to mark attendance');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to server');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a084ca" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#a084ca" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <TouchableOpacity onPress={submitAttendance} style={styles.submitButton}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>

        {students.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              {/* Remove parent name/class display here if present */}
            </View>
            {/* In/Out Time Marking and Method Selection */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity style={[styles.statusButton, { marginRight: 8 }]} onPress={() => handleMarkTime(student.id, 'in_time')}>
                <Text style={styles.statusText}>Mark In</Text>
                </TouchableOpacity>
              <Text style={{ marginRight: 4 }}>In: {attendanceData[student.id]?.in_time || '-'}</Text>
              <TouchableOpacity onPress={() => handleEditTime(student.id, 'in_time')}>
                <MaterialIcons name="edit" size={18} color="#a084ca" />
                </TouchableOpacity>
              </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity style={[styles.statusButton, { marginRight: 8 }]} onPress={() => handleMarkTime(student.id, 'out_time')}>
                <Text style={styles.statusText}>Mark Out</Text>
              </TouchableOpacity>
              <Text style={{ marginRight: 4 }}>Out: {attendanceData[student.id]?.out_time || '-'}</Text>
              <TouchableOpacity onPress={() => handleEditTime(student.id, 'out_time')}>
                <MaterialIcons name="edit" size={18} color="#a084ca" />
              </TouchableOpacity>
            </View>
            {/* Method Selection (remove Take Photo) */}
            <View style={styles.methodSection}>
              <Text style={styles.sectionTitle}>Method:</Text>
              <View style={styles.methodButtons}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    attendanceData[student.id]?.method === 'manual' && styles.activeMethodButton
                  ]}
                  onPress={() => updateMethod(student.id, 'manual')}
                >
                  <Text style={[styles.methodText, attendanceData[student.id]?.method === 'manual' && styles.activeMethodText]}>
                    Manual
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    attendanceData[student.id]?.method === 'qr' && styles.activeMethodButton
                  ]}
                  onPress={() => {
                    updateMethod(student.id, 'qr');
                    openQRScanner(student.id);
                  }}
                >
                  <Text style={[styles.methodText, attendanceData[student.id]?.method === 'qr' && styles.activeMethodText]}>
                    QR Code
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    attendanceData[student.id]?.method === 'face' && styles.activeMethodButton
                  ]}
                  onPress={() => recognizeFace(student.id)}
                >
                  <Text style={[styles.methodText, attendanceData[student.id]?.method === 'face' && styles.activeMethodText]}>
                    Face Recognition
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Show photo thumbnail if taken */}
            {attendanceData[student.id]?.photo && (
              <Image source={{ uri: attendanceData[student.id].photo }} style={{ width: 80, height: 80, borderRadius: 8, marginTop: 8 }} />
            )}
            {/* Time Stamp */}
            {attendanceData[student.id]?.time && (
              <Text style={styles.timeText}>
                Marked at: {attendanceData[student.id].time}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* QR Scanner Modal using expo-camera */}
      <Modal visible={showQRScanner} animationType="slide" onRequestClose={() => setShowQRScanner(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          {!permission ? (
            <ActivityIndicator />
          ) : !permission.granted ? (
            <Text style={{ color: '#fff' }}>No access to camera. Please grant permission in your device settings.</Text>
          ) : (
            <CameraView
              ref={cameraRef}
              style={{ width: '100%', height: '80%' }}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
          )}
          <Button title="Close" onPress={() => setShowQRScanner(false)} color="#a084ca" />
        </View>
      </Modal>
      {showTimePicker && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onTimePicked}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3e8ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#a084ca',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#a084ca',
  },
  submitButton: {
    backgroundColor: '#a084ca',
    paddingHorizontal: isSmallScreen ? 15 : 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 14 : 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: width * 0.05,
  },
  dateText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#6c3483',
    textAlign: 'center',
    marginBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: 15,
    shadowColor: '#a084ca',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  studentInfo: {
    marginBottom: 15,
  },
  studentName: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#6c3483',
  },
  attendanceSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a084ca',
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#a084ca',
  },
  absentButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  lateButton: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12',
  },
  statusText: {
    marginLeft: 4,
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
    color: '#a084ca',
  },
  activeText: {
    color: '#fff',
  },
  absentText: {
    color: '#fff',
  },
  lateText: {
    color: '#fff',
  },
  methodSection: {
    marginBottom: 10,
  },
  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a084ca',
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  activeMethodButton: {
    backgroundColor: '#a084ca',
  },
  methodText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#a084ca',
    fontWeight: '600',
  },
  activeMethodText: {
    color: '#fff',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
}); 