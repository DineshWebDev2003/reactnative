import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../config';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManageBranchesScreen() {
  const navigation = useNavigation();
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [editBranchId, setEditBranchId] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [successColor, setSuccessColor] = useState('#4caf50');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = () => {
    setLoadingBranches(true);
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBranches(data.branches);
        }
        setLoadingBranches(false);
      })
      .catch(() => {
        setLoadingBranches(false);
        Alert.alert('Error', 'Failed to fetch branches.');
      });
  };

  const createBranch = () => {
    if (!branchName || !branchAddress) {
      Alert.alert('Error', 'Please enter both branch name and address.');
      return;
    }
    Alert.alert(
      'Confirm',
      `Create branch "${branchName}" at "${branchAddress}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            fetch(`${BASE_URL}/create_branch.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: branchName, address: branchAddress }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setBranchName('');
                  setBranchAddress('');
                  setSuccessMessage('Branch created successfully!');
                  setSuccessColor('#4caf50');
                  fetchBranches();
                  setShowCreateForm(false);
                  setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                  Alert.alert('Error', data.message || 'Failed to create branch');
                }
              });
          },
        },
      ]
    );
  };

  const startEditBranch = (branch) => {
    setEditBranchId(branch.id);
    setEditBranchName(branch.name);
    setEditBranchAddress(branch.address);
    setShowCreateForm(false); // Hide create form when editing
  };

  const cancelEdit = () => {
    setEditBranchId(null);
    setEditBranchName('');
    setEditBranchAddress('');
  };

  const saveEditBranch = () => {
    Alert.alert(
      'Confirm',
      `Save changes to branch "${editBranchName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            fetch(`${BASE_URL}/edit_branch.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: editBranchId, name: editBranchName, address: editBranchAddress }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  cancelEdit();
                  setSuccessMessage('Branch updated successfully!');
                  setSuccessColor('#2196f3');
                  fetchBranches();
                  setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                  Alert.alert('Error', data.message || 'Failed to update branch');
                }
              });
          },
        },
      ]
    );
  };

  const deleteBranch = (branch) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete the branch "${branch.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            fetch(`${BASE_URL}/delete_branch.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: branch.id }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setSuccessMessage('Branch deleted successfully!');
                  setSuccessColor('#e57373');
                  fetchBranches();
                  setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                  Alert.alert('Error', data.message || 'Failed to delete branch');
                }
              });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Branches</Text>
      </View>

      {successMessage ? (
        <View style={[styles.successBanner, { backgroundColor: successColor }]}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Create Branch Button */}
        {!showCreateForm && !editBranchId && (
            <TouchableOpacity style={styles.toggleButton} onPress={() => { setShowCreateForm(true); setEditBranchId(null); }}>
                <Text style={styles.toggleButtonText}>Create New Branch</Text>
            </TouchableOpacity>
        )}

        {/* Create Branch Form */}
        {showCreateForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create New Branch</Text>
            <TextInput
              style={styles.input}
              placeholder="Branch Name"
              value={branchName}
              onChangeText={setBranchName}
            />
            <TextInput
              style={styles.input}
              placeholder="Branch Address"
              value={branchAddress}
              onChangeText={setBranchAddress}
            />
            <View style={styles.buttonGroup}>
                <TouchableOpacity style={[styles.button, styles.createButton]} onPress={createBranch}>
                    <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowCreateForm(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Branch List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Existing Branches</Text>
          {loadingBranches ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
          ) : (
            branches.map(branch => (
              <View key={branch.id} style={styles.itemContainer}>
                {editBranchId === branch.id ? (
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.input}
                      value={editBranchName}
                      onChangeText={setEditBranchName}
                    />
                    <TextInput
                      style={styles.input}
                      value={editBranchAddress}
                      onChangeText={setEditBranchAddress}
                    />
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveEditBranch}>
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={cancelEdit}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.itemContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{branch.name}</Text>
                        <Text style={styles.itemSub}>{branch.address}</Text>
                    </View>
                    <View style={styles.itemActions}>
                        <TouchableOpacity onPress={() => startEditBranch(branch)} style={{marginRight: 15}}>
                            <FontAwesome5 name="edit" size={18} color="#2196f3" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteBranch(branch)}>
                            <MaterialIcons name="delete" size={22} color="#e57373" />
                        </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingTop: 40, // Adjust for status bar
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  scrollView: {
    padding: 16,
  },
  successBanner: {
    padding: 12,
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
  successText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toggleButton: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#4caf50',
  },
  saveButton: {
    backgroundColor: '#2196f3',
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
  },
  itemSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
