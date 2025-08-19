import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Share } from 'react-native';

export default function InvoiceDetailScreen() {
  const route = useRoute();
  const { invoice } = route.params || {};

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No invoice data found.</Text>
      </View>
    );
  }

  const generateInvoicePDF = async () => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 18px;">
        <div style="display:flex; align-items:center; margin-bottom:8px;">
          <img src="https://app.tnhappykids.in/assets/icon.png" style="height:44px; margin-right:10px;" />
          <span style="font-size:28px; font-weight:bold; color:#1ba260;">TN HAPPYKIDS CHITHODE</span>
        </div>
        <div style="border-bottom:2px solid #222; margin:8px 0 12px 0;"></div>
        <div style="font-size:18px; font-weight:bold; color:#4b2996; margin-bottom:10px;">INVOICE</div>
        <div style="margin-bottom:8px;"><b>Invoice No:</b> ${invoice.invoice_number}</div>
        <div style="margin-bottom:8px;"><b>Date:</b> ${invoice.date}</div>
        <div style="margin-bottom:8px;"><b>Student ID:</b> ${invoice.student_id}</div>
        <div style="margin-bottom:8px;"><b>Student Name:</b> ${invoice.student_name || ''}</div>
        <div style="margin-bottom:8px;"><b>Father Name:</b> ${invoice.father_name || ''}</div>
        <div style="margin-bottom:8px;"><b>Branch:</b> ${invoice.branch}</div>
        <div style="margin-bottom:8px;"><b>Particulars:</b> ${invoice.particulars}</div>
        <div style="margin-bottom:8px;"><b>Amount:</b> ₹${invoice.amount}</div>
        <div style="margin-bottom:8px;"><b>Payment Mode:</b> ${invoice.mode}</div>
        ${invoice.transaction_id ? `<div style="margin-bottom:8px;"><b>Transaction ID:</b> ${invoice.transaction_id}</div>` : ''}
        <div style="margin-top:24px; font-size:12px; color:#666;">
          No.1, Vinayaka Residency, 37/2, Kumilamparappu Pirivu, Nadupalayam, Chithode, Erode, Tamil Nadu 638102
        </div>
        <div style="font-size:13px;"><b>CONTACT:</b> +91 97877 51430</div>
      </div>
    `;
    try {
      const file = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName: `Invoice_${invoice.invoice_number}`,
        directory: 'Documents',
      });
      Alert.alert('PDF Generated', `Saved to ${file.filePath}`, [
        { text: 'Share', onPress: () => Share.share({ url: file.filePath, message: `Invoice PDF: ${file.filePath}` }) },
        { text: 'OK' }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Invoice Details</Text>
      <Text style={styles.label}>Invoice No: <Text style={styles.value}>{invoice.invoice_number}</Text></Text>
      <Text style={styles.label}>Date: <Text style={styles.value}>{invoice.date}</Text></Text>
      <Text style={styles.label}>Student ID: <Text style={styles.value}>{invoice.student_id}</Text></Text>
      <Text style={styles.label}>Student Name: <Text style={styles.value}>{invoice.student_name || ''}</Text></Text>
      <Text style={styles.label}>Father Name: <Text style={styles.value}>{invoice.father_name || ''}</Text></Text>
      <Text style={styles.label}>Branch: <Text style={styles.value}>{invoice.branch}</Text></Text>
      <Text style={styles.label}>Particulars: <Text style={styles.value}>{invoice.particulars}</Text></Text>
      <Text style={styles.label}>Amount: <Text style={styles.value}>₹{invoice.amount}</Text></Text>
      <Text style={styles.label}>Payment Mode: <Text style={styles.value}>{invoice.mode}</Text></Text>
      {invoice.transaction_id ? (
        <Text style={styles.label}>Transaction ID: <Text style={styles.value}>{invoice.transaction_id}</Text></Text>
      ) : null}
      <TouchableOpacity style={styles.button} onPress={generateInvoicePDF}>
        <Text style={styles.buttonText}>Download/Share PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 22, backgroundColor: '#fff', alignItems: 'center' },
  title: { fontWeight: 'bold', fontSize: 22, color: '#4b2996', marginBottom: 16, textAlign: 'center' },
  label: { fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 10 },
  value: { fontWeight: 'normal', color: '#444' },
  button: { backgroundColor: '#1ba260', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, width: '100%' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  errorText: { color: 'red', fontSize: 18, textAlign: 'center', marginTop: 40 }
});