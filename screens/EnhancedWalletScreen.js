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
  Linking,
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';

const { width, height } = Dimensions.get('window');

export default function EnhancedWalletScreen({ route, navigation }) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [razorpayAvailable, setRazorpayAvailable] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    console.log('EnhancedWalletScreen mounted, route params:', route?.params);
    getUserAndFetchData();
    checkRazorpayAvailability();
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkRazorpayAvailability = async () => {
    try {
      const response = await fetch(`${BASE_URL}/check_payment_gateway.php`);
      const data = await response.json();
      setRazorpayAvailable(data.razorpay_available);
    } catch (error) {
      setRazorpayAvailable(false);
    }
  };

  const getUserAndFetchData = async () => {
    try {
      let currentUser = route?.params?.user;
      
      if (!currentUser) {
        const userId = await AsyncStorage.getItem('userId');
        const role = await AsyncStorage.getItem('role');
        
        if (userId) {
          currentUser = { id: userId, role: role };
          console.log('Found user from AsyncStorage:', currentUser);
        }
      }

      if (!currentUser) {
        const userId = route?.params?.userId;
        const role = route?.params?.role;
        const branch = route?.params?.branch;
        
        if (userId) {
          currentUser = { id: userId, role, branch };
          console.log('Found user from route params:', currentUser);
        } else {
          const fallbackUserId = await AsyncStorage.getItem('userId');
          const fallbackRole = await AsyncStorage.getItem('role');
          
          if (fallbackUserId) {
            currentUser = { id: fallbackUserId, role: fallbackRole };
            console.log('Found user from AsyncStorage fallback:', currentUser);
          }
        }
      }

      if (currentUser && currentUser.id) {
        setUser(currentUser);
        await fetchWalletData(currentUser.id);
      } else {
        console.log('No user found in any source');
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
        setWalletData({
          wallet_balance: 0,
          fee_due: 0,
          fee_due_date: null,
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

  const confirmAddMoney = async () => {
    const amount = parseFloat(addMoneyAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount < 1) {
      Alert.alert('Error', 'Minimum amount is ₹1');
      return;
    }

    if (amount > 100000) {
      Alert.alert('Error', 'Maximum amount is ₹1,00,000');
      return;
    }

    setShowAddMoneyModal(false);
    
    if (razorpayAvailable) {
      await initiateRazorpayPayment(amount, 'add_money');
    } else {
      Alert.alert(
        'Payment Gateway Unavailable',
        'Online payment is currently unavailable. Please contact the school administration for payment options.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Contact School', onPress: () => contactSchool() }
        ]
      );
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
    
    if (razorpayAvailable) {
      Alert.alert(
        'Pay Fee',
        `Are you sure you want to pay the full fee due of ₹${amount}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay',
            onPress: () => initiateRazorpayPayment(amount, 'pay_fee')
          }
        ]
      );
    } else {
      Alert.alert(
        'Payment Gateway Unavailable',
        'Online payment is currently unavailable. Please contact the school administration for payment options.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Contact School', onPress: () => contactSchool() }
        ]
      );
    }
  };

  const initiateRazorpayPayment = async (amount, type) => {
    try {
      setPaymentLoading(true);
      
      const orderResponse = await fetch(`${BASE_URL}/create_order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount })
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        Alert.alert('Error', orderData.message || 'Failed to create payment order');
        return;
      }

      Alert.alert(
        'Payment Simulation',
        `Payment of ₹${amount} for ${type === 'add_money' ? 'adding money' : 'fee payment'} would be processed here.\n\nOrder ID: ${orderData.order_id}\n\nIn a real app, this would open Razorpay payment gateway.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Simulate Success', 
            onPress: () => simulatePaymentSuccess(amount, type, orderData.order_id)
          }
        ]
      );
      
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const simulatePaymentSuccess = async (amount, type, orderId) => {
    try {
      setPaymentLoading(true);
      
      const paymentData = {
        user_id: user.id,
        amount: amount,
        razorpay_payment_id: 'sim_' + Date.now(),
        razorpay_order_id: orderId
      };

      const endpoint = type === 'add_money' ? 'add_money.php' : 'pay_fee.php';
      const response = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', data.message);
        fetchWalletData(user.id);
      } else {
        Alert.alert('Error', data.message || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const contactSchool = () => {
    Alert.alert(
      'Contact School',
      'Please contact the school administration for payment options:\n\nPhone: +91-XXXXXXXXXX\nEmail: info@tnhappykids.in',
      [
        { text: 'OK', style: 'default' },
        { text: 'Call Now', onPress: () => Linking.openURL('tel:+91-XXXXXXXXXX') }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTransactionStats = () => {
    if (!walletData?.transactions) return { totalIn: 0, totalOut: 0, count: 0 };
    
    const stats = walletData.transactions.reduce((acc, transaction) => {
      if (transaction.type === 'add_money') {
        acc.totalIn += parseFloat(transaction.amount);
      } else {
        acc.totalOut += parseFloat(transaction.amount);
      }
      acc.count++;
      return acc;
    }, { totalIn: 0, totalOut: 0, count: 0 });
    
    return stats;
  };

  const renderTransaction = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.transactionItem,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
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
            {new Date(item.date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
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
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'success' ? '#e8f5e8' : '#ffe8e8' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'success' ? '#4CAF50' : '#F44336' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderQuickAction = ({ item }) => (
    <TouchableOpacity 
      style={styles.quickActionCard}
      onPress={item.onPress}
      disabled={paymentLoading}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: item.color }]}>
        <FontAwesome5 name={item.icon} size={20} color="#fff" />
      </View>
      <Text style={styles.quickActionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const quickActions = [
    {
      title: 'Add Money',
      icon: 'plus',
      color: '#4CAF50',
      onPress: handleAddMoney
    },
    {
      title: 'Pay Fee',
      icon: 'credit-card',
      color: '#FF9800',
      onPress: handlePayFee
    },
    {
      title: 'History',
      icon: 'history',
      color: '#2196F3',
      onPress: () => navigation.navigate('TransactionHistory', { user })
    },
    {
      title: 'Support',
      icon: 'headset',
      color: '#9C27B0',
      onPress: contactSchool
    }
  ];

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <FontAwesome5 name="wallet" size={64} color="#e75480" style={{ marginBottom: 24 }} />
          <Text style={styles.loadingText}>User not found. Please login again or try refreshing.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={getUserAndFetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </Animated.View>
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

  const daysRemaining = getDaysRemaining(walletData?.fee_due_date);
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const transactionStats = getTransactionStats();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <TouchableOpacity onPress={() => {
            setRefreshing(true);
            if (user && user.id) {
              fetchWalletData(user.id);
            } else {
              getUserAndFetchData();
            }
          }} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            if (user && user.id) {
              fetchWalletData(user.id);
            } else {
              getUserAndFetchData();
            }
          }} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIcon}>
                <FontAwesome5 name="wallet" size={24} color="#fff" />
              </View>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceAmount}>
                  ₹{Number(walletData?.wallet_balance || 0).toFixed(2)}
                </Text>
              </View>
            </View>
            
            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <FlatList
                data={quickActions}
                renderItem={renderQuickAction}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickActionsList}
              />
            </View>
          </View>

          {/* Fee Due Card */}
          {walletData && Number(walletData.fee_due) > 0 && (
            <View style={[styles.feeCard, isOverdue && styles.overdueCard]}>
              <View style={styles.feeHeader}>
                <View style={[styles.feeIcon, { backgroundColor: isOverdue ? '#ffebee' : '#fff3e0' }]}>
                  <FontAwesome5 
                    name={isOverdue ? "exclamation-circle" : "exclamation-triangle"} 
                    size={20} 
                    color={isOverdue ? "#F44336" : "#FF9800"} 
                  />
                </View>
                <View style={styles.feeInfo}>
                  <Text style={[styles.feeTitle, isOverdue && styles.overdueText]}>
                    {isOverdue ? 'Fee Overdue' : 'Fee Due'}
                  </Text>
                  <Text style={[styles.feeAmount, isOverdue && styles.overdueAmount]}>
                    ₹{Number(walletData.fee_due || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.dueDateContainer}>
                <View style={styles.dueDateRow}>
                  <Text style={styles.dueDateLabel}>Due Date:</Text>
                  <Text style={[styles.dueDateValue, isOverdue && styles.overdueText]}>
                    {formatDate(walletData.fee_due_date)}
                  </Text>
                </View>
                {daysRemaining !== null && (
                  <View style={styles.daysRemainingContainer}>
                    <Text style={[styles.daysRemaining, isOverdue && styles.overdueText]}>
                      {isOverdue 
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : `${daysRemaining} days remaining`
                      }
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.payFeeButton, paymentLoading && styles.disabledButton]} 
                onPress={handlePayFee}
                disabled={paymentLoading}
              >
                <FontAwesome5 name="credit-card" size={16} color="#fff" />
                <Text style={styles.payFeeText}>
                  {paymentLoading ? 'Processing...' : 'Pay Fee Now'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Statistics Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Transaction Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{transactionStats.count}</Text>
                <Text style={styles.statLabel}>Total Transactions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  ₹{transactionStats.totalIn.toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Money Added</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F44336' }]}>
                  ₹{transactionStats.totalOut.toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Money Spent</Text>
              </View>
            </View>
          </View>

          {/* Payment Gateway Status */}
          {!razorpayAvailable && (
            <View style={styles.gatewayStatusCard}>
              <View style={styles.gatewayIcon}>
                <FontAwesome5 name="info-circle" size={20} color="#2196F3" />
              </View>
              <View style={styles.gatewayContent}>
                <Text style={styles.gatewayTitle}>Payment Gateway Unavailable</Text>
                <Text style={styles.gatewayStatusText}>
                  Online payment is currently unavailable. Please contact the school for payment options.
                </Text>
              </View>
            </View>
          )}

          {/* Transaction History */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory', { user })}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {walletData && walletData.transactions && walletData.transactions.length > 0 ? (
              <FlatList
                data={walletData.transactions.slice(0, 5)}
                renderItem={renderTransaction}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyHistory}>
                <FontAwesome5 name="history" size={48} color="#ccc" />
                <Text style={styles.emptyHistoryText}>No transactions yet</Text>
                <Text style={styles.emptyHistorySubtext}>Your transaction history will appear here</Text>
              </View>
            )}
          </View>
        </Animated.View>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money to Wallet</Text>
              <TouchableOpacity onPress={() => setShowAddMoneyModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.amountLabel}>Enter Amount (₹)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={addMoneyAmount}
                onChangeText={setAddMoneyAmount}
                autoFocus
              />
            </View>
            
            <View style={styles.quickAmounts}>
              <TouchableOpacity 
                style={styles.quickAmount} 
                onPress={() => setAddMoneyAmount('100')}
              >
                <Text style={styles.quickAmountText}>₹100</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmount} 
                onPress={() => setAddMoneyAmount('500')}
              >
                <Text style={styles.quickAmountText}>₹500</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickAmount} 
                onPress={() => setAddMoneyAmount('1000')}
              >
                <Text style={styles.quickAmountText}>₹1000</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAddMoneyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, paymentLoading && styles.disabledButton]} 
                onPress={confirmAddMoney}
                disabled={paymentLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {paymentLoading ? 'Processing...' : 'Add Money'}
                </Text>
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
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
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
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  quickActionsContainer: {
    marginTop: 8,
  },
  quickActionsList: {
    paddingHorizontal: 4,
  },
  quickActionCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    minWidth: 80,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  feeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderLeftColor: '#F44336',
    backgroundColor: '#fff5f5',
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  feeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feeInfo: {
    flex: 1,
  },
  feeTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  overdueText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  overdueAmount: {
    color: '#F44336',
  },
  dueDateContainer: {
    marginBottom: 16,
  },
  dueDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dueDateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dueDateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  daysRemainingContainer: {
    alignItems: 'flex-end',
  },
  daysRemaining: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  payFeeButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  payFeeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  gatewayStatusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
  },
  gatewayIcon: {
    marginRight: 12,
  },
  gatewayContent: {
    flex: 1,
  },
  gatewayTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gatewayStatusText: {
    fontSize: 12,
    color: '#666',
  },
  historySection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
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
  disabledButton: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  amountInputContainer: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAmount: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
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
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
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