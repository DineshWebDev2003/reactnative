import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { BlurView } from 'expo-blur';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';

export default function ParentDashboard() {
  const navigation = useNavigation();
  const [parent, setParent] = useState({
    name: '',
    role: '',
    branch: '',
    profilePic: require('../assets/Avartar.png'),
    childName: '',
    childClass: '',
  });
  const [cameraUrl, setCameraUrl] = useState(null);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showIdCard, setShowIdCard] = useState(true);
  const idCardRef = useRef();
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);
  const [timetablePeriods, setTimetablePeriods] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [hasNotifications, setHasNotifications] = useState(false);
  const [currentParentId, setCurrentParentId] = useState(null);

  // Remove animated icon components since we're not using vector icons anymore
  // const AnimatedFontAwesome5 = Animated.createAnimatedComponent(FontAwesome5);
  // const AnimatedMaterialIcons = Animated.createAnimatedComponent(MaterialIcons);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(userId => {
      setCurrentParentId(userId);
      if (!userId) return;
      fetch(`${BASE_URL}/get_users.php?id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users && data.users.length > 0) {
            const user = data.users[0];
            // Prefer student_id or child_id if present, fallback to user.id
            const studentId = user.student_id || user.child_id || user.id;
            setParent({
              name: user.name,
              role: user.role,
              branch: user.branch,
              profilePic: user.father_photo
                ? { uri: BASE_URL + '/' + user.father_photo }
                : user.mother_photo
                  ? { uri: BASE_URL + '/' + user.mother_photo }
                  : require('../assets/Avartar.png'),
              childName: user.childName || '',
              childClass: user.childClass || '',
              child_photo: user.child_photo,
              father_photo: user.father_photo,
              mother_photo: user.mother_photo,
              guardian_photo: user.guardian_photo,
              studentId: studentId, // Use this for display and QR
              dob: user.dob || '', // If available
            });
            // Fetch activities for this kid
            if (user.child_photo && user.childName && studentId) {
              fetch(`${BASE_URL}/get_activities.php?kid_id=${studentId}`)
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.activities) setActivities(data.activities);
                });
            }
          }
        });
      // Fetch assigned teachers
      fetch(`${BASE_URL}/get_teachers_for_parent.php?parent_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.teachers) {
            setTeachers(data.teachers);
          }
        });
      // TODO: Add wallet fetch logic here if needed, with error logging
    });
  }, []);

  const iconBounce = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconBounce, { toValue: 1.12, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(iconBounce, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();
  }, []);

  // Fetch today's timetable periods
  useEffect(() => {
    const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = daysOfWeek[new Date().getDay()];
    setLoadingTimetable(true);
    fetch(`${BASE_URL}/get_timetable_periods.php?day=${today}`)
      .then(res => res.json())
      .then(data => {
        setTimetablePeriods(data.success ? data.periods : []);
        setLoadingTimetable(false);
      })
      .catch(() => setTimetablePeriods([]));
  }, []);

  // Fetch today's attendance for the child
  useEffect(() => {
    if (parent.studentId) {
      const today = new Date().toISOString().slice(0, 10);
      fetch(`${BASE_URL}/get_attendance.php?student_id=${parent.studentId}&date=${today}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.attendance && data.attendance.length > 0) {
            setAttendanceStatus(data.attendance[0].status || '');
          } else {
            setAttendanceStatus('');
          }
        })
        .catch(() => setAttendanceStatus(''));
    }
  }, [parent.studentId]);

  // Fetch notifications/messages for the parent
  useEffect(() => {
    AsyncStorage.getItem('userId').then(userId => {
      if (!userId) return;
      fetch(`${BASE_URL}/get_messages.php?user1_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.messages && data.messages.length > 0) {
            // Check for unread messages or any messages
            const hasUnread = data.messages.some(msg => !msg.read || msg.status === 'unread');
            setHasNotifications(hasUnread || data.messages.length > 0);
          } else {
            setHasNotifications(false);
          }
        })
        .catch(() => setHasNotifications(false));
    });
  }, []);

  const handleViewLiveClass = async () => {
    if (!currentParentId) {
      Alert.alert('Error', 'Parent ID not found. Please login again.');
      return;
    }
    setLoadingCamera(true);
    try {
      const response = await fetch(`${BASE_URL}/get_parent_camera.php?parent_id=${currentParentId}`);
      const data = await response.json();
      if (data.success && data.camera_url) {
        setCameraUrl(data.camera_url);
        navigation.navigate('AllCameras', { cameraUrl: data.camera_url });
      } else {
        Alert.alert('No Camera', 'No live camera feed available for your child.');
      }
    } catch (error) {
      console.error('Camera fetch error:', error);
      Alert.alert('Error', 'Failed to load camera feed. Please try again.');
    } finally {
      setLoadingCamera(false);
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const fileUri = FileSystem.documentDirectory + 'download.pdf';
      await FileSystem.writeAsStringAsync(fileUri, blob, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file.');
    }
  };

  const handleDownloadIdCard = async () => {
    try {
      const uri = await captureRef(idCardRef, {
        format: 'png',
        quality: 0.8,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('ID Card download error:', error);
      Alert.alert('Error', 'Failed to download ID card.');
    }
  };

  const flipToBack = () => {
    Animated.timing(flipAnim, {
      toValue: 180,
      duration: 800,
      useNativeDriver: true,
    }).start(() => setIsFlipped(true));
  };

  const flipToFront = () => {
    Animated.timing(flipAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => setIsFlipped(false));
  };

  const handleFlip = () => {
    if (isFlipped) {
      flipToFront();
    } else {
      flipToBack();
    }
  };

  const handleChatWithTeacher = async () => {
    if (teachers.length === 0) {
      Alert.alert('No Teachers', 'No teachers assigned to your child yet.');
      return;
    }
    if (teachers.length === 1) {
      navigation.navigate('Chat', { 
        teacherId: teachers[0].id, 
        teacherName: teachers[0].name,
        teacherPhoto: teachers[0].profile_photo 
      });
    } else {
      navigation.navigate('ChatList');
    }
  };

  // Filter activities to only those posted by the current parent
  const filteredActivities = activities.filter(activity => String(activity.parent_id) === String(currentParentId));

  // Defensive: fallback for parent object
  const safeParent = parent || {};
  // Defensive: fallback for teachers and activities
  const safeTeachers = Array.isArray(teachers) ? teachers : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeTimetablePeriods = Array.isArray(timetablePeriods) ? timetablePeriods : [];
  // Defensive: fallback for images
  const defaultAvatar = require('../assets/Avartar.png');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image source={parent.profilePic} style={styles.profilePic} />
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.parentName}>{parent.name}</Text>
            <Text style={styles.childInfo}>{parent.childName} • {parent.childClass}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('ChatList')}
        >
          <Text style={styles.notificationIcon}>💬</Text>
          {hasNotifications && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={handleViewLiveClass}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>📹</Text>
            <Text style={styles.actionTitle}>Live Class</Text>
            <Text style={styles.actionSubtitle}>Watch your child</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleChatWithTeacher}>
          <LinearGradient
            colors={['#4ECDC4', '#6EE7DF']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>👨‍🏫</Text>
            <Text style={styles.actionTitle}>Chat</Text>
            <Text style={styles.actionSubtitle}>Talk to teachers</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('ActivityList')}
        >
          <LinearGradient
            colors={['#45B7D1', '#67C7E1']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>🎨</Text>
            <Text style={styles.actionTitle}>Activities</Text>
            <Text style={styles.actionSubtitle}>See progress</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('Wallet')}
        >
          <LinearGradient
            colors={['#96CEB4', '#B8E6C8']}
            style={styles.actionGradient}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionTitle}>Wallet</Text>
            <Text style={styles.actionSubtitle}>Manage fees</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ID Card Section */}
      <View style={styles.idCardSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Student ID Card</Text>
          <TouchableOpacity onPress={handleFlip} style={styles.flipButton}>
            <Text style={styles.flipIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.idCardContainer}>
          <Animated.View
            ref={idCardRef}
            style={[
              styles.idCard,
              {
                transform: [
                  { rotateY: flipAnim.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['0deg', '180deg']
                  })}
                ]
              }
            ]}
          >
            {!isFlipped ? (
              <View style={styles.idCardFront}>
                <Image source={require('../assets/logo.png')} style={styles.idCardLogo} />
                <View style={styles.idCardContent}>
                  <Image 
                    source={parent.child_photo ? { uri: BASE_URL + '/' + parent.child_photo } : require('../assets/Avartar.png')} 
                    style={styles.idCardPhoto} 
                  />
                  <View style={styles.idCardInfo}>
                    <Text style={styles.idCardName}>{parent.childName}</Text>
                    <Text style={styles.idCardClass}>Class: {parent.childClass}</Text>
                    <Text style={styles.idCardBranch}>Branch: {parent.branch}</Text>
                    <Text style={styles.idCardId}>ID: {parent.studentId}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.idCardBack}>
                <Text style={styles.qrTitle}>Student QR Code</Text>
                <QRCode value={String(parent.studentId)} size={120} />
                <Text style={styles.qrSubtitle}>Scan for attendance</Text>
              </View>
            )}
          </Animated.View>
        </View>
        
        <TouchableOpacity onPress={handleDownloadIdCard} style={styles.downloadButton}>
          <Text style={styles.downloadIcon}>📥</Text>
          <Text style={styles.downloadText}>Download ID Card</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activities */}
      <View style={styles.activitiesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ActivityList')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {activities.slice(0, 5).map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <Image 
                source={{ uri: BASE_URL + '/' + activity.photo }} 
                style={styles.activityImage} 
              />
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDate}>{activity.created_at}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Teachers Section */}
      <View style={styles.teachersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Child's Teachers</Text>
        </View>
        
        {teachers.map((teacher, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.teacherCard}
            onPress={() => navigation.navigate('Chat', { 
              teacherId: teacher.id, 
              teacherName: teacher.name,
              teacherPhoto: teacher.profile_photo 
            })}
          >
            <Image 
              source={teacher.profile_photo ? { uri: BASE_URL + '/' + teacher.profile_photo } : require('../assets/Avartar.png')} 
              style={styles.teacherPhoto} 
            />
            <View style={styles.teacherInfo}>
              <Text style={styles.teacherName}>{teacher.name}</Text>
              <Text style={styles.teacherSubject}>{teacher.subject}</Text>
            </View>
            <Text style={styles.chatIcon}>💬</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  parentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  childInfo: {
    fontSize: 14,
    color: '#666',
  },
  notificationButton: {
    padding: 10,
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 15,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  idCardSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  flipButton: {
    padding: 8,
  },
  flipIcon: {
    fontSize: 20,
  },
  idCardContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  idCard: {
    width: 320,
    height: 180,
    backgroundColor: '#fdf6e3',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#ffe082',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  idCardFront: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  idCardLogo: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  idCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  idCardPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  idCardInfo: {
    flex: 1,
  },
  idCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  idCardClass: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  idCardBranch: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  idCardId: {
    fontSize: 14,
    color: '#666',
  },
  idCardBack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
  },
  downloadIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  downloadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activitiesSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
  },
  viewAllText: {
    color: '#4F46E5',
    fontSize: 14,
  },
  activityCard: {
    width: 120,
    marginRight: 15,
  },
  activityImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 10,
    color: '#666',
  },
  teachersSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  teacherPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teacherSubject: {
    fontSize: 14,
    color: '#666',
  },
  chatIcon: {
    fontSize: 20,
  },
}); 