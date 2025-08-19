import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { CheckBox } from 'react-native';

export default function ManageUsers() {
  const navigation = useNavigation();
  const route = useRoute();
  const franchiseeBranch = route?.params?.branch || '';
  const isFranchisee = route?.params?.role === 'Franchisee';
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userBranchFilter, setUserBranchFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [adminUserId, setAdminUserId] = useState(null);
  const [showUserIdWarning, setShowUserIdWarning] = useState(false);
  const [lastDeleteResponse, setLastDeleteResponse] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBranches(data.branches);
      });
    fetchUsers();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => {
      setAdminUserId(id);
      setShowUserIdWarning(!id);
    });
  }, []);

  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch(`${BASE_URL}/get_users.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.users);
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  };

  const handleDeleteUser = (userId) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };

  const handleLongPressUser = (userId) => {
    setSelectionMode(true);
    setSelectedUserIds([userId]);
  };

  const handleSelectUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedUserIds([]);
  };

  const confirmDeleteUser = async () => {
    try {
      let adminId = await AsyncStorage.getItem('userId');
      if (!adminId) {
        Alert.alert('Error', 'Missing admin user ID.');
        setShowDeleteModal(false);
        setAdminPassword('');
        setDeleteUserId(null);
        return;
      }
      if (!adminPassword) {
        Alert.alert('Error', 'Please enter your password.');
        return;
      }
      const response = await fetch(`${BASE_URL}/delete_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founder_id: adminId,
          founder_password: adminPassword,
          user_id: deleteUserId,
        }),
      });
      const data = await response.json();
      setLastDeleteResponse(data);
      if (data.success) {
        Alert.alert('Success', 'User deleted');
        fetchUsers();
      } else {
        Alert.alert('Error', data.message || 'Failed to delete user');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    }
    setShowDeleteModal(false);
    setAdminPassword('');
    setDeleteUserId(null);
  };

  const confirmDeleteUsers = async () => {
    try {
      let adminId = await AsyncStorage.getItem('userId');
      if (!adminId) {
        Alert.alert('Error', 'Missing admin user ID.');
        setShowDeleteModal(false);
        setAdminPassword('');
        return;
      }
      if (!adminPassword) {
        Alert.alert('Error', 'Please enter your password.');
        return;
      }
      let lastResponse = null;
      for (const userId of selectedUserIds) {
        const response = await fetch(`${BASE_URL}/delete_user.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            founder_id: adminId,
            founder_password: adminPassword,
            user_id: userId,
          }),
        });
        const data = await response.json();
        lastResponse = data;
        if (!data.success) {
          Alert.alert('Error', data.message || `Failed to delete user ${userId}`);
          break;
        }
      }
      setLastDeleteResponse(lastResponse);
      if (lastResponse && lastResponse.success) {
        Alert.alert('Success', 'Selected users deleted');
        fetchUsers();
        setSelectedUserIds([]);
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    }
    setShowDeleteModal(false);
    setAdminPassword('');
  };

  // Remove the old Bulk Upload CSV button and its logic from the UI and code

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Debug: Show admin user ID */}
      <Text style={{color: 'gray', fontSize: 12, marginBottom: 4}}>Debug: Admin User ID: {adminUserId || 'Not found'}</Text>
      {/* Show warning if admin user ID is missing */}
      {showUserIdWarning && (
        <View style={{backgroundColor: '#ffe0e0', padding: 10, borderRadius: 8, marginBottom: 10}}>
          <Text style={{color: '#b71c1c', fontWeight: 'bold'}}>Error: Admin user ID not found. Please log in again to perform delete actions.</Text>
        </View>
      )}
      <Text style={styles.title}><FontAwesome5 name="users" size={22} color="#1a237e" />  Manage Users</Text>
      {/* Filters */}
      {!isFranchisee && (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 8}}>
          <View style={[styles.pickerContainer, {flex: 1, minWidth: 120, marginRight: 4}]}> 
            <Picker
              selectedValue={userRoleFilter}
              style={styles.picker}
              onValueChange={setUserRoleFilter}>
              <Picker.Item label="All Roles" value="" />
              <Picker.Item label="Founder" value="Founder" />
              <Picker.Item label="Franchisee" value="Franchisee" />
              <Picker.Item label="Teacher" value="Teacher" />
              <Picker.Item label="Parent" value="Parent" />
            </Picker>
          </View>
          <View style={[styles.pickerContainer, {flex: 1, minWidth: 120, marginRight: 4}]}> 
            <Picker
              selectedValue={userBranchFilter}
              style={styles.picker}
              onValueChange={setUserBranchFilter}>
              <Picker.Item label="All Branches" value="" />
              {branches.map(branch => (
                <Picker.Item key={branch.id} label={branch.name} value={branch.name} />
              ))}
            </Picker>
          </View>
          <TextInput
            style={[styles.input, {flex: 2, minWidth: 120}]}
            placeholder="Search by name or email"
            value={userSearch}
            onChangeText={setUserSearch}
          />
        </View>
      )}
      {/* Cancel Selection Button */}
      {selectionMode && (
        <TouchableOpacity
          style={styles.cancelSelectionButton}
          onPress={handleCancelSelection}
        >
          <Text style={styles.cancelSelectionButtonText}>Cancel Selection</Text>
        </TouchableOpacity>
      )}
      {/* Delete Selected Button */}
      {selectionMode && selectedUserIds.length > 0 && (
        <TouchableOpacity
          style={styles.deleteSelectedButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={styles.deleteSelectedButtonText}>
            Delete Selected ({selectedUserIds.length})
          </Text>
        </TouchableOpacity>
      )}
      {/* Filtered User List */}
      {loadingUsers ? <Text>Loading...</Text> : users
        .filter(user => isFranchisee ? (user.branch === franchiseeBranch && user.role !== 'Founder') : (!userRoleFilter || (user.role && user.role.toLowerCase()) === userRoleFilter.toLowerCase()))
        .filter(user => isFranchisee ? true : (!userBranchFilter || user.branch === userBranchFilter))
        .filter(user => !userSearch || user.name.toLowerCase().includes(userSearch.toLowerCase()) || user.email.toLowerCase().includes(userSearch.toLowerCase()))
        .map(user => {
          const isSelected = selectedUserIds.includes(user.id);
          return (
            <View
              key={user.id}
              style={[
                styles.userRowCard,
                selectionMode && isSelected && styles.userRowCardSelected
              ]}
            >
              {selectionMode && (
                <TouchableOpacity onPress={() => handleSelectUser(user.id)}>
                  <MaterialIcons
                    name={isSelected ? "check-box" : "check-box-outline-blank"}
                    size={28}
                    color={isSelected ? "#4f8cff" : "#aaa"}
                    style={{marginRight: 8}}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{flex: 1}}
                onLongPress={() => !showUserIdWarning && handleLongPressUser(user.id)}
                onPress={() => {
                  if (!selectionMode) {
                    navigation.navigate('EditUser', { user });
                  } else {
                    handleSelectUser(user.id);
                  }
                }}
                disabled={showUserIdWarning}
              >
                <Text style={styles.userNameText}>
                  {user.name} ({user.role}) - {user.branch}
                  {user.role === 'Teacher' || user.role === 'Staff' ? ` [${user.staff_id}]` : user.role === 'Parent' ? ` [${user.student_id}]` : ''}
                </Text>
              </TouchableOpacity>
              {!selectionMode && (
                <TouchableOpacity style={[styles.createButton, {paddingHorizontal: 8, marginRight: 4}]} onPress={() => navigation.navigate('EditUser', { user })}>
                  <Text style={styles.createButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              {!selectionMode && (
                <TouchableOpacity onPress={() => !showUserIdWarning && handleDeleteUser(user.id)} disabled={showUserIdWarning}>
                  <MaterialIcons name="delete" size={20} color={showUserIdWarning ? '#ccc' : '#e57373'} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.3)'}}>
          <View style={{backgroundColor:'#fff', padding:24, borderRadius:12, width:300}}>
            <Text style={{fontWeight:'bold', fontSize:18, marginBottom:12}}>
              {selectedUserIds.length > 1 ? `Delete ${selectedUserIds.length} users?` : 'Enter Password to Delete User'}
            </Text>
            <TextInput
              placeholder="Your Password (required)"
              secureTextEntry
              value={adminPassword}
              onChangeText={setAdminPassword}
              style={{borderWidth:1, borderColor:!adminPassword ? '#e53935' : '#ccc', borderRadius:8, padding:10, marginBottom:8}}
            />
            {!adminPassword && (
              <Text style={{color:'#e53935', marginBottom:8}}>Password is required to delete users.</Text>
            )}
            <View style={{flexDirection:'row', justifyContent:'flex-end'}}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={{marginRight:16}}>
                <Text style={{color:'#888'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={selectedUserIds.length > 0 ? confirmDeleteUsers : confirmDeleteUser}
                style={{backgroundColor:'#e53935', paddingHorizontal:18, paddingVertical:10, borderRadius:8}}
                disabled={!adminPassword || showUserIdWarning}
              >
                <Text style={{color:'#fff', fontWeight:'bold'}}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Remove the old Bulk Upload CSV button and its logic from the UI and code */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 16,
    backgroundColor: '#f5f7fa',
    paddingBottom: 32,
    paddingTop: 32,
    flexGrow: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#1a237e',
    marginBottom: 16,
    alignSelf: 'center',
  },
  pickerContainer: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 44,
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  createButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  createButtonText: {
    color: '#1a237e',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteSelectedButton: {
    backgroundColor: '#e53935',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  deleteSelectedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelSelectionButton: {
    backgroundColor: '#888',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  cancelSelectionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  userRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userRowCardSelected: {
    borderColor: '#4f8cff',
    backgroundColor: '#eaf2ff',
    shadowColor: '#4f8cff',
    shadowOpacity: 0.15,
  },
  userNameText: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: 'bold',
  },
}); 