import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../config';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeworkScreen({ route }) {
  const navigation = useNavigation();
  const { studentId, studentName } = route.params || {};
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchHomework = async () => {
    if (!studentId) {
      setError('No student ID provided');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${BASE_URL}/get_student_homework.php?student_id=${studentId}`);
      const data = await response.json();
      
      if (data.success && data.homeworks) {
        setHomeworks(data.homeworks);
      } else {
        setHomeworks([]);
        setError(data.message || 'No homework found');
      }
    } catch (err) {
      console.error('Error fetching homework:', err);
      setError('Failed to load homework. Please check your connection.');
      setHomeworks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [studentId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomework();
  };

  const handleSubmitHomework = (homework) => {
    Alert.alert(
      'Submit Homework',
      `Do you want to submit homework for "${homework.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => {
          // TODO: Implement homework submission
          Alert.alert('Success', 'Homework submission feature coming soon!');
        }}
      ]
    );
  };

  const renderHomeworkItem = ({ item }) => (
    <View style={styles.homeworkCard}>
      <View style={styles.homeworkHeader}>
        <MaterialIcons name="assignment" size={24} color="#e75480" />
        <View style={styles.homeworkTitleContainer}>
          <Text style={styles.homeworkTitle}>{item.title || 'Homework'}</Text>
          <Text style={styles.homeworkDate}>
            {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.homeworkDescription}>{item.description || 'No description available'}</Text>
      
      {item.status && (
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'Completed' ? '#43cea2' : '#ffa500' }
          ]}>
            Status: {item.status}
          </Text>
        </View>
      )}
      
      {item.status !== 'Completed' && (
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => handleSubmitHomework(item)}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e75480" />
        <Text style={styles.loadingText}>Loading homework...</Text>
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
          <MaterialIcons name="arrow-back" size={24} color="#e75480" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {studentName ? `${studentName}'s Homework` : 'Homework'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={24} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={homeworks}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={renderHomeworkItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment-turned-in" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {error ? 'Failed to load homework' : 'No homework assigned yet'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fa',
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
    color: '#e75480',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7fa',
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
  },
  homeworkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  homeworkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  homeworkTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  homeworkTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#e75480',
  },
  homeworkDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  homeworkDescription: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#e75480',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#e75480',
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