import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { BASE_URL } from '../config';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

export default function AllCamerasScreen(props) {
  const route = useRoute();
  const navigation = useNavigation();
  const branchParam = route?.params?.branch || props.branch || '';
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editCameraBranchId, setEditCameraBranchId] = useState(null);
  const [editCameraUrl, setEditCameraUrl] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBranches(data.branches);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startEditCameraUrl = (branch) => {
    setEditCameraBranchId(branch.id);
    setEditCameraUrl(branch.camera_url || '');
  };
  const saveEditCameraUrl = () => {
    Alert.alert(
      'Confirm',
      'Save camera URL for this branch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            fetch(`${BASE_URL}/edit_camera_url.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: editCameraBranchId, camera_url: editCameraUrl }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setEditCameraBranchId(null);
                  setEditCameraUrl('');
                  fetch(`${BASE_URL}/get_branches.php`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) setBranches(data.branches);
                    });
                } else {
                  Alert.alert('Error', data.message || 'Failed to update camera URL');
                }
              });
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{branchParam ? `${branchParam} Branch Camera` : 'All Branch Cameras'}</Text>
      {loading ? <Text>Loading...</Text> :
        branches.length === 0 ? (
          <Text>No branches found.</Text>
        ) : (
          branches
            .filter(branch => !branchParam || branch.name === branchParam)
            .map(branch => (
              <View key={branch.id} style={styles.cameraCard}>
                <Text style={styles.branchName}>{branch.name}</Text>
                {branch.camera_url ? (
                  <>
                    <WebView
                      style={styles.cameraWebview}
                      source={{ uri: branch.camera_url }}
                      allowsFullscreenVideo
                    />
                    <TouchableOpacity style={[styles.createButton, {backgroundColor: '#009688', marginTop: 8}]} onPress={() => navigation.navigate('CameraFullscreen', { cameraUrl: branch.camera_url })}>
                      <Text style={[styles.createButtonText, {color: '#fff'}]}>View Fullscreen</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.cameraPlaceholder}>
                    <Text style={{color:'#aaa'}}>No camera URL</Text>
                  </View>
                )}
                {editCameraBranchId === branch.id ? (
                  <>
                    <TextInput
                      style={[styles.input, {marginBottom: 8}]}
                      placeholder="Camera URL"
                      value={editCameraUrl}
                      onChangeText={setEditCameraUrl}
                    />
                    <TouchableOpacity style={[styles.createButton, {marginRight: 8}]} onPress={saveEditCameraUrl}>
                      <Text style={styles.createButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.createButton, {backgroundColor: '#ccc'}]} onPress={() => setEditCameraBranchId(null)}>
                      <Text style={[styles.createButtonText, {color: '#333'}]}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={[styles.createButton, {backgroundColor: '#2196f3', marginTop: 8}]} onPress={() => startEditCameraUrl(branch)}>
                    <Text style={[styles.createButtonText, {color: '#fff'}]}>Edit Camera</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
        )
      }
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
  cameraCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  branchName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a237e',
    marginBottom: 4,
  },
  cameraWebview: {
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraUrl: {
    color: '#666',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 