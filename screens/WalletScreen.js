import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, FlatList, RefreshControl, Modal, TextInput, Platform } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import RazorpayCheckout from 'react-native-razorpay';

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
      // Try to get user from route params first
      let currentUser = route?.params?.user;
      
      // If not in params, try to get from AsyncStorage
      if (!currentUser) {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          currentUser = JSON.parse(userData);
        }
      }

      // If still no user, try to get from route params with different structure
      if (!currentUser) {
        const userId = route?.params?.userId;
        const role = route?.params?.role;
        const branch = route?.params?.branch;
        
        if (userId) {
          currentUser = { id: userId, role, branch };
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
      console.error('Error getting user data:', error);
      Alert.alert('Error', 'Failed to get user data');
    }
  };

  const fetchWalletData = async (userId) => {
    try {
      setLoading(true);
      console.log('Fetching wallet data for user:', userId);
      
      const response = await fetch(`${BASE_URL}/get_wallet.php?user_id=${userId}`);
      const data = await response.json();
      
      console.log('Wallet data response:', data);
      
      if (data.success) {
        setWalletData(data);
      } else {
        console.log('Wallet fetch failed:', data.message);
        // Don't show alert for empty wallet, just set empty data
        setWalletData({
          wallet_balance: 0,
          fee_due: 0,
          transactions: []
        });
      }
    } catch (error) {
      console.error('Network error:', error);
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

  const confirmAddMoney = () => {
    const amount = parseFloat(addMoneyAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setShowAddMoneyModal(false);
    initiatePayment(amount);
  };

  const initiatePayment = (amount) => {
    if (!user || !user.id) {
      Alert.alert('Error', 'User data not available');
      return;
    }
    var options = {
      description: 'Add Money to Wallet',
      image: 'https://your-logo-url.png', // Optional, or use your app logo
      currency: 'INR',
      key: 'YOUR_RAZORPAY_KEY_ID', // <-- Replace with your Razorpay Key ID
      amount: amount * 100, // Amount in paise
      name: 'Your App Name',
      prefill: {
        email: user.email || '',
        contact: user.mobile || '',
        name: user.name || ''
      },
      theme: { color: '#e75480' }
    };
    RazorpayCheckout.open(options).then((data) => {
      // Success: send payment data to backend
      realPaymentSuccess(amount, data.razorpay_payment_id, data.razorpay_order_id);
    }).catch((error) => {
      Alert.alert('Payment Failed', error.description || 'Payment was cancelled');
    });
  };

  const realPaymentSuccess = async (amount, razorpay_payment_id, razorpay_order_id) => {
    try {
      const paymentData = {
        user_id: user.id,
        amount: amount,
        razorpay_payment_id,
        razorpay_order_id
      };
      const response = await fetch(`${BASE_URL}/add_money.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `₹${amount} added to wallet successfully!`);
        fetchWalletData(user.id);
      } else {
        Alert.alert('Error', data.message || 'Failed to add money to wallet');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error while processing payment');
    }
  };

  const handlePayFee = () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'User data not available');
      return;
    }
    
    if (!walletData || !walletData.fee_due || walletData.fee_due <= 0) {
      Alert.alert('Info', 'No fee due at this time');
      return;
    }
    
    const amount = walletData.fee_due;
    Alert.alert(
      'Pay Fee',
      `Are you sure you want to pay the full fee due of ₹${amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: () => payFee(amount)
        }
      ]
    );
  };

  const payFee = async (amount) => {
    try {
      const paymentData = {
        user_id: user.id,
        amount: amount,
        razorpay_payment_id: 'simulated_payment_' + Date.now(),
        razorpay_order_id: 'simulated_order_' + Date.now()
      };
      const response = await fetch(`${BASE_URL}/pay_fee.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Fee paid successfully!');
        fetchWalletData(user.id);
      } else {
        Alert.alert('Error', data.message || 'Failed to pay fee');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error while paying fee');
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <FontAwesome5 
          name={item.type === 'add_money' ? 'plus-circle' : 'minus-circle'} 
          size={20} 
          color={item.type === 'add_money' ? '#4CAF50' : '#F44336'} 
        />
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>
            {item.type === 'add_money' ? 'Money Added' : 'Payment Made'}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'add_money' ? '#4CAF50' : '#F44336' }
        ]}>
          {item.type === 'add_money' ? '+' : '-'}₹{parseFloat(item.amount).toFixed(2)}
        </Text>
        <Text style={[
          styles.transactionStatus,
          { color: item.status === 'success' ? '#4CAF50' : '#F44336' }
        ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="wallet" size={48} color="#e75480" style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>User not found. Please login again or try refreshing.</Text>
        <TouchableOpacity style={styles.addMoneyButton} onPress={getUserAndFetchData}>
          <Text style={styles.addMoneyText}>Retry</Text>
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
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={() => {
        setRefreshing(true);
        if (user && user.id) {
          fetchWalletData(user.id);
        } else {
          getUserAndFetchData();
        }
      }} />
    }>
      {/* Add Money Modal */}
      <Modal
        visible={showAddMoneyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMoneyModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%', maxWidth: 340 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Add Money to Wallet</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 18, marginBottom: 16 }}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={addMoneyAmount}
              onChangeText={setAddMoneyAmount}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowAddMoneyModal(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: '#e75480', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAddMoney}>
                <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 16 }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <FontAwesome5 name="wallet" size={24} color="#4CAF50" />
          <Text style={styles.balanceTitle}>Current Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>
          ₹{Number(walletData?.wallet_balance || 0).toFixed(2)}
        </Text>
        <TouchableOpacity style={styles.addMoneyButton} onPress={handleAddMoney}>
          <FontAwesome5 name="plus" size={16} color="#fff" />
          <Text style={styles.addMoneyText}>Add Money</Text>
        </TouchableOpacity>
      </View>

      {/* Fee Due Card */}
      {walletData && Number(walletData.fee_due) > 0 && (
        <View style={styles.feeCard}>
          <View style={styles.feeHeader}>
            <FontAwesome5 name="exclamation-triangle" size={20} color="#FF9800" />
            <Text style={styles.feeTitle}>Fee Due</Text>
          </View>
          <Text style={styles.feeAmount}>₹{Number(walletData.fee_due || 0).toFixed(2)}</Text>
          <TouchableOpacity style={styles.payFeeButton} onPress={handlePayFee}>
            <Text style={styles.payFeeText}>Pay Fee</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transaction History */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Transaction History</Text>
        {walletData && walletData.transactions && walletData.transactions.length > 0 ? (
          <FlatList
            data={walletData.transactions}
            renderItem={renderTransaction}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyHistory}>
            <FontAwesome5 name="history" size={48} color="#ccc" />
            <Text style={styles.emptyHistoryText}>No transactions yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  addMoneyButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addMoneyText: {
    color: '#fff',
    fontSize: 16,
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
    color: '#666',
    marginLeft: 8,
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 12,
  },
  payFeeButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  payFeeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  transactionDetails: {
    marginLeft: 12,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 2,
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
}); 