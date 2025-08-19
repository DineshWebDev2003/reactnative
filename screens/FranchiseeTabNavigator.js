import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FranchiseeDashboard from './FranchiseeDashboard';
import IncomeExpense from './IncomeExpense';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

// Placeholder for History tab
function HistoryScreen() {
  return null; // Replace with your actual history component if needed
}

const Tab = createBottomTabNavigator();

export default function FranchiseeTabNavigator({ route }) {
  // If you want to pass branch dynamically, you can use context or props
  // Here, branch is left empty. Update as needed.
  const branch = route?.params?.branch || '';

  return (
    <Tab.Navigator
      initialRouteName="FranchiseeHome"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'FranchiseeHome') {
            return <MaterialIcons name="home" size={size} color={color} />;
          }
          if (route.name === 'History') {
            return <MaterialIcons name="history" size={size} color={color} />;
          }
          if (route.name === 'IncomeExpenseTab') {
            return <FontAwesome5 name="rupee-sign" size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#009688',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="FranchiseeHome"
        component={FranchiseeDashboard}
        options={{ title: 'Home', headerShown: false }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History', headerShown: false }}
      />
      <Tab.Screen
        name="IncomeExpenseTab"
        component={IncomeExpense}
        options={{
          title: 'Income Expense',
          headerShown: false,
        }}
        initialParams={{ role: 'Franchisee', branch }}
      />
    </Tab.Navigator>
  );
}
