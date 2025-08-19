import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BASE_URL } from '../config';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function IncomeExpense({ route }) {
  // --- State ---
  const role = route?.params?.role === 'Administration' ? 'Administration' : (route?.params?.role || 'Franchisee');
  const branch = route?.params?.branch || '';
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [desc, setDesc] = useState('');
  const [isShared, setIsShared] = useState(false); // Disabled by default for both franchisee and administration
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [pdfLoading, setPdfLoading] = useState(false);
  const franchiseeId = route?.params?.franchiseeId || '';
  const [franchiseeProfile, setFranchiseeProfile] = useState(null);
  const [showExportDatePicker, setShowExportDatePicker] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(new Date());
  const [exportEndDate, setExportEndDate] = useState(new Date());
  const [exportDateMode, setExportDateMode] = useState('start');
  const [receivedBy, setReceivedBy] = useState(''); // Unchecked by default
  const [selectedTab, setSelectedTab] = useState('add');
  const [franchisees, setFranchisees] = useState([]);
  const [selectedFranchisee, setSelectedFranchisee] = useState(branch || '');

  // --- Add Transaction: read-only 'Added by' ---

  // --- Fetch records ---
  const fetchRecords = () => {
    setLoading(true);
    fetch(`${BASE_URL}/get_income.php?branch=${encodeURIComponent(role === 'Administration' ? selectedFranchisee : branch)}`)
      .then(res => res.json())
      .then(data => {
        setRecords(data.records || []);
        setSummary(data.summary || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
    useEffect(() => {
    if (role === 'Administration' && !selectedFranchisee) {
      // Don't fetch records until a franchisee is selected
      setRecords([]);
      setSummary(null);
      return;
    }
    fetchRecords();
    if (role === 'Administration') {
      fetch(`${BASE_URL}/get_users.php?role=Franchisee`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users) {
            setFranchisees(data.users);
            if(data.users.length > 0 && !selectedFranchisee) {
              setSelectedFranchisee(data.users[0].branch_name);
            }
          }
        })
        .catch(err => console.error('Failed to fetch franchisees:', err));
    } else if (role === 'Franchisee' && franchiseeId) {
      fetch(`${BASE_URL}/get_user_details.php?id=${franchiseeId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Franchisee Profile Data:', data); // Added for debugging
          if (data.success && data.user) {
            setFranchiseeProfile(data.user);
          }
        })
        .catch(err => console.error('Failed to fetch franchisee details:', err));
    }
  }, [branch, franchiseeId, role, selectedFranchisee]);



  // --- Add Transaction Handler ---
  const handleSubmit = async () => {
    if (!amount || !desc) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    // For EXPENSE, allow submitting without selecting receivedBy
    if (type === 'income' && !receivedBy) {
      Alert.alert('Error', 'Please select who received the amount.');
      return;
    }
    setSubmitting(true);
    // Franchisee submits for Administration approval, Administration submits for Franchisee approval
    const submitRole = role === 'Administration' ? 'Franchisee' : 'Administration';
    fetch(`${BASE_URL}/create_income.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        amount,
        desc,
        role: submitRole,
        branch: role === 'Administration' ? selectedFranchisee : branch,
        date: new Date().toISOString(),
        status: 'pending',
        created_by_role: role,
        is_shared: isShared ? 1 : 0,
        received_by: receivedBy,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setAmount('');
          setDesc('');
          setType('income');
          setIsShared(false);
          fetchRecords();
          Alert.alert('Success', 'Record saved!');
        } else {
          Alert.alert('Error', data.message || 'Failed to save record.');
        }
      })
      .catch(() => {
        setSubmitting(false);
        Alert.alert('Error', 'Network error.');
      });
  };

  // --- Approve/Reject Handler (Administration only, for Franchisee records) ---
  const updateExpenseStatus = (id, status) => {
    fetch(`${BASE_URL}/update_expense_status.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) fetchRecords();
        else Alert.alert('Error', data.message || 'Failed to update status.');
      })
      .catch(() => Alert.alert('Error', 'Network error.'));
  };

  // --- Delete Transaction Handler ---
  const handleDeleteTransaction = (id) => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${BASE_URL}/delete_income.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          const data = await res.json();
          if (data.success) fetchRecords();
          else Alert.alert('Error', data.message || 'Failed to delete transaction.');
        } catch (e) {
          Alert.alert('Error', 'Network error.');
        }
      }},
    ]);
  };

  // --- Summary Calculation ---
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const safeRecords = Array.isArray(records) ? records : [];
    return safeRecords.reduce((acc, record) => {
      if (record.status === 'approved') {
        if (record.type === 'income') {
          acc.totalIncome += parseFloat(record.amount);
        } else {
          acc.totalExpense += parseFloat(record.amount);
        }
      }
      acc.netBalance = acc.totalIncome - acc.totalExpense;
      return acc;
    }, { totalIncome: 0, totalExpense: 0, netBalance: 0 });
  }, [records]);

  // --- Filtered Records for History ---
  const filteredRecords = useMemo(() => {
    let filtered = records.filter(record => {
      const d = new Date(record.date.replace(' ', 'T'));
      const monthMatch = selectedMonth === 'all' || d.getMonth() + 1 === Number(selectedMonth);
      const yearMatch = selectedYear === 'all' || d.getFullYear() === Number(selectedYear);
      return monthMatch && yearMatch;
    });
    // If navigated with showOnlyPending, show only pending expenses
    if (route?.params?.showOnlyPending) {
      filtered = filtered.filter(r => r.status === 'pending');
    } else {
      // Default: show approved and pending
      filtered = filtered.filter(r => r.status === 'approved' || r.status === 'pending');
    }
    return filtered.sort((a, b) => new Date(b.date.replace(' ', 'T')) - new Date(a.date.replace(' ', 'T')));
  }, [records, selectedMonth, selectedYear, route?.params?.showOnlyPending]);

  const franchiseeShare = useMemo(() => {
    if (role === 'Administration') {
      const selectedData = franchisees.find(f => f.branch_name === selectedFranchisee);
      return selectedData?.share || '';
    }
    return franchiseeProfile?.share || '';
  }, [role, franchisees, selectedFranchisee, franchiseeProfile]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const shareValue = franchiseeProfile?.share ? parseFloat(franchiseeProfile.share) : null;

    const filteredForExport = filteredRecords.filter(txn => {
      const txnDate = new Date(txn.date.replace(' ', 'T'));
      return txnDate >= exportStartDate && txnDate <= exportEndDate;
    });

    let totalFranchiseeShare = 0;
    let totalAdministrationShare = 0;

    filteredForExport.forEach(txn => {
      const amount = parseFloat(txn.amount) || 0;
      if (txn.type === 'income') {
        if (txn.is_shared && shareValue) {
          totalFranchiseeShare += amount * (shareValue / 100);
          totalAdministrationShare += amount * ((100 - shareValue) / 100);
        } else {
          totalFranchiseeShare += amount; 
        }
      } else { // expense
        totalAdministrationShare += amount;
      }
    });

    const grandTotal = totalFranchiseeShare + totalAdministrationShare;
    const dateRangeStr = `${exportStartDate.toLocaleDateString()} - ${exportEndDate.toLocaleDateString()}`;

    const htmlContent = `
      <div style="text-align:center; font-family: Arial, sans-serif;">
        <h2 style='color:#4F46E5;'>TN Happykids - Branch: ${branch}</h2>
        <div>Date Range: <b>${dateRangeStr}</b></div>
        <table border="1" style="width:100%;font-size:12px;border-collapse:collapse;margin-top:16px;">
          <tr style='background:#4F46E5;color:#fff;'>
            <th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>Shared</th><th>Franchisee Share</th><th>Admin Share</th>
          </tr>
          ${filteredForExport.map((txn, i) => {
            const amount = parseFloat(txn.amount) || 0;
            let fShare = 0, adShare = 0;
            if (txn.type === 'income') {
              if (txn.is_shared && shareValue) {
                fShare = amount * (shareValue / 100);
                adShare = amount * ((100 - shareValue) / 100);
              } else {
                fShare = amount;
              }
            } else { // expense
              adShare = amount;
            }
            return `<tr style='background:${i % 2 === 0 ? '#f5f7fa' : '#fff'};'>
              <td>${new Date(txn.date.replace(' ', 'T')).toLocaleDateString()}</td>
              <td>${txn.type}</td>
              <td>₹${amount.toFixed(2)}</td>
              <td>${txn.description || txn.desc || ''}</td>
              <td>${txn.is_shared ? 'Yes' : 'No'}</td>
              <td style='color:#38A169;'>₹${fShare.toFixed(2)}</td>
              <td style='color:#4F46E5;'>₹${adShare.toFixed(2)}</td>
            </tr>`;
          }).join('')}
        </table>
        <div style='margin-top:24px; text-align:right; font-size:14px;'>
          <div style='padding:8px; background:#e0f2f1; border-radius:8px;'>
            <b>Total Franchisee Share:</b> <span style='color:#38A169;'>₹${totalFranchiseeShare.toFixed(2)}</span>
          </div>
          <div style='padding:8px; background:#e3f2fd; border-radius:8px; margin-top:8px;'>
            <b>Total Administration Share:</b> <span style='color:#4F46E5;'>₹${totalAdministrationShare.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Report' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
    }
    setPdfLoading(false);
  };

  // --- Render Transaction Item ---
  const renderRecordItem = ({ item }) => {
    const status = item.status;
    const style = statusStyles[status] || statusStyles.pending;
    return (
      <View style={[styles.cardRecordItem, { borderLeftColor: item.type === 'income' ? '#4CAF50' : '#F44336', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.description}</Text>
            <Text style={[styles.statusBadge, { backgroundColor: style.backgroundColor, color: style.color }]}> 
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.cardAmount, { color: item.type === 'income' ? '#4CAF50' : '#F44336' }]}> 
              ₹{parseFloat(item.amount).toFixed(2)}
            </Text>
            <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            Added by: {item.created_by_role}{item.branch ? ` (${item.branch})` : ''}
          </Text>
          {item.is_shared ? <Text style={styles.sharedText}>Shared Expense</Text> : null}
          {/* Approve/Reject buttons for Administration on pending Franchisee records */}
          {status === 'pending' && role === 'Administration' && item.role === 'Administration' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => updateExpenseStatus(item.id, 'approved')} style={[styles.actionButton, {backgroundColor: '#4CAF50'}]}>
                <MaterialIcons name="check" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateExpenseStatus(item.id, 'rejected')} style={[styles.actionButton, {backgroundColor: '#F44336'}]}>
                <MaterialIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {/* Delete Button */}
        <TouchableOpacity onPress={() => handleDeleteTransaction(item.id)} style={{ marginLeft: 12, padding: 8 }}>
          <FontAwesome5 name="trash" size={18} color="#e53935" />
        </TouchableOpacity>
      </View>
    );
  };

    const SummaryView = ({ franchiseeShare, records }) => {
    if (loading) return <ActivityIndicator />;

    const { totalIncome, totalExpenses } = useMemo(() => {
      const safeRecords = Array.isArray(records) ? records : [];
      return safeRecords.reduce((acc, record) => {
        if (record.status === 'approved') {
          if (record.type === 'income') {
            acc.totalIncome += parseFloat(record.amount) || 0;
          } else {
            acc.totalExpenses += parseFloat(record.amount) || 0;
          }
        }
        return acc;
      }, { totalIncome: 0, totalExpenses: 0 });
    }, [records]);

    const netProfitBeforeShare = totalIncome - totalExpenses;

    const sharePercentage = franchiseeShare ? parseFloat(franchiseeShare) : 0;
    const franchiseeShareAmount = netProfitBeforeShare * (sharePercentage / 100);

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Financial Summary</Text>
        <Text>Total Income: ₹{totalIncome.toFixed(2)}</Text>
        <Text>Total Expenses: ₹{totalExpenses.toFixed(2)}</Text>
        <Text>Net Balance: ₹{netProfitBeforeShare.toFixed(2)}</Text>
        <Text style={styles.shareAmount}>
          Franchisee Share ({sharePercentage}% of Net Profit): ₹{franchiseeShareAmount.toFixed(2)}
        </Text>
        <Text style={styles.shareAmount}>
          Administration Share ({100 - sharePercentage > 0 ? (100 - sharePercentage) : 0}% of Net Profit): ₹{(netProfitBeforeShare - franchiseeShareAmount).toFixed(2)}
        </Text>
        <Text style={styles.netProfit}>Final Net Profit (Franchisee): ₹{franchiseeShareAmount.toFixed(2)}</Text>
        <Text style={styles.settlement}>
          {franchiseeShareAmount > 0 ? `Franchisee will receive ₹${franchiseeShareAmount.toFixed(2)}.` : 
          franchiseeShareAmount < 0 ? `Franchisee owes ₹${Math.abs(franchiseeShareAmount).toFixed(2)}.` : 
          'The account is settled.'}
        </Text>
      </View>
    );
  };

  // --- UI ---
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa', padding: 16, marginTop: 20 }}>
      {role === 'Administration' && (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedFranchisee}
            onValueChange={(itemValue) => setSelectedFranchisee(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select a Franchisee..." value="" />
            {franchisees.map(f => (
              <Picker.Item key={f.id} label={f.name} value={f.branch_name} />
            ))}
          </Picker>
        </View>
      )}
      <View style={styles.tabContainer}>
        {['add', 'list', ...(role === 'Administration' ? ['requests'] : [])].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text 
              style={[
                styles.tabButtonText,
                selectedTab === tab && styles.tabButtonTextActive
              ]}
            >
              {tab === 'add' ? 'Add Transaction' : tab === 'list' ? 'List' : 'Requests'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selectedTab === 'add' && (
        <>
          {/* Summary Card */}
          {/* <SummaryView franchiseeShare={franchiseeShare} /> */}

          {/* Add Transaction Form */}
          <View style={styles.formSection}>
            <Text style={styles.title}>Add New Transaction</Text>
            <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeButton, type === 'income' && styles.typeButtonActive]} onPress={() => setType('income')}>
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]} onPress={() => setType('expense')}>
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>Expense</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Description" value={desc} onChangeText={setDesc} />
            {/* Shared Toggle and Franchisee Share */}
            <View>
              <View style={styles.sharedRow}>
                <Text style={{ fontWeight: 'bold', marginRight: 8 }}>Shared:</Text>
                <Switch value={isShared} onValueChange={setIsShared} />
              </View>
              {isShared && franchiseeShare !== '' && (
                <Text style={{ marginBottom: 8, color: '#4F46E5', fontWeight: 'bold' }}>Franchisee Share: {franchiseeShare}%</Text>
              )}
            </View>
            {/* Received By Checkbox - only for income */}
            {type === 'income' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', marginRight: 8 }}>Received by:</Text>
                <TouchableOpacity onPress={() => setReceivedBy('Administration')} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                  <View style={[styles.checkbox, receivedBy === 'Administration' && styles.checkboxChecked]} />
                  <Text style={{ marginLeft: 4 }}>Administration</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReceivedBy('Franchisee')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.checkbox, receivedBy === 'Franchisee' && styles.checkboxChecked]} />
                  <Text style={{ marginLeft: 4 }}>Franchisee</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Added by:</Text>
            <Picker selectedValue={role} enabled={false} style={{ backgroundColor: '#f5f7fa', borderRadius: 8, marginBottom: 12 }}>
              <Picker.Item label="Administration" value="Administration" />
              <Picker.Item label="Franchisee" value="Franchisee" />
            </Picker>
            <TouchableOpacity style={[styles.submitButton, type === 'expense' && {backgroundColor: '#F44336'}]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Add Transaction'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {selectedTab === 'list' && (
        <>
          {/* Filters and PDF Export */}
          <View style={styles.filterRow}>
            <Picker selectedValue={selectedMonth} style={styles.filterPicker} onValueChange={setSelectedMonth}>
              <Picker.Item label="All Months" value="all" />
              {[...Array(12)].map((_, i) => (
                <Picker.Item key={i+1} label={new Date(0, i).toLocaleString('default', { month: 'long' })} value={(i+1).toString()} />
              ))}
            </Picker>
            <Picker selectedValue={selectedYear} style={styles.filterPicker} onValueChange={setSelectedYear}>
              <Picker.Item label="All Years" value="all" />
              {[...Array(5)].map((_, i) => (
                <Picker.Item key={i} label={`${(new Date()).getFullYear()-2+i}`} value={`${(new Date()).getFullYear()-2+i}`} />
              ))}
            </Picker>
            <TouchableOpacity style={styles.pdfButton} onPress={() => setShowExportDatePicker(true)} disabled={pdfLoading}>
              <FontAwesome5 name="file-pdf" size={18} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 6 }}>{pdfLoading ? 'Exporting...' : 'Export PDF'}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredRecords.filter(r => r.status === 'approved' || r.status === 'pending')}
            renderItem={renderRecordItem}
            keyExtractor={item => item.id.toString()}
            ListFooterComponent={<SummaryView franchiseeShare={franchiseeShare} records={records} />}
            ListEmptyComponent={<Text>No transactions found.</Text>}
          />
        </>
      )}
      {selectedTab === 'requests' && role === 'Administration' && (
        <View style={{ flex: 1 }}>
          {/* Pending Requests Summary */}
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { fontSize: 16, marginBottom: 10 }]}>Pending Approvals</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>₹{filteredRecords.filter(r => r.status === 'pending' && r.type === 'income').reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(2)}</Text>
                <Text style={styles.summaryLabel}>Pending Income</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryValue, { color: '#F44336' }]}>₹{filteredRecords.filter(r => r.status === 'pending' && r.type === 'expense').reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(2)}</Text>
                <Text style={styles.summaryLabel}>Pending Expenses</Text>
              </View>
            </View>
          </View>

          {/* Pending Requests List */}
          <FlatList
            data={filteredRecords.filter(r => r.status === 'pending')}
            renderItem={({ item }) => (
              <View style={[styles.recordItem, { borderLeftWidth: 4, borderLeftColor: item.type === 'income' ? '#4CAF50' : '#F44336' }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.desc}</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 4 }}>
                    {item.type === 'income' ? '+' : '-'}₹{parseFloat(item.amount).toFixed(2)}
                  </Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {new Date(item.date).toLocaleDateString()}
                    {item.branch && ` • From: ${item.branch}`}
                    {item.received_by && ` • Received by: ${item.received_by}`}
                  </Text>
                </View>
                {role === 'Administration' && (
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                      onPress={() => updateExpenseStatus(item.id, 'approved')}
                    >
                      <Text style={{ color: '#fff', fontWeight: '500' }}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#F44336', marginLeft: 8 }]}
                      onPress={() => updateExpenseStatus(item.id, 'rejected')}
                    >
                      <Text style={{ color: '#fff', fontWeight: '500' }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: 30 }}>
                <MaterialIcons name="pending-actions" size={48} color="#ccc" />
                <Text style={{ fontSize: 18, color: '#666', marginTop: 10, fontWeight: '500' }}>No pending requests</Text>
                <Text style={{ fontSize: 14, color: '#999', marginTop: 5, textAlign: 'center' }}>
                  All caught up! No pending transactions to review.
                </Text>
              </View>
            }
          />
        </View>
      )}
      {/* Export Date Range Picker Modal */}
      {showExportDatePicker && (
        <View style={styles.datePickerModal}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Select Export Date Range</Text>
          <TouchableOpacity onPress={() => setExportDateMode('start')} style={styles.dateBtn}>
            <Text>From: {exportStartDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExportDateMode('end')} style={styles.dateBtn}>
            <Text>To: {exportEndDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {exportDateMode === 'start' && (
            <DateTimePicker
              value={exportStartDate}
              mode="date"
              display="default"
              onChange={(e, d) => { if (d) setExportStartDate(d); setExportDateMode(''); }}
            />
          )}
          {exportDateMode === 'end' && (
            <DateTimePicker
              value={exportEndDate}
              mode="date"
              display="default"
              onChange={(e, d) => { if (d) setExportEndDate(d); setExportDateMode(''); }}
            />
          )}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <TouchableOpacity style={[styles.submitButton, { flex: 1, marginRight: 8 }]} onPress={() => setShowExportDatePicker(false)}>
              <Text style={styles.submitButtonText}>Cancel</Text>
            </TouchableOpacity>
            {/* The actual export logic will be updated in the next step */}
            <TouchableOpacity style={[styles.submitButton, { flex: 1 }]} onPress={() => { setShowExportDatePicker(false); handleDownloadPDF(); }}>
              <Text style={styles.submitButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// --- Styles ---
const statusStyles = {
  approved: {
    backgroundColor: '#E6F4EA',
    color: '#38A169',
  },
  pending: {
    backgroundColor: '#FEFCE8',
    color: '#D97706',
  },
  rejected: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    marginTop: 8,
    marginLeft: 4,
    marginRight: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    marginLeft: 4,
    marginRight: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#1a237e',
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  typeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterPicker: {
    flex: 1,
    height: 40,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 10,
    color: '#1a237e',
  },
  cardRecordItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  statusBadge: {
    fontWeight: 'bold',
    fontSize: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardDate: {
    fontSize: 13,
    color: '#888',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  sharedText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
  },
  datePickerModal: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  dateBtn: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 5,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  tabButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  recordItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recordInfo: {
    flex: 1,
  },
  recordDesc: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  recordAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  recordDate: {
    color: '#666',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  summaryContainer: {
    padding: 15,
    marginTop: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  netProfit: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  settlement: {
    marginTop: 10,
    fontStyle: 'italic',
    color: '#007bff',
  },
  shareAmount: {
    color: '#dc3545',
  },
});