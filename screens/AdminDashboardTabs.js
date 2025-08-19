import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Easing, SafeAreaView } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5, Entypo, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import AdministrationDashboard from './AdministrationDashboard';
import ChatScreen from './ChatScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

// Utility fallback icon component
function SafeIcon({ IconComponent, name, size = 24, color = '#333', fallback = null }) {
  if (IconComponent && typeof IconComponent === 'function') {
    try {
      return <IconComponent name={name} size={size} color={color} />;
    } catch (e) {
      return fallback || <MaterialIcons name="help-outline" size={size} color={color} />;
    }
  }
  return fallback || <MaterialIcons name="help-outline" size={size} color={color} />;
}

function QuickActionsScreen({ handlers }) {
  const navigation = useNavigation();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const quickActions = [
    {
      gradientColors: ['#43cea2', '#185a9d'],
      icon: <SafeIcon IconComponent={MaterialIcons} name="location-on" color="#fff" />,
      label: 'Manage Branches',
      onPress: () => navigation.navigate('ManageBranches'),
    },
    {
      gradientColors: ['#f7971e', '#ffd200'],
      icon: <SafeIcon IconComponent={FontAwesome5} name="user-plus" color="#fff" />,
      label: 'Create/Assign Users',
      onPress: () => navigation.navigate('AssignUser'),
    },
    {
      gradientColors: ['#f953c6', '#b91d73'],
      icon: <SafeIcon IconComponent={FontAwesome5} name="users" color="#fff" />,
      label: 'Manage Users',
      onPress: () => navigation.navigate('ManageUsers'),
    },
    {
      gradientColors: ['#00c6ff', '#0072ff'],
      icon: <SafeIcon IconComponent={Ionicons} name="chatbubble-ellipses-outline" color="#fff" />,
      label: 'Chat with Franchisees',
      onPress: () => navigation.navigate('Chat'),
    },
    {
      gradientColors: ['#a6c1ee', '#fbc2eb'],
      icon: <SafeIcon IconComponent={Entypo} name="video" color="#fff" />,
      label: 'View All Cameras',
      onPress: () => navigation.navigate('AllCamerasScreen'),
    },
    {
      gradientColors: ['#b2dfdb', '#4caf50'],
      icon: <SafeIcon IconComponent={Feather} name="settings" color="#fff" />,
      label: 'Master Settings',
      onPress: handlers.handleShowMasterSettings,
    },
    {
      gradientColors: ['#a084ca', '#FFD700'],
      icon: <SafeIcon IconComponent={MaterialIcons} name="event-available" color="#fff" />,
      label: 'View Attendance',
      onPress: handlers.handleViewAttendance,
    },
    {
      gradientColors: ['#e75480', '#FFD700'],
      icon: <SafeIcon IconComponent={FontAwesome5} name="rupee-sign" color="#fff" />,
      label: 'Assign/Update Parent Fees',
      onPress: () => navigation.navigate('AssignFee'),
    },
    {
      gradientColors: ['#2193b0', '#6dd5ed'],
      icon: <SafeIcon IconComponent={FontAwesome5} name="id-card" color="#fff" />,
      label: 'ID Card List',
      onPress: () => navigation.navigate('IDCardList'),
    },
    {
      gradientColors: ['#4CAF50', '#2E7D32'],
      icon: <SafeIcon IconComponent={MaterialIcons} name="event-available" size={24} color="#fff" />,
      label: 'Staff Attendance',
      onPress: () => navigation.navigate('StaffAttendance'),
    },
    {
      gradientColors: ['#ff8008', '#ffc837'],
      icon: <SafeIcon IconComponent={FontAwesome5} name="wallet" color="#fff" />,
      label: 'Income/Expense',
      onPress: () => navigation.navigate('IncomeExpense'),
    },
  ];

  return (
    <SafeAreaView style={styles.qaContainer}>
      <View style={styles.qaHeader}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="flash-sharp" size={28} color="#a084ca" />
        </Animated.View>
        <Text style={styles.qaHeaderText}>Quick Actions</Text>
      </View>
      <FlatList
        data={quickActions}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        contentContainerStyle={styles.quickActionsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={item.onPress} style={styles.actionButton}>
            <LinearGradient colors={item.gradientColors} style={styles.gradient}>
              {item.icon}
              <Text style={styles.actionLabel}>{item.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}


export default function AdminDashboardTabs() {
  const [showMasterSettings, setShowMasterSettings] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);

  const handleShowMasterSettings = () => setShowMasterSettings(v => !v);
  const handleViewAttendance = () => {
    // This logic is simplified. The original logic to fetch data before showing the modal
    // remains in AdministrationDashboard. This handler just toggles the visibility.
    setAttendanceModalVisible(v => !v);
  };

  const homeScreenProps = {
    showMasterSettings,
    setShowMasterSettings,
    attendanceModalVisible,
    setAttendanceModalVisible,
  };

  const quickActionHandlers = {
    handleShowMasterSettings,
    handleViewAttendance,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Quick Actions') {
            iconName = 'flash';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#a084ca',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home">
        {props => <AdministrationDashboard {...props} {...homeScreenProps} />}
      </Tab.Screen>
      <Tab.Screen name="Quick Actions">
        {props => <QuickActionsScreen {...props} handlers={quickActionHandlers} />}
      </Tab.Screen>
      <Tab.Screen name="Chat" component={ChatScreen} initialParams={{ role: 'Franchisee' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  qaContainer: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    marginTop: 20,
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  qaHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  quickActionsContainer: {
    padding: 10,
  },
  actionButton: {
    flex: 1,
    margin: 5,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  actionLabel: {
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
