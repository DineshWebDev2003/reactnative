import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, FlatList, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { handleLogout } from '../utils/logout';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Animated } from 'react-native';

function SummaryCard({ gradientColors, icon, label, value, style }) {
  const scale = React.useRef(new Animated.Value(0.9)).current;
  React.useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [value]);
  return (
    <Animated.View style={{
      ...style,
    }}>
      <LinearGradient colors={gradientColors} style={{ borderRadius: 18, padding: 0 }}>
        <BlurView intensity={30} tint="light" style={{ borderRadius: 18, padding: 12, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 32, padding: 10, marginBottom: 10, shadowColor: '#fff', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
            {icon}
          </View>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 2, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: {width:0, height:1}, textShadowRadius:2 }}>{label}</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: {width:0, height:2}, textShadowRadius:3 }}>{value}</Text>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}

function QuickActionButton({ gradientColors, icon, label, onPress, isFirst, isLast }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <Animated.View style={{
      width: 96,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: (isLast ? 0 : 10),
      marginLeft: (isFirst ? 0 : 10),
      marginBottom: 14,
      borderRadius: 24,
      backgroundColor: '#fff',
      shadowColor: gradientColors[1],
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ alignItems: 'center' }}
      >
        <LinearGradient
           colors={gradientColors.length > 2 ? gradientColors : [gradientColors[0], gradientColors[1], '#fff']}
           start={[0.1, 0.1]}
           end={[0.9, 0.9]}
           style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
            shadowColor: gradientColors[1],
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.7)',
          }}
        >
           {React.cloneElement(icon, { size: 22 })}
         </LinearGradient>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 12,
            color: '#333',
            textAlign: 'center',
            marginTop: 2,
            letterSpacing: 0.2,
            maxWidth: 80,
            paddingHorizontal: 2,
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TeacherDashboard() {
  const navigation = useNavigation();
  const [teacher, setTeacher] = useState({
    name: 'Miss Anu',
    branch: 'TN Happy Kids - Main Branch',
    profilePic: require('../assets/Avartar.png'),
  });
  const [parents, setParents] = useState([]);
  const [studentCards, setStudentCards] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null); // {clock_in, clock_out, report}
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadTeacherProfile();
    fetchAttendance();
    AsyncStorage.getItem('userId').then(setUserId);
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    if (teacher.branch && teacher.branch !== 'Branch Not Assigned') {
      fetchTimetable();
    }
  }, [teacher.branch]);

  const loadTeacherProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`${BASE_URL}/get_teacher_profile.php?userId=${userId}`);
        const data = await response.json();
        if (data.success && data.teacher) {
          setTeacher({
            name: data.teacher.name || 'Teacher',
            branch: data.teacher.branch || 'Branch Not Assigned',
            profilePic: data.teacher.profile_pic ? { uri: `${BASE_URL}/${data.teacher.profile_pic}` } : require('../assets/Avartar.png'),
          });
        }
      }
    } catch (error) {
      console.log('Error loading teacher profile:', error);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`${BASE_URL}/get_students_for_teacher.php?teacherId=${userId}`);
        const data = await response.json();
        if (data.success && data.students) {
          setStudentCards(data.students);
        }
      }
    } catch (error) {
      console.log('Error loading students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchTimetable = async () => {
    setLoadingTimetable(true);
    try {
      // Log and trim the branch value
      const branchParam = teacher.branch ? teacher.branch.trim() : '';
      console.log('Fetching timetable for branch:', branchParam);
      const response = await fetch(`${BASE_URL}/get_timetable.php?branch=${encodeURIComponent(branchParam)}`);
      const data = await response.json();
      if (data.success && data.periods) {
        setTimetable(data.periods);
        console.log('Timetable API response:', data.periods);
      } else {
        setTimetable([]);
        console.log('Timetable API response: []');
      }
    } catch (error) {
      setTimetable([]);
      console.log('Timetable API error:', error);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const response = await fetch(`${BASE_URL}/get_attendance.php?branch=${encodeURIComponent(teacher.branch)}&date=${today}`);
      const data = await response.json();
      if (data.success && data.attendance) {
        setAttendanceList(data.attendance);
      } else {
        setAttendanceList([]);
      }
    } catch (error) {
      setAttendanceList([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchTodayAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const id = await AsyncStorage.getItem('userId');
      if (!id) return;
      const res = await fetch(`${BASE_URL}/get_staff_attendance.php?staff_id=${id}&branch=${encodeURIComponent(teacher.branch)}&date=${today}`);
      const data = await res.json();
      if (data.success && data.attendance) {
        setAttendanceStatus(data.attendance);
        setReportText(data.attendance.report || '');
      } else {
        setAttendanceStatus(null);
        setReportText('');
      }
    } catch (e) {
      setAttendanceStatus(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleClockIn = async () => {
    setAttendanceLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/staff_clock_in.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: userId, branch: teacher.branch })
      });
      const data = await res.json();
      Alert.alert(data.success ? 'Success' : 'Error', data.message);
      fetchTodayAttendance();
    } catch (e) {
      Alert.alert('Error', 'Failed to clock in');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleClockOut = async () => {
    setAttendanceLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/staff_clock_out.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: userId, branch: teacher.branch })
      });
      const data = await res.json();
      Alert.alert(data.success ? 'Success' : 'Error', data.message);
      fetchTodayAttendance();
    } catch (e) {
      Alert.alert('Error', 'Failed to clock out');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    setReportSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/submit_staff_report.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: userId, branch: teacher.branch, report: reportText, submitted_to: 'both' })
      });
      const data = await res.json();
      Alert.alert(data.success ? 'Success' : 'Error', data.message);
      fetchTodayAttendance();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const renderStudentCard = ({ item }) => {
    const cardWidth = Dimensions.get('window').width / 2 - 28;
    const cardHeight = cardWidth * 3 / 4;
    const imageSource = item.child_photo
      ? { uri: `${BASE_URL}/${item.child_photo}` }
      : require('../assets/Avartar.png');
    return (
      <TouchableOpacity
        style={[styles.studentCard, { width: cardWidth, height: cardHeight }]}
        onPress={() => {/* handle selection or navigation here */}}
        activeOpacity={0.85}
      >
        <Image
          source={imageSource}
          style={styles.studentImage}
          resizeMode="cover"
        />
        {item.activity_time && (
          <View style={styles.activityBadge}>
            <Text style={styles.activityBadgeText}>{item.activity_time}</Text>
          </View>
        )}
        <View style={styles.studentOverlay}>
          <Text style={styles.studentName}>{item.childName || item.name}</Text>
          <Text style={styles.studentBranch}>{item.branch}</Text>
          <Text style={styles.studentClass}>{item.childClass}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Debug log for timetable data
  console.log('Timetable:', timetable);
  // Render raw timetable data for debugging
  <View style={{padding: 10, backgroundColor: '#fff', borderRadius: 8, marginBottom: 12}}>
    <Text style={{fontSize: 12, color: '#333'}}>Raw Timetable Data:</Text>
    <Text style={{fontSize: 11, color: '#a084ca'}}>{JSON.stringify(timetable, null, 2)}</Text>
  </View>
  // Group timetable by day, try alternative property names
  const timetableByDay = timetable.reduce((acc, period) => {
    const day = (period.day_name || period.day || period.weekday || '').charAt(0).toUpperCase() + (period.day_name || period.day || period.weekday || '').slice(1).toLowerCase();
    if (!acc[day]) acc[day] = [];
    acc[day].push(period);
    return acc;
  }, {});
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Debug logs for diagnosis
  console.log('Timetable (raw):', timetable);
  console.log('TimetableByDay keys:', Object.keys(timetableByDay));
  console.log('SelectedDay:', selectedDay);

  // Defensive: fallback for teacher object
  const safeTeacher = teacher || {};
  // Defensive: fallback for parents, studentCards, timetable, attendanceList
  const safeParents = Array.isArray(parents) ? parents : [];
  const safeStudentCards = Array.isArray(studentCards) ? studentCards : [];
  const safeTimetable = Array.isArray(timetable) ? timetable : [];
  const safeAttendanceList = Array.isArray(attendanceList) ? attendanceList : [];
  // Defensive: fallback for images
  const defaultAvatar = require('../assets/Avartar.png');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{paddingBottom: 32}} showsVerticalScrollIndicator={false}>
        <View style={{margin: 16}}>
          {/* Profile Section */}
          <View style={styles.topRow}>
            <View style={styles.profileContainer}>
              <Image source={safeTeacher.profilePic || defaultAvatar} style={styles.profilePic} />
              <View style={styles.profileTextContainer}>
                <Text style={styles.teacherName}>{safeTeacher.name}</Text>
                <Text style={styles.branchName}>{safeTeacher.branch}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={() => handleLogout(navigation)}>
              <MaterialIcons name="logout" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.className}>Class: Butterflies</Text>
            <Text style={styles.totalStudents}>Total Students: 30</Text>
          </View>
          {/* Quick Tabs */}
          <View style={styles.quickTabs}>
            <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('MarkAttendance')}>
              <MaterialIcons name="check-circle" size={18} color="#a084ca" style={{marginRight: 6}} />
              <Text style={styles.tabText}>Mark Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <FontAwesome5 name="file-alt" size={16} color="#a084ca" style={{marginRight: 6}} />
              <Text style={styles.tabText}>Upload Progress Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('PostActivity')}>
              <Entypo name="camera" size={18} color="#a084ca" style={{marginRight: 6}} />
              <Text style={styles.tabText}>Post Daily Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Ionicons name="mail" size={18} color="#a084ca" style={{marginRight: 6}} />
              <Text style={styles.tabText}>Message Parents</Text>
            </TouchableOpacity>
          </View>
          {/* Timetable Section (Tabbed, View Only) */}
<View style={{backgroundColor:'#fff', borderRadius:12, padding:16, marginVertical:16, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10, elevation:2}}>
  <Text style={{fontWeight:'bold', fontSize:17, marginBottom:10}}>Timetable</Text>
  <View style={{flexDirection:'row', justifyContent:'center', marginBottom:12}}>
    {daysOfWeek.map(day => (
      <TouchableOpacity key={day} onPress={() => setSelectedDay(day)} style={{padding:8, marginHorizontal:4, borderRadius:6, backgroundColor: selectedDay===day ? '#4F46E5' : '#eee'}}>
        <Text style={{color: selectedDay===day ? '#fff' : '#333', fontWeight:'bold'}}>{day.slice(0,3)}</Text>
      </TouchableOpacity>
    ))}
  </View>
  {loadingTimetable ? (
    <ActivityIndicator size="small" color="#4F46E5" style={{marginVertical:16}} />
  ) : timetableByDay[selectedDay] && timetableByDay[selectedDay].length > 0 ? (
    timetableByDay[selectedDay].map(period => (
      <View key={period.id} style={{backgroundColor:'#f9f9f9', borderRadius:8, padding:10, marginBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
        <View>
          <Text style={{fontWeight:'bold', fontSize:15}}>{period.start} - {period.end}</Text>
          <Text style={{color:'#333'}}>{period.description}</Text>
        </View>
      </View>
    ))
  ) : (
    <Text style={{color:'#888', textAlign:'center', marginVertical:12}}>No periods for this day.</Text>
  )}
</View>
          {/* Attendance Section (View Only) */}
          <View style={{backgroundColor:'#fff', borderRadius:16, padding:0, marginVertical:18, shadowColor:'#000', shadowOpacity:0.07, shadowRadius:12, elevation:3, borderWidth:1, borderColor:'#e0e0f0'}}>
            <View style={{backgroundColor:'#43cea2', borderTopLeftRadius:16, borderTopRightRadius:16, paddingVertical:12, paddingHorizontal:18, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
              <Text style={{fontWeight:'bold', fontSize:18, color:'#fff', letterSpacing:0.5}}>Today's Attendance</Text>
              <MaterialIcons name="check-circle" size={22} color="#fff" />
            </View>
            <View style={{paddingHorizontal:14, paddingBottom:16, paddingTop:10}}>
              {loadingAttendance ? (
                <ActivityIndicator size="small" color="#43cea2" style={{marginVertical:18}} />
              ) : safeAttendanceList.length === 0 ? (
                <Text style={{color:'#888', textAlign:'center', marginVertical:18, fontSize:15}}>No attendance records found for today.</Text>
              ) : (
                safeAttendanceList.map((item, idx, arr) => (
                  <View key={item.id || idx} style={{backgroundColor:'#f9f9f9', borderRadius:10, padding:12, marginBottom:idx===arr.length-1?0:10, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#ede7f6', justifyContent:'space-between'}}>
                    <View style={{flex:1}}>
                      <Text style={{fontWeight:'bold', fontSize:15, color:'#4F46E5'}}>{item.name || item.student_name || 'N/A'}</Text>
                      <Text style={{color:'#888', fontSize:13}}>{item.branch || ''}</Text>
                    </View>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                      <Text style={{fontWeight:'bold', color: item.status==='present' ? '#43cea2' : item.status==='absent' ? '#e74c3c' : '#f39c12', fontSize:15, marginRight:8}}>{item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : '-'}</Text>
                      <MaterialIcons name={item.status==='present' ? 'check-circle' : item.status==='absent' ? 'cancel' : 'help'} size={22} color={item.status==='present' ? '#43cea2' : item.status==='absent' ? '#e74c3c' : '#f39c12'} />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
          {/* Staff Attendance Section */}
<View style={{backgroundColor:'#fff', borderRadius:12, padding:16, marginVertical:16, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10, elevation:2}}>
  <Text style={{fontWeight:'bold', fontSize:17, marginBottom:10}}>Staff Attendance</Text>
  {attendanceLoading ? (
    <ActivityIndicator size="small" color="#4F46E5" style={{marginVertical:16}} />
  ) : attendanceStatus && attendanceStatus.clock_in ? (
    <>
      <Text style={{marginBottom:6}}>Clock In: <Text style={{fontWeight:'bold'}}>{attendanceStatus.clock_in}</Text></Text>
      <Text style={{marginBottom:6}}>Clock Out: <Text style={{fontWeight:'bold'}}>{attendanceStatus.clock_out || '-'}</Text></Text>
      {!attendanceStatus.clock_out && (
        <TouchableOpacity style={[styles.createButton, {marginBottom:10, backgroundColor:'#43cea2'}]} onPress={handleClockOut}>
          <Text style={{color:'#fff', fontWeight:'bold'}}>Clock Out</Text>
        </TouchableOpacity>
      )}
      <Text style={{marginTop:10, fontWeight:'bold'}}>Today’s Report:</Text>
      <TextInput
        style={{backgroundColor:'#f9f9f9', borderRadius:8, padding:10, marginTop:6, minHeight:60, borderWidth:1, borderColor:'#eee'}}
        placeholder="Enter your report for today..."
        value={reportText}
        onChangeText={setReportText}
        editable={!attendanceStatus.report}
        multiline
      />
      <TouchableOpacity
        style={[styles.createButton, {marginTop:10, backgroundColor:'#a084ca', opacity: attendanceStatus.report ? 0.5 : 1}]}
        onPress={handleSubmitReport}
        disabled={!!attendanceStatus.report || reportSubmitting}
      >
        <Text style={{color:'#fff', fontWeight:'bold'}}>Submit Report</Text>
      </TouchableOpacity>
      {attendanceStatus.report && (
        <Text style={{marginTop:8, color:'#43cea2', fontWeight:'bold'}}>Report already submitted.</Text>
      )}
    </>
  ) : (
    <TouchableOpacity style={[styles.createButton, {backgroundColor:'#4F46E5'}]} onPress={handleClockIn}>
      <Text style={{color:'#fff', fontWeight:'bold'}}>Clock In</Text>
    </TouchableOpacity>
  )}
</View>
          {/* Pending Parent Replies */}
          <View style={styles.pendingReplies}>
            <Text style={styles.pendingTitle}>Pending Parent Replies</Text>
            <View style={styles.pendingItem}>
              <Entypo name="dot-single" size={18} color="#a084ca" />
              <Text style={styles.pendingText}>Parent 1: Absent note</Text>
            </View>
            <View style={styles.pendingItem}>
              <Entypo name="dot-single" size={18} color="#a084ca" />
              <Text style={styles.pendingText}>Parent 2: Homework query</Text>
            </View>
          </View>
          {/* Message Parents Section */}
          <TouchableOpacity
            style={styles.messageSection}
            onPress={() => navigation.navigate('MessageParentsScreen')}
          >
            <Text style={styles.messageTitle}>Message Parents</Text>
            <MaterialIcons name="arrow-forward-ios" size={20} color="#a084ca" style={{ position: 'absolute', right: 16, top: 20 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3e8ff',
  },
  statusBar: {
    height: 0, // Adjust based on your status bar height
    backgroundColor: '#f3e8ff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    backgroundColor: '#f3e8ff',
    paddingBottom: 32,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20, // Added margin-top as requested
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 15,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#a084ca',
  },
  profileTextContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  teacherName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#a084ca',
    marginBottom: 4,
  },
  branchName: {
    color: '#6c3483',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#a084ca',
    borderRadius: 8,
    shadowColor: '#a084ca',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a084ca33',
    shadowColor: '#a084ca',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  className: {
    color: '#a084ca',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 6,
  },
  totalStudents: {
    color: '#6c3483',
    fontSize: 16,
    fontWeight: '600',
  },
  quickTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tab: {
    backgroundColor: '#e9d6f7',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#a084ca',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c3483',
    textAlign: 'center',
  },
  scheduleSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#a084ca22',
    shadowColor: '#a084ca',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  scheduleTitle: {
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 15,
    fontSize: 18,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleTime: {
    color: '#6c3483',
    fontWeight: '600',
    fontSize: 14,
  },
  scheduleActivity: {
    color: '#333',
    fontSize: 14,
  },
  pendingReplies: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#a084ca22',
    shadowColor: '#a084ca',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  pendingTitle: {
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 12,
    fontSize: 18,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pendingText: {
    color: '#333',
    fontSize: 14,
    marginLeft: 4,
  },
  messageSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#a084ca22',
    shadowColor: '#a084ca',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  messageTitle: {
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 15,
    fontSize: 18,
  },
  parentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  childName: {
    fontSize: 14,
    color: '#666',
  },
  noParents: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    paddingVertical: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  studentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  activityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#a084caee',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  activityBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  studentOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  studentName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  studentBranch: {
    color: '#e0d7f7',
    fontSize: 12,
  },
  studentClass: {
    color: '#f7b2ff',
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#a084ca',
    fontSize: 18,
    marginBottom: 12,
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
}); 