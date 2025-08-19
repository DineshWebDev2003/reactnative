import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '../config';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Share } from 'react-native';

export default function InvoiceGeneratorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { franchiseeName, branch } = route.params || {};
  const [studentList, setStudentList] = useState([]);
  const [invoiceStudent, setInvoiceStudent] = useState(null);
  const [invoiceFather, setInvoiceFather] = useState('');
  const [invoiceParticulars, setInvoiceParticulars] = useState('Admission Fees');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMode, setInvoiceMode] = useState('Cash');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Fetch students for this branch
  useEffect(() => {
    if (branch) {
      setLoading(true);
      fetch(`${BASE_URL}/get_users.php?role=tuition_student&branch=${encodeURIComponent(branch)}`)
        .then(res => res.json())
        .then(data => {
          setStudentList(data.success && data.users ? data.users : []);
          setLoading(false);
        })
        .catch(() => { setStudentList([]); setLoading(false); });
    }
  }, [branch]);

  // Fetch next invoice number from backend
  useEffect(() => {
    if (branch && invoiceParticulars) {
      fetch(`${BASE_URL}/get_next_invoice_number.php?branch=${encodeURIComponent(branch)}&particulars=${encodeURIComponent(invoiceParticulars)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.invoice_number) setInvoiceNumber(data.invoice_number);
          else setInvoiceNumber('');
        })
        .catch(() => setInvoiceNumber(''));
    }
  }, [branch, invoiceParticulars]);

  const generateInvoicePDF = async (invoiceData) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 18px;">
        <div style="display:flex; align-items:center; margin-bottom:8px;">
          <img src="https://app.tnhappykids.in/assets/icon.png" style="height:44px; margin-right:10px;" />
          <span style="font-size:28px; font-weight:bold; color:#1ba260;">TN HAPPYKIDS CHITHODE</span>
        </div>
        <div style="border-bottom:2px solid #222; margin:8px 0 12px 0;"></div>
        <div style="font-size:20px; font-weight:bold; text-align:center; margin-bottom:10px;">BILL VOUCHER-ADMISSION FEES</div>
        <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:bold; margin-bottom:10px;">
          <span>VOUCHER NO: ${invoiceData.invoice_number}</span>
          <span>DATE: ${invoiceData.date}</span>
        </div>
        <div style="margin-bottom:5px;"><b>STUDENT NAME:</b> ${invoiceData.student_name}</div>
        <div style="margin-bottom:5px;"><b>SON OF:</b> ${invoiceData.father_name}</div>
        <div style="margin-bottom:5px;"><b>PARTICULARS:</b> ${invoiceData.particulars}</div>
        <div style="margin-bottom:5px;"><b>AMOUNT:</b> ₹${invoiceData.amount}/-</div>
        <div style="margin-bottom:5px;"><b>MODE OF PAYMENT:</b> ${invoiceData.mode}</div>
        <div style="margin-bottom:10px;"><b>TRANSACTION ID:</b> ${invoiceData.transaction_id ? invoiceData.transaction_id : '-'}</div>
        <div style="display:flex; justify-content:center; margin:18px 0;">
          <div style="background:#ffce54; border-radius:9px; padding:10px 28px; font-size:18px; font-weight:bold; border:2px solid #ffb347; color:#222;">
            <span style="font-size:22px;">✱</span> Received with thanks <span style="font-size:22px;">✱</span>
          </div>
        </div>
        <div style="text-align:center; font-weight:bold; margin-bottom:12px;">AUTHORIZED SIGNATURE</div>
        <div style="font-size:13px; margin-bottom:3px;"><b>ADDRESS</b></div>
        <div style="font-size:13px; margin-bottom:6px;">
          No.1, Vinayaka Residency, 37/2, Kumilamparappu Pirivu, Nadupalayam, Chithode, Erode, Tamil Nadu 638102
        </div>
        <div style="font-size:13px;"><b>CONTACT:</b> +91 97877 51430</div>
      </div>
    `;
    const options = {
      html: htmlContent,
      fileName: `Invoice_${invoiceData.invoice_number}`,
      directory: 'Documents',
    };
    const file = await RNHTMLtoPDF.convert(options);
    Alert.alert('PDF Generated', `Saved to ${file.filePath}`, [
      { text: 'Share', onPress: () => Share.share({ url: file.filePath, message: `Invoice PDF: ${file.filePath}` }) },
      { text: 'OK' }
    ]);
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceStudent || !invoiceAmount || !invoiceParticulars || !invoiceMode || !invoiceDate) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (invoiceMode !== 'Cash' && !transactionId) {
      Alert.alert('Error', 'Transaction ID is required for non-cash payments.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/create_invoice.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `branch=${encodeURIComponent(branch)}&invoice_number=${encodeURIComponent(invoiceNumber)}&student_id=${encodeURIComponent(invoiceStudent)}&particulars=${encodeURIComponent(invoiceParticulars)}&amount=${encodeURIComponent(invoiceAmount)}&mode=${encodeURIComponent(invoiceMode)}&transaction_id=${encodeURIComponent(transactionId)}&date=${encodeURIComponent(invoiceDate)}`
      });
      const data = await response.json();
      if (data.success) {
        // Prepare invoice data for PDF
        const studentObj = studentList.find(s => s.id === invoiceStudent);
        await generateInvoicePDF({
          invoice_number: invoiceNumber,
          franchiseeName,
          branch,
          student_name: studentObj ? (studentObj.childName || studentObj.name) : '',
          father_name: invoiceFather,
          particulars: invoiceParticulars,
          amount: invoiceAmount,
          date: invoiceDate,
          mode: invoiceMode,
          transaction_id: transactionId
        });
        Alert.alert('Success', 'Invoice created and PDF generated!');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error || 'Failed to create invoice');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Generate Invoice</Text>
      <Text style={styles.label}>Franchisee:</Text>
      <Text style={styles.value}>{franchiseeName || '-'}</Text>
      <Text style={styles.label}>Branch:</Text>
      <Text style={styles.value}>{branch || '-'}</Text>
      <Text style={styles.label}>Invoice Number:</Text>
      <Text style={styles.value}>{invoiceNumber || 'Loading...'}</Text>
      <Text style={styles.label}>Student Name:</Text>
      <Picker
        selectedValue={invoiceStudent}
        style={styles.picker}
        onValueChange={val => setInvoiceStudent(val)}
      >
        <Picker.Item label="Select Student" value={null} />
        {studentList.map(s => (
          <Picker.Item key={s.id} label={s.childName || s.name} value={s.id} />
        ))}
      </Picker>
      <Text style={styles.label}>Father's Name:</Text>
      <TextInput
        style={styles.input}
        value={invoiceFather}
        onChangeText={setInvoiceFather}
        placeholder="Enter Father's Name"
      />
      <Text style={styles.label}>Particulars:</Text>
      <TextInput
        style={styles.input}
        value={invoiceParticulars}
        onChangeText={setInvoiceParticulars}
        placeholder="Particulars"
      />
      <Text style={styles.label}>Amount:</Text>
      <TextInput
        style={styles.input}
        value={invoiceAmount}
        onChangeText={setInvoiceAmount}
        placeholder="Amount"
        keyboardType="numeric"
      />
      <Text style={styles.label}>Mode of Payment:</Text>
      <Picker
        selectedValue={invoiceMode}
        style={styles.picker}
        onValueChange={val => setInvoiceMode(val)}
      >
        <Picker.Item label="Cash" value="Cash" />
        <Picker.Item label="UPI" value="UPI" />
        <Picker.Item label="Card" value="Card" />
        <Picker.Item label="Bank Transfer" value="Bank Transfer" />
      </Picker>
      {invoiceMode !== 'Cash' && (
        <>
          <Text style={styles.label}>Transaction ID:</Text>
          <TextInput
            style={styles.input}
            value={transactionId}
            onChangeText={setTransactionId}
            placeholder="Transaction ID"
          />
        </>
      )}
      <Text style={styles.label}>Date:</Text>
      <TextInput
        style={styles.input}
        value={invoiceDate}
        onChangeText={setInvoiceDate}
        placeholder="YYYY-MM-DD"
      />
      <TouchableOpacity style={styles.button} onPress={handleGenerateInvoice} disabled={loading}>
        <Text style={styles.buttonText}>Generate Invoice</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', alignItems: 'center' },
  title: { fontWeight: 'bold', fontSize: 22, color: '#4b2996', marginBottom: 16, textAlign: 'center' },
  label: { fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 10 },
  value: { marginBottom: 8, alignSelf: 'flex-start', color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, marginBottom: 8, width: '100%' },
  picker: { height: 40, width: '100%', marginBottom: 8 },
  button: { backgroundColor: '#ffb347', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16, width: '100%' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { marginTop: 14, alignItems: 'center', width: '100%' },
  cancelText: { color: '#888' },
});
