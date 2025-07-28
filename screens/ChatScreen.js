import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null); // The person using the app
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef();
  const route = useRoute();
  const navigation = useNavigation();
  const { user: recipientUser } = route.params || {}; // The person being chatted with

  useEffect(() => {
    const initialize = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id);
      
      if (!id || !recipientUser?.id) {
      setLoading(false);
      return;
    }
      
    setLoading(true);
      // Construct IDs for fetching messages based on who is sender/receiver
      const senderId = id;
      const receiverId = recipientUser.id;
      
      fetch(`${BASE_URL}/get_messages.php?user1_id=${senderId}&user2_id=${receiverId}`)
      .then(res => res.json())
      .then(data => {
          if (data.success) {
            setMessages(data.messages || []);
          } else {
            console.log('Failed to fetch messages:', data.message);
            setMessages([]);
          }
      })
      .catch(err => {
        console.log('Error fetching messages:', err);
          setMessages([]);
        })
        .finally(() => {
        setLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        });
    };
    
    initialize();
  }, [recipientUser]);

  const sendMessage = () => {
    if (!input.trim() || !currentUserId || !recipientUser?.id) {
        console.log("Cannot send message. Missing IDs or input.", { currentUserId, recipientId: recipientUser?.id, input });
        return;
    }

    const messageData = {
        sender_id: currentUserId,
        receiver_id: recipientUser.id,
        message: input.trim(),
    };

    fetch(`${BASE_URL}/send_message.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    })
      .then(async res => {
        const text = await res.text();
        console.log("Send message response:", text);
        try {
          return JSON.parse(text);
        } catch {
          return { success: false, message: "Invalid server response" };
        }
      })
      .then(data => {
        if (data.success) {
          setMessages(prev => [...prev, { ...messageData, id: data.message_id, created_at: new Date().toISOString() }]);
          setInput('');
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } else {
          Alert.alert('Error', data.message || 'Failed to send message.');
        }
      })
      .catch(error => {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'A network error occurred.');
      });
  };

  if (!recipientUser) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>User info missing. Please go back and try again.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{recipientUser?.name || 'Chat'}</Text>
      </View>
      <ScrollView 
        style={styles.messagesContainer} 
        ref={scrollViewRef} 
        contentContainerStyle={{padding: 16}}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {loading ? <ActivityIndicator size="large" color="#4F46E5" /> :
          messages.length === 0 ? (
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          ) : (
            messages.map(msg => (
              <View key={msg.id} style={[
                styles.messageBubble, 
                msg.sender_id == currentUserId ? styles.myMessage : styles.theirMessage
              ]}>
                <Text style={styles.messageText}>{msg.message}</Text>
                <Text style={styles.timeText}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</Text>
              </View>
            ))
          )}
      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <MaterialIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

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
    errorText: {
        color: '#DC2626',
        fontWeight: 'bold',
        fontSize: 18
    },
  header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4F46E5',
    paddingVertical: 12,
        paddingHorizontal: 16,
        paddingTop: 40, // For status bar area
    },
    backButton: {
        marginRight: 16,
  },
  headerText: {
        color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
    messagesContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    emptyText: {
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 20
    },
    messageBubble: {
        padding: 12,
        borderRadius: 18,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
        backgroundColor: '#4F46E5',
    alignSelf: 'flex-end',
  },
    theirMessage: {
        backgroundColor: '#fff',
    alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#E5E7EB',
  },
  messageText: {
        fontSize: 16,
  },
  timeText: {
        fontSize: 10,
        color: '#9CA3AF',
    alignSelf: 'flex-end',
        marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
        alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
        borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
  },
  sendButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    }
}); 