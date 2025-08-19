import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  FlatList 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const StaffAttendance = ({ visible, onClose }) => {
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const branch = await AsyncStorage.getItem('userBranch');
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `${BASE_URL}/get_all_staff_attendance.php?date=${dateStr}${branch ? `&branch=${branch}` : ''}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAttendance(data.attendance || []);
      } else {
        console.error('Error:', data.message);
        alert('Failed to load attendance data');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchAttendance();
    }
  }, [selectedDate, visible]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.staffName}>{item.staff_name}</Text>
        <Text style={styles.staffRole}>{item.staff_role}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.timeContainer}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>In</Text>
            <Text style={styles.timeValue}>{formatTime(item.clock_in)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Out</Text>
            <Text style={styles.timeValue}>{formatTime(item.clock_out)}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.status, 
            item.status === 'present' ? styles.statusPresent : 
            item.status === 'absent' ? styles.statusAbsent : styles.statusPending
          ]}>
            {item.status === 'present' ? 'Present' : 
             item.status === 'absent' ? 'Absent' : 'Not Marked'}
          </Text>
        </View>
      </View>
      {item.report && (
        <View style={styles.reportContainer}>
          <Text style={styles.reportLabel}>Report:</Text>
          <Text style={styles.reportText}>{item.report}</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.title}>Staff Attendance</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="date-range" size={20} color="#2c3e50" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
            maximumDate={new Date()}
          />
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c3e50" />
          </View>
        ) : (
          <FlatList
            data={attendance}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={50} color="#95a5a6" />
                <Text style={styles.emptyText}>No attendance records found</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  dateText: {
    marginLeft: 6,
    color: '#2c3e50',
    fontWeight: '500',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    color: '#95a5a6',
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  staffRole: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  timeContainer: {
    flexDirection: 'row',
  },
  timeItem: {
    marginRight: 20,
  },
  timeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 80,
  },
  statusPresent: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusAbsent: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  reportContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reportLabel: {
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  reportText: {
    color: '#34495e',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default StaffAttendance;
