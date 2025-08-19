import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { VirtualIDCardFront, VirtualIDCardBack } from '../components/VirtualIDCard';
import { zip } from 'react-native-zip-archive';

export default function IDCardListScreen() {
  const navigation = useNavigation();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStudent, setModalStudent] = useState(null);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [franchiseeMobile, setFranchiseeMobile] = useState('');
  const [fetchingFranchisee, setFetchingFranchisee] = useState(false);
  const idCardFrontRef = useRef();
  const idCardBackRef = useRef();
  const logoSource = { uri: 'https://app.tnhappykids.in/assets/icon.png' };
  const [canDownload, setCanDownload] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBranches(data.branches);
      });
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      setLoading(true);
      fetch(`${BASE_URL}/get_users.php`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const filtered = data.users.filter(u => u.role === 'Parent' && u.branch === selectedBranch);
            setStudents(filtered);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setStudents([]);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (showModal && modalStudent) {
      setCanDownload(false);
      setTimeout(() => setCanDownload(true), 350); // Wait for refs to render
    } else {
      setCanDownload(false);
    }
  }, [showModal, modalStudent]);

  const handleDownloadIDCard = async (student) => {
    if (!student || !student.student_id || !student.childName) {
      Alert.alert('Missing Info', 'Student info is incomplete.');
      return;
    }
    setShowBack(false);
    setModalStudent(student);
    setShowModal(true);
    setFetchingFranchisee(true);
    // Fetch franchisee mobile for this branch
    try {
      const res = await fetch(`${BASE_URL}/get_franchisees.php`);
      const data = await res.json();
      if (data.success && Array.isArray(data.franchisees)) {
        const franchisee = data.franchisees.find(f => f.branch === student.branch);
        setFranchiseeMobile(franchisee && franchisee.mobile ? franchisee.mobile : '');
      } else {
        setFranchiseeMobile('');
      }
    } catch {
      setFranchiseeMobile('');
    }
    setFetchingFranchisee(false);
  };

  const handleShare = async () => {
    if (!idCardFrontRef.current || !idCardBackRef.current) return;
    setCaptureLoading(true);
    try {
      await new Promise(res => setTimeout(res, 200));
      const studentId = modalStudent.student_id || 'student';
      // Use local file paths for zip-archive
      const cacheDir = FileSystem.cacheDirectory.replace('file://', '');
      const frontPath = cacheDir + `idcard_front_${studentId}.png`;
      const backPath = cacheDir + `idcard_back_${studentId}.png`;
      const zipPath = cacheDir + `idcard_${studentId}.zip`;
      const frontUri = await captureRef(idCardFrontRef, { format: 'png', quality: 1 });
      await new Promise(res => setTimeout(res, 200));
      const backUri = await captureRef(idCardBackRef, { format: 'png', quality: 1 });
      // Save both images to files with student id in name
      await FileSystem.copyAsync({ from: frontUri, to: 'file://' + frontPath });
      await FileSystem.copyAsync({ from: backUri, to: 'file://' + backPath });
      // Debug: check if files exist
      const frontInfo = await FileSystem.getInfoAsync('file://' + frontPath);
      const backInfo = await FileSystem.getInfoAsync('file://' + backPath);
      console.log('Front exists:', frontInfo.exists, 'Back exists:', backInfo.exists);
      console.log('cacheDir:', cacheDir);
      console.log('frontPath:', frontPath);
      console.log('backPath:', backPath);
      console.log('zipPath:', zipPath);
      if (!frontInfo.exists || !backInfo.exists) {
        Alert.alert('Error', 'Failed to save one or both images.');
        setCaptureLoading(false);
        return;
      }
      // Zip both images
      try {
        const zipResult = await zip(cacheDir, zipPath, [
          `idcard_front_${studentId}.png`,
          `idcard_back_${studentId}.png`
        ]);
        console.log('zipResult:', zipResult);
        await Sharing.shareAsync('file://' + zipPath, { mimeType: 'application/zip', dialogTitle: 'Download ID Card ZIP' });
      } catch (zipError) {
        console.log('zip error:', zipError);
        Alert.alert('ZIP Error', String(zipError));
        setCaptureLoading(false);
        return;
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate or share ZIP.');
    }
    setCaptureLoading(false);
    setShowModal(false);
    setModalStudent(null);
  };

  const filteredStudents = students.filter(s =>
    !search ||
    (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
    (s.student_id && s.student_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 12}}>
          <MaterialIcons name="arrow-back" size={26} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.title}><FontAwesome5 name="id-card" size={22} color="#1a237e" />  ID Card List by Branch</Text>
      </View>
      {branches.length === 0 ? (
        <Text style={styles.info}>No branches found.</Text>
      ) : (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedBranch}
            style={styles.picker}
            onValueChange={setSelectedBranch}>
            <Picker.Item label="Select Branch" value="" />
            {branches.map(branch => (
              <Picker.Item key={branch.id} label={branch.name} value={branch.name} />
            ))}
          </Picker>
        </View>
      )}
      {selectedBranch ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Search by name or student ID"
            value={search}
            onChangeText={setSearch}
          />
          {loading ? <ActivityIndicator size="large" color="#1a237e" style={{marginTop: 24}} /> : (
            <ScrollView style={{marginTop: 8}} contentContainerStyle={{paddingBottom: 32}}>
              {filteredStudents.length === 0 ? (
                <Text style={styles.info}>No students found for this branch.</Text>
              ) : filteredStudents.map(student => (
                <View key={student.id} style={styles.studentRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentId}>ID: {student.student_id}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDownloadIDCard(student)} style={styles.idCardButton}>
                    <FontAwesome5 name="id-card" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      ) : null}
      {/* Modal for Virtual ID Card Preview and Share */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(255,236,179,0.7)'}}>
          <View style={{backgroundColor:'#fffde7', borderRadius:24, padding:18, alignItems:'center', minWidth:340, borderWidth:2, borderColor:'#ffe082'}}>
            {/* Hidden views for capture */}
            <View style={{position:'absolute', left:-9999, top:-9999}}>
              {modalStudent && <View collapsable={false} ref={idCardFrontRef}><VirtualIDCardFront student={modalStudent} logoSource={logoSource} /></View>}
              {modalStudent && <View collapsable={false} ref={idCardBackRef}><VirtualIDCardBack student={modalStudent} franchiseeMobile={franchiseeMobile} /></View>}
            </View>
            {/* Visible preview */}
            {modalStudent && (
              <View style={{alignSelf:'center'}}>
                {showBack ? (
                  <VirtualIDCardBack student={modalStudent} franchiseeMobile={franchiseeMobile} />
                ) : (
                  <VirtualIDCardFront student={modalStudent} logoSource={logoSource} />
                )}
              </View>
            )}
            {fetchingFranchisee || captureLoading ? <ActivityIndicator size="large" color="#1a237e" style={{marginTop: 16}} /> : (
              <View style={{flexDirection:'row', marginTop: 16, alignItems:'center'}}>
                <TouchableOpacity style={[styles.idCardButton, {alignSelf:'center', marginRight: 12}]} onPress={() => setShowBack(b => !b)}>
                  <Ionicons name={showBack ? 'ios-arrow-back' : 'ios-arrow-forward'} size={20} color="#fff" />
                  <Text style={{color:'#fff', fontWeight:'bold', marginLeft:8}}>{showBack ? 'Front Side' : 'Back Side'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.idCardButton, {alignSelf:'center', opacity: canDownload ? 1 : 0.5}]} onPress={canDownload ? handleShare : undefined} disabled={!canDownload}>
                  <FontAwesome5 name="share" size={20} color="#fff" />
                  <Text style={{color:'#fff', fontWeight:'bold', marginLeft:8}}>Download ZIP</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => { setShowModal(false); setModalStudent(null); }} style={{marginTop: 12}}>
              <Text style={{color:'#888'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
    paddingTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#1a237e',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 16,
  },
  info: {
    color: '#888',
    fontSize: 16,
    marginTop: 24,
    alignSelf: 'center',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  studentName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a237e',
  },
  studentId: {
    color: '#555',
    fontSize: 14,
    marginTop: 2,
  },
  idCardButton: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    padding: 10,
    marginLeft: 12,
  },
}); 