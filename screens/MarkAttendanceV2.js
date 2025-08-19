import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Button,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '../config';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

export default function MarkAttendanceV2({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({});
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef(null);
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }
  const attendanceKey = `attendance_${getToday()}`;

  useEffect(() => {
    loadStudents();
    loadCachedAttendance();
    loadTodayAttendance();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTodayAttendance();
    }, [students])
  );

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
        const initial = {};
        data.students.forEach((s) => (initial[s.student_id] = {}));
        setAttendanceData(initial);
      } else {
        Alert.alert('Error', data.message || 'Failed to load students');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const loadCachedAttendance = async () => {
    try {
      const cached = await AsyncStorage.getItem(attendanceKey);
      if (cached) setAttendanceData(JSON.parse(cached));
    } catch {}
  };

  const loadTodayAttendance = async () => {
    try {
      const today = getToday();
      const studentList = students && students.length ? students : [];
      const attendanceResults = {};

      await Promise.all(studentList.map(async (student) => {
        try {
          const res = await fetch(`${BASE_URL}/get_attendance.php?student_id=${student.student_id}&date=${today}`);
          const data = await res.json();
          if (data.success && data.attendance) {
            attendanceResults[student.student_id] = {
              status: data.attendance.status,
              in_time: data.attendance.in_time,
              out_time: data.attendance.out_time,
              method: data.attendance.method,
              send_off: data.attendance.send_off,
              time: data.attendance.in_time || data.attendance.out_time || '',
            };
          } else {
            attendanceResults[student.student_id] = {};
          }
        } catch (err) {
          attendanceResults[student.student_id] = {};
        }
      }));

      setAttendanceData(prev => ({ ...prev, ...attendanceResults }));
    } catch (e) {
      console.log('Failed to load today attendance', e);
    }
  };

  const markAttendance = async (studentId, status = 'present', method = 'manual', type = null, faceData = null) => {
    const userId = await AsyncStorage.getItem('userId');
    const now = new Date();
    const prev = attendanceData[studentId] || {};
    let in_time = prev.in_time || null;
    let out_time = prev.out_time || null;
    let send_off_name = null;

    if (method === 'manual' || method === 'qr') {
      if (type === 'in') in_time = now.toTimeString().slice(0, 8);
      if (type === 'out') out_time = now.toTimeString().slice(0, 8);
    }
    if (faceData && faceData.send_off) send_off_name = faceData.send_off;

    setAttendanceData((prev) => {
      const updatedRecord = {
        ...prev[studentId],
        status,
        method,
        in_time,
        out_time,
        send_off: send_off_name,
        time: now.toLocaleTimeString(),
      };
      const updated = { ...prev, [studentId]: updatedRecord };
      AsyncStorage.setItem(attendanceKey, JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    const payload = {
      student_id: studentId,
      action: type === 'out' ? 'out' : 'in',
      method,
      marked_by: userId,
    };
    if (send_off_name && type === 'out') {
      payload.send_off_name = send_off_name;
    }

    try {
      const res = await fetch(`${BASE_URL}/mark_attendance_v2.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        Alert.alert('Error', data.message || 'Failed to mark attendance');
      } else {
        setTimeout(() => loadTodayAttendance(), 200);
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect to server');
    }
  };



  const { presentCount, absentCount, notMarkedCount } = useMemo(() => {
    let present = 0, absent = 0;
    students.forEach((s) => {
      const st = attendanceData[s.student_id]?.status;
      if (st === 'present') present++; else if (st === 'absent') absent++;
    });
    return { presentCount: present, absentCount: absent, notMarkedCount: students.length - present - absent };
  }, [students, attendanceData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a084ca" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

        const handleWebViewMessage = (event) => {
    const { data } = event.nativeEvent;
    let studentId = null;

    try {
      const parsedData = JSON.parse(data);
      if (parsedData && parsedData.student_id) {
        studentId = parsedData.student_id;
      } else if (parsedData && parsedData.error) {
        Alert.alert('Scan Error', parsedData.error);
        return;
      }
    } catch (e) {
      // If JSON parsing fails, assume the data is the raw student ID.
      if (typeof data === 'string' && data.trim().length > 0) {
        studentId = data.trim();
      }
    }

    if (studentId) {
      if (students.some(s => String(s.student_id) === String(studentId))) {
        const studentAttendance = attendanceData[studentId] || {};
        const action = studentAttendance.in_time && !studentAttendance.out_time ? 'out' : 'in';
        markAttendance(studentId, 'present', 'qr', action);
        Alert.alert('Success', `Attendance marked for student ID: ${studentId}`);
        setShowWebView(false);
      } else {
        Alert.alert('Invalid Student ID', `The scanned ID '${studentId}' does not belong to a valid student.`);
      }
    } else {
      Alert.alert('Processing Error', 'Could not extract a valid student ID from the scanner.');
    }
  };

  if (showWebView) {
    return (
      <Modal
        visible={showWebView}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}>
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://app.tnhappykids.in/backend/scanner.html' }}
          style={{ flex: 1 }}
          onMessage={handleWebViewMessage}
        />
        <Button title="Close" onPress={() => setShowWebView(false)} />
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Mark Attendance</Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#a084ca',
          borderRadius: 8,
          padding: 14,
          marginHorizontal: 24,
          marginBottom: 8,
          marginTop: 8,
          alignItems: 'center',
        }}
        onPress={() => setShowWebView(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          Mark Attendance (QR Code)
        </Text>
      </TouchableOpacity>
      <Modal visible={parentModalVisible} transparent animationType="slide" onRequestClose={() => setParentModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 18, width: 340, maxHeight: 420 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Select Student</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 12 }}>
              {students.map((student) => (
                <TouchableOpacity
                  key={student.student_id}
                  style={{
                    alignItems: 'center',
                    marginHorizontal: 10,
                    borderWidth: selectedStudent && selectedStudent.student_id === student.student_id ? 3 : 0,
                    borderColor: selectedStudent && selectedStudent.student_id === student.student_id ? '#43cea2' : 'transparent',
                    borderRadius: 40,
                    padding: 3,
                    backgroundColor: selectedStudent && selectedStudent.student_id === student.student_id ? '#e6fff7' : 'transparent',
                  }}
                  onPress={() => setSelectedStudent(student)}
                >
                  <Image
                    source={student.child_photo ? { uri: `${BASE_URL}/${student.child_photo}` } : require('../assets/Avartar.png')}
                    style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#eee', marginBottom: 5 }}
                  />
                  <Text style={{ fontSize: 14, color: '#333', textAlign: 'center', maxWidth: 80 }} numberOfLines={2}>
                    {student.childName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!selectedStudent && (
              <View style={{ alignItems: 'center', marginVertical: 24 }}>
                <Text style={{ color: '#888', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                  Please select a student to view parent photos and mark attendance.
                </Text>
              </View>
            )}
            {selectedStudent && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, backgroundColor: '#f8f6ff', borderRadius: 16, paddingVertical: 18, shadowColor: '#a084ca', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6 }}>
                {['father_photo', 'mother_photo', 'guardian_photo'].map((role, idx) => {
                  const label = role.replace('_photo', '');
                  const studentObj = students.find(s => s.student_id === selectedStudent.student_id) || selectedStudent;
                  const photoPath = studentObj[role];
                  const colorMap = ['#43cea2', '#a084ca', '#f39c12'];
                  return (
                    <View key={role} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{
                        borderWidth: 3,
                        borderColor: colorMap[idx],
                        borderRadius: 48,
                        padding: 6,
                        backgroundColor: '#fff',
                        shadowColor: colorMap[idx],
                        shadowOpacity: 0.12,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 6,
                        elevation: 4,
                        marginBottom: 8,
                      }}>
                        <Image
                          source={photoPath ? { uri: photoPath.startsWith('http') ? photoPath : `${BASE_URL}/${photoPath}` } : require('../assets/Avartar.png')}
                          style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFFDE7' }}
                        />
                      </View>
                      <Text style={{ fontSize: 15, color: colorMap[idx], fontWeight: 'bold', marginBottom: 4, textAlign: 'center' }}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
            <TouchableOpacity
              style={{ backgroundColor: '#43cea2', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 10, opacity: !selectedStudent ? 0.5 : 1 }}
              disabled={!selectedStudent}
              onPress={() => {
                if (selectedStudent) {
                  markAttendance(selectedStudent.student_id, 'present', 'face', 'out', { send_off: 'teacher' });
                  setParentModalVisible(false);
                  setSelectedStudent(null);
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Mark with Face</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryBadge, { backgroundColor: '#C8E6C9' }]}>Present: {presentCount}</Text>
          <Text style={[styles.summaryBadge, { backgroundColor: '#FFCDD2' }]}>Absent: {absentCount}</Text>
          <Text style={[styles.summaryBadge, { backgroundColor: '#FFE0B2' }]}>Not Marked: {notMarkedCount}</Text>
        </View>
        {students.map((student) => (
          <View key={student.student_id || student.id} style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <Image
                source={
                  student.child_photo
                    ? { uri: `${BASE_URL}/${student.child_photo}` }
                    : require('../assets/Avartar.png')
                }
                style={styles.avatar}
              />
              <Text style={styles.studentName}>{student.childName}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text
                style={[
                  styles.statusBadge,
                  attendanceData[student.student_id]?.status === 'present'
                    ? styles.badgePresent
                    : attendanceData[student.student_id]?.status === 'absent'
                    ? styles.badgeAbsent
                    : styles.badgeNotMarked,
                ]}
              >
                {attendanceData[student.student_id]?.status?.toUpperCase() || 'NOT MARKED'}
              </Text>
              <Text style={styles.timeText}>In: {attendanceData[student.student_id]?.in_time || '-'}</Text>
              <Text style={styles.timeText}>Out: {attendanceData[student.student_id]?.out_time || '-'}</Text>
              <Text style={styles.timeText}>By: {attendanceData[student.student_id]?.send_off ? attendanceData[student.student_id].send_off.charAt(0).toUpperCase()+attendanceData[student.student_id].send_off.slice(1) : '-'}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                disabled={Boolean(attendanceData[student.student_id]?.in_time)}
                style={[styles.actionButton, { backgroundColor: '#43cea2', opacity: attendanceData[student.student_id]?.in_time ? 0.4 : 1 }]}
                onPress={() => markAttendance(student.student_id, 'present', 'manual', 'in')}
              >
                <Text style={styles.actionButtonText}>Mark IN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!attendanceData[student.student_id]?.in_time || Boolean(attendanceData[student.student_id]?.out_time)}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: '#f39c12',
                    opacity: !attendanceData[student.student_id]?.in_time || attendanceData[student.student_id]?.out_time ? 0.4 : 1,
                  },
                ]}
                onPress={() => markAttendance(student.student_id, 'present', 'manual', 'out')}
              >
                <Text style={styles.actionButtonText}>Mark OUT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={Boolean(attendanceData[student.student_id]?.in_time)}
                style={[styles.actionButton, { backgroundColor: '#e74c3c', opacity: attendanceData[student.student_id]?.in_time ? 0.4 : 1 }]}
                onPress={() => markAttendance(student.student_id, 'absent', 'manual')}
              >
                <Text style={styles.actionButtonText}>Mark ABSENT</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
  },
  qrFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#a084ca',
    borderRadius: 10,
    marginBottom: 20,
  },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', margin: 20, color: '#333' },
  dateText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#555' },
  scrollView: { flex: 1 },
  content: { paddingBottom: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#a084ca',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  studentInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#eee' },
  studentName: { fontSize: isSmallScreen ? 16 : 18, fontWeight: 'bold', color: '#333' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgePresent: { backgroundColor: '#2ecc71' },
  badgeAbsent: { backgroundColor: '#e74c3c' },
  badgeNotMarked: { backgroundColor: '#bdc3c7' },
  timeText: { fontSize: 12, color: '#7f8c8d' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  summaryBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});