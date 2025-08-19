import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '../config';

export default function BranchInvoiceListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { branch } = route.params || {};
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branch) {
      setLoading(true);
      fetch(`${BASE_URL}/get_invoices.php?branch=${encodeURIComponent(branch)}`)
        .then(res => res.json())
        .then(data => {
          setInvoices(data.success && data.invoices ? data.invoices : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [branch]);

  const renderItem = ({ item }) => (
    <View style={styles.invoiceItem}>
      <Text style={styles.invoiceNumber}>#{item.invoice_number}</Text>
      <Text>Student: {item.student_id} | {item.particulars}</Text>
      <Text>Amount: ₹{item.amount} | Date: {item.date}</Text>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => navigation.navigate('InvoiceDetailScreen', { invoice: item })}
      >
        <Text style={styles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoices for {branch}</Text>
      <FlatList
        data={invoices}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No invoices found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 16, textAlign: 'center' },
  invoiceItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  invoiceNumber: { fontWeight: 'bold', color: '#4b2996' },
  viewButton: {
    marginTop: 8,
    backgroundColor: '#1ba260',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
