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

  // Manual CSV input as fallback
  const [showManualCsv, setShowManualCsv] = useState(false);
  const [manualCsvText, setManualCsvText] = useState('');

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

  // Alternative CSV upload handler with better device compatibility
  const handleCsvUpload = async () => {
    try {
      // Try multiple file type configurations
      const fileTypes = [
        { type: ['text/csv', 'application/csv', '*/*'] },
        { type: 'text/csv' },
        { type: '*/*' }
      ];
      
      let result = null;
      let error = null;
      
      for (const config of fileTypes) {
        try {
          result = await DocumentPicker.getDocumentAsync({ 
            ...config,
            copyToCacheDirectory: true,
            multiple: false
          });
          
          if (result.type === 'success') {
            break;
          }
        } catch (e) {
          error = e;
          console.log(`Failed with config ${config.type}:`, e);
        }
      }
      
      if (!result || result.type !== 'success') {
        Alert.alert(
          'File Selection Issue', 
          'Unable to pick CSV file. Please ensure:\n\n1. The file is a valid CSV\n2. You have permission to access files\n3. Try saving the file to Downloads first'
        );
        return;
      }
      
      console.log('Selected file:', result);
      
      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(result.uri);
      console.log('File content length:', fileContent.length);
      
      if (!fileContent || fileContent.length === 0) {
        Alert.alert('Empty File', 'The selected file appears to be empty.');
        return;
      }
      
      // Parse CSV
      const parsed = Papa.parse(fileContent, { 
        header: true,
        skipEmptyLines: true,
        trimHeaders: true
      });
      
      console.log('Parsed CSV:', parsed);
      
      if (parsed.errors.length > 0) {
        Alert.alert('CSV Parse Error', `Error: ${parsed.errors[0].message}`);
        return;
      }
      
      // Validate required columns
      const requiredColumns = ['name', 'role', 'branch', 'email', 'mobile', 'password'];
      const headers = parsed.meta.fields || [];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        Alert.alert(
          'Invalid CSV Format', 
          `Missing required columns: ${missingColumns.join(', ')}\n\nPlease use the "View CSV Format" button to see the correct format.`
        );
        return;
      }
      
      // Filter valid rows
      const validRows = parsed.data.filter(row => 
        row.name && row.role && row.branch && row.email && row.mobile && row.password
      );
      
      if (validRows.length === 0) {
        Alert.alert(
          'No Valid Users', 
          'No valid users found in CSV. Please check that all required fields are filled.'
        );
        return;
      }
      
      setBulkUsers([...bulkUsers, ...validRows]);
      Alert.alert('CSV Upload Success', `${validRows.length} users added to bulk list.`);
      
    } catch (e) {
      console.error('CSV Upload Error:', e);
      Alert.alert(
        'CSV Upload Error', 
        `Error: ${e.message}\n\nPlease try:\n1. Using a different CSV file\n2. Checking file permissions\n3. Restarting the app`
      );
    }
  };

  const handleManualCsvSubmit = () => {
    try {
      if (!manualCsvText.trim()) {
        Alert.alert('Empty Input', 'Please enter CSV data.');
        return;
      }

      const parsed = Papa.parse(manualCsvText, { 
        header: true,
        skipEmptyLines: true,
        trimHeaders: true
      });

      if (parsed.errors.length > 0) {
        Alert.alert('CSV Parse Error', `Error: ${parsed.errors[0].message}`);
        return;
      }

      const requiredColumns = ['name', 'role', 'branch', 'email', 'mobile', 'password'];
      const headers = parsed.meta.fields || [];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));

      if (missingColumns.length > 0) {
        Alert.alert('Invalid CSV Format', `Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      const validRows = parsed.data.filter(row => 
        row.name && row.role && row.branch && row.email && row.mobile && row.password
      );

      if (validRows.length === 0) {
        Alert.alert('No Valid Users', 'No valid users found in CSV data.');
        return;
      }

      setBulkUsers([...bulkUsers, ...validRows]);
      setManualCsvText('');
      setShowManualCsv(false);
      Alert.alert('CSV Upload Success', `${validRows.length} users added to bulk list.`);
    } catch (e) {
      Alert.alert('CSV Parse Error', e.message);
    }
  };

  const downloadDemoCsv = async () => {
    // Updated CSV content with all required columns
    const csv = 'name,role,branch,email,mobile,password,parent_name,child_name,child_class,category,address,emergency_contact\nJohn Doe,Administration,Coimbatore,john@example.com,9876543210,pass123,Robert Doe,Emily Doe,Playgroup,Daycare,123 Main St,9876543211\nJane Smith,Teacher,Tambaram,jane@example.com,9123456789,pass456,Anna Smith,Lucas Smith,Kindergarten,Playschool,456 Oak Ave,9123456790\nMike Johnson,Parent,Pollachi,mike@example.com,9988776655,pass789,Mike Johnson,Sarah Johnson,Toddler,Toddler,789 Pine Rd,9988776656\n';
    const fileUri = FileSystem.cacheDirectory + 'demo_users.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Download Demo CSV' });
  };

  // Show CSV format information
  const showCsvFormat = () => {
    Alert.alert(
      'CSV Format Required',
      `Your CSV file must have these columns:
      
Required columns:
• name - User's full name
• role - User role (Teacher, Parent, Administration, etc.)
• branch - Branch name
• email - Email address
• mobile - Mobile number
• password - Password

Optional columns:
• parent_name - Parent's name (for students)
• child_name - Child's name (for parents)
• child_class - Child's class (Daycare, Playschool, Toddler)
• category - Category (Daycare, Playschool, Toddler)
• address - Address
• emergency_contact - Emergency contact number

Example:
name,role,branch,email,mobile,password,parent_name,child_name,child_class
John Doe,Parent,Pollachi,john@example.com,9876543210,pass123,John Doe,Emily Doe,Playgroup`,
      [{ text: 'OK' }]
    );
  };

  // In the role picker, restrict roles for founders:
  const founderRoles = ['Teacher', 'Administration', 'Parent', 'tuition_teacher', 'tuition_student'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color="#1a237e" />
      </TouchableOpacity>
      <Text style={styles.title}><FontAwesome5 name="user-plus" size={22} color="#1a237e" />  Assign User to Branch</Text>
      <View style={styles.formSection}>
        <TextInput style={styles.input} placeholder="Name" value={userName} onChangeText={setUserName} />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userRole}
            style={styles.picker}
            onValueChange={(itemValue) => setUserRole(itemValue)}>
            {(!staticBranch ? founderRoles : allowedRoles).map(role => (
              <Picker.Item key={role} label={role} value={role} />
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
            });
          }} disabled={!userName || !userRole || !userEmail || !userMobile || !userPassword || loading}>
            <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Add Single User'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.createButton, {flex:1, marginLeft: 6}, (!userName || !userRole || !userBranch || !userEmail || !userMobile || !userPassword) && { opacity: 0.5 }]} onPress={addUserToBulk} disabled={!userName || !userRole || !userBranch || !userEmail || !userMobile || !userPassword || loading}>
            <Text style={styles.createButtonText}>Add to Bulk</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* CSV Upload Section */}
      <View style={styles.csvSection}>
        <Text style={styles.sectionTitle}>Bulk Upload via CSV</Text>
        
        {/* CSV Format Info Button */}
        <TouchableOpacity style={[styles.createButton, {backgroundColor:'#FF9800', marginBottom: 8}]} onPress={showCsvFormat}>
          <Text style={styles.createButtonText}>📋 View CSV Format</Text>
        </TouchableOpacity>
        
        {/* Download Demo CSV */}
        <TouchableOpacity style={[styles.createButton, {backgroundColor:'#FFD700', marginBottom: 8}]} onPress={downloadDemoCsv}>
          <Text style={styles.createButtonText}>📥 Download Demo CSV</Text>
        </TouchableOpacity>
        
        {/* Upload CSV */}
        <TouchableOpacity style={[styles.createButton, {backgroundColor:'#2196f3', marginBottom: 8}]} onPress={handleCsvUpload}>
          <Text style={styles.createButtonText}>📤 Upload CSV</Text>
        </TouchableOpacity>
        
        {/* Manual CSV Input (Fallback) */}
        <TouchableOpacity style={[styles.createButton, {backgroundColor:'#9c27b0', marginBottom: 12}]} onPress={() => setShowManualCsv(!showManualCsv)}>
          <Text style={styles.createButtonText}>✏️ Manual CSV Input</Text>
        </TouchableOpacity>
        
        {/* Manual CSV Input Area */}
        {showManualCsv && (
          <View style={styles.manualCsvSection}>
            <Text style={styles.sectionSubtitle}>Paste CSV data here:</Text>
            <TextInput
              style={styles.csvTextInput}
              placeholder="name,role,branch,email,mobile,password&#10;John Doe,Parent,Pollachi,john@example.com,9876543210,pass123"
              value={manualCsvText}
              onChangeText={setManualCsvText}
              multiline
              numberOfLines={6}
            />
            <View style={{flexDirection: 'row', gap: 8}}>
              <TouchableOpacity style={[styles.createButton, {flex: 1, backgroundColor: '#4caf50'}]} onPress={handleManualCsvSubmit}>
                <Text style={styles.createButtonText}>Add Users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.createButton, {flex: 1, backgroundColor: '#f44336'}]} onPress={() => {setShowManualCsv(false); setManualCsvText('');}}>
                <Text style={styles.createButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      {/* Bulk Users List */}
      {bulkUsers.length > 0 && (
        <View style={styles.bulkListSection}>
          <Text style={{fontWeight:'bold', fontSize:16, marginBottom:8, color:'#1a237e'}}>Bulk Users to Create:</Text>
          {bulkUsers.map((user, idx) => (
            <View key={idx} style={{flexDirection:'row', alignItems:'center', marginBottom:4}}>
              <Text style={{flex:1}}>{user.name} ({user.role}) - {user.branch}</Text>
              <TouchableOpacity onPress={() => removeBulkUser(idx)}>
                <MaterialIcons name="delete" size={20} color="#e57373" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={[styles.createButton, {backgroundColor:'#4caf50', marginTop:10}]} onPress={submitBulkUsers} disabled={loading}>
            <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Submit All'}</Text>
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
  csvSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1a237e',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  manualCsvSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  csvTextInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
}); 