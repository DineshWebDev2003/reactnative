import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { BASE_URL } from '../config';

const MarkAttendanceV2Debug = ({ navigation, route }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  const userId = route.params?.userId || 1;

  // Debug logging function
  const addDebugLog = useCallback((message, data = null) => {
    const log = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    console.log('🔍 DEBUG:', message, data);
    setDebugLogs(prev => [...prev.slice(-9), log]); // Keep last 10 logs
  }, []);

  // Load attendance data
  const loadAttendance = useCallback(async () => {
    addDebugLog('Loading attendance data...', { userId });
    
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      addDebugLog('Fetching attendance for date', { today });
      
      const response = await fetch(`${BASE_URL}/get_attendance_v2.php?teacherId=${userId}&date=${today}`);
      addDebugLog('API response status', { status: response.status });
      
      const data = await response.json();
      addDebugLog('API response data', data);
      
      if (data.success) {
        setAttendanceRecords(data.attendance || []);
        addDebugLog('Attendance records loaded', { count: data.attendance?.length || 0 });
      } else {
        addDebugLog('API returned error', { message: data.message });
        Alert.alert('Error', data.message || 'Failed to load attendance');
      }
    } catch (error) {
      addDebugLog('Network error loading attendance', { error: error.message });
      Alert.alert('Error', 'Failed to load attendance: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, addDebugLog]);

  // Submit attendance
  const submitAttendance = useCallback(async (records) => {
    addDebugLog('Submitting attendance records...', { count: records.length });
    
    try {
      setLoading(true);
      
      const requestData = {
        attendance: records.map(record => ({
          studentId: record.student_id,
          date: record.date,
          status: record.status,
          in_time: record.in_time,
          out_time: record.out_time,
          teacherId: userId,
          method: record.method || 'manual',
          guardian_id: record.guardian_id,
          send_off: record.send_off || 'no'
        }))
      };
      
      addDebugLog('Request data prepared', requestData);
      
      const response = await fetch(`${BASE_URL}/mark_attendance_v2_debug.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      addDebugLog('Submit response status', { status: response.status });
      
      const responseText = await response.text();
      addDebugLog('Raw response text', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        addDebugLog('Parsed response data', data);
      } catch (parseError) {
        addDebugLog('Failed to parse JSON response', { error: parseError.message, text: responseText });
        throw new Error('Invalid response from server');
      }
      
      if (data.success) {
        addDebugLog('Attendance submission successful', data);
        Alert.alert('Success', data.message || 'Attendance submitted successfully');
        loadAttendance(); // Reload data
      } else {
        addDebugLog('Attendance submission failed', data);
        Alert.alert('Error', data.message || 'Failed to submit attendance');
      }
    } catch (error) {
      addDebugLog('Network error submitting attendance', { error: error.message });
      Alert.alert('Error', 'Failed to submit attendance: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, loadAttendance, addDebugLog]);

  // Handle QR code scan
  const handleBarCodeScanned = useCallback(({ data }) => {
    addDebugLog('QR code scanned', { data });
    
    try {
      const scannedData = JSON.parse(data);
      addDebugLog('Parsed QR data', scannedData);
      
      if (scannedData.studentId && scannedData.date) {
        const today = new Date().toISOString().slice(0, 10);
        
        // Check if attendance already exists
        const existingIndex = attendanceRecords.findIndex(
          record => record.student_id === scannedData.studentId && record.date === today
        );
        
        if (existingIndex !== -1) {
          addDebugLog('Updating existing attendance', { studentId: scannedData.studentId });
          
          const updatedRecords = [...attendanceRecords];
          updatedRecords[existingIndex] = {
            ...updatedRecords[existingIndex],
            status: 'present',
            in_time: new Date().toTimeString().slice(0, 8),
            method: 'qr'
          };
          
          setAttendanceRecords(updatedRecords);
          submitAttendance(updatedRecords);
        } else {
          addDebugLog('Adding new attendance record', { studentId: scannedData.studentId });
          
          const newRecord = {
            student_id: scannedData.studentId,
            date: today,
            status: 'present',
            in_time: new Date().toTimeString().slice(0, 8),
            out_time: null,
            method: 'qr',
            guardian_id: null,
            send_off: 'no'
          };
          
          const updatedRecords = [...attendanceRecords, newRecord];
          setAttendanceRecords(updatedRecords);
          submitAttendance(updatedRecords);
        }
        
        setScanned(true);
        setTimeout(() => setScanned(false), 2000);
      } else {
        addDebugLog('Invalid QR code data', scannedData);
        Alert.alert('Error', 'Invalid QR code data');
      }
    } catch (error) {
      addDebugLog('Error parsing QR code', { error: error.message });
      Alert.alert('Error', 'Invalid QR code format');
    }
  }, [attendanceRecords, submitAttendance, addDebugLog]);

  // Request camera permission
  useEffect(() => {
    (async () => {
      addDebugLog('Requesting camera permission...');
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      addDebugLog('Camera permission result', { status });
    })();
  }, [addDebugLog]);

  // Load attendance on component mount
  useEffect(() => {
    addDebugLog('Component mounted, loading attendance...');
    loadAttendance();
  }, [loadAttendance]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    addDebugLog('Pull to refresh triggered');
    setRefreshing(true);
    await loadAttendance();
    setRefreshing(false);
  }, [loadAttendance]);

  // Toggle attendance status
  const toggleAttendance = useCallback((studentId) => {
    addDebugLog('Toggling attendance for student', { studentId });
    
    const today = new Date().toISOString().slice(0, 10);
    const existingIndex = attendanceRecords.findIndex(
      record => record.student_id === studentId && record.date === today
    );
    
    let updatedRecords;
    if (existingIndex !== -1) {
      // Update existing record
      updatedRecords = [...attendanceRecords];
      updatedRecords[existingIndex] = {
        ...updatedRecords[existingIndex],
        status: updatedRecords[existingIndex].status === 'present' ? 'absent' : 'present',
        in_time: updatedRecords[existingIndex].status === 'present' ? null : new Date().toTimeString().slice(0, 8)
      };
    } else {
      // Add new record
      const newRecord = {
        student_id: studentId,
        date: today,
        status: 'present',
        in_time: new Date().toTimeString().slice(0, 8),
        out_time: null,
        method: 'manual',
        guardian_id: null,
        send_off: 'no'
      };
      updatedRecords = [...attendanceRecords, newRecord];
    }
    
    setAttendanceRecords(updatedRecords);
    submitAttendance(updatedRecords);
  }, [attendanceRecords, submitAttendance, addDebugLog]);

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mark Attendance (Debug)</Text>
      
      {/* Debug Logs */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Logs:</Text>
        <ScrollView style={styles.debugLogs}>
          {debugLogs.map((log, index) => (
            <Text key={index} style={styles.debugLog}>
              {log.timestamp.slice(11, 19)}: {log.message}
              {log.data && ` (${JSON.stringify(log.data).slice(0, 50)}...)`}
            </Text>
          ))}
        </ScrollView>
      </View>
      
      {/* QR Scanner */}
      {scanning && (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
          />
          <TouchableOpacity
            style={styles.scannerButton}
            onPress={() => setScanning(false)}
          >
            <Text style={styles.scannerButtonText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Attendance List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          attendanceRecords.map((record, index) => (
            <TouchableOpacity
              key={`${record.student_id}-${record.date}-${index}`}
              style={[
                styles.record,
                record.status === 'present' && styles.present,
                record.status === 'absent' && styles.absent
              ]}
              onPress={() => toggleAttendance(record.student_id)}
            >
              <Text style={styles.studentName}>Student {record.student_id}</Text>
              <Text style={styles.status}>{record.status.toUpperCase()}</Text>
              {record.in_time && (
                <Text style={styles.time}>In: {record.in_time}</Text>
              )}
              <Text style={styles.method}>Method: {record.method}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setScanning(true)}
        >
          <Text style={styles.buttonText}>Scan QR Code</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={loadAttendance}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
    color: '#333',
  },
  debugContainer: {
    backgroundColor: '#000',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    maxHeight: 150,
  },
  debugTitle: {
    color: '#0f0',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugLogs: {
    flex: 1,
  },
  debugLog: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  scannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  scanner: {
    flex: 1,
  },
  scannerButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  scannerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  record: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  present: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  absent: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  method: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MarkAttendanceV2Debug; 