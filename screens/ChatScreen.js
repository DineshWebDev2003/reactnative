import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, 
  Platform, ActivityIndicator, Alert, FlatList, Image, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import StatusViewer from '../components/StatusViewer'; // Import the new component

const Tab = createMaterialTopTabNavigator();

// Component for the Chat Flow (List + Individual Chat)
function ChatFlow({ userData }) {
  const route = useRoute();
  const navigation = useNavigation();

  // State for the user list part
  const [users, setUsers] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  // State to manage which view to show: list or chat
  const [selectedUser, setSelectedUser] = useState(null);

  // State for the individual chat part
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatLoading, setChatLoading] = useState(true);
  const scrollViewRef = useRef();

  
  // Effect to fetch the list of users based on the new hierarchy
  useEffect(() => {
    if (!userData || !userData.role || !userData.id) {
      setListError('User data is missing. Cannot load user list.');
      setListLoading(false);
      return;
    }

    const { role, branch, id } = userData;
    const fetchUrl = `${BASE_URL}/get_users.php?user_role=${role}&user_branch=${branch || ''}&user_id=${id}`;

    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          setListError(data.message || 'No users found.');
        }
      })
      .catch(() => setListError('Error fetching users.'))
      .finally(() => setListLoading(false));
  }, [userData]);

  // Effect to fetch messages when a user is selected
  useEffect(() => {
    const fetchUserIdAndMessages = async () => {
      if (!selectedUser) return;

      setChatLoading(true);
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) throw new Error('User ID not found');
        setCurrentUserId(storedUserId);

        const response = await fetch(`${BASE_URL}/get_messages.php?sender_id=${storedUserId}&receiver_id=${selectedUser.id}`);
        const data = await response.json();

        if (data.success) {
          setMessages(data.messages);
        } else {
          Alert.alert('Error', data.message || 'Failed to fetch messages.');
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred while fetching data.');
      } finally {
        setChatLoading(false);
      }
    };

    fetchUserIdAndMessages();
  }, [selectedUser]);

  const handleSend = async () => {
    if (input.trim() === '' || !selectedUser) return;

    const messageData = {
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      message: input,
    };

    try {
      const response = await fetch(`${BASE_URL}/send_message.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      const result = await response.json();

      if (result.success) {
        setMessages(prev => [...prev, { ...messageData, id: result.message_id, timestamp: new Date().toISOString() }]);
        setInput('');
        scrollViewRef.current?.scrollToEnd({ animated: true });
      } else {
        Alert.alert('Error', result.message || 'Failed to send message.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while sending the message.');
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setMessages([]); // Clear messages for the next chat session
  };

  // Render User List View
  const renderUserList = () => {
    if (listLoading) {
      return <View style={styles.centered}><ActivityIndicator size="large" color="#4F46E5" /><Text>Loading Users...</Text></View>;
    }
    if (listError) {
      return <View style={styles.centered}><Text style={styles.errorText}>{listError}</Text></View>;
    }

    return (
      <SafeAreaView style={styles.listContainer}>
        <Text style={styles.listHeader}>Chats</Text>
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userItem} onPress={() => handleSelectUser(item)}>
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
          ListEmptyComponent={<View style={styles.centered}><Text>No users available to chat.</Text></View>}
        />
      </SafeAreaView>
    );
  };

  // Render Individual Chat View
  const renderChatInterface = () => (
    <KeyboardAvoidingView 
      style={styles.chatContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>{selectedUser.name}</Text>
      </View>

      {chatLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#4F46E5" /></View>
      ) : (
        <ScrollView 
          style={styles.messagesContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View 
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.sender_id == currentUserId ? styles.myMessage : styles.theirMessage
              ]}
            >
              <Text style={msg.sender_id == currentUserId ? styles.myMessageText : styles.theirMessageText}>{msg.message}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <MaterialIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return selectedUser ? renderChatInterface() : renderUserList();
}

// Component for the Status Tab
function StatusTab() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/get_status_updates.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.statuses) {
          setStatuses(data.statuses);
        } else {
          setError('Failed to load status updates.');
        }
      })
      .catch(() => setError('An error occurred while fetching statuses.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <View style={styles.statusContainer}>
        <Text style={styles.statusHeader}>Recent Updates</Text>
        <FlatList
            data={statuses}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.statusItem} onPress={() => setSelectedStatus(item)}>
                    <Image source={{ uri: item.thumbnail_url }} style={styles.statusThumbnail} />
                    <Text style={styles.statusBranchName}>{item.branch_name}</Text>
                </TouchableOpacity>
            )}
            ListEmptyComponent={<View style={styles.centered}><Text>No recent updates.</Text></View>}
        />
        {selectedStatus && <StatusViewer status={selectedStatus} onClose={() => setSelectedStatus(null)} />}
    </View>
  );
}

// Main export: The Tab Navigator
export default function ChatScreen() {
  const [userData, setUserData] = useState({ role: null, branch: null, id: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        const branch = await AsyncStorage.getItem('userBranch');
        const id = await AsyncStorage.getItem('userId');
        setUserData({ role, branch, id });
      } catch (error) {
        console.error("Failed to load user data from storage", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', marginHorizontal: 8 }}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#E5E7EB',
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
          tabBarStyle: { backgroundColor: '#4F46E5' },
          tabBarIndicatorStyle: { backgroundColor: '#fff', height: 3 },
        }}
      >
        <Tab.Screen name="Chats">
          {() => <ChatFlow userData={userData} />}
        </Tab.Screen>
        <Tab.Screen name="Status" component={StatusTab} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

// Merged and refined styles
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  // List styles
  listContainer: { flex: 1, backgroundColor: '#F7FAFC' },
  listHeader: { fontSize: 24, fontWeight: 'bold', color: '#111827', padding: 16, backgroundColor: '#fff' },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 16 },
  userName: { fontSize: 18, fontWeight: '600' },
  userBranch: { fontSize: 14, color: '#6B7280' },
  // Chat styles
  chatContainer: { flex: 1, backgroundColor: '#E5E5E5' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 15, paddingHorizontal: 10, paddingTop: 15 },
  backButton: { marginRight: 15 },
  chatHeaderTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  messagesContainer: { flex: 1, paddingHorizontal: 10, paddingTop: 10 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 18, marginBottom: 10 },
  myMessage: { backgroundColor: '#4F46E5', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  myMessageText: { color: '#fff', fontSize: 16 },
  theirMessageText: { color: '#333', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' },
  input: { flex: 1, height: 40, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, marginRight: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  // Status Tab styles
  statusContainer: { flex: 1, backgroundColor: '#F7FAFC', paddingTop: 20 },
  statusHeader: { fontSize: 16, fontWeight: 'bold', color: '#111827', paddingHorizontal: 16, marginBottom: 10 },
  statusItem: { alignItems: 'center', marginRight: 15 },
  statusThumbnail: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#4F46E5' },
  statusBranchName: { marginTop: 5, fontSize: 12, color: '#6B7280' }
}); 