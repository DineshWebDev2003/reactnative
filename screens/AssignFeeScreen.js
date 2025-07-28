import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BASE_URL } from '../config';
import { useRoute } from '@react-navigation/native';

export default function AssignFeeScreen() {
  const route = useRoute();
  const franchiseeBranch = route?.params?.branch || '';
  const [parents, setParents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [feeInputs, setFeeInputs] = useState({});

  useEffect(() => {
    console.log('Fetching parents from:', `${BASE_URL}/get_users.php?role=Parent`);
    fetch(`${BASE_URL}/get_users.php?role=Parent`)
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        console.log('Parents response:', data);
        if (data.success && data.users) {
          // Double-check to ensure only parents are shown
          let parentUsers = data.users.filter(user => 
            user.role && user.role.toLowerCase() === 'parent'
          );
          // If branch param is present, filter to only that branch
          if (franchiseeBranch) {
            parentUsers = parentUsers.filter(user => user.branch === franchiseeBranch);
          }
          console.log('Filtered parents:', parentUsers.length);
          setParents(parentUsers);
          setFiltered(parentUsers);
          const fees = {};
          parentUsers.forEach(u => { 
            fees[u.id] = u.fee_due || '0'; 
          });
          setFeeInputs(fees);
        } else {
          Alert.alert('Error', 'Failed to fetch parents');
        }
      })
      .catch((error) => {
        console.log('Error fetching parents:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to fetch parents');
      });
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    const filteredParents = parents.filter(p =>
      p.name && p.name.toLowerCase().includes(text.toLowerCase()) ||
      (p.branch && p.branch.toLowerCase().includes(text.toLowerCase())) ||
      (p.childName && p.childName.toLowerCase().includes(text.toLowerCase()))
    );
    setFiltered(filteredParents);
  };

  const handleFeeChange = (id, value) => {
    setFeeInputs({ ...feeInputs, [id]: value });
  };

  const handleUpdateFee = (parent_id) => {
    const fee_due = parseFloat(feeInputs[parent_id]);
    if (isNaN(fee_due) || fee_due < 0) {
      Alert.alert('Error', 'Enter a valid fee amount');
      return;
    }
    setUpdatingId(parent_id);
    console.log('Updating fee for parent:', parent_id, 'amount:', fee_due);
    fetch(`${BASE_URL}/assign_fee.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id, fee_due })
    })
      .then(res => res.json())
      .then(data => {
        setUpdatingId(null);
        console.log('Fee update response:', data);
        if (data.success) {
          Alert.alert('Success', 'Fee updated successfully!');
        } else {
          Alert.alert('Error', data.message || 'Failed to update fee');
        }
      })
      .catch((error) => {
        console.log('Error updating fee:', error);
        setUpdatingId(null);
        Alert.alert('Error', 'Failed to update fee');
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e75480" />
        <Text style={styles.loadingText}>Loading parents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign/Update Parent Fees</Text>
      <Text style={styles.subtitle}>Total Parents: {parents.length}</Text>
      <TextInput
        style={styles.search}
        placeholder="Search by name, branch, or child"
        value={search}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.parentRow}>
            <View style={{flex:1}}>
              <Text style={styles.parentName}>{item.name} ({item.childName || 'No Child'})</Text>
              <Text style={styles.parentInfo}>Branch: {item.branch || '-'} | Class: {item.childClass || '-'}</Text>
              <Text style={styles.roleInfo}>Role: {item.role}</Text>
            </View>
            <TextInput
              style={styles.feeInput}
              keyboardType="numeric"
              value={feeInputs[item.id]?.toString() || ''}
              onChangeText={v => handleFeeChange(item.id, v)}
              placeholder="Fee"
            />
            <TouchableOpacity 
              style={styles.updateBtn} 
              onPress={() => handleUpdateFee(item.id)} 
              disabled={updatingId === item.id}
            >
              <Text style={{color:'#fff'}}>
                {updatingId === item.id ? 'Updating...' : 'Update'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No parents found.</Text>
            <Text style={styles.emptySubtext}>Make sure there are users with 'Parent' role in the database.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffe4ec', 
    padding: 16 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe4ec',
  },
  loadingText: {
    marginTop: 10,
    color: '#e75480',
    fontSize: 16,
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#e75480', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  search: { 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 12, 
    fontSize: 16 
  },
  parentRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    marginBottom: 10, 
    padding: 10, 
    elevation: 2 
  },
  parentName: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#e75480' 
  },
  parentInfo: { 
    color: '#009688', 
    fontSize: 13 
  },
  roleInfo: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  feeInput: { 
    width: 70, 
    backgroundColor: '#f3f3f3', 
    borderRadius: 6, 
    padding: 6, 
    marginHorizontal: 8, 
    textAlign: 'center', 
    fontSize: 15 
  },
  updateBtn: { 
    backgroundColor: '#e75480', 
    borderRadius: 6, 
    paddingVertical: 8, 
    paddingHorizontal: 12 
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
}); 