import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

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
      console.log('Stored userId:', id);
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

  const confirmDeleteUser = async () => {
    try {
      let adminId = await AsyncStorage.getItem('userId');
      console.log('Admin ID from AsyncStorage:', adminId);
      if (!adminId) {
        adminId = prompt('Enter your admin user ID:');
        if (!adminId) {
          Alert.alert('Error', 'Missing admin user ID.');
          setShowDeleteModal(false);
          setAdminPassword('');
          setDeleteUserId(null);
          return;
        }
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

  // Remove the old Bulk Upload CSV button and its logic from the UI and code

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
      {/* Filtered User List */}
      {loadingUsers ? <Text>Loading...</Text> : users
        .filter(user => isFranchisee ? (user.branch === franchiseeBranch && user.role !== 'Founder') : (!userRoleFilter || (user.role && user.role.toLowerCase()) === userRoleFilter.toLowerCase()))
        .filter(user => isFranchisee ? true : (!userBranchFilter || user.branch === userBranchFilter))
        .filter(user => !userSearch || user.name.toLowerCase().includes(userSearch.toLowerCase()) || user.email.toLowerCase().includes(userSearch.toLowerCase()))
        .map(user => (
          <View key={user.id} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
            <Text style={{flex: 1}}>
              {user.name} ({user.role}) - {user.branch}
              {user.role === 'Teacher' || user.role === 'Staff' ? ` [${user.staff_id}]` : user.role === 'Parent' ? ` [${user.student_id}]` : ''}
            </Text>
            <TouchableOpacity style={[styles.createButton, {paddingHorizontal: 8, marginRight: 4}]} onPress={() => navigation.navigate('EditUser', { user })}>
              <Text style={styles.createButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteUser(user.id)}>
              <MaterialIcons name="delete" size={20} color="#e57373" />
            </TouchableOpacity>
          </View>
        ))}
      {/* Delete Modal */}
      <Modal transparent animationType="fade" visible={showDeleteModal} onRequestClose={() => setShowDeleteModal(false)}>
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.3)'}}>
          <View style={{backgroundColor:'#fff', padding:24, borderRadius:12, width:300}}>
            <Text style={{fontWeight:'bold', fontSize:18, marginBottom:12}}>Enter Password to Delete User</Text>
            <TextInput
              placeholder="Your Password"
              secureTextEntry
              value={adminPassword}
              onChangeText={setAdminPassword}
              style={{borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:10, marginBottom:16}}
            />
            <View style={{flexDirection:'row', justifyContent:'flex-end'}}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={{marginRight:16}}>
                <Text style={{color:'#888'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteUser}
                style={{backgroundColor:'#e53935', paddingHorizontal:18, paddingVertical:10, borderRadius:8}}
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
}); 