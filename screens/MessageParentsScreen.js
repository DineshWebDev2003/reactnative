import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../config';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function MessageParentsScreen() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const fetchParents = async () => {
    try {
      setError(null);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/get_parents_for_teacher.php?teacher_id=${userId}`);
      const data = await response.json();
      
      if (data.success && data.parents) {
        setParents(data.parents);
      } else {
        setParents([]);
        setError(data.message || 'No parents found');
      }
    } catch (err) {
      console.error('Error fetching parents:', err);
      setError('Failed to load parents. Please check your connection.');
      setParents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchParents();
  };

  const handleParentPress = (parent) => {
    if (!parent || !parent.role) {
      Alert.alert('Error', 'Parent information is incomplete. Cannot open chat.');
      return;
    }

    // Navigate to chat with parent
    navigation.navigate('Chat', { 
      user: parent,
      chatTitle: `${parent.name} (${parent.childName || 'Parent'})`
    });
  };

  const renderParentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.parentItem}
      onPress={() => handleParentPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={
          item.child_photo 
            ? { uri: BASE_URL + '/' + item.child_photo } 
            : require('../assets/Avartar.png')
        }
        style={styles.childPhoto}
      />
      <View style={styles.parentInfo}>
        <Text style={styles.parentName}>{item.name || 'Unknown Parent'}</Text>
        <Text style={styles.childName}>
          Child: {item.childName || 'N/A'}
        </Text>
        {item.mobile && (
          <Text style={styles.mobileNumber}>
            📱 {item.mobile}
          </Text>
        )}
      </View>
      <View style={styles.chatButton}>
        <MaterialIcons name="chat" size={24} color="#a084ca" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="people" size={64} color="#ccc" />
      <Text style={styles.emptyText}>
        {error ? 'Failed to load parents' : 'No parents assigned to you yet'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a084ca" />
        <Text style={styles.loadingText}>Loading parents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#a084ca" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Parents</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error && !loading && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={20} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={parents}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={renderParentItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3e8ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a084ca',
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    color: '#ff6b6b',
    flex: 1,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#a084ca',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  childPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eee',
  },
  parentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  parentName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  childName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  mobileNumber: {
    fontSize: 12,
    color: '#888',
  },
  chatButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#a084ca',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
