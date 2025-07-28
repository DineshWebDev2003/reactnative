import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { handleLogout } from '../utils/logout';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function FranchiseeDashboard() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState({
    name: '',
    branch: '',
    address: '',
    profilePic: '🧑‍💼', // Default emoji for profile pic
  });
  const [kidsCount, setKidsCount] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activities, setActivities] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [reportStaff, setReportStaff] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [showReportDatePicker, setShowReportDatePicker] = useState(false);
  const [staffReports, setStaffReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(userId => {
      if (!userId) return;
      fetch(`${BASE_URL}/get_users.php?id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users && data.users.length > 0) {
            const user = data.users[0];
            setProfile({
              name: user.name,
              branch: user.branch,
              address: user.address,
              profilePic: '🧑‍💼', // Default emoji for profile pic
            });
            // Fetch kids count (role=Parent in branch)
            fetch(`${BASE_URL}/get_users.php?role=Parent`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.users) {
                  setKidsCount(data.users.filter(u => u.branch === user.branch).length);
                }
              });
            // Fetch this month's income and expenses
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            fetch(`${BASE_URL}/get_income.php?branch=${encodeURIComponent(user.branch)}`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.records) {
                  const monthIncome = data.records.filter(r => {
                    const d = new Date(r.date);
                    return d.getMonth() + 1 === month && d.getFullYear() === year && r.type === 'income';
                  }).reduce((sum, r) => sum + Number(r.amount), 0);
                  setMonthlyIncome(monthIncome);
                  // Expense breakdown for pie chart
                  const monthExpenses = data.records.filter(r => {
                    const d = new Date(r.date);
                    return d.getMonth() + 1 === month && d.getFullYear() === year && r.type === 'expense';
                  });
                  // Group by description
                  const breakdownMap = {};
                  monthExpenses.forEach(r => {
                    const key = r.description || 'Other';
                    breakdownMap[key] = (breakdownMap[key] || 0) + Number(r.amount);
                  });
                  // Convert to chart data
                  const colors = ['#f953c6', '#43cea2', '#ffd200', '#00c6ff', '#b91d73', '#a6c1ee', '#f7971e', '#8ec5fc', '#fbc2eb'];
                  const chartData = Object.entries(breakdownMap).map(([name, value], i) => ({
                    name,
                    amount: value,
                    color: colors[i % colors.length],
                    legendFontColor: '#333',
                    legendFontSize: 13,
                  }));
                  setExpenseBreakdown(chartData);
                }
              });
            // Fetch notification count (alerts)
            fetch(`${BASE_URL}/get_alerts_count.php?branch=${encodeURIComponent(user.branch)}`)
              .then(res => res.json())
              .then(data => setNotificationCount(data.count || 0));
            // Fetch activities for this branch
            fetch(`${BASE_URL}/get_activities.php?branch=${encodeURIComponent(user.branch)}`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.activities) setActivities(data.activities);
              });
          }
        })
        .catch(err => {
          console.log('User fetch error:', err);
        });
    });
  }, []);

  useEffect(() => {
    // Fetch users for staff filter
    fetch(`${BASE_URL}/get_users.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.users);
        else setUsers([]);
      })
      .catch(() => setUsers([]));
  }, []);

  const fetchStaffReports = () => {
    setLoadingReports(true);
    let url = `${BASE_URL}/get_staff_reports.php?`;
    if (profile.branch) url += `branch=${encodeURIComponent(profile.branch)}&`;
    if (reportStaff) url += `staff_id=${reportStaff}&`;
    if (reportDate) url += `date=${reportDate}&`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) setStaffReports(data.reports);
        else setStaffReports([]);
        setLoadingReports(false);
      })
      .catch(() => { setStaffReports([]); setLoadingReports(false); });
  };

  useEffect(() => {
    if (profile.branch && users.length) fetchStaffReports();
  }, [profile.branch, reportStaff, reportDate, users.length]);

  const handleDownload = async (url) => {
    try {
      const filename = url.split('/').pop();
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      await Sharing.shareAsync(uri);
    } catch (e) {
      alert('Download failed');
    }
  };

  const handleShareInstagram = async (url, kidName) => {
    try {
      const filename = url.split('/').pop();
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      await Sharing.shareAsync(uri, { dialogTitle: 'Share to Instagram', UTI: 'com.instagram.exclusivegram', mimeType: 'image/jpeg', message: `TN Happy Kids - Today's Activity: ${kidName}` });
    } catch (e) {
      alert('Share failed');
    }
  };

  // Add handler for branch camera fullscreen
  const handleViewBranchCamera = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get_branches.php`);
      const data = await response.json();
      if (data.success && data.branches) {
        const branch = data.branches.find(b => b.name === profile.branch);
        if (branch && branch.camera_url) {
          navigation.navigate('CameraFullscreen', { cameraUrl: branch.camera_url });
        } else {
          Alert.alert('No Camera', 'No camera URL found for your branch.');
        }
      } else {
        Alert.alert('Error', 'Could not fetch branch camera info.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error fetching camera info.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa', paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image source={{ uri: profile.profilePic }} style={styles.profilePic} />
        <View style={styles.profileTextContainer}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileRole}>Franchisee</Text>
          <Text style={styles.profileLocation}>{profile.branch}</Text>
          <Text style={styles.profileLocation}>{profile.address}</Text>
        </View>
        <View style={styles.profileButtons}>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate('UpdateProfileScreen')}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={() => handleLogout(navigation)}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Top Summary */}
        <View style={[styles.topSummary, {marginBottom: 8}]}> 
          <SummaryCard
            gradientColors={['#43cea2', '#185a9d']}
            icon={<FontAwesome5 name="child" size={28} color="#fff" />}
            label="Kids Count"
            value={kidsCount}
          />
          <SummaryCard
            gradientColors={['#f7971e', '#ffd200']}
            icon={<MaterialIcons name="currency-rupee" size={28} color="#fff" />}
            label="This Month's Income"
            value={`₹${monthlyIncome}`}
          />
          <SummaryCard
            gradientColors={['#f953c6', '#b91d73']}
            icon={<Ionicons name="notifications" size={28} color="#fff" />}
            label="Notifications"
            value={notificationCount}
          />
      </View>
      {/* Activities Section */}
        <View style={{marginTop: 24, marginBottom: 18}}>
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
            <Entypo name="star" size={20} color="#009688" style={{marginRight:6}} />
            <Text style={{fontWeight:'bold', fontSize:20, color:'#009688'}}>Today's Activities</Text>
          </View>
        {activities.length === 0 ? (
          <Text style={{color:'#888'}}>No activities posted yet.</Text>
        ) : (
          activities.map(activity => (
              <View key={activity.id} style={{backgroundColor:'#fff',borderRadius:16,padding:14,marginBottom:14,shadowColor:'#009688',shadowOpacity:0.10,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:3,borderLeftWidth:5,borderLeftColor:'#a084ca'}}>
              <Image source={{ uri: BASE_URL + '/' + activity.image_path }} style={{width:'100%',height:220,borderRadius:12,marginBottom:8}} resizeMode="cover" />
                <Text style={{fontWeight:'bold',fontSize:17,color:'#a084ca',marginBottom:2}}>{activity.childName}</Text>
                <Text style={{color:'#009688',fontSize:13,marginBottom:2}}>{profile.branch}</Text>
              <Text style={{color:'#888',fontSize:13,marginBottom:6}}>{new Date(activity.created_at).toLocaleString()}</Text>
              <View style={{flexDirection:'row',gap:8}}>
                  <TouchableOpacity style={{backgroundColor:'#009688',padding:10,borderRadius:10,alignSelf:'flex-start',marginRight:8,shadowColor:'#009688',shadowOpacity:0.15,shadowRadius:4,shadowOffset:{width:0,height:2}}} onPress={() => handleDownload(BASE_URL + '/' + activity.image_path)}>
                  <Text style={{color:'#fff',fontWeight:'bold'}}>Download</Text>
                </TouchableOpacity>
                  <TouchableOpacity style={{backgroundColor:'#e75480',padding:10,borderRadius:10,alignSelf:'flex-start',shadowColor:'#e75480',shadowOpacity:0.15,shadowRadius:4,shadowOffset:{width:0,height:2}}} onPress={() => handleShareInstagram(BASE_URL + '/' + activity.image_path, activity.childName)}>
                  <Text style={{color:'#fff',fontWeight:'bold'}}>Share to Instagram</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      {/* Staff Attendance Reports Section */}
      <View style={{backgroundColor:'#fff', borderRadius:12, padding:16, marginVertical:16, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10, elevation:2}}>
        <Text style={{fontWeight:'bold', fontSize:17, marginBottom:10}}>Staff Attendance Reports</Text>
        <View style={{flexDirection:'row', flexWrap:'wrap', marginBottom:12, gap:8}}>
          <View style={{flex:1, minWidth:120, marginRight:4}}>
            <Text style={{fontWeight:'bold', color:'#333', marginBottom:4}}>Branch: {profile.branch}</Text>
          </View>
          <View style={{flex:1, minWidth:120, marginRight:4}}>
            <Picker
              selectedValue={reportStaff}
              style={{height:40}}
              onValueChange={setReportStaff}>
              <Picker.Item label="All Staff" value="" />
              {users.filter(u => u.role && (u.role.toLowerCase().includes('teacher') || u.role.toLowerCase().includes('staff')) && u.branch === profile.branch).map(u => (
                <Picker.Item key={u.id} label={u.name} value={u.id} />
              ))}
            </Picker>
          </View>
          <TouchableOpacity onPress={() => setShowReportDatePicker(true)} style={{backgroundColor:'#f5f7fa', borderRadius:8, borderWidth:1, borderColor:'#e0e0e0', paddingHorizontal:12, justifyContent:'center', height:40}}>
            <Text style={{color:'#333'}}>{reportDate ? reportDate : 'Select Date'}</Text>
          </TouchableOpacity>
          {showReportDatePicker && (
            <DateTimePicker
              value={reportDate ? new Date(reportDate) : new Date()}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setShowReportDatePicker(false);
                if (d) setReportDate(d.toISOString().slice(0,10));
              }}
            />
          )}
          <TouchableOpacity onPress={fetchStaffReports} style={{backgroundColor:'#4F46E5', borderRadius:8, paddingHorizontal:16, justifyContent:'center', height:40, marginLeft:4}}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>Filter</Text>
          </TouchableOpacity>
        </View>
        {loadingReports ? <ActivityIndicator size="small" color="#4F46E5" style={{marginVertical:16}} /> : staffReports.length === 0 ? (
          <Text style={{color:'#888', textAlign:'center', marginVertical:12}}>No reports found.</Text>
        ) : (
          <ScrollView horizontal style={{marginTop:8}} contentContainerStyle={{paddingBottom:8}}>
            <View>
              <View style={{flexDirection:'row', borderBottomWidth:1, borderColor:'#eee', paddingBottom:6, marginBottom:6}}>
                <Text style={{width:90, fontWeight:'bold'}}>Date</Text>
                <Text style={{width:120, fontWeight:'bold'}}>Staff</Text>
                <Text style={{width:120, fontWeight:'bold'}}>Branch</Text>
                <Text style={{width:80, fontWeight:'bold'}}>Clock In</Text>
                <Text style={{width:80, fontWeight:'bold'}}>Clock Out</Text>
                <Text style={{width:160, fontWeight:'bold'}}>Report</Text>
                <Text style={{width:80, fontWeight:'bold'}}>To</Text>
              </View>
              {staffReports.map(r => (
                <View key={r.id} style={{flexDirection:'row', borderBottomWidth:1, borderColor:'#f5f5f5', paddingVertical:6}}>
                  <Text style={{width:90}}>{r.date}</Text>
                  <Text style={{width:120}}>{(users.find(u => u.id == r.staff_id) || {}).name || r.staff_id}</Text>
                  <Text style={{width:120}}>{r.branch}</Text>
                  <Text style={{width:80}}>{r.clock_in || '-'}</Text>
                  <Text style={{width:80}}>{r.clock_out || '-'}</Text>
                  <Text style={{width:160}} numberOfLines={2} ellipsizeMode="tail">{r.report || '-'}</Text>
                  <Text style={{width:80}}>{r.submitted_to || '-'}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
      {/* Tabs */}
      <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, styles.tabVibrant]} onPress={() => navigation.navigate('IncomeExpense', { role: 'Franchisee', branch: profile.branch })} activeOpacity={0.85}>
            <FontAwesome5 name="money-bill-wave" size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={{color:'#fff',fontWeight:'bold'}}>Record Income/Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.tabVibrant2]} onPress={() => navigation.navigate('ChatListScreen', { role: 'Founder' })} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={{color:'#fff',fontWeight:'bold'}}>Chat with Founder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.tabVibrant3]} onPress={() => navigation.navigate('ActivityListScreen', { branch: profile.branch, role: 'Franchisee' })} activeOpacity={0.85}>
            <Entypo name="star" size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={{color:'#fff',fontWeight:'bold'}}>Daily Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.tabVibrant4]} activeOpacity={0.85}>
            <MaterialIcons name="event" size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={{color:'#fff',fontWeight:'bold'}}>Events & Notices</Text>
          </TouchableOpacity>
        </View>
        {/* Pie Chart Section */}
        <View style={styles.pieChartSection}>
          <Text style={styles.pieChartTitle}>Expense Breakdown</Text>
          {expenseBreakdown.length === 0 ? (
            <View style={styles.pieChartPlaceholder}><Text style={{color:'#888'}}>No expenses this month.</Text></View>
          ) : (
            <PieChart
              data={expenseBreakdown.map(d => ({
                name: d.name,
                population: d.amount,
                color: d.color,
                legendFontColor: d.legendFontColor,
                legendFontSize: d.legendFontSize,
              }))}
              width={Dimensions.get('window').width - 64}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(160, 132, 202, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(26, 35, 126, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="16"
              absolute
            />
          )}
        </View>
        {/* Replace the current action buttons with attractive cards in a container */}
        <View style={{marginTop: 18, marginBottom: 18}}>
          <Text style={{fontWeight:'bold', fontSize:20, color:'#009688', marginBottom:12, letterSpacing:0.5}}>Quick Actions</Text>
          <LinearGradient colors={["#e0c3fc", "#8ec5fc"]} style={{borderRadius:22, padding:18, shadowColor:'#a084ca', shadowOpacity:0.10, shadowRadius:12, shadowOffset:{width:0,height:6}, marginBottom:8}}>
            <View style={{flexDirection:'row', flexWrap:'wrap', justifyContent:'flex-start', alignItems:'flex-start', width:'100%', marginVertical: 8}}>
              {/* Manage Users */}
              <QuickActionButton
                gradientColors={['#43cea2', '#185a9d']}
                icon={<FontAwesome5 name="users" size={22} color="#fff" />}
                label="Manage Users"
                onPress={() => navigation.navigate('ManageUsers', { role: 'Franchisee', branch: profile.branch })}
              />
              {/* Assign User */}
              <QuickActionButton
                gradientColors={['#f7971e', '#ffd200']}
                icon={<FontAwesome5 name="user-plus" size={22} color="#fff" />}
                label="Assign User"
                onPress={() => navigation.navigate('AssignUser', { branch: profile.branch, allowedRoles: ['Teacher', 'Parent'] })}
              />
              {/* Branch Camera */}
              <QuickActionButton
                gradientColors={['#00c6ff', '#0072ff']}
                icon={<Entypo name="camera" size={22} color="#fff" />}
                label="Branch Camera"
                onPress={handleViewBranchCamera}
              />
              {/* Assign/Update Parent Fees */}
              <QuickActionButton
                gradientColors={['#f953c6', '#b91d73']}
                icon={<MaterialIcons name="currency-rupee" size={22} color="#fff" />}
                label="Assign/Update Parent Fees (INR)"
                onPress={() => navigation.navigate('AssignFee', { branch: profile.branch })}
              />
            </View>
          </LinearGradient>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ gradientColors, icon, label, value }) {
  const scale = React.useRef(new Animated.Value(0.9)).current;
  React.useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [value]);
  return (
    <Animated.View style={{
      flex: 1,
      margin: 6,
      transform: [{ scale }],
      borderRadius: 18,
      shadowColor: gradientColors[1],
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
      overflow: 'hidden',
    }}>
      <LinearGradient colors={gradientColors} style={{ borderRadius: 18, padding: 0 }}>
        <BlurView intensity={30} tint="light" style={{ borderRadius: 18, padding: 18, alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 32, padding: 10, marginBottom: 10, shadowColor: '#fff', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
            {icon}
          </View>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 2, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: {width:0, height:1}, textShadowRadius:2 }}>{label}</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: {width:0, height:2}, textShadowRadius:3 }}>{value}</Text>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}

function QuickActionButton({ gradientColors, icon, label, onPress }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <Animated.View style={{
      width: '33%',
      alignItems: 'center',
      marginBottom: 18,
      transform: [{ scale }],
    }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ alignItems: 'center' }}
      >
        <LinearGradient
          colors={gradientColors}
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            shadowColor: gradientColors[1],
            shadowOpacity: 0.18,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.5)',
          }}
        >
          {icon}
        </LinearGradient>
        <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#333', textAlign: 'center', marginTop: 2, letterSpacing: 0.2 }}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  profilePic: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
    backgroundColor: '#f5f7fa',
  },
  profileTextContainer: {
    flexDirection: 'column',
    flex: 1,
    marginTop: 4,
  },
  profileName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1a237e',
  },
  profileRole: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 15,
  },
  profileLocation: {
    color: '#009688',
    fontSize: 14,
    fontWeight: '500',
  },
  profileButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  editProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#009688',
    borderRadius: 8,
    shadowColor: '#009688',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  editProfileText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logoutButton: {
    alignSelf: 'center',
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    shadowColor: '#FFD700',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutText: {
    color: '#1a237e',
    fontWeight: 'bold',
    fontSize: 15,
  },
  topSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    minWidth: '45%',
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00968833',
    marginBottom: 8,
  },
  summaryTitle: {
    color: '#009688',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#00695c',
    fontSize: 22,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    backgroundColor: '#b2dfdb',
    borderRadius: 10,
    padding: 12,
    margin: 4,
    minWidth: '45%',
    alignItems: 'center',
    marginBottom: 8,
  },
  pieChartSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00968822',
  },
  pieChartTitle: {
    fontWeight: 'bold',
    color: '#009688',
    marginBottom: 8,
  },
  pieChartPlaceholder: {
    height: 120,
    backgroundColor: '#b2ebf2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    backgroundColor: '#009688',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00968822',
    alignItems: 'center',
  },
  actionCard: { flexBasis: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  actionCardText: { fontWeight: 'bold', fontSize: 16, color: '#333', textAlign: 'center' },
  tabVibrant: {
    backgroundColor: '#009688',
    borderRadius: 10,
    padding: 12,
    margin: 4,
    minWidth: '45%',
    alignItems: 'center',
    marginBottom: 8,
  },
  tabVibrant2: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    padding: 12,
    margin: 4,
    minWidth: '45%',
    alignItems: 'center',
    marginBottom: 8,
  },
  tabVibrant3: {
    backgroundColor: '#00BCD4',
    borderRadius: 10,
    padding: 12,
    margin: 4,
    minWidth: '45%',
    alignItems: 'center',
    marginBottom: 8,
  },
  tabVibrant4: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 12,
    margin: 4,
    minWidth: '45%',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionCardModern: {
    flexBasis: '30%',
    maxWidth: '32%',
    minWidth: 90,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 4,
    marginHorizontal: 2,
    minHeight: 70,
    justifyContent: 'center',
    transform: [{ scale: 1 }],
  },
  actionCardTextModern: {
    fontWeight: 'bold',
    fontSize: 13, // reduced from 16
    color: '#333',
    textAlign: 'center',
    marginTop: 2, // reduced from 4
    letterSpacing: 0.2,
  },
}); 