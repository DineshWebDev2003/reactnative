import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../config';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function MessageParentsScreen() {
  const [parents, setParents] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    AsyncStorage.getItem('userId').then(userId => {
      if (!userId) return;
      fetch(`${BASE_URL}/get_parents_for_teacher.php?teacher_id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.parents) setParents(data.parents);
        });
    });
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.parentItem}
      onPress={() => {
        if (item && item.role) {
          navigation.navigate('ChatScreen', { user: item });
        } else {
          Alert.alert('Error', 'Parent info missing. Cannot open chat.');
        }
      }}
    >
      <Image
        source={item.child_photo ? { uri: BASE_URL + '/' + item.child_photo } : require('../assets/Avartar.png')}
        style={styles.childPhoto}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.parentName}>{item.name}</Text>
        <Text style={styles.childName}>Child: {item.childName || 'N/A'}</Text>
      </View>
      <MaterialIcons name="chat" size={22} color="#a084ca" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Message Parents</Text>
      <FlatList
        data={parents}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>No parents found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3e8ff', padding: 16 },
  title: { fontWeight: 'bold', fontSize: 20, color: '#a084ca', marginBottom: 16, textAlign: 'center' },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#a084ca',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  childPhoto: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#eee' },
  parentName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  childName: { fontSize: 14, color: '#888' },
});
