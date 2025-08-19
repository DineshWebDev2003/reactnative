import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { BASE_URL } from '../config';
import { Picker } from '@react-native-picker/picker';

export default function ManageStaff({ route }) {
  const { branch } = route.params;
  const [staffList, setStaffList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', email: '', mobile: '', timetable: '' });
  const [editingId, setEditingId] = useState(null);

  // Fetch staff for this branch
  const fetchStaff = () => {
    fetch(`${BASE_URL}/get_staff.php?branch=${encodeURIComponent(branch)}`)
      .then(res => res.json())
      .then(data => setStaffList(data.staff || []));
  };

  useEffect(() => { fetchStaff(); }, []);

  // Add or update staff
  const handleSave = () => {
    const url = editingId ? `${BASE_URL}/update_staff.php` : `${BASE_URL}/create_staff.php`;
    const payload = editingId ? { ...form, id: editingId, branch } : { ...form, branch };
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchStaff();
          setModalVisible(false);
          setForm({ name: '', role: '', email: '', mobile: '', timetable: '' });
          setEditingId(null);
        } else {
          Alert.alert('Error', data.message || 'Failed to save staff');
        }
      });
  };

  // Delete staff
  const handleDelete = (id) => {
    Alert.alert('Confirm', 'Delete this staff?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          fetch(`${BASE_URL}/delete_staff.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) fetchStaff();
              else Alert.alert('Error', data.message || 'Failed to delete staff');
            });
        }
      }
    ]);
  };

  // Open modal for edit
  const handleEdit = (staff) => {
    setForm(staff);
    setEditingId(staff.id);
    setModalVisible(true);
  };

  // Open modal for add
  const handleAdd = () => {
    setForm({ name: '', role: '', email: '', mobile: '', timetable: '' });
    setEditingId(null);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff for {branch}</Text>
      <FlatList
        data={staffList}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.staffCard}>
            <Text style={styles.staffName}>{item.name} ({item.role})</Text>
            <Text>Email: {item.email}</Text>
            <Text>Mobile: {item.mobile}</Text>
            <Text>Timetable: {item.timetable}</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => handleEdit(item)}><Text>Edit</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}><Text>Delete</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addButtonText}>Add Staff</Text>
      </TouchableOpacity>
      {/* Modal for Add/Edit Staff */}
      <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput placeholder="Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} style={styles.input} />
            <Picker
              selectedValue={form.role}
              onValueChange={v => setForm(f => ({ ...f, role: v }))}
              style={styles.input}
            >
              <Picker.Item label="Select Role" value="" />
              <Picker.Item label="Nani" value="Nani" />
              <Picker.Item label="Teacher" value="Teacher" />
            </Picker>
            <TextInput placeholder="Email" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} style={styles.input} />
            <TextInput placeholder="Mobile" value={form.mobile} onChangeText={v => setForm(f => ({ ...f, mobile: v }))} style={styles.input} />
            <TextInput placeholder="Timetable" value={form.timetable} onChangeText={v => setForm(f => ({ ...f, timetable: v }))} style={styles.input} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleSave}><Text>Save</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 12 },
  staffCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 },
  staffName: { fontWeight: 'bold', fontSize: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  addButton: { backgroundColor: '#009688', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '80%' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' }
}); 