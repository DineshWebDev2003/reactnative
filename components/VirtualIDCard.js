import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { BASE_URL } from '../config';
import QRCode from 'react-native-qrcode-svg';

const CARD_WIDTH = 320;
const CARD_HEIGHT = 180;

function Header() {
  return (
    <Text style={styles.schoolTitle}>TN Happy Kids Playschool</Text>
  );
}

export function VirtualIDCardFront({ student, logoSource }) {
  if (!student) {
    return (
      <View style={styles.idCard}>
        <Header />
        <Text style={{ color: 'red' }}>No student data available</Text>
      </View>
    );
  }
  return (
    <View style={styles.idCard}>
      <View style={styles.bgPattern} />
      <Header />
      <Image source={logoSource} style={styles.logo} />
      <View style={{flexDirection:'row',alignItems:'center', marginTop: 8}}>
        <Image source={student.child_photo ? { uri: BASE_URL + '/' + student.child_photo } : require('../assets/Avartar.png')} style={styles.idCardPhoto} />
        <View style={{marginLeft:16}}>
          <Text style={styles.idCardName}>{student.childName || '-'}</Text>
          <Text style={styles.idCardLabel}>Class: <Text style={styles.idCardValue}>{student.childClass || '-'}</Text></Text>
          <Text style={styles.idCardLabel}>Branch: <Text style={styles.idCardValue}>{student.branch || '-'}</Text></Text>
          <Text style={styles.idCardLabel}>Student ID: <Text style={styles.idCardValue}>{student.student_id || '-'}</Text></Text>
          {student.dob && <Text style={styles.idCardLabel}>DOB: <Text style={styles.idCardValue}>{student.dob}</Text></Text>}
          <Text style={styles.idCardLabel}>Parent Mobile: <Text style={styles.idCardValue}>{student.mobile || '-'}</Text></Text>
        </View>
      </View>
    </View>
  );
}

export function VirtualIDCardBack({ student, franchiseeMobile }) {
  if (!student) {
    return (
      <View style={[styles.idCard, styles.idCardBackContent]}>
        <Header />
        <Text style={{ color: 'red' }}>No student data available</Text>
      </View>
    );
  }
  return (
    <View style={[styles.idCard, styles.idCardBackContent]}>
      <View style={styles.bgPattern} />
      <Header />
      <View style={styles.qrBackWrap}>
        {student.student_id ? (
          <QRCode value={String(student.student_id)} size={60} />
        ) : (
          <Text style={{ color: 'red' }}>No Student ID</Text>
        )}
        <Text style={styles.qrLabel}>Student QR Code</Text>
      </View>
      <Text style={styles.idCardLabelBack} numberOfLines={1} ellipsizeMode="tail">
        School Contact: <Text style={styles.idCardValue}>{franchiseeMobile || '-'}</Text>
      </Text>
    </View>
  );
}

// Default export component
export default function VirtualIDCard({ student, logoSource, franchiseeMobile }) {
  return (
    <View style={styles.container}>
      <VirtualIDCardFront student={student} logoSource={logoSource} />
      <VirtualIDCardBack student={student} franchiseeMobile={franchiseeMobile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  idCard: {
    backgroundColor: '#fdf6e3',
    borderRadius: 18,
    padding: 20,
    margin: 8,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    minWidth: CARD_WIDTH,
    maxWidth: CARD_WIDTH,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderWidth: 2,
    borderColor: '#ffe082',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-start',
  },
  idCardBackContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 18,
  },
  schoolTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#e65100',
    alignSelf: 'center',
    marginBottom: 4,
    letterSpacing: 1.2,
    fontFamily: 'sans-serif-medium',
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: '#ffe082',
    borderRadius: 18,
  },
  logo: {
    position: 'absolute',
    top: 38,
    right: 18,
    width: 38,
    height: 38,
    resizeMode: 'contain',
    zIndex: 2,
  },
  idCardPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: '#1a237e',
  },
  idCardName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a237e',
    marginBottom: 2,
  },
  idCardLabel: {
    color: '#333',
    fontSize: 13,
    marginTop: 2,
  },
  idCardLabelBack: {
    color: '#333',
    fontSize: 13,
    marginTop: 12,
    marginBottom: 2,
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
  },
  idCardValue: {
    color: '#444',
    fontWeight: 'bold',
  },
  qrWrap: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
    alignSelf: 'center',
    width: '100%',
  },
  qrBackWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  qrLabel: {
    color: '#1a237e',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 8,
    alignSelf: 'center',
  },
}); 