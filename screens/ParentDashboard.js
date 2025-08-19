import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing, ActivityIndicator, TextInput, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

export default function ParentDashboard() {
  const navigation = useNavigation();
  const [parent, setParent] = useState({
    name: '',
    role: '',
    branch: '',
    profilePic: { uri: 'https://app.tnhappykids.in/assets/Avartar.png' },
    childName: '',
    childClass: '',
    father_photo: null,
    mother_photo: null,
    guardian_photo: null,
    father_name: '',
    mother_name: '',
    guardian_name: '',
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
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const statusScrollViewRef = useRef(null);
  const [updatingCaretaker, setUpdatingCaretaker] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const AnimatedFontAwesome5 = Animated.createAnimatedComponent(FontAwesome5);
  const AnimatedMaterialIcons = Animated.createAnimatedComponent(MaterialIcons);

  // --- FILTER ACTIVITIES TO TODAY ONLY ---
  const todayStr = new Date().toISOString().slice(0,10);
  const filteredActivities = activities.filter(activity => {
    if (!activity || !activity.created_at) return false;
    const dateOnly = activity.created_at.slice(0,10);
    return dateOnly === todayStr;
  });

  // --- ANIMATE PROGRESS BAR FILL ON SLIDE CHANGE ---
  useEffect(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 20000, // 20 seconds per slide
      useNativeDriver: false,
    }).start();
  }, [currentActivityIndex, filteredActivities.length]);

  // Auto-slide functionality with fade transition
  useEffect(() => {
    if (filteredActivities.length > 1) {
      const interval = setInterval(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Change image
          setCurrentActivityIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % filteredActivities.length;
            return nextIndex;
          });
          // Fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      }, 20000); // 20 seconds

      return () => clearInterval(interval);
    }
  }, [filteredActivities, fadeAnim]);

  // Handle progress bar tap
  const handleProgressBarTap = (index) => {
    if (index !== currentActivityIndex) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change image
        setCurrentActivityIndex(index);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  useEffect(() => {
    AsyncStorage.getItem('userId').then(userId => {
      setCurrentParentId(userId);
      if (!userId) return;
      fetch(`${BASE_URL}/get_users.php?id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users && data.users.length > 0) {
            const user = data.users[0];
            console.log('Parent user data:', user);
            // Prefer student_id or child_id if present, fallback to user.id
            const studentId = user.student_id || user.child_id || user.id;
            console.log('Parent studentId calculated:', { student_id: user.student_id, child_id: user.child_id, id: user.id, final: studentId });
            setParent({
              name: user.name || '',
              role: user.role || '',
              branch: user.branch || '',
              profilePic: user.father_photo
                ? { uri: BASE_URL + '/' + user.father_photo }
                : user.mother_photo
                  ? { uri: BASE_URL + '/' + user.mother_photo }
                  : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' },
              childName: user.childName || '',
              childClass: user.childClass || '',
              child_photo: user.child_photo,
              father_photo: user.father_photo,
              mother_photo: user.mother_photo,
              guardian_photo: user.guardian_photo,
              father_name: user.father_name || '',
              mother_name: user.mother_name || '',
              guardian_name: user.guardian_name || '',
              studentId: studentId, // Use this for display and QR
              dob: user.dob || '', // If available
            });
            // Fetch activities for all kids in the parent's branch
            if (user.branch) {
              fetch(`${BASE_URL}/get_activities.php?branch=${encodeURIComponent(user.branch)}`)
                .then(res => res.json())
                .then(data => {
                  console.log('Activities response:', data);
                  if (data.success && data.activities && Array.isArray(data.activities)) {
                    setActivities(data.activities.filter(item => item != null));
                  } else {
                    console.log('No activities found or API error');
                    setActivities([]);
                  }
                })
                .catch(error => {
                  console.log('Error fetching activities:', error);
                  setActivities([]);
                });
            }
          } else {
            console.log('No user data found or API error');
            setParent({
              name: '',
              role: '',
              branch: '',
              profilePic: { uri: 'https://app.tnhappykids.in/assets/Avartar.png' },
              childName: '',
              childClass: '',
            });
          }
        })
        .catch(error => {
          console.log('Error fetching user data:', error);
          setParent({
            name: '',
            role: '',
            branch: '',
            profilePic: { uri: 'https://app.tnhappykids.in/assets/Avartar.png' },
            childName: '',
            childClass: '',
          });
        });
      // Fetch assigned teachers
      fetch(`${BASE_URL}/get_teachers_for_parent.php?parent_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Teachers for parent response:', data);
          if (data.success && data.teachers && Array.isArray(data.teachers)) {
            setTeachers(data.teachers.filter(item => item != null));
          } else {
            setTeachers([]);
          }
        })
        .catch(err => {
          console.log('Teacher fetch error:', err);
          setTeachers([]);
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
  }, [iconBounce]);

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
      // Use local date instead of UTC to avoid timezone issues
      const now = new Date();
      const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      console.log('Parent fetching attendance for studentId:', parent.studentId, 'date:', today, 'current timezone:', new Date().toString());
      // DEBUG: Log the studentId and API URL used for attendance fetch
      console.log('PARENT DASHBOARD: Fetching attendance for studentId:', parent.studentId, 'date:', today, 'API URL:', `${BASE_URL}/get_attendance.php?student_id=${parent.studentId}&date=${today}`);
      fetch(`${BASE_URL}/get_attendance.php?student_id=${parent.studentId}&date=${today}`)
        .then(res => res.json())
        .then(data => {
          console.log('Parent attendance response:', data);
          // --- PATCH: fallback to attendance_records if attendance is empty ---
          let attendanceArr = [];
          if (data.attendance && data.attendance.length > 0) {
            attendanceArr = data.attendance;
          } else if (data.attendance_records && data.attendance_records.length > 0) {
            attendanceArr = data.attendance_records;
          }
          if (attendanceArr.length > 0) {
            setAttendanceStatus(attendanceArr[0].status || '');
          } else {
            setAttendanceStatus('');
            // Debug: Check what's in the database
            fetch(`${BASE_URL}/debug_attendance.php?student_id=${parent.studentId}&date=${today}`)
              .then(res => res.text())
              .then(text => {
                console.log('Debug raw response:', text);
                try {
                  const debugData = JSON.parse(text);
                  console.log('Debug attendance data:', debugData);
                } catch (e) {
                  console.log('Debug JSON parse error:', e);
                }
              })
              .catch(err => console.log('Debug fetch error:', err));
          }
        })
        .catch((e) => { setAttendanceStatus(''); });
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

  useFocusEffect(
    React.useCallback(() => {
      // Refetch attendance when dashboard is focused
      if (parent.studentId) {
        const now = new Date();
        const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        console.log('Parent fetching attendance for studentId:', parent.studentId, 'date:', today, 'current timezone:', new Date().toString());
        // DEBUG: Log the studentId and API URL used for attendance fetch
        console.log('PARENT DASHBOARD: Fetching attendance for studentId:', parent.studentId, 'date:', today, 'API URL:', `${BASE_URL}/get_attendance.php?student_id=${parent.studentId}&date=${today}`);
        fetch(`${BASE_URL}/get_attendance.php?student_id=${parent.studentId}&date=${today}`)
          .then(res => res.json())
          .then(data => {
            let attendanceArr = [];
            if (data.attendance && data.attendance.length > 0) {
              attendanceArr = data.attendance;
            } else if (data.attendance_records && data.attendance_records.length > 0) {
              attendanceArr = data.attendance_records;
            }
            if (attendanceArr.length > 0) {
              setAttendanceStatus(attendanceArr[0].status || '');
            } else {
              setAttendanceStatus('');
            }
          })
          .catch((e) => { setAttendanceStatus(''); });
      }
    }, [parent.studentId])
  );

  const handleViewLiveClass = async () => {
    setLoadingCamera(true);
    try {
      const email = await AsyncStorage.getItem('email');
      const mobile = await AsyncStorage.getItem('mobile');
      const password = await AsyncStorage.getItem('password');
      const email_or_mobile = email || mobile;
      const response = await fetch(`${BASE_URL}/get_parent_camera.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_mobile, password })
      });
      const data = await response.json();
      setLoadingCamera(false);
      if (data.success && data.camera_url) {
        setCameraUrl(data.camera_url);
        navigation.navigate('CameraFullscreen', { cameraUrl: data.camera_url || '' });
      } else {
        setCameraUrl(null);
        alert(data.message || 'Camera not found or unavailable.');
        console.log('Camera fetch error:', data);
      }
    } catch (err) {
      setLoadingCamera(false);
      setCameraUrl(null);
      alert('Error fetching camera');
      console.log('Camera fetch error:', err);
    }
  };

  const handleDownload = async (url) => {
    try {
      const filename = url.split('/').pop();
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      await Sharing.shareAsync(uri);
    } catch (e) {
      alert('Download failed');
    }
  };

  const handleDownloadIdCard = async () => {
    try {
      const uri = await captureRef(idCardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri);
    } catch (e) {
      alert('Failed to share ID card');
    }
  };

  // Flip animation logic
  const flipToBack = () => {
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => setIsFlipped(true));
  };
  const flipToFront = () => {
    Animated.timing(flipAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => setIsFlipped(false));
  };
  const handleFlip = () => {
    if (isFlipped) {
      flipToFront();
    } else {
      flipToBack();
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const handleChatWithTeacher = async () => {
    if (!parent || !parent.branch) {
      alert('Error', 'Parent information not available. Please try logging in again.');
      return;
    }
    
    fetch(`${BASE_URL}/get_users.php?role=tuition_teacher`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users && data.users.length > 0) {
          const teacher = data.users.find(u => u.branch === parent.branch);
          if (teacher && teacher.role) {
            navigation.navigate('ChatScreen', { user: teacher, student_id: parent.studentId, teacher_id: teacher.id, childName: parent.childName });
          } else if (teacher) {
            alert('Error', 'Teacher info missing. Cannot open chat.');
          } else {
            alert(
              'No Teacher in Branch',
              'No tuition teacher found for your branch. Would you like to chat with another tuition teacher?',
              [
                ...data.users.map(t => ({
                  text: t.name + ' (' + t.branch + ')',
                  onPress: () => {
                    if (t && t.role) {
                      navigation.navigate('ChatScreen', { user: t, student_id: parent.studentId, teacher_id: t.id, childName: parent.childName });
                    } else {
                      alert('Error', 'Teacher info missing. Cannot open chat.');
                    }
                  }
                })),
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        } else {
          alert('No Teacher', 'No tuition teacher found.');
        }
      })
      .catch(() => {
        alert('Error', 'Failed to fetch teacher info.');
      });
  };

  // helper to upload new caretaker photo (and optionally name)
  const pickAndUploadCaretaker = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const newUri = result.assets[0].uri;

      // Ask for new name
      let newName = parent[`${type}_name`] || '';
      if (Platform.OS === 'ios') {
        await new Promise((resolve) => {
          alert(`Edit ${type} name`, '', (text) => {
            newName = text;
            resolve();
          }, 'plain-text', newName);
        });
      }

      const form = new FormData();
      form.append('user_id', currentParentId);
      form.append(`${type}_photo`, { uri: newUri, name: `${type}.jpg`, type: 'image/jpeg' });
      if (newName) form.append(`${type}_name`, newName);

      setUpdatingCaretaker(true);
      await fetch(`${BASE_URL}/parent_onboarding.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: form,
      });
      setUpdatingCaretaker(false);

      // refresh parent data quickly
      setParent((prev) => ({ ...prev, [`${type}_photo`]: `${type}.jpg?ts=${Date.now()}`, [`${type}_name`]: newName }));
    } catch (e) {
      console.log('Caretaker update error', e);
      setUpdatingCaretaker(false);
    }
  };

  // Defensive: fallback for parent object
  const safeParent = parent || {};

  // Debug logging
  console.log('Activities state:', activities);
  console.log('Filtered activities:', filteredActivities);
  console.log('Parent branch:', safeParent.branch);
  console.log('Current activity index:', currentActivityIndex);
  console.log('Filtered activities length:', filteredActivities.filter(activity => activity != null).length);
  // Defensive: fallback for teachers and activities
  const safeTeachers = Array.isArray(teachers) ? teachers : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeTimetablePeriods = Array.isArray(timetablePeriods) ? timetablePeriods : [];
  // Defensive: fallback for images
  const defaultAvatar = { uri: 'https://app.tnhappykids.in/assets/Avartar.png' };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
              {/* Student ID for attendance fetch: {parent.studentId || 'N/A'} */}
            </Text>
          </View>
          {/* Profile Section */}
          <View style={styles.topRow}>
            <View style={styles.profileContainer}>
              <Image 
                source={safeParent.profilePic || defaultAvatar} 
                style={styles.profilePic} 
                resizeMode="cover"
              />
              <View style={styles.profileTextContainer}>
                <Text style={styles.parentName}>{safeParent.name || 'Parent'}</Text>
                <Text style={styles.roleText}>Parent</Text>
                <Text style={styles.branchName}>{safeParent.branch || 'Branch'}</Text>
            </View>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={() => navigation.replace('Login')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        
          {/* Caretaker Photos & Names */}
          {/* Only show authorized family members (father, mother, guardian) if their name or photo exists */}
          <View style={styles.familyRow}>
            {['father','mother','guardian'].map((t) => (
              (parent[`${t}_photo`] || parent[`${t}_name`]) ? (
                <TouchableOpacity key={t} style={styles.familyCol} onPress={() => pickAndUploadCaretaker(t)}>
                  <Image
                    source={ parent[`${t}_photo`] ? { uri: BASE_URL + '/' + parent[`${t}_photo`] } : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' } }
                    style={styles.familyImg}
                  />
                  <View style={{flexDirection:'row', alignItems:'center', marginTop:4}}>
                    <Text style={styles.familyName}>{(t==='father'?'Father': t==='mother'?'Mother':'Guardian')}</Text>
                    <Ionicons name="md-create" size={14} color="#1e88e5" style={{marginLeft:4}} />
                  </View>
                  {parent[`${t}_name`] ? <Text style={styles.caretakerPersonalName}>{parent[`${t}_name`]}</Text> : null}
                </TouchableOpacity>
              ) : null
            ))}
          </View>
          {updatingCaretaker && <ActivityIndicator style={{ marginTop: 8 }} />}
        
          {/* Virtual ID Card - Flip on tap */}
          {showIdCard && (
        <TouchableOpacity activeOpacity={0.9} onPress={handleFlip}>
          <View style={styles.flipCardContainer}>
            {/* Front of card */}
            <Animated.View style={[styles.idCard, { backfaceVisibility: 'hidden', transform: [{ rotateY: frontInterpolate }] }]}
              ref={idCardRef}
            >
              <Text style={styles.idCardTitle}>Virtual ID Card</Text>
              {/* Logo at top right */}
              <View style={styles.idCardLogo}>
                <Image source={{ uri: 'https://app.tnhappykids.in/assets/icon.png' }} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
              </View>
              <View style={{flexDirection:'row',alignItems:'center'}}>
                <Image source={safeParent.child_photo ? { uri: BASE_URL + '/' + safeParent.child_photo } : defaultAvatar} style={styles.idCardPhoto} />
                <View style={{marginLeft:16}}>
                  <Text style={styles.idCardName}>{safeParent.childName || '-'}</Text>
                  <Text style={styles.idCardLabel}>Class: <Text style={styles.idCardValue}>{safeParent.childClass || '-'}</Text></Text>
                  <Text style={styles.idCardLabel}>Branch: <Text style={styles.idCardValue}>{safeParent.branch || '-'}</Text></Text>
                  <Text style={styles.idCardLabel}>Student ID: <Text style={styles.idCardValue}>{safeParent.studentId || '-'}</Text></Text>
                  {safeParent.dob && <Text style={styles.idCardLabel}>DOB: <Text style={styles.idCardValue}>{safeParent.dob}</Text></Text>}
                </View>
              </View>
              <TouchableOpacity style={styles.idCardShareBtn} onPress={handleDownloadIdCard}>
                <Text style={styles.idCardShareText}>Download/Share ID Card</Text>
              </TouchableOpacity>
              <Text style={styles.flipHint}>Tap card to show QR code</Text>
            </Animated.View>
            {/* Back of card (QR code) */}
            <Animated.View style={[styles.idCard, styles.qrCardBack, { position: 'absolute', top: 0, left: 0, right: 0, backfaceVisibility: 'hidden', transform: [{ rotateY: backInterpolate }] }]}
              pointerEvents={isFlipped ? 'auto' : 'none'}
            >
              <View style={styles.qrCodeCenterWrap}>
                {safeParent.studentId && (
                  <QRCode value={String(safeParent.studentId)} size={120} />
                )}
                <Text style={styles.qrLabel}>Student QR Code</Text>
                <Text style={styles.flipHint}>Tap card to show details</Text>
              </View>
            </Animated.View>
          </View>
        </TouchableOpacity>
      )}
      {/* Enhanced Child Info Card */}
      <View style={styles.childInfoCard}>
        <LinearGradient 
          colors={['#ff9a9e', '#fecfef', '#fecfef']} 
          style={styles.childInfoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.childInfoContent}>
            <View style={styles.childPhotoContainer}>
              <Image 
                source={safeParent.child_photo ? { uri: BASE_URL + '/' + safeParent.child_photo } : defaultAvatar} 
                style={styles.childPhoto} 
              />
              <View style={styles.childStatusIndicator} />
            </View>
            <View style={styles.childInfoText}>
              <Text style={styles.childName}>{safeParent.childName || 'Student'}</Text>
              <Text style={styles.childClass}>{safeParent.childClass || 'Class'}</Text>
              <Text style={styles.childBranch}>{safeParent.branch || 'Branch'}</Text>
            </View>

          </View>
        </LinearGradient>
      </View>
      {/* Enhanced Toggle ID Card Button */}
      <View style={styles.toggleIdCardContainer}>
        <TouchableOpacity 
          style={styles.toggleIdCardBtn} 
          onPress={() => setShowIdCard(v => !v)}
          activeOpacity={0.8}
        >
          <View style={styles.toggleIdCardContent}>
            <MaterialIcons 
              name={showIdCard ? "visibility-off" : "visibility"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.toggleIdCardText}>
              {showIdCard ? 'Hide ID Card' : 'Show ID Card'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* Authorized Family Members */}
      <Text style={styles.sectionTitle}>Authorized Family Members</Text>
      <View style={styles.familySection}>
        <View style={styles.familyCard}>
          <View style={styles.familyRow}>
            {/* Father */}
            <View style={styles.familyMember}>
              <View style={styles.familyPhotoContainer}>
                <Image 
                  source={safeParent.father_photo ? { uri: BASE_URL + '/' + safeParent.father_photo } : defaultAvatar} 
                  style={styles.familyPhoto} 
                  resizeMode="cover" 
                />
                <View style={styles.familyPhotoOverlay}>
                  <MaterialIcons name="man" size={20} color="#fff" />
                </View>
              </View>
              <Text style={styles.familyLabel}>Father</Text>
              <Text style={styles.familyRole}>Primary Contact</Text>
            </View>
            {/* Mother */}
            <View style={styles.familyMember}>
              <View style={styles.familyPhotoContainer}>
                <Image 
                  source={safeParent.mother_photo ? { uri: BASE_URL + '/' + safeParent.mother_photo } : defaultAvatar} 
                  style={styles.familyPhoto} 
                  resizeMode="cover" 
                />
                <View style={styles.familyPhotoOverlay}>
                  <MaterialIcons name="woman" size={20} color="#fff" />
                </View>
              </View>
              <Text style={styles.familyLabel}>Mother</Text>
              <Text style={styles.familyRole}>Secondary Contact</Text>
            </View>
            {/* Guardian */}
            <View style={styles.familyMember}>
              <View style={styles.familyPhotoContainer}>
                <Image 
                  source={safeParent.guardian_photo ? { uri: BASE_URL + '/' + safeParent.guardian_photo } : defaultAvatar} 
                  style={styles.familyPhoto} 
                  resizeMode="cover" 
                />
                <View style={styles.familyPhotoOverlay}>
                  <MaterialIcons name="supervisor-account" size={20} color="#fff" />
                </View>
              </View>
              <Text style={styles.familyLabel}>Guardian</Text>
              <Text style={styles.familyRole}>Emergency Contact</Text>
            </View>
          </View>
        </View>
      </View>
      {/* Authorized to Receive Kid Text Below Family Row */}
      <View style={{marginTop: 8, marginBottom: 16, alignItems: 'center'}}>
        <Text style={{color: '#e75480', fontWeight: 'bold', fontSize: 16, letterSpacing: 1, backgroundColor: '#fff0f4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8}}>
          Authorized to Receive Kid
        </Text>
      </View>
      {/* Kid Activity Feed Button */}
      <View style={{alignItems:'center', marginBottom: 18}}>
        <TouchableOpacity
          style={styles.kidActivityButton}
          onPress={() => navigation.navigate('ActivityListScreen', { studentId: safeParent.studentId })}
          activeOpacity={0.85}
        >
          <FontAwesome5 name="child" size={22} color="#fff" style={{marginRight: 10}} />
          <Text style={styles.kidActivityButtonText}>Kid Activity Feed</Text>
        </TouchableOpacity>
      </View>
      {/* Enhanced Summary Cards Row */}
      <View style={styles.cardsRow}>
        <LinearGradient 
          colors={['#667eea', '#764ba2']} 
          style={styles.enhancedCard} 
          start={{x:0, y:0}} 
          end={{x:1, y:1}}
        >
          <View style={styles.cardIconContainer}>
            <AnimatedMaterialIcons 
              name="event-available" 
              size={28} 
              color="#fff" 
              style={{transform: [{ scale: iconBounce }]}} 
            />
          </View>
          <Text style={styles.enhancedCardLabel}>Today's Attendance</Text>
          <Text style={styles.enhancedCardValue}>
            {attendanceStatus ? attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1) : 'Not marked'}
          </Text>
          <View style={styles.cardStatusIndicator}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: attendanceStatus === 'present' ? '#4caf50' : attendanceStatus === 'absent' ? '#f44336' : '#ff9800' }
            ]} />
          </View>
        </LinearGradient>
        
        <LinearGradient 
          colors={['#f093fb', '#f5576c']} 
          style={styles.enhancedCard} 
          start={{x:0, y:0}} 
          end={{x:1, y:1}}
        >
          <View style={styles.cardIconContainer}>
            <AnimatedFontAwesome5 
              name="book" 
              size={24} 
              color="#fff" 
              style={{transform: [{ scale: iconBounce }]}} 
            />
          </View>
          <Text style={styles.enhancedCardLabel}>Homework</Text>
          <Text style={styles.enhancedCardValue}>Posted</Text>
          <View style={styles.cardStatusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#4caf50' }]} />
          </View>
        </LinearGradient>
      </View>
      {/* Today’s Timetable Section */}
      <View style={{backgroundColor:'#fff', borderRadius:12, padding:16, marginBottom:16, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10, elevation:2}}>
        <Text style={{fontWeight:'bold', fontSize:17, marginBottom:10, color:'#e75480'}}>Today’s Timetable</Text>
        {loadingTimetable ? (
          <ActivityIndicator size="small" color="#e75480" style={{marginVertical:12}} />
        ) : safeTimetablePeriods.length === 0 ? (
          <Text style={{color:'#888', textAlign:'center'}}>No periods for today.</Text>
        ) : (
          safeTimetablePeriods.map(period => (
            <View key={period.id} style={{flexDirection:'row', alignItems:'center', marginBottom:6}}>
              <FontAwesome5 name="clock" size={16} color="#e75480" style={{marginRight:8}} />
              <Text style={{fontWeight:'bold', color:'#e75480'}}>{period.start} to {period.end}</Text>
              <Text style={{marginLeft:8, color:'#333'}}>{period.description}</Text>
            </View>
          ))
        )}
      </View>
      {/* Message Teacher Section */}
      <View style={{marginTop: 24, marginBottom: 12}}>
        <Text style={{fontWeight:'bold', fontSize:18, color:'#e75480', marginBottom:8}}>Message Teacher</Text>
        {safeTeachers.length === 0 ? (
          <Text style={{color:'#888'}}>No teacher assigned yet.</Text>
        ) : (
          safeTeachers.filter(teacher => teacher != null).map(teacher => (
            <TouchableOpacity
              key={teacher.id || Math.random().toString()}
              style={{flexDirection:'row',alignItems:'center',padding:12,backgroundColor:'#fff',borderRadius:8,marginBottom:8,shadowColor:'#e75480',shadowOpacity:0.08,shadowRadius:4,shadowOffset:{width:0,height:2}}}
              onPress={() => {
                if (teacher && teacher.role) {
                  navigation.navigate('ChatScreen', { user: teacher });
                } else {
                  alert('Error', 'Teacher info missing. Cannot open chat.');
                }
              }}
            >
              <FontAwesome5 name="chalkboard-teacher" size={20} color="#e75480" style={{marginRight:10}} />
              <View>
                <Text style={{fontWeight:'bold',fontSize:16}}>{teacher.name || 'Unknown'}</Text>
                <Text style={{color:'#888',fontSize:13}}>{teacher.branch || 'Unknown Branch'}</Text>
              </View>
              <MaterialIcons name="chat" size={22} color="#e75480" style={{marginLeft:'auto'}} />
            </TouchableOpacity>
          ))
        )}
      </View>
      {/* Single 4:3 Ratio Frame with Progress Bar */}
      <View style={{marginTop: 12, marginBottom: 12}}>
        <Text style={{fontWeight:'bold', fontSize:18, color:'#e75480', marginBottom:8}}>Kids Activities</Text>
        {filteredActivities.length === 0 ? (
          <Text style={{color:'#888'}}>No activities posted yet.</Text>
        ) : (
          <View style={styles.singleFrameContainer}>
            {/* Admin-style Progress Bar Above Image */}
            <View style={{ width: '90%', alignSelf: 'center', alignItems: 'center', marginBottom: 12 }}>
              <View style={[styles.customProgressBar, { width: '100%', height: 8, borderRadius: 6, backgroundColor: '#e0e0e0', flexDirection: 'row', overflow: 'hidden', position: 'relative' }]}> 
                {filteredActivities.map((_, index) => (
                  <TouchableOpacity key={index} onPress={() => handleProgressBarTap(index)} style={{ flex: 1, height: '100%', position: 'relative' }}>
                    <View style={{
                      backgroundColor: '#bdbdbd',
                      height: '100%',
                      borderRadius: 6,
                      marginHorizontal: index === 0 ? 0 : 2,
                    }} />
                    {index === currentActivityIndex && (
                      <Animated.View style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        }),
                        backgroundColor: '#4F46E5',
                        borderRadius: 6,
                      }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Single Frame */}
            <Animated.View style={[styles.singleFrame, { opacity: fadeAnim }]}> 
              {filteredActivities[currentActivityIndex] && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    // Advance to next slide (with fade animation)
                    Animated.timing(fadeAnim, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setCurrentActivityIndex((prevIndex) => (prevIndex + 1) % filteredActivities.length);
                      Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                      }).start();
                    });
                  }}
                  style={{flex:1}}
                >
                  <View style={styles.frameContent}>
                    <Image 
                      source={{ uri: BASE_URL + '/' + filteredActivities[currentActivityIndex].image_path }} 
                      style={{
                        width: '100%',
                        aspectRatio: 4/5, // Enforce 4:5 ratio for slider
                        borderRadius: 12,
                        alignSelf: 'center',
                      }} 
                      resizeMode="cover" 
                    />
                  </View>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        )}
      </View>
      {/* Send Message Button */}
      <TouchableOpacity 
        style={styles.sendMessageButton}
        onPress={() => {
          if (safeTeachers.length > 0 && safeTeachers[0] && safeTeachers[0].role) {
            navigation.navigate('ChatScreen', { user: safeTeachers[0] });
          } else {
            alert('No teacher assigned yet or teacher info missing.');
          }
        }}
      >
        <Text style={styles.sendMessageText}>Send Message to Teacher</Text>
      </TouchableOpacity>
      {/* Enhanced Action Cards Grid */}
      <View style={styles.actionCardsContainer}>
        {/* Live Class View */}
        <TouchableOpacity style={styles.actionCard} onPress={handleViewLiveClass}>
          <View style={styles.actionCardIconContainer}>
            <FontAwesome5 name="video" size={24} color="#fff" />
          </View>
          <Text style={styles.actionCardText}>Live Class View</Text>
        </TouchableOpacity>
        
        {/* Wallet */}
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('Wallet', { userId: currentParentId, role: safeParent.role || '', branch: safeParent.branch || '' })}
        >
          <View style={styles.actionCardIconContainer}>
            <FontAwesome5 name="wallet" size={24} color="#fff" />
          </View>
          <Text style={styles.actionCardText}>Wallet</Text>
        </TouchableOpacity>
      </View>
      {/* Show camera stream if available */}
      {cameraUrl && (
        <View style={{marginVertical: 16, height: 220, borderRadius: 12, overflow: 'hidden'}}>
          <WebView
            source={{ uri: cameraUrl }}
            style={{ flex: 1, borderRadius: 12 }}
            allowsFullscreenVideo
          />
        </View>
      )}
          {loadingCamera && <Text style={{textAlign:'center', color:'#e75480'}}>Loading camera...</Text>}
        </View>
        </ScrollView>
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  profileTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  parentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 2,
  },
  branchName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e75480',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  childInfoCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  childInfoGradient: {
    padding: 20,
  },
  childInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childPhotoContainer: {
    position: 'relative',
  },
  childPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: '#fff',
  },
  childStatusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  childInfoText: {
    flex: 1,
    marginLeft: 15,
  },
  childStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  childName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  childClass: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  childBranch: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '400',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    minWidth: 120,
    maxWidth: '48%',
  },
  sendMessageButton: {
    backgroundColor: '#d0f5e8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 24, // Added margin bottom for spacing
  },
  sendMessageText: {
    color: '#009688',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileGlass: {
    marginTop: 24,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
    paddingHorizontal: 8,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    width: 320,
    height: 180,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    alignSelf: 'center',
    marginBottom: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backfaceVisibility: 'hidden',
  },
  idCardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#e75480',
    marginBottom: 10,
  },
  idCardPhoto: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: '#e75480',
  },
  idCardName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#009688',
    marginBottom: 4,
  },
  idCardLabel: {
    fontSize: 15,
    color: '#888',
  },
  idCardValue: {
    color: '#333',
    fontWeight: 'bold',
  },
  idCardShareBtn: {
    backgroundColor: '#e75480',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
    alignSelf: 'center',
  },
  idCardShareText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  qrSwipeArea: {
    alignItems: 'center',
    marginBottom: 10,
  },
  qrSwipeText: {
    color: '#009688',
    fontWeight: 'bold',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  toggleIdCardContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleIdCardBtn: {
    backgroundColor: '#667eea',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toggleIdCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleIdCardText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  qrCardBack: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    width: 320,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  qrCodeCenterWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  qrLabel: {
    color: '#888',
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
  },
  flipHint: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  flipCardContainer: {
    alignSelf: 'center',
    width: 320,
    height: 180,
    marginBottom: 18,
    perspective: 1000,
  },
  idCardLogo: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 80,
    height: 80,
    resizeMode: 'contain',
    zIndex: 2,
  },
  idCardLogoText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#e75480',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a084ca',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  chatBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  enhancedCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    minWidth: 120,
    position: 'relative',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardStatusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  enhancedCardLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  enhancedCardValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  familySection: {
    marginBottom: 20,
  },
  familyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  familyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap', // Allow wrapping if screen is small
  },
  familyMember: {
    alignItems: 'center',
    marginHorizontal: 8,
    maxWidth: 90,
    flexShrink: 1,
  },
  familyPhotoContainer: {
    position: 'relative',
  },
  familyPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8f9fa',
    borderWidth: 3,
    borderColor: '#667eea',
    overflow: 'hidden',
  },
  familyPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  familyLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  familyRole: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '500',
    textAlign: 'center',
  },
  kidActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a084ca',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: '#a084ca',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  kidActivityButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  squarePhoto: {
    borderRadius: 8,
  },
  actionCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginBottom: 12,
  },
  actionCardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  actionCardText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  statusContainer: {
    width: '100%',
    height: 240, // 9:16 ratio (width: 135, height: 240)
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  statusScrollView: {
    width: '100%',
    height: '100%',
  },
  statusContentContainer: {
    alignItems: 'center',
  },
  statusCard: {
    width: 135, // 9:16 ratio width
    height: 240, // 9:16 ratio height
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
  },
  statusImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  statusOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
  },
  statusChildName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusTime: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 1,
  },
  statusDate: {
    color: '#fff',
    fontSize: 11,
  },
  statusDownloadBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 6,
  },
  singleFrameContainer: {
    width: '100%',
    height: 337.5, // 4:5 ratio (width: 270, height: 337.5)
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 10,
  },
  progressBarContainerModern: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
    gap: 8,
  },
  progressBarItemModern: {
    width: 24,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 3,
    shadowColor: '#aaa',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  progressBarActiveModern: {
    backgroundColor: '#a084ca', // Modern highlight color
    shadowColor: '#a084ca',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  singleFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  frameContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  frameImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  familyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  familyCol: {
    alignItems: 'center',
  },
  familyImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  familyName: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  editText: {
    fontSize: 11,
    color: '#1e88e5',
  },
  caretakerPersonalName: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  customProgressBar: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 0,
  },
});