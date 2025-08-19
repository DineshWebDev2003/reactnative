import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

const ChatListScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');

        if (!userId) {
          setError('User ID not found. Please log in again.');
          setLoading(false);
          return;
        }

        const url = `${BASE_URL}/get_users.php?user_id=${userId}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          setError(data.message || 'No users found.');
        }
      } catch (e) {
        setError('Error fetching users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text>Loading Users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
       <Text style={styles.header}>Start a new Chat</Text>
       <FlatList
        data={users}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => {
              // Ensure user object and role are valid before navigating
              if (item && item.id && item.role) {
                navigation.navigate('ChatScreen', { user: item });
              } else {
                alert('User info missing. Cannot open chat.');
              }
            }}
          >
            <Image
              source={item.avatar ? { uri: item.avatar } : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userBranch}>{item.branch}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.centerContainer}><Text>No users available to chat.</Text></View>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    padding: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userBranch: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default ChatListScreen;