import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from '../config';
import { MaterialIcons } from '@expo/vector-icons';

export default function AttendanceReport({ navigation }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBranches(data.branches);
          if (data.branches.length > 0) setSelectedBranch(data.branches[0].name);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedBranch && date) fetchAttendance();
  }, [selectedBranch, date]);

  const fetchAttendance = () => {
    setLoading(true);
    fetch(`${BASE_URL}/get_attendance_v2.php?branch=${encodeURIComponent(selectedBranch)}&date=${date.toISOString().slice(0,10)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.attendance) {
          data.attendance.forEach(record => {
            console.log('Rendering child:', record.childName, record.child_photo);
          });
          setAttendance(data.attendance || []);
        } else {
          setAttendance([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setAttendance([]);
        setLoading(false);
        Alert.alert('Error', 'Failed to fetch attendance.');
      });
  };

  const renderStatus = (status) => {
    let color = '#bdbdbd', label = 'Unknown';
    if (status === 'present') { color = '#4caf50'; label = 'Present'; }
    else if (status === 'absent') { color = '#e53935'; label = 'Absent'; }
    else if (status === 'late') { color = '#ff9800'; label = 'Late'; }
    return <Text style={{color, fontWeight:'bold'}}>{label}</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <Picker
          selectedValue={selectedBranch}
          onValueChange={setSelectedBranch}
          style={styles.picker}
        >
          {branches.map(b => (
            <Picker.Item key={b.id} label={b.name} value={b.name} />
          ))}
        </Picker>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <MaterialIcons name="date-range" size={22} color="#1a237e" />
          <Text style={styles.dateText}>{date.toISOString().slice(0,10)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(e, d) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}
      </View>
      <Text style={styles.title}>Attendance Report</Text>
      {loading ? <ActivityIndicator size="large" color="#009688" /> : (
        <FlatList
          data={attendance}
          keyExtractor={item => (item.attendance_id || item.student_id || item.student_code).toString() + item.date}
          ListEmptyComponent={<Text style={{textAlign:'center', color:'#888', marginTop:32}}>No records found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.cell}>{item.student_code} - {item.childName}</Text>
              <Text style={styles.cell}>{item.childClass || ''}</Text>
              <Text style={styles.cell}>{item.date}</Text>
              <Text style={styles.cell}>{renderStatus(item.status)}</Text>
              <Text style={styles.cell}>{item.in_time || '-'}</Text>
              <Text style={styles.cell}>{item.out_time || '-'}</Text>
            </View>
          )}
          ListHeaderComponent={
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerCell]}>Student</Text>
              <Text style={[styles.cell, styles.headerCell]}>Class</Text>
              <Text style={[styles.cell, styles.headerCell]}>Date</Text>
              <Text style={[styles.cell, styles.headerCell]}>Status</Text>
              <Text style={[styles.cell, styles.headerCell]}>In</Text>
              <Text style={[styles.cell, styles.headerCell]}>Out</Text>
            </View>
          }
        />
      )}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  picker: { flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee', padding: 8, marginLeft: 8 },
  dateText: { marginLeft: 6, color: '#1a237e', fontWeight: 'bold' },
  title: { fontWeight: 'bold', fontSize: 20, color: '#1a237e', marginBottom: 12, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  headerRow: { backgroundColor: '#ede7f6' },
  cell: { flex: 1, color: '#333', fontSize: 14, textAlign: 'center' },
  headerCell: { fontWeight: 'bold', color: '#4b2996' },
  closeBtn: { marginTop: 20, backgroundColor: '#a084ca', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 32, alignSelf: 'center' },
  closeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
}); 