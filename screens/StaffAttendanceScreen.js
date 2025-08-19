import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

const StaffAttendanceScreen = () => {
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [staffReports, setStaffReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportBranch, setReportBranch] = useState('');
  const [reportStaff, setReportStaff] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [showReportDatePicker, setShowReportDatePicker] = useState(false);

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_branches.php`);
      const data = await res.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches);
      } else {
        setBranches([]);
      }
    } catch (e) {
      setBranches([]);
      Alert.alert('Error', 'Failed to fetch branches');
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_users.php`);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (e) {
      setUsers([]);
      Alert.alert('Error', 'Failed to fetch users');
    }
  };

  // Grouping utility
  const groupReportsByDate = (reports) => {
    const grouped = {};
    reports.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });
    return grouped;
  };

  // Fetch staff attendance reports
  const fetchStaffReports = async () => {
    setLoadingReports(true);
    let url = `${BASE_URL}/get_staff_reports.php?`;
    if (reportBranch) url += `branch=${encodeURIComponent(reportBranch)}&`;
    if (reportStaff) url += `staff_id=${reportStaff}&`;
    url += `month=${reportMonth}&year=${reportYear}&`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setStaffReports(data.reports);
      else setStaffReports([]);
    } catch (e) {
      setStaffReports([]);
      Alert.alert('Error', 'Failed to fetch staff reports');
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (branches.length && users.length) fetchStaffReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportBranch, reportStaff, reportMonth, reportYear, branches.length, users.length]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Attendance Report</Text>
      <View style={styles.card}>
        <Text style={{fontWeight:'bold', fontSize:17, marginBottom:10}}>Staff Attendance Reports</Text>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Picker
              selectedValue={reportBranch}
              style={{height:40}}
              onValueChange={setReportBranch}>
              <Picker.Item label="All Branches" value="" />
              {branches.map(b => (
                <Picker.Item key={b.id || b.name} label={b.name} value={b.name} />
              ))}
            </Picker>
          </View>
          <View style={styles.filterItem}>
            <Picker
              selectedValue={reportStaff}
              style={{height:40}}
              onValueChange={setReportStaff}>
              <Picker.Item label="All Staff" value="" />
              {users.filter(u => u.role && (u.role.toLowerCase().includes('teacher') || u.role.toLowerCase().includes('staff'))).map(u => (
                <Picker.Item key={u.id} label={u.name} value={u.id} />
              ))}
            </Picker>
          </View>
          <Picker
            selectedValue={reportMonth}
            style={{height:40, width:100}}
            onValueChange={setReportMonth}>
            {[...Array(12).keys()].map(m => (
              <Picker.Item key={m+1} label={new Date(0, m).toLocaleString('default', { month: 'long' })} value={m+1} />
            ))}
          </Picker>
          <Picker
            selectedValue={reportYear}
            style={{height:40, width:100}}
            onValueChange={setReportYear}>
            {[...Array(5).keys()].map(y => (
              <Picker.Item key={y} label={`${new Date().getFullYear() - 2 + y}`} value={new Date().getFullYear() - 2 + y} />
            ))}
          </Picker>
          <TouchableOpacity onPress={fetchStaffReports} style={styles.filterButton}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>Filter</Text>
          </TouchableOpacity>
        </View>
        {loadingReports ? <ActivityIndicator size="small" color="#4F46E5" style={{marginVertical:16}} /> : staffReports.length === 0 ? (
          <Text style={{color:'#888', textAlign:'center', marginVertical:12}}>No reports found.</Text>
        ) : (
          <ScrollView style={{marginTop:8}} contentContainerStyle={{paddingBottom:8}}>
            {Object.keys(groupReportsByDate(staffReports)).sort().map(date => (
              <View key={date} style={styles.dayBox}>
                <Text style={styles.dayTitle}>{date}</Text>
                <ScrollView horizontal>
                  <View>
                    <View style={styles.headerRow}>
                      <Text style={styles.headerCell}>Staff</Text>
                      <Text style={styles.headerCell}>Branch</Text>
                      <Text style={styles.headerCell}>Clock In</Text>
                      <Text style={styles.headerCell}>Clock Out</Text>
                      <Text style={[styles.headerCell, {width:160}]}>Report</Text>
                      <Text style={styles.headerCell}>To</Text>
                    </View>
                    {groupReportsByDate(staffReports)[date].map(r => (
                      <View key={r.id} style={styles.dataRow}>
                        <Text style={styles.dataCell}>{(users.find(u => u.id == r.staff_id) || {}).name || r.staff_id}</Text>
                        <Text style={styles.dataCell}>{r.branch}</Text>
                        <Text style={styles.dataCell}>{r.clock_in || '-'}</Text>
                        <Text style={styles.dataCell}>{r.clock_out || '-'}</Text>
                        <Text style={[styles.dataCell, {width:160}]} numberOfLines={2} ellipsizeMode="tail">{r.report || '-'}</Text>
                        <Text style={styles.dataCell}>{r.submitted_to || '-'}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', paddingTop: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4b2996', alignSelf: 'center', marginBottom: 12 },
  card: { backgroundColor:'#fff', borderRadius:12, padding:12, margin:8, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10, elevation:2, flex:1 },
  filterRow: { flexDirection:'row', flexWrap:'wrap', marginBottom:12, gap:8, alignItems:'center' },
  filterItem: { flex:1, minWidth:120, marginRight:4 },
  filterButton: { backgroundColor:'#4F46E5', borderRadius:8, paddingHorizontal:16, justifyContent:'center', height:40, marginLeft:4 },
  headerRow: { flexDirection:'row', borderBottomWidth:1, borderColor:'#eee', paddingBottom:6, marginBottom:6 },
  headerCell: { width:90, fontWeight:'bold' },
  dataRow: { flexDirection:'row', borderBottomWidth:1, borderColor:'#f5f5f5', paddingVertical:6 },
  dataCell: { width:90 },
  dayBox: { backgroundColor:'#fff', borderRadius:10, padding:10, marginBottom:12, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:4, elevation:1 },
  dayTitle: { fontWeight:'bold', fontSize:16, color:'#4b2996', marginBottom:4 },
});

export default StaffAttendanceScreen;
