import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Image, TouchableOpacity, Modal, TextInput, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { handleLogout } from '../utils/logout';
import { useNavigation } from '@react-navigation/native';

function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default function TuitionStudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const navigation = useNavigation();
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch data only once on mount
  useEffect(() => {
    fetchStudentAndHomework();
    fetchAnnouncements();
  }, []);

  // Update profile form when student changes
  useEffect(() => {
    if (student) {
      setProfileForm({
        name: student.name || '',
        email: student.email || '',
        mobile: student.mobile || '',
        password: '',
      });
    }
  }, [student]);

  const fetchAnnouncements = () => {
    setLoadingAnnouncements(true);
    fetch(`${BASE_URL}/get_tuition_announcements.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.announcements) {
          setAnnouncements(data.announcements);
        }
        setLoadingAnnouncements(false);
      })
      .catch(() => setLoadingAnnouncements(false));
  };

  const fetchStudentAndHomework = async () => {
    setLoading(true);
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Error', 'User not found');
      setLoading(false);
      return;
    }
    // Fetch tuition student info
    fetch(`${BASE_URL}/get_users.php?id=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users && data.users.length > 0) {
          setStudent(data.users[0]);
        }
      });
    // Fetch homework for this student
    fetch(`${BASE_URL}/get_student_homework.php?student_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.homeworks) {
          setHomeworks(data.homeworks);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'assigned': return '#FFD700'; // gold
      case 'submitted': return '#42a5f5'; // blue
      case 'reviewed': return '#66bb6a'; // green
      default: return '#bdbdbd'; // grey
    }
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);
      const userId = await AsyncStorage.getItem('userId');
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('profile_image', {
        uri: result.assets[0].uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      });
      fetch(`${BASE_URL}/update_profile.php`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
        .then(res => res.json())
        .then(data => {
          setUploading(false);
          if (data.success) {
            fetchStudentAndHomework();
            Alert.alert('Success', 'Profile photo updated!');
          } else {
            Alert.alert('Error', data.message || 'Failed to update photo');
          }
        })
        .catch(() => {
          setUploading(false);
          Alert.alert('Error', 'Failed to upload photo');
        });
    }
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    const userId = await AsyncStorage.getItem('userId');
    const formData = new FormData();
    formData.append('user_id', userId);
    if (profileForm.name) formData.append('name', profileForm.name);
    if (profileForm.email) formData.append('email', profileForm.email);
    if (profileForm.mobile) formData.append('mobile', profileForm.mobile);
    if (profileForm.password) formData.append('password', profileForm.password);
    fetch(`${BASE_URL}/update_profile.php`, {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        setSavingProfile(false);
        if (data.success) {
          setSettingsVisible(false);
          fetchStudentAndHomework();
          Alert.alert('Success', 'Profile updated!');
        } else {
          Alert.alert('Error', data.message || 'Failed to update profile');
        }
      })
      .catch(() => {
        setSavingProfile(false);
        Alert.alert('Error', 'Failed to update profile');
      });
  };

  const handleChatWithTeacher = async () => {
    if (!student) return;
    setChatLoading(true);
    fetch(`${BASE_URL}/get_users.php?role=tuition_teacher`)
      .then(res => res.json())
      .then(data => {
        setChatLoading(false);
        if (data.success && data.users && data.users.length > 0) {
          // Try to find teacher in the same branch
          const teacher = data.users.find(u => u.branch === student.branch);
          if (teacher) {
            navigation.navigate('ChatScreen', { user: teacher });
          } else {
            // If none in branch, show a picker/modal for all tuition teachers
            Alert.alert(
              'No Teacher in Branch',
              'No tuition teacher found for your branch. Choose another tuition teacher to chat with:',
              [
                ...data.users.map(t => ({
                  text: t.name + ' (' + t.branch + ')',
                  onPress: () => navigation.navigate('ChatScreen', { user: t })
                })),
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        } else {
          Alert.alert('No Teacher', 'No tuition teacher found.');
        }
      })
      .catch(() => {
        setChatLoading(false);
        Alert.alert('Error', 'Failed to fetch teacher info.');
      });
  };

  // Progress Tracker calculation
  const today = new Date();
  const monday = getMonday(today);
  const weekHomeworks = homeworks.filter(hw => {
    const hwDate = new Date(hw.date || hw.created_at);
    return hwDate >= monday && hwDate <= today;
  });
  const completedCount = weekHomeworks.filter(hw => ['reviewed', 'submitted'].includes((hw.status || '').toLowerCase())).length;
  const totalCount = weekHomeworks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={["#a084ca", "#f7b2ff"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : student && student.profile_image ? (
              <Image source={{ uri: `${BASE_URL}/${student.profile_image}?t=${Date.now()}` }} style={styles.avatarImg} />
            ) : (
              <FontAwesome5 name="user-graduate" size={38} color="#fff" />
            )}
            <View style={styles.cameraIcon}><MaterialIcons name="photo-camera" size={18} color="#fff" /></View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Welcome{student ? `, ${student.name}` : ''}!</Text>
            <Text style={styles.headerSubtitle}>Your Tuition Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => handleLogout(navigation)}>
            <MaterialIcons name="logout" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsVisible(true)}>
        <MaterialIcons name="settings" size={22} color="#a084ca" />
        <Text style={styles.settingsBtnText}>Profile & Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.chatBtn} onPress={handleChatWithTeacher} disabled={chatLoading}>
        <MaterialIcons name="chat" size={22} color="#fff" />
        <Text style={styles.chatBtnText}>{chatLoading ? 'Loading...' : 'Chat with Teacher'}</Text>
      </TouchableOpacity>
      {/* Announcements Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><MaterialIcons name="campaign" size={18} color="#a084ca" />  Announcements & Notices</Text>
        {loadingAnnouncements ? (
          <ActivityIndicator size="small" color="#a084ca" style={{ marginTop: 10 }} />
        ) : announcements.length === 0 ? (
          <Text style={{ color: '#888', marginTop: 10 }}>No announcements at this time.</Text>
        ) : (
          announcements.map(a => (
            <View key={a.id} style={styles.announcementCard}>
              <Text style={styles.announcementTitle}>{a.title}</Text>
              <Text style={styles.announcementMsg}>{a.message}</Text>
              <Text style={styles.announcementDate}>{new Date(a.created_at).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
      {/* Progress Tracker Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><MaterialIcons name="trending-up" size={18} color="#a084ca" />  Progress Tracker</Text>
        {totalCount === 0 ? (
          <Text style={{ color: '#888', marginTop: 10 }}>No assignments this week yet.</Text>
        ) : (
          <>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount} of {totalCount} assignments completed this week</Text>
          </>
        )}
      </View>
      {/* Student Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.info}><MaterialIcons name="school" size={18} color="#a084ca" />  Branch: <Text style={styles.infoValue}>{student ? student.branch : ''}</Text></Text>
        <Text style={styles.info}><MaterialIcons name="email" size={18} color="#a084ca" />  Email: <Text style={styles.infoValue}>{student ? student.email : ''}</Text></Text>
      </View>
      {/* Homework Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><FontAwesome5 name="book" size={18} color="#a084ca" />  Your Homework</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#a084ca" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={homeworks}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.hwCard}>
                <View style={styles.hwHeader}>
                  <Text style={styles.hwTitle}>{item.title}</Text>
                  <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}> 
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.hwDesc}>{item.description}</Text>
                {item.feedback ? <Text style={styles.hwFeedback}>Feedback: {item.feedback}</Text> : null}
              </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No homework assigned yet.</Text>}
          />
        )}
      </View>
      {/* Payments Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><FontAwesome5 name="wallet" size={18} color="#a084ca" />  Payments</Text>
        <Text style={{ color: '#888', marginTop: 8 }}>Coming soon: Tuition fee payment and wallet features.</Text>
      </View>
      {/* Motivational Quote */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>“Education is the most powerful weapon which you can use to change the world.”</Text>
        <Text style={styles.quoteAuthor}>- Nelson Mandela</Text>
      </View>
      <Modal visible={settingsVisible} animationType="slide" transparent onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile & Settings</Text>
            <TextInput style={styles.input} placeholder="Name" value={profileForm.name} onChangeText={v => setProfileForm(f => ({ ...f, name: v }))} />
            <TextInput style={styles.input} placeholder="Email" value={profileForm.email} onChangeText={v => setProfileForm(f => ({ ...f, email: v }))} />
            <TextInput style={styles.input} placeholder="Mobile" value={profileForm.mobile} onChangeText={v => setProfileForm(f => ({ ...f, mobile: v }))} />
            <TextInput style={styles.input} placeholder="New Password (optional)" value={profileForm.password} onChangeText={v => setProfileForm(f => ({ ...f, password: v }))} secureTextEntry />
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1, marginRight: 8 }]} onPress={handleProfileSave} disabled={savingProfile}>
                <Text style={styles.saveBtnText}>{savingProfile ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1, marginLeft: 8 }]} onPress={() => setSettingsVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6fd',
    padding: 0,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#b39ddb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    position: 'relative',
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'cover',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#a084ca',
    borderRadius: 10,
    padding: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#f3e5f5',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 18,
    marginTop: -28,
    marginBottom: 10,
    padding: 18,
    shadowColor: '#a084ca',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  info: {
    fontSize: 15,
    color: '#4b2996',
    marginBottom: 6,
    fontWeight: '600',
  },
  infoValue: {
    color: '#333',
    fontWeight: 'normal',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 18,
    marginTop: 16,
    padding: 16,
    shadowColor: '#a084ca',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#a084ca',
    marginBottom: 10,
  },
  hwCard: {
    backgroundColor: '#f7f6fd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#a084ca',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  hwHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hwTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4b2996',
    flex: 1,
  },
  statusChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  hwDesc: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  hwFeedback: {
    fontSize: 13,
    color: '#388e3c',
    marginTop: 4,
  },
  quoteCard: {
    backgroundColor: '#ede7f6',
    borderRadius: 16,
    marginHorizontal: 18,
    marginTop: 24,
    padding: 18,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#4b2996',
    textAlign: 'center',
    marginBottom: 6,
  },
  quoteAuthor: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  logoutBtn: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(160,132,202,0.18)',
  },
  announcementCard: {
    backgroundColor: '#f7f6fd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#a084ca',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  announcementTitle: {
    fontWeight: 'bold',
    color: '#4b2996',
    fontSize: 15,
    marginBottom: 2,
  },
  announcementMsg: {
    color: '#333',
    fontSize: 14,
    marginBottom: 2,
  },
  announcementDate: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 18,
    marginTop: 8,
    backgroundColor: '#ede7f6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#a084ca',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  settingsBtnText: {
    color: '#a084ca',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '88%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b2996',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f7f6fd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ede7f6',
  },
  saveBtn: {
    backgroundColor: '#a084ca',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#ede7f6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#a084ca',
    fontWeight: 'bold',
    fontSize: 15,
  },
  progressBarBg: {
    height: 16,
    backgroundColor: '#ede7f6',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 16,
    backgroundColor: '#a084ca',
    borderRadius: 8,
  },
  progressText: {
    color: '#4b2996',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 2,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: '#a084ca',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    shadowColor: '#a084ca',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chatBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
}); 