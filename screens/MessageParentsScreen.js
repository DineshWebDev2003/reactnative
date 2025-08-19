import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

export default function MessageParentsScreen() {
  const navigation = useNavigation();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    loadParents();
    AsyncStorage.getItem('userId').then(setTeacherId);
  }, []);

  const loadParents = async () => {
    setLoading(true);
    try {
      const teacherId = await AsyncStorage.getItem('userId');
      if (teacherId) {
        const response = await fetch(`${BASE_URL}/get_parents_for_teacher.php?teacher_id=${teacherId}`);
        const data = await response.json();
        if (data.success && data.parents) {
          setParents(data.parents);
        } else {
          setParents([]);
        }
      }
    } catch (error) {
      console.log('Error loading parents:', error);
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (mobileNumber) => {
    if (mobileNumber) {
      Linking.openURL(`sms:${mobileNumber}`);
    } else {
      Alert.alert("Error", "Mobile number is not available for this parent.");
    }
  };

  const handleCall = (mobileNumber) => {
    if (mobileNumber) {
      Linking.openURL(`tel:${mobileNumber}`);
    } else {
      Alert.alert("Error", "Mobile number is not available for this parent.");
    }
  };

  const renderParentCard = ({ item }) => (
    <TouchableOpacity
      style={styles.parentCard}
      onPress={() => {
        setSelectedParent(item);
        setShowMessageModal(true);
      }}
    >
      <View style={styles.parentInfo}>
      <Image
          source={
            item.father_photo 
              ? { uri: `${BASE_URL}/${item.father_photo}` }
              : item.mother_photo 
                ? { uri: `${BASE_URL}/${item.mother_photo}` }
                : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' }
          }
          style={styles.parentImage}
        />
        <View style={styles.parentDetails}>
          <Text style={styles.parentName}>
            {item.name || `${item.father_name || ''} ${item.mother_name || ''}`.trim()}
          </Text>
          <Text style={styles.childName}>
            Child: {item.childName || item.child_name || 'N/A'}
          </Text>
          <Text style={styles.childClass}>
            Class: {item.childClass || item.child_class || 'N/A'}
          </Text>
        </View>
      </View>
      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => handleSendMessage(item.mobile)}>
          <MaterialIcons name="message" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleCall(item.mobile)} style={{ marginLeft: 15 }}>
          <FontAwesome5 name="phone" size={24} color="green" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading parents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Parents</Text>
        <TouchableOpacity onPress={loadParents} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <FontAwesome5 name="users" size={24} color="#4CAF50" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>Total Parents</Text>
                <Text style={styles.summaryValue}>{parents.length}</Text>
              </View>
            </View>
          </View>

          {/* Parents List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Parent to Message</Text>
            {parents.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome5 name="users" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No parents found</Text>
                <Text style={styles.emptySubtext}>Parents will appear here when assigned to your class</Text>
              </View>
            ) : (
              <FlatList
                data={parents}
                renderItem={renderParentCard}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Quick Message Templates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Message Templates</Text>
            <View style={styles.templatesContainer}>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => {
                  setMessageText("Hello! Your child had a great day today. They participated well in all activities.");
                  if (parents.length > 0) {
                    setSelectedParent(parents[0]);
                    setShowMessageModal(true);
                  }
                }}
              >
                <MaterialIcons name="thumb-up" size={20} color="#4CAF50" />
                <Text style={styles.templateText}>Positive Update</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => {
                  setMessageText("Please remember to bring the homework assignment tomorrow. Thank you!");
                  if (parents.length > 0) {
                    setSelectedParent(parents[0]);
                    setShowMessageModal(true);
                  }
                }}
              >
                <MaterialIcons name="assignment" size={20} color="#FF9800" />
                <Text style={styles.templateText}>Homework Reminder</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => {
                  setMessageText("Your child was absent today. Please let us know if everything is okay.");
                  if (parents.length > 0) {
                    setSelectedParent(parents[0]);
                    setShowMessageModal(true);
                  }
                }}
              >
                <MaterialIcons name="info" size={20} color="#2196F3" />
                <Text style={styles.templateText}>Absence Notice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Message</Text>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedParent && (
              <View style={styles.selectedParent}>
                <Image
                  source={
                    selectedParent.father_photo 
                      ? { uri: `${BASE_URL}/${selectedParent.father_photo}` }
                      : selectedParent.mother_photo 
                        ? { uri: `${BASE_URL}/${selectedParent.mother_photo}` }
                        : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' }
                  }
                  style={styles.selectedParentImage}
                />
                <View style={styles.selectedParentInfo}>
                  <Text style={styles.selectedParentName}>
                    {selectedParent.name || `${selectedParent.father_name || ''} ${selectedParent.mother_name || ''}`.trim()}
                  </Text>
                  <Text style={styles.selectedChildName}>
                    Child: {selectedParent.childName || selectedParent.child_name || 'N/A'}
                  </Text>
                </View>
              </View>
            )}
            
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              numberOfLines={6}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowMessageModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, { opacity: sendingMessage ? 0.5 : 1 }]}
                onPress={() => handleSendMessage(selectedParent.mobile)}
                disabled={sendingMessage}
              >
                <Text style={styles.sendButtonText}>
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </Text>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  parentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  parentDetails: {
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  childName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  childClass: {
    fontSize: 12,
    color: '#999',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  templatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  templateText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedParent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  selectedParentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedParentInfo: {
    flex: 1,
  },
  selectedParentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedChildName: {
    fontSize: 12,
    color: '#666',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
