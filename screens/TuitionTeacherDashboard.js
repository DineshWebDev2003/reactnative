import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function TuitionTeacherDashboard() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [teacherName, setTeacherName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not found');
        setLoading(false);
        return;
      }
      // Fetch teacher name
      fetch(`${BASE_URL}/get_users.php?id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users && data.users.length > 0) {
            setTeacherName(data.users[0].name);
          }
        });
      // Fetch assigned tuition students
      fetch(`${BASE_URL}/get_users.php?role=tuition_student`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users) {
            setStudents(data.users);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetchData();
  }, []);

  // Placeholder for future feature implementations
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <LinearGradient colors={["#a084ca", "#f7b2ff"]} style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {teacherName || 'Tuition Teacher'}!</Text>
        <Text style={styles.headerSubtitle}>Your Tuition Teacher Dashboard</Text>
      </LinearGradient>
      {/* Homework Management */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><FontAwesome5 name="book" size={18} color="#a084ca" />  Homework Management</Text>
        <Text style={styles.sectionDesc}>Assign homework, view submissions, and give feedback to your tuition students here. (Coming soon)</Text>
      </View>
      {/* Student Progress Overview */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><MaterialIcons name="trending-up" size={18} color="#a084ca" />  Student Progress Overview</Text>
        <Text style={styles.sectionDesc}>See each student’s homework completion and recent submissions. (Coming soon)</Text>
      </View>
      {/* Announcements/Notices */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><MaterialIcons name="campaign" size={18} color="#a084ca" />  Announcements & Notices</Text>
        <Text style={styles.sectionDesc}>Post and view important notices for your tuition students. (Coming soon)</Text>
      </View>
      {/* Class Schedule */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><MaterialIcons name="event" size={18} color="#a084ca" />  Class Schedule</Text>
        <Text style={styles.sectionDesc}>View and manage your upcoming tuition sessions. (Coming soon)</Text>
      </View>
      {/* Chat with Students/Parents */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><MaterialIcons name="chat" size={18} color="#a084ca" />  Chat with Students/Parents</Text>
        <Text style={styles.sectionDesc}>Message your assigned tuition students or their parents. (Coming soon)</Text>
      </View>
      {/* Profile & Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><MaterialIcons name="settings" size={18} color="#a084ca" />  Profile & Settings</Text>
        <Text style={styles.sectionDesc}>Update your profile, photo, and contact info. (Coming soon)</Text>
      </View>
      {/* Motivational Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><Ionicons name="star" size={18} color="#a084ca" />  Motivational Section</Text>
        <Text style={styles.sectionDesc}>Show a motivational quote or “Student of the Week”. (Coming soon)</Text>
      </View>
      {/* List of Tuition Students */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}><FontAwesome5 name="users" size={18} color="#a084ca" />  Your Tuition Students</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#a084ca" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={students}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.studentCard}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentInfo}>Branch: {item.branch}</Text>
                <Text style={styles.studentInfo}>Email: {item.email}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No tuition students assigned yet.</Text>}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6fd',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4b2996',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
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
  sectionDesc: {
    color: '#555',
    fontSize: 14,
    marginBottom: 2,
  },
  studentCard: {
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
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b2996',
  },
  studentInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
}); 