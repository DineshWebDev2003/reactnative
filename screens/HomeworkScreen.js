import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { BASE_URL } from '../config';

export default function HomeworkScreen({ route }) {
  const { studentId } = route.params || {};
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    fetch(`${BASE_URL}/get_student_homework.php?student_id=${studentId}`)
      .then(res => res.json())
      .then(data => {
        setHomeworks(data.success && data.homeworks ? data.homeworks : []);
        setLoading(false);
      })
      .catch(() => setHomeworks([]));
  }, [studentId]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7fa', padding: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 16, color: '#e75480' }}>Homework</Text>
      {loading ? <ActivityIndicator color="#e75480" style={{ marginTop: 20 }} /> : (
        <FlatList
          data={homeworks}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, elevation: 2 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#e75480' }}>{item.title || 'Homework'}</Text>
              <Text style={{ color: '#555', marginTop: 4 }}>{item.description}</Text>
              <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{item.date ? new Date(item.date).toLocaleDateString() : ''}</Text>
              {item.status && <Text style={{ color: '#43cea2', marginTop: 2 }}>Status: {item.status}</Text>}
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No homework found.</Text>}
        />
      )}
    </View>
  );
} 