import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../config';

const MESSAGE_TEMPLATES = [
  'Your child was absent today.',
  'Homework reminder: Please check the diary.',
  'Fee payment is due. Kindly pay at the earliest.',
  'Parent-teacher meeting this Friday at 4PM.',
];

export default function StudentsListScreen({ route }) {
  const students = route.params?.students || [];
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [sending, setSending] = useState(false);
  const navigation = useNavigation();

  // Helper to get image source
  const getStudentImage = (student) => {
    if (student.child_photo && student.child_photo !== 'null' && student.child_photo !== '') {
      if (student.child_photo.startsWith('http')) {
        return { uri: student.child_photo };
      } else {
        return { uri: `https://app.tnhappykids.in/backend/${student.child_photo}` };
      }
    } else if (student.profile_pic && student.profile_pic !== 'null' && student.profile_pic !== '') {
      if (student.profile_pic.startsWith('http')) {
        return { uri: student.profile_pic };
      } else {
        return { uri: `https://app.tnhappykids.in/backend/${student.profile_pic}` };
      }
    }
    return { uri: 'https://app.tnhappykids.in/assets/Avartar.png' };
  };

  const handleChat = (student) => {
    navigation.navigate('ChatScreen', { user: student });
  };

  // Simulate sending message to all parents
  const handleSendTemplate = async (template) => {
    setSending(true);
    setShowMsgModal(false);
    try {
      for (const student of students) {
        const parentId = student.parent_id || student.parentId || student.parent_user_id;
        if (!parentId) continue;
        await fetch(`${BASE_URL}/send_message.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_id: parentId, message: template })
        });
      }
      setSending(false);
      // Removed Alert. You can add a UI feedback element if desired.
    } catch (err) {
      setSending(false);
      // Optionally handle error UI here, but no alert.
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Students</Text>
      <FlatList
        data={students}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedStudent(item)}>
            <View style={styles.card}>
              <Image source={getStudentImage(item)} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.childName || item.name}</Text>
                {item.class && <Text style={styles.classText}>Class: {item.class}</Text>}
                {item.section && <Text style={styles.sectionText}>Section: {item.section}</Text>}
              </View>
              <TouchableOpacity style={styles.callIcon} onPress={() => {
                let phone = item.mobile || item.parent_mobile || item.phone;
                if (phone) {
                  phone = String(phone).replace(/[^\d+]/g, ''); // Remove non-digit except +
                  if (phone.length < 7) {
                    Alert.alert('Invalid Number', 'This number is invalid or missing.');
                    return;
                  }
                  Alert.alert(
                    'Call Parent',
                    `Call this number?\n${phone}`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Call', onPress: () => {
                          console.log('Calling:', phone);
                          Linking.openURL(`tel:${phone}`);
                        }
                      },
                    ]
                  );
                } else {
                  Alert.alert('No Number', 'No phone number found for this student.');
                }
              }}>
                <MaterialIcons name="call" size={27} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatIcon} onPress={() => handleChat(item)}>
                <MaterialIcons name="chat" size={28} color="#764ba2" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
      {/* Virtual Card Modal (updated to use Parent Dashboard image) */}
      <Modal visible={!!selectedStudent} transparent animationType="slide" onRequestClose={() => setSelectedStudent(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              {/* Replace the image with Parent Dashboard image, update below as needed */}
              <Image source={{ uri: 'https://app.tnhappykids.in/assets/parent_dashboard_id_card.png' }} style={styles.modalAvatar} />
              <Text style={styles.modalName}>{selectedStudent?.childName || selectedStudent?.name}</Text>
              {selectedStudent?.class && <Text style={styles.modalField}>Class: {selectedStudent.class}</Text>}
              {selectedStudent?.section && <Text style={styles.modalField}>Section: {selectedStudent.section}</Text>}
              {selectedStudent?.roll_no && <Text style={styles.modalField}>Roll No: {selectedStudent.roll_no}</Text>}
              {selectedStudent?.dob && <Text style={styles.modalField}>DOB: {selectedStudent.dob}</Text>}
              {selectedStudent?.gender && <Text style={styles.modalField}>Gender: {selectedStudent.gender}</Text>}
              {selectedStudent?.parent_name && <Text style={styles.modalField}>Parent: {selectedStudent.parent_name}</Text>}
              {selectedStudent?.address && <Text style={styles.modalField}>Address: {selectedStudent.address}</Text>}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedStudent(null)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Sending indicator */}
      {sending && (
        <View style={styles.sendingOverlay}>
          <ActivityIndicator size="large" color="#764ba2" />
          <Text style={{ color: '#fff', marginTop: 12, fontWeight: 'bold' }}>Sending message to all parents...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#764ba2', alignSelf: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#a084ca',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#764ba2',
    backgroundColor: '#eee',
  },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  classText: { fontSize: 14, color: '#666', marginTop: 2 },
  sectionText: { fontSize: 13, color: '#999', marginTop: 1 },
  callIcon: { padding: 6, marginLeft: 0 },
  chatIcon: { padding: 6, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    elevation: 8,
    shadowColor: '#764ba2',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  modalAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 18,
    borderWidth: 3,
    borderColor: '#764ba2',
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  modalName: { fontSize: 22, fontWeight: 'bold', color: '#4a267a', marginBottom: 10, alignSelf: 'center' },
  modalField: { fontSize: 17, color: '#333', marginBottom: 7, alignSelf: 'center' },
  closeBtn: {
    marginTop: 18,
    backgroundColor: '#764ba2',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  sendingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});