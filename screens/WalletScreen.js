import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator, 
  FlatList, 
  RefreshControl, 
  Modal, 
  TextInput, 
  Platform, 
  StatusBar
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

export default function WalletScreen({ route, navigation }) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');

  useEffect(() => {
    getUserAndFetchData();
  }, []);

  const getUserAndFetchData = async () => {
    try {
      let currentUser = route?.params?.user;
      
      if (!currentUser) {
        const userId = await AsyncStorage.getItem('userId');
        const role = await AsyncStorage.getItem('role');
        
        if (userId) {
          currentUser = { id: userId, role: role };
        }
      }

      if (!currentUser) {
        const userId = route?.params?.userId;
        const role = route?.params?.role;
        
        if (userId) {
          currentUser = { id: userId, role, branch: route?.params?.branch };
        }
      }

      if (currentUser && currentUser.id) {
        setUser(currentUser);
        await fetchWalletData(currentUser.id);
      } else {
        setUser(null);
        setWalletData(null);
        setLoading(false);
      }
    } catch (error) {
      setUser(null);
      setWalletData(null);
      setLoading(false);
      Alert.alert('Error', 'Failed to get user data');
    }
  };

  const fetchWalletData = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/get_wallet.php?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setWalletData(data);
      } else {
        setWalletData({
          wallet_balance: 0,
          fee_due: 0,
          fee_due_date: null,
          transactions: []
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Network error while fetching wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddMoney = () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'User data not available');
      return;
    }
    setAddMoneyAmount('');
    setShowAddMoneyModal(true);
  };

  const confirmAddMoney = async () => {
    const amount = parseFloat(addMoneyAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

      Alert.alert(
      'Add Money',
      `Add ₹${amount} to wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => {
          Alert.alert('Success', `₹${amount} added to wallet successfully!`);
          setShowAddMoneyModal(false);
          fetchWalletData(user.id);
        }}
      ]
    );
  };

  const handlePayFee = () => {
    if (!walletData || !walletData.fee_due || walletData.fee_due <= 0) {
      Alert.alert('Info', 'No fee due at this time');
      return;
    }
    
    Alert.alert(
      'Pay Fee',
      `Pay ₹${walletData.fee_due} fee?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay', onPress: () => {
          Alert.alert('Success', 'Fee paid successfully!');
          fetchWalletData(user.id);
        }}
      ]
    );
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: item.type === 'add_money' ? '#e8f5e8' : '#ffe8e8' }
        ]}>
        <FontAwesome5 
            name={item.type === 'add_money' ? 'plus' : 'minus'} 
            size={12} 
          color={item.type === 'add_money' ? '#4CAF50' : '#F44336'} 
        />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>
            {item.type === 'add_money' ? 'Money Added' : 'Payment Made'}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString('en-IN')}
          </Text>
        </View>
      </View>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'add_money' ? '#4CAF50' : '#F44336' }
        ]}>
          {item.type === 'add_money' ? '+' : '-'}₹{parseFloat(item.amount).toFixed(2)}
        </Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="wallet" size={64} color="#e75480" />
        <Text style={styles.loadingText}>User not found. Please login again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getUserAndFetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={() => {
        setRefreshing(true);
          fetchWalletData(user.id);
        }} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchWalletData(user.id);
          }} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <FontAwesome5 name="wallet" size={24} color="#4CAF50" />
            <Text style={styles.balanceLabel}>Current Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            ₹{Number(walletData?.wallet_balance || 0).toFixed(2)}
          </Text>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddMoney}>
              <FontAwesome5 name="plus" size={16} color="#fff" />
              <Text style={styles.actionText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.payButton]} onPress={handlePayFee}>
              <FontAwesome5 name="credit-card" size={16} color="#fff" />
              <Text style={styles.actionText}>Pay Fee</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fee Due Card */}
        {walletData && Number(walletData.fee_due) > 0 && (
          <View style={styles.feeCard}>
            <View style={styles.feeHeader}>
              <FontAwesome5 name="exclamation-triangle" size={20} color="#FF9800" />
              <Text style={styles.feeTitle}>Fee Due</Text>
            </View>
            <Text style={styles.feeAmount}>₹{Number(walletData.fee_due || 0).toFixed(2)}</Text>
            {walletData.fee_due_date && (
              <Text style={styles.feeDate}>
                Due: {new Date(walletData.fee_due_date).toLocaleDateString('en-IN')}
              </Text>
            )}
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Transactions</Text>
          
          {walletData && walletData.transactions && walletData.transactions.length > 0 ? (
            <FlatList
              data={walletData.transactions.slice(0, 10)}
              renderItem={renderTransaction}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <FontAwesome5 name="history" size={48} color="#ccc" />
              <Text style={styles.emptyHistoryText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Money Modal */}
      <Modal
        visible={showAddMoneyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMoneyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Money to Wallet</Text>
            
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={addMoneyAmount}
              onChangeText={setAddMoneyAmount}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAddMoneyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={confirmAddMoney}
              >
                <Text style={styles.confirmButtonText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  payButton: {
    backgroundColor: '#FF9800',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  feeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 8,
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  feeDate: {
    fontSize: 12,
    color: '#666',
  },
  historySection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 