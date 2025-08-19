import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { handleLogout } from '../utils/logout';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const onLogoutPress = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => handleLogout(navigation) },
      ],
      { cancelable: false }
    );
  };

  const settingGroups = [
    {
      title: 'General',
      options: [
        { icon: 'person-outline', title: 'Account', subtitle: 'Privacy, security, change number' },
        { icon: 'notifications-none', title: 'Notifications', subtitle: 'Messages, group & call tones' },
        { icon: 'color-lens', title: 'Appearance', subtitle: 'Theme, wallpaper, font size' },
        { icon: 'lock-outline', title: 'Privacy', subtitle: 'Block contacts, disappearing messages' },
        { icon: 'language', title: 'App Language', subtitle: 'English (device\'s language)' },
      ]
    },
    {
      title: 'Support',
      options: [
        { icon: 'help-outline', title: 'Help', subtitle: 'Help center, contact us, privacy policy' },
        { icon: 'gavel', title: 'Terms and Conditions', subtitle: 'Read our terms of service' },
      ]
    },
  ];

  const renderSettingOption = (item, isLast) => (
    <TouchableOpacity key={item.title} style={[styles.optionContainer, isLast && styles.noBorder]}>
      <MaterialIcons name={item.icon} size={24} color="#555" style={styles.optionIcon} />
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.optionSubtitle}>{item.subtitle}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {settingGroups.map(group => (
          <View key={group.title} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.options.map((item, index) => renderSettingOption(item, index === group.options.length - 1))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
          <MaterialIcons name="exit-to-app" size={24} color="#D32F2F" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.footerText}>from</Text>
            <Text style={[styles.footerText, {fontWeight: 'bold'}]}>tnhappykids team</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  groupContainer: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6D6D72',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF4',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    color: '#000',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 17,
    color: '#D32F2F',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
      alignItems: 'center',
      padding: 20,
      marginTop: 10,
  },
  footerText: {
      fontSize: 14,
      color: '#8A8A8E',
  }
});

export default SettingsScreen;
