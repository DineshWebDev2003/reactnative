import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { BASE_URL } from '../config';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ActivityListScreen({ route, navigation }) {
  const { branch, role, userId, studentId } = route.params || {};
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [date]); // Remove branch from deps to show all branches

  const fetchActivities = async () => {
    setLoading(true);
    let url = `${BASE_URL}/get_activities.php?date=${date.toISOString().slice(0,10)}`;
    const res = await fetch(url);
    const data = await res.json();
    let acts = [];
    if (data.success && data.activities) {
      acts = data.activities;
      // Sort: parent's kid's activities first
      if (studentId) {
        acts = [
          ...acts.filter(a => a.kid_id == studentId || a.child_id == studentId),
          ...acts.filter(a => a.kid_id != studentId && a.child_id != studentId)
        ];
      }
    }
    setActivities(acts);
    setLoading(false);
  };

  const canEditDelete = (item) => {
    if (role === 'Franchisee' && item.branch === branch) return true;
    if (role === 'Teacher' && item.teacher_id === userId) return true;
    if (role === 'administration' || role === 'admin') return true;
    return false;
  };

  const handleEdit = (item) => {
    navigation.navigate('EditActivityScreen', { activity: item });
  };
  
  const handleDelete = async (item) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const response = await fetch(`${BASE_URL}/delete_activity.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity_id: item.id,
              user_id: userId,
              user_role: role
            })
          });
          // Defensive: check response.ok and handle non-JSON or server errors
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          let data;
          try {
            data = await response.json();
          } catch (jsonErr) {
            Alert.alert('Error', 'Invalid response from server.');
            return;
          }
          if (data.success) {
            Alert.alert('Success', 'Activity deleted successfully!');
            fetchActivities();
          } else {
            Alert.alert('Error', data.message || 'Failed to delete activity.');
          }
        } catch (error) {
          // Enhanced error reporting
          Alert.alert('Network Error', error.message || 'Network error while deleting activity.');
        }
      }}
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={{ backgroundColor: '#fff', margin: 8, borderRadius: 10, padding: 12, elevation: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.kid_name || item.childName}</Text>
        <Text style={{ color: '#a084ca', fontSize: 13, backgroundColor:'#f3e8ff', borderRadius:6, paddingHorizontal:8, paddingVertical:2 }}>{item.branch}</Text>
        {canEditDelete(item) && (
          <TouchableOpacity onPress={() => Alert.alert('Options', '', [
            { text: 'Edit', onPress: () => handleEdit(item) },
            { text: 'Delete', onPress: () => handleDelete(item), style: 'destructive' },
            { text: 'Cancel', style: 'cancel' }
          ])}>
            <MaterialIcons name="more-vert" size={22} color="#888" />
          </TouchableOpacity>
        )}
      </View>
      {item.image_path ? (
        <Image 
          source={{ uri: BASE_URL + '/' + item.image_path }} 
          style={{
            width: '100%',
            aspectRatio: 4/5, 
            borderRadius: 8,
            marginTop: 8,
            marginBottom: 8,
            alignSelf: 'center',
          }} 
          resizeMode="cover" 
        />
      ) : null}
      <Text style={{ color: '#555', marginTop: 4 }}>{item.description}</Text>
      <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fa' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, flex: 1 }}>Daily Activities</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <MaterialIcons name="date-range" size={24} color="#a084ca" />
          <Text style={{ color: '#a084ca', fontSize: 13 }}>{date.toISOString().slice(0,10)}</Text>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) setDate(d);
          }}
        />
      )}
      {loading ? <ActivityIndicator color="#a084ca" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={activities}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No activities found.</Text>}
        />
      )}
    </View>
  );
} 