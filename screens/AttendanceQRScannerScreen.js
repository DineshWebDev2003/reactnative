import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function AttendanceQRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera. Please enable camera permissions in your settings.</Text>;
  }

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    Alert.alert('QR Code Scanned', `Type: ${type}\nData: ${data}`);
    // TODO: Send `data` to your backend to mark attendance
    // fetch('https://your-backend.com/mark_attendance.php', { ... })
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scan QR to Mark Attendance</Text>
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      {scanned && (
        <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8ff' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#764ba2', marginBottom: 18 },
  scannerContainer: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#764ba2',
    width: 320,
    height: 320,
    backgroundColor: '#000',
    marginBottom: 20,
  },
});
