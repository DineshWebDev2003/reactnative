import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BASE_URL } from '../config';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function AssignFeeScreen() {
  const route = useRoute();
  const navigation = useNavigation();
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
      body: JSON.stringify({ user_id: parent_id, amount: fee_due })
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
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading parents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign/Update Fees</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
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
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#4CAF50',
    fontSize: 16,
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
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  parentRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    marginBottom: 10, 
    padding: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  parentName: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#333',
    marginBottom: 4,
  },
  parentInfo: { 
    fontSize: 14, 
    color: '#666',
    marginBottom: 2,
  },
  roleInfo: { 
    fontSize: 12, 
    color: '#999',
  },
  feeInput: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 6, 
    padding: 8, 
    marginHorizontal: 8, 
    width: 80, 
    textAlign: 'center',
    fontSize: 14,
  },
  updateBtn: { 
    backgroundColor: '#4CAF50', 
    borderRadius: 6, 
    padding: 8, 
    paddingHorizontal: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
}); 