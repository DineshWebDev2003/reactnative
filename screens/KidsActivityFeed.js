import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

export default function KidsActivityFeed() {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherBranch, setTeacherBranch] = useState('');
  const [editingActivity, setEditingActivity] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    loadUserRole();
    loadTeacherProfile();
    fetchActivities();
  }, []);

  const loadUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('role');
      setUserRole(role || '');
    } catch (error) {
      console.log('Error loading user role:', error);
    }
  };

  const loadTeacherProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`${BASE_URL}/get_teacher_profile.php?userId=${userId}`);
        const data = await response.json();
        if (data.success && data.teacher) {
          setTeacherBranch(data.teacher.branch || '');
        }
      }
    } catch (error) {
      console.log('Error loading teacher profile:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Check if user is admin (administration role)
      const userId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('role');
      
      console.log('User role:', userRole);
      console.log('Teacher branch:', teacherBranch);
      
      let response;
      if (userRole === 'administration') {
        // For admin, fetch all activities from all branches
        console.log('Fetching all activities for admin');
        response = await fetch(`${BASE_URL}/get_activities.php`);
      } else {
        // For teachers, fetch activities by branch
        console.log('Fetching activities for branch:', teacherBranch);
        response = await fetch(`${BASE_URL}/get_activities.php?branch=${encodeURIComponent(teacherBranch)}`);
      }
      
      const data = await response.json();
      console.log('Activities response:', data);
      
      if (data.success && data.activities) {
        setActivities(data.activities);
      } else {
        console.log('No activities found or API error:', data.message);
        setActivities([]);
      }
    } catch (error) {
      console.log('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setEditDescription(activity.activity_text || '');
    setShowEditModal(true);
  };

  const handleDeleteActivity = (activityId) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteActivity(activityId) }
      ]
    );
  };

  const confirmDeleteActivity = async (activityId) => {
    try {
      setSubmitting(true);
      const userId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('role');
      
      const response = await fetch(`${BASE_URL}/delete_activity.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          activity_id: activityId,
          user_id: userId,
          user_role: userRole
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Activity deleted successfully!');
        fetchActivities();
      } else {
        Alert.alert('Error', data.message || 'Failed to delete activity');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error while deleting activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateActivity = async () => {
    if (!editDescription.trim()) {
      Alert.alert('Error', 'Please enter activity description');
      return;
    }

    try {
      setSubmitting(true);
      const userId = await AsyncStorage.getItem('userId');
      const userRole = await AsyncStorage.getItem('role');
      
      const response = await fetch(`${BASE_URL}/update_activity.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: editingActivity.id,
          user_id: userId,
          user_role: userRole,
          description: editDescription.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Activity updated successfully!');
        setShowEditModal(false);
        setEditingActivity(null);
        fetchActivities();
      } else {
        Alert.alert('Error', data.message || 'Failed to update activity');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error while updating activity');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user can edit/delete activities
  const canEditDelete = () => {
    const allowedRoles = ['teacher', 'franchisee', 'admin', 'administration'];
    return allowedRoles.includes(userRole.toLowerCase());
  };

  const renderActivityCard = ({ item }) => {
    const imageSource = item.image_path ? { uri: `${BASE_URL}/${item.image_path}` } : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' };
    
    return (
      <View style={styles.activityCard}>
        <Image source={imageSource} style={styles.activityImage} />
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>{item.activity_text || '🏃‍♂️ Activity'}</Text>
            {canEditDelete() && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleEditActivity(item)}
                >
                  <MaterialIcons name="edit" size={18} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleDeleteActivity(item.id)}
                >
                  <MaterialIcons name="delete" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.activityFooter}>
            <Text style={styles.kidName}>{item.childName || 'Unknown Kid'}</Text>
            <Text style={styles.branchName}>{item.branch || 'Unknown Branch'}</Text>
            <Text style={styles.activityDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading activities...</Text>
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
        <Text style={styles.headerTitle}>
          {userRole === 'administration' ? 'All Kids Activities (Admin)' : 'All Kids Activities'}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('PostActivity')} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivityCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="images" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No activities found</Text>
            <Text style={styles.emptySubtext}>Start posting activities to see them here</Text>
            <TouchableOpacity 
              style={styles.postActivityButton}
              onPress={() => navigation.navigate('PostActivity')}
            >
              <Text style={styles.postActivityButtonText}>Post First Activity</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Activity</Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Activity Text"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.updateButton]}
                onPress={handleUpdateActivity}
                disabled={submitting}
              >
                <Text style={styles.updateButtonText}>
                  {submitting ? 'Updating...' : 'Update'}
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
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
  },
  listContainer: {
    padding: 16,
  },
  activityCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  frameBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    borderRadius: 16,
  },
  overlayContent: {
    zIndex: 1,
    position: 'relative',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  activityContent: {
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kidName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  postActivityButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  postActivityButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 