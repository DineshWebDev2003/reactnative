import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { BASE_URL } from '../config';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function AssignUser() {
  const navigation = useNavigation();
  const route = useRoute();
  const allowedRoles = route?.params?.allowedRoles || ['Teacher', 'Parent'];
  const staticBranch = route?.params?.branch || '';
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Teacher');
  const [userBranch, setUserBranch] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [bulkUsers, setBulkUsers] = useState([]); // For bulk creation
  const [bulkSuccess, setBulkSuccess] = useState(false);
  const [childName, setChildName] = useState('');
  const [childClass, setChildClass] = useState('');
  const [branches, setBranches] = useState([]);
  const [pendingCsvUsers, setPendingCsvUsers] = useState([]);
  const [percentage, setPercentage] = useState('');
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBranches(data.branches);
      });
  }, []);

  const addUserToBulk = () => {
    if (!userName || !userRole || !userBranch || !userEmail || !userMobile || !userPassword) return;
    setBulkUsers([...bulkUsers, {
      name: userName,
      role: userRole,
      branch: userBranch,
      email: userEmail,
      mobile: userMobile,
      password: userPassword,
    }]);
    setUserName('');
    setUserRole('Teacher');
    setUserBranch('');
    setUserEmail('');
    setUserMobile('');
    setUserPassword('');
  };

  const removeBulkUser = (index) => {
    setBulkUsers(bulkUsers.filter((_, i) => i !== index));
  };

  const submitBulkUsers = () => {
    if (bulkUsers.length === 0) return;
    setLoading(true);
    Promise.all(bulkUsers.map(user =>
      fetch(`${BASE_URL}/create_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }).then(res => res.json())
    )).then(results => {
      setLoading(false);
      if (results.every(r => r.success)) {
        setBulkSuccess(true);
        setBulkUsers([]);
      } else {
        Alert.alert('Some users failed', 'Check your data and try again.');
      }
    });
  };

  const createUser = (userData) => {
    if (!userName || !userRole || !userEmail || !userMobile || !userPassword) {
      Alert.alert('Error', 'Please fill all required fields, including branch.');
      return;
    }
    setLoading(true);
    fetch(`${BASE_URL}/create_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName,
        role: userRole,
        branch: staticBranch || userBranch,
        email: userEmail,
        mobile: userMobile,
        password: userPassword,
        childName: userRole === 'Parent' ? childName : undefined,
        childClass: userRole === 'Parent' ? childClass : undefined,
        percentage: userRole === 'Franchisee' ? percentage : undefined,
        student_id: (userRole === 'Parent' || userRole === 'tuition_student') ? studentId : undefined,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        console.log('AssignUser create user response:', data); // Debug log
        if (data.success) {
          setSuccessModal(true);
          setUserName('');
          setUserRole('Teacher');
          setUserBranch('');
          setUserEmail('');
          setUserMobile('');
          setUserPassword('');
          setChildName('');
          setChildClass('');
          setStudentId('');
        } else {
          Alert.alert('Error', data.message || 'Failed to create user');
        }
      })
      .catch(async (err) => { // Make the catch block async
        setLoading(false);
        Alert.alert('Error', 'Network or server error. Check console for details.');
        // Log the raw text response to see what the server is actually sending
        if (err.response) {
          const text = await err.response.text();
          console.log('AssignUser server response text:', text);
        }
        console.log('AssignUser create user error:', err);
      });
  };

  // CSV upload handler
  const handleCsvUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      console.log('File Picker Result:', result); // Debug
      if (result.type === 'success' || (result.assets && result.assets.length > 0)) {
        // Support both new and old API shapes
        const uri = result.uri || (result.assets && result.assets[0] && result.assets[0].uri);
        if (!uri) {
          Alert.alert('CSV Upload Error', 'No file URI found.');
          return;
        }
        const csvText = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
        console.log('CSV Text:', csvText); // Debug
        const parsed = Papa.parse(csvText, { header: true });
        console.log('Parsed CSV:', parsed); // Debug
        if (parsed.errors.length) {
          Alert.alert('CSV Parse Error', parsed.errors[0].message);
          return;
        }
        // Expect columns: name, role, branch, email, mobile, password
        const validRows = parsed.data.filter(row => row.name && row.role && row.branch && row.email && row.mobile && row.password).map(row => ({
          ...row,
          childName: row.child_name || null,
          childClass: row.child_class || null,
          percentage: row.percentage || null,
        }));
        console.log('Valid Rows:', validRows); // Debug
        if (validRows.length === 0) {
          Alert.alert('No valid users found in CSV.');
          return;
        }
        setPendingCsvUsers(validRows);
        Alert.alert('CSV Ready', `${validRows.length} users ready to upload. Review below and click Upload Users.`);
      }
    } catch (e) {
      console.log('CSV Upload Error:', e); // Debug
      Alert.alert('CSV Upload Error', e.message);
    }
  };

  const handleUploadPendingCsvUsers = async () => {
    if (!pendingCsvUsers.length) return;
    let successCount = 0;
    let failCount = 0;
    for (const user of pendingCsvUsers) {
      // Replace blank fields with null
      const cleanUser = {};
      for (const key in user) {
        cleanUser[key] = user[key] === '' ? null : user[key];
      }
      // Map CSV fields to API fields
      if (cleanUser.child_name) cleanUser.childName = cleanUser.child_name;
      if (cleanUser.child_class) cleanUser.childClass = cleanUser.child_class;
      if (cleanUser.percentage) cleanUser.percentage = cleanUser.percentage;
      // Remove CSV-only fields
      delete cleanUser.child_name;
      delete cleanUser.child_class;
      try {
        console.log('Uploading user:', cleanUser); // Debug
        const res = await fetch(`${BASE_URL}/create_user.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanUser),
        });
        const data = await res.json();
        console.log('API Response:', data); // Debug
        if (data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        console.log('User upload error:', e); // Debug
        failCount++;
      }
    }
    setPendingCsvUsers([]);
    Alert.alert('CSV Upload', `${successCount} users created successfully. ${failCount > 0 ? failCount + ' failed.' : ''}`);
  };

  const downloadDemoCsv = async () => {
    // Demo CSV with all supported roles and relevant fields
    const csv =
      'name,role,branch,email,mobile,password,child_name,child_class,percentage\n' +
      'John Doe,Franchisee,Coimbatore,john@example.com,9876543210,pass123,, ,10\n' +
      'Jane Smith,Teacher,Tambaram,jane@example.com,9123456789,pass456,, ,\n' +
      'Robert Parent,Parent,Chennai,robert.parent@example.com,9000000000,pass789,Emily Doe,Grade 1,\n' +
      'Priya Tuition,tuition_teacher,Salem,priya.tuition@example.com,9111111111,pass321,, ,\n' +
      'Kumar Student,tuition_student,Salem,kumar.student@example.com,9222222222,pass654,, ,\n';
    const fileUri = FileSystem.cacheDirectory + 'demo_users.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Download Demo CSV' });
  };

  // In the role picker, update the options:
  const founderRoles = ['Franchisee', 'Teacher', 'Parent', 'tuition_teacher', 'tuition_student'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#1a237e" />
      </TouchableOpacity>
      <Text style={styles.title}><FontAwesome5 name="user-plus" size={22} color="#1a237e" />  Assign User to Branch</Text>
      <View style={styles.formSection}>
        <TextInput style={styles.input} placeholder="Name" value={userName} onChangeText={setUserName} />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userRole}
            style={styles.picker}
            onValueChange={setUserRole}
          >
            {founderRoles.map(role => (
              <Picker.Item key={role} label={role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')} value={role} />
            ))}
          </Picker>
        </View>
        {userRole === 'Parent' && (
          <>
            <TextInput style={styles.input} placeholder="Child Name" value={childName} onChangeText={setChildName} />
            {!staticBranch ? (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={childClass}
                  style={styles.picker}
                  onValueChange={setChildClass}>
                  <Picker.Item label="Select Class" value="" />
                  <Picker.Item label="Daycare" value="Daycare" />
                  <Picker.Item label="Playschool" value="Playschool" />
                  <Picker.Item label="Toddler" value="Toddler" />
                </Picker>
              </View>
            ) : (
              <TextInput style={styles.input} placeholder="Child Class" value={childClass} onChangeText={setChildClass} />
            )}
          </>
        )}
        {userRole === 'Franchisee' && (
          <>
            <Text style={styles.label}>Percentage</Text>
            <TextInput
              value={percentage}
              onChangeText={setPercentage}
              style={styles.input}
              placeholder="Enter percentage"
              keyboardType="numeric"
            />
          </>
        )}
        {(userRole === 'Parent' || userRole === 'tuition_student') && (
          <>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              value={studentId}
              onChangeText={setStudentId}
              style={styles.input}
              placeholder="Enter student ID"
              keyboardType="numeric"
            />
          </>
        )}
        {/* Show static branch as a label, not a picker */}
        {!staticBranch ? (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={userBranch}
              style={styles.picker}
              onValueChange={(itemValue) => setUserBranch(itemValue)}>
              <Picker.Item label="Select Branch" value="" />
              {branches && branches.map(branch => (
                <Picker.Item key={branch.id} label={branch.name} value={branch.name} />
              ))}
            </Picker>
          </View>
        ) : (
          <View style={{marginBottom: 12}}>
            <Text style={{fontWeight:'bold', color:'#009688'}}>Branch: <Text style={{color:'#333'}}>{staticBranch}</Text></Text>
          </View>
        )}
        <TextInput style={styles.input} placeholder="Email" value={userEmail} onChangeText={setUserEmail} />
        <TextInput style={styles.input} placeholder="Mobile" value={userMobile} onChangeText={setUserMobile} />
        <TextInput style={styles.input} placeholder="Password" value={userPassword} onChangeText={setUserPassword} secureTextEntry />
        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
          <TouchableOpacity style={[styles.createButton, {flex:1, marginRight: 6}, (!userName || !userRole || !userEmail || !userMobile || !userPassword) && { opacity: 0.5 }]} onPress={() => {
            createUser({
              name: userName,
              role: userRole,
              branch: staticBranch || userBranch,
              email: userEmail,
              mobile: userMobile,
              password: userPassword,
              childName: userRole === 'Parent' ? childName : undefined,
              childClass: userRole === 'Parent' ? childClass : undefined,
              percentage: userRole === 'Franchisee' ? percentage : undefined,
              student_id: (userRole === 'Parent' || userRole === 'tuition_student') ? studentId : undefined,
            });
          }} disabled={!userName || !userRole || !userEmail || !userMobile || !userPassword || loading}>
            <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Add Single User'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* CSV Upload Button */}
      <TouchableOpacity style={[styles.createButton, {backgroundColor:'#FFD700', marginBottom: 12}]} onPress={downloadDemoCsv}>
        <Text style={styles.createButtonText}>Download Demo CSV</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.createButton, {backgroundColor:'#2196f3', marginBottom: 12}]} onPress={handleCsvUpload}>
        <Text style={styles.createButtonText}>Upload CSV</Text>
      </TouchableOpacity>
      {pendingCsvUsers.length > 0 && (
        <View style={{backgroundColor:'#eaf2ff', borderRadius:10, padding:12, marginBottom:12}}>
          <Text style={{fontWeight:'bold', color:'#1a237e', marginBottom:6}}>
            Users to be uploaded from CSV:
          </Text>
          {pendingCsvUsers.map((user, idx) => (
            <Text key={idx} style={{marginBottom:2}}>
              {user.name} | {user.role} | {user.branch} | {user.email} | {user.mobile}
            </Text>
          ))}
          <TouchableOpacity
            style={[styles.createButton, {backgroundColor:'#4caf50', marginTop:10}]}
            onPress={handleUploadPendingCsvUsers}
          >
            <Text style={styles.createButtonText}>Upload Users</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Single Success Modal */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successDialog}>
            <MaterialIcons name="check-circle" size={48} color="#4caf50" style={{marginBottom: 8}} />
            <Text style={{fontWeight: 'bold', fontSize: 18, color: '#4caf50', marginBottom: 8}}>User Created Successfully!</Text>
            <TouchableOpacity style={styles.okButton} onPress={() => { setSuccessModal(false); navigation.goBack(); }}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Bulk Success Modal */}
      <Modal visible={bulkSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successDialog}>
            <MaterialIcons name="check-circle" size={48} color="#4caf50" style={{marginBottom: 8}} />
            <Text style={{fontWeight: 'bold', fontSize: 18, color: '#4caf50', marginBottom: 8}}>All Users Created Successfully!</Text>
            <TouchableOpacity style={styles.okButton} onPress={() => { setBulkSuccess(false); navigation.goBack(); }}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 18,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerContainer: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    height: 44,
    width: '100%',
  },
  createButton: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successDialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  okButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 12,
  },
  okButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bulkListSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    fontWeight: 'bold',
  },
}); 