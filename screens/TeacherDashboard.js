import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, FlatList, ActivityIndicator, Dimensions, TextInput, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { handleLogout } from '../utils/logout';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Animated } from 'react-native';
import ActivityViewerModal from '../components/ActivityViewerModal';

// Utility to render HH:MM from HH:MM:SS coming from API
const formatTime = (t) => (t && t.length >= 5 ? t.slice(0, 5) : '--:--');

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
    id: '',
    name: 'Miss Anu',
    branch: 'TN Happy Kids - Main Branch',
    profilePic: { uri: 'https://app.tnhappykids.in/assets/Avartar.png' },
    email: ''
  });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [timetable, setTimetable] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [todayAttendanceCount, setTodayAttendanceCount] = useState(0);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- Activity Slider State for Today ---
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Robust filter for today's activities, ignoring timezone issues
  const today = new Date();
  const isSameDay = (dateString) => {
    if (!dateString) return false;
    const activityDate = new Date(dateString);
    return (
      activityDate.getFullYear() === today.getFullYear() &&
      activityDate.getMonth() === today.getMonth() &&
      activityDate.getDate() === today.getDate()
    );
  };
  const filteredActivities = recentActivities.filter(act => isSameDay(act.created_at));

  // Auto-slide with fade animation
  useEffect(() => {
    if (filteredActivities.length > 1) {
      const interval = setInterval(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setCurrentActivityIndex(prev => (prev + 1) % filteredActivities.length);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [filteredActivities, fadeAnim]);

  const handleProgressBarTap = idx => {
    if (idx !== currentActivityIndex) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentActivityIndex(idx);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const getToday = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchTodayAttendanceCount = async () => {
    try {
      const today = getToday();
      if (!teacher || !teacher.branch) {
        setTodayAttendanceCount(0);
        return;
      }
      const response = await fetch(`${BASE_URL}/get_attendance.php?branch=${encodeURIComponent(teacher.branch)}&date=${today}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.attendance)) {
        // Only count records with a name and status (present)
        const validAttendance = data.attendance.filter(item =>
          (item.childName || item.name) && item.status
        );
        setTodayAttendanceCount(validAttendance.length);
      } else {
        setTodayAttendanceCount(0);
      }
    } catch (error) {
      setTodayAttendanceCount(0);
      console.error("Failed to fetch today's attendance count:", error);
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    fetchUserId();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Re-fetch all data
    await loadTeacherProfile();
    await fetchAttendance();
    await fetchTodayAttendanceCount();
    await fetchTodayAttendance();
    await loadStudents();
    await fetchTimetable();
    // fetchRecentActivities will be triggered by the `teacher` state update
    setRefreshing(false);
  }, [teacher.branch]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadTeacherProfile();
        await fetchAttendance();
        await fetchTodayAttendanceCount();
        await fetchTodayAttendance();
        await loadStudents();
        await fetchTimetable();
      };

      loadData();

      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  // Removed useFocusEffect and any other auto-refresh on focus/navigation.

  const loadTeacherProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`${BASE_URL}/get_teacher_profile.php?userId=${userId}`);
        const data = await response.json();
        if (data.success && data.teacher) {
          // Handle profile picture with better error checking
          let profilePic = { uri: 'https://app.tnhappykids.in/assets/Avartar.png' }; // Default avatar
          if (data.teacher.profile_pic && data.teacher.profile_pic !== 'null' && data.teacher.profile_pic !== '') {
            if (data.teacher.profile_pic.startsWith('http')) {
              profilePic = { uri: data.teacher.profile_pic };
            } else {
              profilePic = { uri: `${BASE_URL}/${data.teacher.profile_pic}` };
            }
          }

          setTeacher({
            id: data.teacher.id,
            name: data.teacher.name || 'Teacher',
            branch: data.teacher.branch || 'Branch Not Assigned',
            profilePic: profilePic,
            email: data.teacher.email || ''
          });
          // Debug log
          console.log('Loaded teacher profile:', data.teacher);
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
        console.log('Students API response:', data);
        if (data.success && data.students) {
          console.log('Setting students with data:', data.students);
          setStudents(data.students);
        }
      }
    } catch (error) {
      console.log('Error loading students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const userId = await AsyncStorage.getItem('userId');
      
      // Get teacher profile to get branch information
      let branch = teacher.branch;
      if (!branch || branch === 'Branch Not Assigned') {
        const response = await fetch(`${BASE_URL}/get_teacher_profile.php?userId=${userId}`);
        const data = await response.json();
        if (data.success && data.teacher) {
          branch = data.teacher.branch || '';
        }
      }
      
      if (!branch) {
        setAttendanceList([]);
        setLoadingAttendance(false);
        return;
      }
      
      const response = await fetch(`${BASE_URL}/get_attendance.php?branch=${encodeURIComponent(branch)}&date=${today}`);
      const data = await response.json();
      if (data.success && data.attendance) {
        // Filter out records without student names and show only marked attendance
        const validAttendance = data.attendance.filter(item => 
          (item.childName || item.name) && item.status
        );
        setAttendanceList(validAttendance);
        setTodayAttendanceCount(validAttendance.length);
      } else {
        setAttendanceList([]);
        setTodayAttendanceCount(0);
      }
    } catch (error) {
      console.log('Error fetching attendance:', error);
      setAttendanceList([]);
      setTodayAttendanceCount(0);
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
    console.log('ClockIn userId:', userId);
    console.log('ClockIn teacher:', teacher);
    if (!userId || !teacher || !teacher.branch || teacher.branch === 'Branch Not Assigned') {
      Alert.alert(
        'Missing Info',
        'Cannot clock in: Staff ID or Branch is missing. Please ensure your profile is complete and try again.'
      );
      return;
    }
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
      fetchAttendance();
    } catch (e) {
      Alert.alert('Error', 'Failed to clock in');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleClockOut = async () => {
    // Check if report is filled before allowing clock out
    if (!reportText.trim()) {
      Alert.alert('Report Required', 'Please fill in today\'s progress report before clocking out.');
      return;
    }
    
    setAttendanceLoading(true);
    try {
      // First submit the report
      const reportRes = await fetch(`${BASE_URL}/submit_staff_report.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: userId, branch: teacher.branch, report: reportText.trim(), submitted_to: 'both' })
      });
      const reportData = await reportRes.json();
      
      if (!reportData.success) {
        Alert.alert('Error', reportData.message || 'Failed to submit report');
        setAttendanceLoading(false);
        return;
      }
      
      // Then clock out
      const res = await fetch(`${BASE_URL}/staff_clock_out.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: userId, branch: teacher.branch })
      });
      const data = await res.json();
      Alert.alert(data.success ? 'Success' : 'Error', data.message);
      fetchTodayAttendance();
      fetchAttendance();
    } catch (e) {
      Alert.alert('Error', 'Failed to clock out');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    // Validate report length
    if (!reportText.trim()) {
      Alert.alert('Error', 'Please enter a report before submitting.');
      return;
    }
    
    if (reportText.trim().length < 20) {
      Alert.alert('Error', 'Please enter at least 20 characters for a meaningful report.');
      return;
    }
    
    setReportSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/submit_staff_report.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: userId, branch: teacher.branch, report: reportText.trim(), submitted_to: 'both' })
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

  const fetchRecentActivities = async () => {
    setLoadingActivities(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setRecentActivities([]);
        setLoadingActivities(false);
        return;
      }
      console.log('Fetching activities for teacher ID:', userId);
      const response = await fetch(`${BASE_URL}/get_activities.php?teacher_id=${userId}`);
      const data = await response.json();
      console.log('Recent activities API response:', data);
      if (data.success && data.activities) {
        setRecentActivities(data.activities);
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      setRecentActivities([]);
      console.log('Fetch recent activities error:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchTimetable = async () => {
    setLoadingTimetable(true);
    try {
      const response = await fetch(`${BASE_URL}/get_timetable.php?branch=${encodeURIComponent(teacher.branch)}`);
      const data = await response.json();
      if (data.success && data.periods) {
        setTimetable(data.periods);
      } else {
        setTimetable([]);
      }
    } catch (error) {
      console.log('Error fetching timetable:', error);
      setTimetable([]);
    } finally {
      setLoadingTimetable(false);
    }
  };

  // Ensure fetchRecentActivities runs only after teacher is loaded
  useEffect(() => {
    if (teacher && teacher.branch && teacher.branch !== 'Branch Not Assigned') {
      fetchRecentActivities();
      console.log('Teacher state after setTeacher:', teacher);
    }
  }, [teacher]);

  const renderActivityCard = ({ item }) => {
    const imageSource = item.image_url ? { uri: `${BASE_URL}/${item.image_url}` } : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' };
    return (
      <View style={styles.activityCard}>
        <Image source={imageSource} style={styles.activityImage} />
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityDescription}>{item.description}</Text>
          <View style={styles.activityActions}>
            <TouchableOpacity style={styles.editButton}>
              <MaterialIcons name="edit" size={18} color="#a084ca" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton}>
              <MaterialIcons name="delete" size={18} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderStudentCard = ({ item }) => {
    const cardWidth = Dimensions.get('window').width / 2 - 28;
    const cardHeight = cardWidth * 3 / 4;
    
    // Determine image source with better error handling
    let imageSource = { uri: 'https://app.tnhappykids.in/assets/Avartar.png' }; // Default avatar
    
    if (item.child_photo && item.child_photo !== 'null' && item.child_photo !== '') {
      // Check if it's already a full URL or needs BASE_URL prefix
      if (item.child_photo.startsWith('http')) {
        imageSource = { uri: item.child_photo };
      } else {
        imageSource = { uri: `${BASE_URL}/${item.child_photo}` };
      }
    } else if (item.profile_pic && item.profile_pic !== 'null' && item.profile_pic !== '') {
      if (item.profile_pic.startsWith('http')) {
        imageSource = { uri: item.profile_pic };
      } else {
        imageSource = { uri: `${BASE_URL}/${item.profile_pic}` };
      }
    }
    
    console.log('Student data for card:', {
      id: item.id,
      name: item.childName || item.name,
      child_photo: item.child_photo,
      profile_pic: item.profile_pic,
      imageSource: imageSource
    });
    return (
      <TouchableOpacity
        style={{
          width: cardWidth,
          height: cardHeight,
          backgroundColor: '#fff',
          borderRadius: 16,
          margin: 8,
          shadowColor: '#a084ca',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
          overflow: 'hidden',
        }}
        onPress={() => {
          // Navigate to student details or chat
          Alert.alert('Student', `View details for ${item.childName || item.name}`);
        }}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          marginBottom: 8,
          borderWidth: 2,
          borderColor: '#a084ca',
          overflow: 'hidden',
          backgroundColor: '#f0f0f0',
        }}>
          <Image
            source={imageSource}
            style={{
              width: '100%',
              height: '100%',
            }}
            onError={() => {
              console.log('Image failed to load for student:', item.childName || item.name);
            }}
            defaultSource={require('../assets/Avartar.png')}
            resizeMode="cover"
          />
        </View>
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 14,
              color: '#333',
              textAlign: 'center',
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {item.childName || item.name || 'Student'}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#666',
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {item.childClass || item.class || 'Class'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getAllPeriods = (timetable) => {
    const periodMap = {};
    timetable.forEach(period => {
      const key = `${period.start_time}-${period.end_time}`;
      if (!periodMap[key]) {
        periodMap[key] = {
          start_time: period.start_time,
          end_time: period.end_time,
          label: period.period || `${formatTime(period.start_time)} - ${formatTime(period.end_time)}`,
        };
      }
    });
    // Sort by start_time
    return Object.values(periodMap).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const renderTimetableGrid = () => {
    if (!timetable || timetable.length === 0) return null;

    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayNames = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday'
    };

    // Get all periods (rows)
    const allPeriods = getAllPeriods(timetable);

    // Build grid: { [periodKey]: { [day]: periodObj } }
    const grid = {};
    allPeriods.forEach(periodSlot => {
      const key = `${periodSlot.start_time}-${periodSlot.end_time}`;
      grid[key] = {};
      dayOrder.forEach(day => {
        grid[key][day] = null;
      });
    });
    timetable.forEach(period => {
      const key = `${period.start_time}-${period.end_time}`;
      const day = period.day?.toLowerCase();
      if (grid[key] && dayOrder.includes(day)) {
        grid[key][day] = period;
      }
    });

    return (
      <ScrollView horizontal style={{ marginTop: 10 }}>
        <View>
          {/* Header Row: Days */}
          <View style={{ flexDirection: 'row', backgroundColor: '#f3f3fa', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <View style={{ width: 80, padding: 8 }} />
            {dayOrder.map(day => (
              <View key={day} style={{ flex: 1, minWidth: 110, padding: 8 }}>
                <Text style={{ fontWeight: 'bold', color: '#6c47a6', textAlign: 'center' }}>{dayNames[day]}</Text>
              </View>
            ))}
          </View>
          {/* Period Rows */}
          {allPeriods.map(periodSlot => {
            const key = `${periodSlot.start_time}-${periodSlot.end_time}`;
            return (
              <View key={key} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' }}>
                {/* Period label */}
                <View style={{ width: 80, padding: 8, borderRightWidth: 1, borderColor: '#eee', backgroundColor: '#f6f0ff' }}>
                  <Text style={{ fontWeight: 'bold', color: '#a084ca', textAlign: 'center' }}>
                    {formatTime(periodSlot.start_time)} - {formatTime(periodSlot.end_time)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                    {formatTime(periodSlot.start_time)} - {formatTime(periodSlot.end_time)}
                  </Text>
                </View>
                {/* Period cells */}
                {dayOrder.map(day => {
                  const period = grid[key][day];
                  return (
                    <View
                      key={day}
                      style={{
                        flex: 1,
                        minWidth: 110,
                        padding: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRightWidth: day !== 'saturday' ? 1 : 0,
                        borderColor: '#eee',
                        backgroundColor: period ? '#f9f6ff' : '#fff'
                      }}
                    >
                      {period ? (
                        <>
                          <Text style={{ fontWeight: 'bold', color: '#6c47a6', marginBottom: 2 }}>{period.subject}</Text>
                          <Text style={{ fontSize: 12, color: '#444' }}>{period.description || ''}</Text>
                          <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                            {formatTime(period.start_time)} - {formatTime(period.end_time)}
                          </Text>
                        </>
                      ) : (
                        <Text style={{ color: '#ccc', fontSize: 12 }}>—</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderTimetableItem = ({ item }) => {
    const dayNames = {
      'monday': 'Monday',
      'tuesday': 'Tuesday', 
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };
    
    return (
      <View style={styles.timetableItem}>
        <View style={styles.timetableHeader}>
          <Text style={styles.timetableDay}>{dayNames[item.day?.toLowerCase()] || item.day}</Text>
          <Text style={styles.timetableTime}>
            {formatTime(item.start_time)} - {formatTime(item.end_time)}
          </Text>
        </View>
        <View style={styles.timetableContent}>
          <Text style={styles.timetableSubject}>{item.subject || 'General Activity'}</Text>
          <Text style={styles.timetableDescription}>{item.description || 'Class activity'}</Text>
          {item.branch && item.branch !== 'ALL' && (
            <Text style={styles.timetableBranch}>Branch: {item.branch}</Text>
          )}
        </View>
      </View>
    );
  };

  const safeAttendanceList = Array.isArray(attendanceList) ? attendanceList : [];

  return (
    <View style={styles.container}>
      <ActivityViewerModal
        visible={modalVisible}
        imageUrl={selectedImage}
        onClose={() => setModalVisible(false)}
      />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#a084ca']} />}
      >
        <View style={styles.content}>
          {/* Profile Section */}
          <View style={styles.topRow}>
            <View style={styles.profileContainer}>
              <Image source={teacher.profilePic} style={styles.profilePic} />
              <View style={styles.profileTextContainer}>
                <Text style={styles.teacherName}>{teacher.name}</Text>
                <Text style={styles.branchName}>{teacher.branch}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={() => handleLogout(navigation)}>
              <MaterialIcons name="logout" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Activity Slider */}
          {filteredActivities.length > 0 && (
            <View style={{marginTop: 16, marginBottom: 24, alignItems: 'center'}}>
            <TouchableOpacity onPress={() => {
              const imageUrl = filteredActivities[currentActivityIndex].image_path ? `${BASE_URL}/${filteredActivities[currentActivityIndex].image_path}` : 'https://app.tnhappykids.in/assets/Avartar.png';
              setSelectedImage(imageUrl);
              setModalVisible(true);
            }}>
              <Animated.View style={{
                width: 240, height: 300, borderRadius: 20, overflow: 'hidden', backgroundColor:'#fff',
                shadowColor: '#a084ca', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: {width:0, height:4}, elevation: 7,
                opacity: fadeAnim,
              }}>
                <View style={{flex:1, position:'relative'}}>
                  {/* Activity Image (4:5 ratio) */}
                  <Image
                    source={filteredActivities[currentActivityIndex].image_path ? { uri: `${BASE_URL}/${filteredActivities[currentActivityIndex].image_path}` } : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' }}
                    style={{width:'100%', height:'100%', resizeMode:'cover', aspectRatio: 4/5}}
                  />
                  {/* Overlay: Branch, Kid Name, Activity Name, Date */}
                  <View style={{position:'absolute', left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.32)', padding:12}}>
                    <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}} numberOfLines={1}>
                      {filteredActivities[currentActivityIndex].childName || filteredActivities[currentActivityIndex].name || 'Unknown Kid'}
                    </Text>
                    <Text style={{color:'#fff', fontSize:13}} numberOfLines={1}>
                      {filteredActivities[currentActivityIndex].branch || 'Unknown Branch'}
                    </Text>
                    <Text style={{color:'#fff', fontSize:15, fontWeight:'600', marginTop:2}} numberOfLines={1}>
                      {filteredActivities[currentActivityIndex].activity_name || filteredActivities[currentActivityIndex].title || 'Activity'}
                    </Text>
                    <Text style={{color:'#fff', fontSize:12, marginTop:2}}>
                      {new Date(filteredActivities[currentActivityIndex].created_at || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>
              {/* Progress Bar */}
              <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:10}}>
                {filteredActivities.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{width:22, height:6, borderRadius:3, marginHorizontal:3, backgroundColor: idx === currentActivityIndex ? '#a084ca' : '#e0d7fa'}}
                    onPress={() => handleProgressBarTap(idx)}
                  />
                ))}
              </View>
            </View>
          )}
          {/* Summary Cards */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => navigation.navigate('StudentsListScreen', { students })} onLongPress={() => setShowStudentModal(true)}>
              <SummaryCard
                gradientColors={['#667eea', '#764ba2']}
                icon={<FontAwesome5 name="users" size={24} color="#fff" />}
                label="Students"
                value={students.length}
                style={{ flex: 1, marginRight: 8 }}
              />
            </TouchableOpacity>
            <SummaryCard
              gradientColors={['#f093fb', '#f5576c']}
              icon={<MaterialIcons name="check-circle" size={24} color="#fff" />}
              label="Present"
              value={safeAttendanceList.filter(item => item.status === 'present').length}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          {/* Quick Actions */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#333', marginBottom: 12 }}>Quick Actions</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <QuickActionButton
                gradientColors={['#4facfe', '#00f2fe']}
                icon={<MaterialIcons name="message" size={22} color="#fff" />}
                label="Message Parents"
                onPress={() => navigation.navigate('StudentsListScreen', { students })}
                isFirst={true}
                isLast={false}
              />
              <QuickActionButton
                gradientColors={['#43e97b', '#38f9d7']}
                icon={<MaterialIcons name="check-circle" size={22} color="#fff" />}
                label="Mark Attendance"
                onPress={() => navigation.navigate('MarkAttendanceV2')}
                isFirst={false}
                isLast={false}
              />
              <QuickActionButton
                gradientColors={['#fa709a', '#fee140']}
                icon={<MaterialIcons name="add-a-photo" size={22} color="#fff" />}
                label="Post Activity"
                onPress={() => navigation.navigate('PostActivity')}
                isFirst={false}
                isLast={true}
              />
            </View>
          </View>

          {/* Recent Activities Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activities</Text>
              <TouchableOpacity onPress={() => navigation.navigate('KidsActivityFeed')}>
                <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
            </View>
            {loadingActivities ? (
              <ActivityIndicator size="small" color="#4CAF50" style={{ marginVertical: 20 }} />
            ) : recentActivities.length > 0 ? (
              <FlatList
                data={recentActivities.slice(0, 3)}
                renderItem={renderActivityCard}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <MaterialIcons name="photo-library" size={48} color="#ccc" />
                <Text style={{ color: '#999', marginTop: 8 }}>No activities posted yet</Text>
                <TouchableOpacity 
                  style={styles.postActivityButton}
                  onPress={() => navigation.navigate('PostActivity')}
                >
                  <Text style={styles.postActivityButtonText}>Post First Activity</Text>
            </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Timetable Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Class Timetable</Text>
              <TouchableOpacity onPress={fetchTimetable}>
                <MaterialIcons name="refresh" size={20} color="#a084ca" />
              </TouchableOpacity>
            </View>
            {loadingTimetable ? (
              <ActivityIndicator size="small" color="#a084ca" style={{ marginVertical: 20 }} />
            ) : timetable.length > 0 ? (
              <View>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 12, textAlign: 'center' }}>
                  Administration Timetable for {teacher.branch}
                </Text>
                {renderTimetableGrid()}
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <MaterialIcons name="schedule" size={48} color="#ccc" />
                <Text style={{ color: '#999', marginTop: 8 }}>No timetable available</Text>
                <Text style={{ color: '#666', marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                  Contact administration to set up class schedule
                </Text>
              </View>
            )}
          </View>

          {/* Attendance Sections Container */}
          <View>
            {/* Today's Attendance Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Attendance</Text>
                <TouchableOpacity onPress={fetchAttendance}>
                  <MaterialIcons name="refresh" size={20} color="#a084ca" />
                </TouchableOpacity>
              </View>
                {/* Pull-to-refresh wrapper for attendance list */}
<FlatList
  data={safeAttendanceList}
  keyExtractor={(item, idx) => `attendance-${idx}`}
  renderItem={({ item, index }) => (
    <View key={`attendance-${index}`} style={styles.attendanceItem}>
      <View style={styles.attendanceLeft}>
        <Text style={styles.studentName}>{item.childName || item.name || 'N/A'}</Text>
        <Text style={styles.studentClass}>{item.childClass || item.class || ''}</Text>
        <Text style={{ fontSize: 10, color: '#999' }}>ID: {item.student_id || item.user_id || 'N/A'}</Text>
        {item.method && (
          <Text style={{ fontSize: 10, color: '#666' }}>Method: {item.method}</Text>
        )}
      </View>
      <View style={styles.attendanceRight}>
        <Text style={[
          styles.attendanceStatus,
          { color: item.status === 'present' ? '#43cea2' : item.status === 'absent' ? '#e74c3c' : '#f39c12' }
        ]}>
          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : '-'}
        </Text>
        <MaterialIcons
          name={item.status === 'present' ? 'check-circle' : item.status === 'absent' ? 'cancel' : 'help'}
          size={20}
          color={item.status === 'present' ? '#43cea2' : item.status === 'absent' ? '#e74c3c' : '#f39c12'}
        />
        {item.in_time && (
          <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{item.in_time}</Text>
        )}
      </View>
    </View>
  )}
  ListEmptyComponent={loadingAttendance ? (
    <ActivityIndicator size="small" color="#a084ca" style={{ marginVertical: 20 }} />
  ) : (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <MaterialIcons name="check-circle" size={48} color="#ccc" />
      <Text style={{ color: '#999', marginTop: 8, textAlign: 'center' }}>No attendance records for today</Text>
      <Text style={{ color: '#666', marginTop: 4, fontSize: 12, textAlign: 'center' }}>Pull to refresh or mark attendance to see records</Text>
    </View>
  )}
  refreshing={loadingAttendance}
  onRefresh={fetchAttendance}
  style={{ marginVertical: 8 }}
/>

            {/* Staff Attendance Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>My Attendance</Text>
    {attendanceLoading ? (
                <ActivityIndicator size="small" color="#a084ca" style={{ marginVertical: 20 }} />
    ) : attendanceStatus && attendanceStatus.clock_in ? (
                <View>
                  <View style={styles.attendanceInfo}>
                    <Text style={styles.attendanceLabel}>Clock In:</Text>
                    <Text style={styles.attendanceValue}>{attendanceStatus.clock_in}</Text>
                  </View>
                  <View style={styles.attendanceInfo}>
                    <Text style={styles.attendanceLabel}>Clock Out:</Text>
                    <Text style={styles.attendanceValue}>{attendanceStatus.clock_out || '-'}</Text>
                  </View>
        {!attendanceStatus.clock_out && (
          <View>
            <TouchableOpacity 
              style={[
                styles.clockOutButton, 
                { 
                  opacity: reportText.trim() ? 1 : 0.6,
                  backgroundColor: reportText.trim() ? '#4caf50' : '#ff9800'
                }
              ]} 
              onPress={handleClockOut}
            >
              <Text style={styles.buttonText}>
                {reportText.trim() ? 'Clock Out' : 'Fill Report to Clock Out'}
              </Text>
            </TouchableOpacity>
            {!reportText.trim() && (
              <Text style={{ 
                color: '#ff9800', 
                fontSize: 12, 
                textAlign: 'center', 
                marginTop: 4,
                fontStyle: 'italic'
              }}>
                Please fill today's progress report first
              </Text>
            )}
          </View>
        )}
                  <View style={styles.reportSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.reportLabel}>Today's Progress Report:</Text>
                      <Text style={{ 
                        color: reportText.length >= 20 ? '#4caf50' : reportText.length > 10 ? '#ff9800' : '#999',
                        fontSize: 12 
                      }}>
                        {reportText.length}/20 characters (min)
                      </Text>
                    </View>
        <TextInput
                      style={[
                        styles.reportInput,
                        { 
                          borderColor: reportText.trim() ? '#4caf50' : '#ddd',
                          borderWidth: 2
                        }
                      ]}
          placeholder="Describe today's activities, student progress, and any important notes..."
          value={reportText}
          onChangeText={setReportText}
          editable={!attendanceStatus.report}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity
                      style={[
                        styles.submitButton, 
                        { 
                          opacity: (attendanceStatus.report || !reportText.trim()) ? 0.5 : 1,
                          backgroundColor: reportText.trim() ? '#4caf50' : '#ccc'
                        }
                      ]}
          onPress={handleSubmitReport}
          disabled={!!attendanceStatus.report || reportSubmitting || !reportText.trim()}
        >
                      <Text style={styles.buttonText}>
                        {reportSubmitting ? 'Submitting...' : 'Submit Report Only'}
                      </Text>
        </TouchableOpacity>
        {attendanceStatus.report && (
                      <Text style={styles.reportSubmitted}>Report already submitted.</Text>
        )}
                  </View>
                </View>
    ) : (
                <TouchableOpacity style={styles.clockInButton} onPress={handleClockIn}>
                  <Text style={styles.buttonText}>Clock In</Text>
      </TouchableOpacity>
    )}
            </View>
          </View>
        </View>
      </View> {/* Close Attendance Container */}
    </ScrollView>
    {showStudentModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%', maxHeight: '70%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Students List</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {students.map((student, idx) => (
                <View key={idx} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                  <Text style={{ fontSize: 16 }}>{student.childName || student.name}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowStudentModal(false)} style={{ marginTop: 16, alignSelf: 'center', backgroundColor: '#764ba2', padding: 10, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 20,
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
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#a084ca',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  attendanceLeft: {
    flex: 1,
  },
  studentName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  studentClass: {
    color: '#666',
    fontSize: 13,
  },
  attendanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceStatus: {
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  attendanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  attendanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  clockInButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  clockOutButton: {
    backgroundColor: '#43cea2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reportSection: {
    marginTop: 16,
  },
  reportLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  reportInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#a084ca',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportSubmitted: {
    marginTop: 8,
    color: '#43cea2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  activityContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  activityTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    marginLeft: 10,
  },
  deleteButton: {
    marginLeft: 10,
  },
  seeAllText: {
    fontSize: 14,
    color: '#a084ca',
    fontWeight: 'bold',
  },
  postActivityButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  postActivityButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timetableItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#a084ca',
  },
  timetableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timetableDay: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  timetableTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  timetableContent: {
    marginTop: 4,
  },
  timetableSubject: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#a084ca',
    marginBottom: 4,
  },
  timetableDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  timetableBranch: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  timetableDaySection: {
    marginBottom: 16,
  },
  timetableDayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 4,
  },
  timetablePeriodItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a084ca',
  },
  timetablePeriodHeader: {
    marginBottom: 6,
  },
  timetablePeriodTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timetablePeriodContent: {
    marginTop: 4,
  },
  timetablePeriodSubject: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#a084ca',
    marginBottom: 2,
  },
  timetablePeriodDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
}); 