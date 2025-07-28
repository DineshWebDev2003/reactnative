import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '../config';

export default function EditUser() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: initialUser } = route.params;
  const [user, setUser] = useState(initialUser);
  const [branches, setBranches] = useState([]);
  const [userName, setUserName] = useState(user.name);
  const [userRole, setUserRole] = useState(user.role);
  const [userBranch, setUserBranch] = useState(user.branch);
  const [userEmail, setUserEmail] = useState(user.email);
  const [userMobile, setUserMobile] = useState(user.mobile);
  const [userPassword, setUserPassword] = useState('');
  const [userShare, setUserShare] = useState(user.franchisee_share);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialUser.student_id && !initialUser.staff_id) {
      // Fetch full user details from backend
      fetch(`${BASE_URL}/get_users.php?id=${initialUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users && data.users.length > 0) {
            setUser(data.users[0]);
          }
        });
    }
  }, [initialUser]);

  useEffect(() => {
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBranches(data.branches);
      });
  }, []);

  const saveEditUser = () => {
    if (!userName || !userRole || !userBranch || !userEmail || !userMobile) return;
    setLoading(true);
    fetch(`${BASE_URL}/edit_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        name: userName,
        role: userRole,
        branch: userBranch,
        email: userEmail,
        mobile: userMobile,
        password: userPassword, // Only update if not blank
        franchisee_share: userShare,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          Alert.alert('Success', 'User updated successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Error', data.message || 'Failed to update user');
        }
      });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Edit User</Text>
      <View style={styles.formSection}>
        <TextInput style={styles.input} placeholder="Name" value={userName} onChangeText={setUserName} />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userRole}
            style={styles.picker}
            onValueChange={setUserRole}>
            <Picker.Item label="Franchisee" value="Franchisee" />
            <Picker.Item label="Teacher" value="Teacher" />
            <Picker.Item label="Parent" value="Parent" />
            <Picker.Item label="Tuition Teacher" value="tuition_teacher" />
            <Picker.Item label="Tuition Student" value="tuition_student" />
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userBranch}
            style={styles.picker}
            onValueChange={setUserBranch}>
            <Picker.Item label="Select Branch" value="" />
            {branches.map(branch => (
              <Picker.Item key={branch.id} label={branch.name} value={branch.name} />
            ))}
          </Picker>
        </View>
        <TextInput style={styles.input} placeholder="Email" value={userEmail} onChangeText={setUserEmail} />
        <TextInput style={styles.input} placeholder="Mobile" value={userMobile} onChangeText={setUserMobile} />
        <TextInput style={styles.input} placeholder="New Password (optional)" value={userPassword} onChangeText={setUserPassword} secureTextEntry />
        {userRole === 'Franchisee' && (
          <TextInput
            style={styles.input}
            placeholder="Franchisee Share (%)"
            value={userShare}
            onChangeText={setUserShare}
            keyboardType="numeric"
          />
        )}
        <TouchableOpacity style={[styles.createButton, (!userName || !userRole || !userBranch || !userEmail || !userMobile) && { opacity: 0.5 }]} onPress={saveEditUser} disabled={!userName || !userRole || !userBranch || !userEmail || !userMobile || loading}>
          <Text style={styles.createButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFD700',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#1a237e',
    fontWeight: 'bold',
    fontSize: 15,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#1a237e',
    marginBottom: 16,
    alignSelf: 'center',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
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