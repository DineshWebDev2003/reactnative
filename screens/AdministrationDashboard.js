import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient'; // If using Expo, otherwise use a View with a gradient-like color
import { WebView } from 'react-native-webview';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleLogout } from '../utils/logout';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import SlidingActivityScreen from '../components/SlidingActivityScreen';

const cameraBranches = [
  {
    id: 1,
    name: 'Pollachi',
    stream_url: 'https://player.twitch.tv/?channel=tnhappykidspollachi&parent=live.tnhappykids.in',
  },
  {
    id: 2,
    name: 'Coimbatore',
    stream_url: 'https://player.twitch.tv/?channel=tnhappykidscoimbatore&parent=live.tnhappykids.in',
  },
  {
    id: 3,
    name: 'Tambaram',
    stream_url: 'https://player.twitch.tv/?channel=tnhappykids_Tambaram&parent=live.tnhappykids.in',
  },
  {
    id: 4,
    name: 'Kolathur',
    stream_url: 'https://player.twitch.tv/?channel=tnhappykids_kolathur&parent=live.tnhappykids.in',
  },
  {
    id: 5,
    name: 'Tiruppur',
    stream_url: 'https://player.twitch.tv/?channel=tnhappykids_tiruppur&parent=live.tnhappykids.in',
  },
];

export default function AdministrationDashboard() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  // Administration profile info
  const administrationProfile = {
    name: 'TN Happy Kids Administration',
    role: 'Administration',
    location: 'Pollachi',
    profilePic: { uri: 'https://app.tnhappykids.in/assets/Avartar.png' },
  };
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Teacher');
  const [userBranch, setUserBranch] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateForms, setShowCreateForms] = useState(false);
  const [showCameras, setShowCameras] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userBranchFilter, setUserBranchFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  // 1. Add state for success messages and colors
  const [successMessage, setSuccessMessage] = useState('');
  const [successColor, setSuccessColor] = useState('#4caf50'); // green by default
  // Remove editUserId, editUserName, etc. state and inline edit logic for users
  const [editCameraBranchId, setEditCameraBranchId] = useState(null);
  const [editCameraUrl, setEditCameraUrl] = useState('');
  const [totalIncome, setTotalIncome] = useState(0);
  const [creatingUser, setCreatingUser] = useState(false);
  const [selectedFranchisee, setSelectedFranchisee] = useState('');
  const [userShare, setUserShare] = useState('');
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [showAttendanceDatePicker, setShowAttendanceDatePicker] = useState(false);
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [feeBranch, setFeeBranch] = useState('');
  const [kidsList, setKidsList] = useState([]);
  const [feeInputs, setFeeInputs] = useState({});
  const [showAttendanceExport, setShowAttendanceExport] = useState(false);
  const [exportDate, setExportDate] = useState(new Date().toISOString().slice(0, 10));
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportType, setExportType] = useState('daily');
  const [exportData, setExportData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [timetables, setTimetables] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  
  // Timetable form states
  const [timetableTitle, setTimetableTitle] = useState('');
  const [timetableDesc, setTimetableDesc] = useState('');
  const [timetableDate, setTimetableDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timetableBranch, setTimetableBranch] = useState(''); // Empty for "All Branches"

  // Add state for income/expense filter

  // Timetable Management State
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedTimetableDay, setSelectedTimetableDay] = useState(daysOfWeek[0]);
  const [periods, setPeriods] = useState([]); // periods for selected day
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null); // {id, start, end, desc}
  const [periodTime, setPeriodTime] = useState({ start: new Date(), end: new Date() });
  const [periodDesc, setPeriodDesc] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [loadingActivities, setLoadingActivities] = useState(true);

  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [loadingMonthlyIncome, setLoadingMonthlyIncome] = useState(false);
  // Add state for recent transactions and loading
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [reportBranch, setReportBranch] = useState('');
  const [reportStaff, setReportStaff] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [showReportDatePicker, setShowReportDatePicker] = useState(false);
  const [staffReports, setStaffReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Add state for periodDay and periodBranch near other modal states
  const [periodDay, setPeriodDay] = useState(daysOfWeek[0]);
  const [periodBranch, setPeriodBranch] = useState(branches.length > 0 ? branches[0].name : 'ALL');

  // 1. Add state for master settings modal and new version info
  const [showMasterSettings, setShowMasterSettings] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [newVersionNumber, setNewVersionNumber] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [newVersionChangelog, setNewVersionChangelog] = useState('');
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [latestVersionInfo, setLatestVersionInfo] = useState(null);
  const [appFiles, setAppFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Chat Modal State
  const [isChatModalVisible, setChatModalVisible] = useState(false);
  const [chatView, setChatView] = useState('list'); // 'list' or 'chat'
  const [selectedUser, setSelectedUser] = useState(null);

  // Add Expense Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseFranchisee, setExpenseFranchisee] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // State for income/expense trend graph
  const [selectedTrendBranch, setSelectedTrendBranch] = useState('');
  const [trendData, setTrendData] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [filterType, setFilterType] = useState('day'); // 'day', 'month', 'range'
  const [incomeExpenseDate, setIncomeExpenseDate] = useState(new Date());
  const [showIncomeExpenseDatePicker, setShowIncomeExpenseDatePicker] = useState(false);
  const [incomeExpenseMonth, setIncomeExpenseMonth] = useState(new Date().getMonth() + 1);
  const [incomeExpenseYear, setIncomeExpenseYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });

  const fetchTrendData = (branch, type = filterType, date = incomeExpenseDate, month = incomeExpenseMonth, year = incomeExpenseYear, range = dateRange) => {
    if (!branch) return;
    setTrendLoading(true);
    let url = `${BASE_URL}/get_income_trend.php?branch=${encodeURIComponent(branch)}`;

    if (type === 'day') {
      url += `&group_by=day&date=${date.toISOString().slice(0, 10)}`;
    } else if (type === 'month') {
      url += `&group_by=month&month=${month}&year=${year}`;
    } else if (type === 'range') {
      url += `&group_by=day&start_date=${range.start.toISOString().slice(0, 10)}&end_date=${range.end.toISOString().slice(0, 10)}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTrendData(data.trend || []);
        } else {
          setTrendData([]);
        }
        setTrendLoading(false);
      })
      .catch(() => {
        setTrendData([]);
        setTrendLoading(false);
      });
  };

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

  const handleDownloadCSV = async () => {
    let csv = 'Date,Type,Amount,Description\n';
    trendData.forEach(row => {
      csv += `${row.day || row.date},${row.type || ''},${row.amount || row.total_income || row.total_expense},${row.description || ''}\n`;
    });
    const fileUri = FileSystem.cacheDirectory + 'income_expense.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Download Income/Expense CSV' });
  };

  const handleAttendanceExport = async () => {
    try {
      setExportLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      
      let url = `${BASE_URL}/export_attendance.php?user_id=${userId}&export_type=${exportType}`;
      
      if (exportType === 'daily') {
        url += `&date=${exportDate}`;
      } else {
        url += `&month=${exportMonth}&year=${exportYear}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setExportData(data);
        
        // Create CSV content
        let csv = 'Branch,Student Name,Parent Name,Class,Status,In Time,Out Time,Method,Date\n';
        
        Object.keys(data.data).forEach(branch => {
          data.data[branch].forEach(record => {
            csv += `${branch},${record.childName || ''},${record.parent_name || ''},${record.childClass || ''},${record.status || ''},${record.in_time || ''},${record.out_time || ''},${record.method || ''},${record.date || ''}\n`;
          });
        });
        
        const fileUri = FileSystem.cacheDirectory + `attendance_${exportType}_${exportDate || `${exportYear}-${exportMonth}`}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Download Attendance CSV' });
        
        Alert.alert('Success', 'Attendance data exported successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to export attendance');
      }
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('Error', 'Failed to export attendance data');
    } finally {
      setExportLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get_recent_activities.php`);
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.log('Error fetching activities:', error);
    }
  };

  // Fetch branches and users
  const fetchBranches = () => {
    setLoadingBranches(true);
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => res.json())
      .then(data => {
        console.log('Branches response:', data); // Debug log
        if (data.success) setBranches(data.branches);
        setLoadingBranches(false);
      })
      .catch((err) => {
        console.log('Branches fetch error:', err); // Debug log
        setLoadingBranches(false);
      });
  };
  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch(`${BASE_URL}/get_users.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
          console.log('Fetched users:', data.users);
        }
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  };


  useEffect(() => {
    fetchBranches();
    fetchUsers();
    fetchActivities();
    fetch(`${BASE_URL}/get_total_income.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTotalIncome(data.total_income || 0);
      });
    // Fetch trend for the first branch by default
    if (branches.length > 0 && !selectedTrendBranch) {
      const defaultBranch = branches[0].name;
      setSelectedTrendBranch(defaultBranch);
      fetchTrendData(defaultBranch);
    }
    fetchLiveAlerts();
    fetchTimetables();

    // Set up a timer to refresh alerts every 30 seconds
    const alertInterval = setInterval(fetchLiveAlerts, 30000);
    return () => clearInterval(alertInterval);
  }, []);



  useEffect(() => {
    // Fetch this month's overall income for all branches
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    setLoadingMonthlyIncome(true);
    fetch(`${BASE_URL}/get_income_trend.php?group_by=month&month=${month}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.trend)) {
          const found = data.trend.find(row => Number(row.month) === month && Number(row.year) === year);
          setMonthlyIncome(found ? Number(found.total_income) : 0);
        } else {
          setMonthlyIncome(0);
        }
        setLoadingMonthlyIncome(false);
      })
      .catch(() => {
        setMonthlyIncome(0);
        setLoadingMonthlyIncome(false);
      });
  }, []);


  // 2. Update createBranch to show confirmation dialog and success color indicator

  // 4. Update deleteBranch to show confirmation dialog

  // 5. Update createUser to show confirmation dialog and color indicator
  const createUser = () => {
    if (!userName || !userRole || !userBranch || !userEmail || !userMobile || !userPassword) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setCreatingUser(true);
    fetch(`${BASE_URL}/create_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userName,
        role: userRole,
        branch: userBranch,
        email: userEmail,
        mobile: userMobile,
        password: userPassword,
        share: userShare, // Add share to the body
      }),
    })
      .then(res => res.json())
      .then(data => {
        setCreatingUser(false);
        console.log('Create user response:', data); // Debug log
        if (data.success) {
          setUserName('');
          setUserRole('Teacher');
          setUserBranch('');
          setUserEmail('');
          setUserMobile('');
          setUserPassword('');
          setUserShare(''); // Clear share after creation
          setSuccessMessage('User created successfully!');
          setSuccessColor('#4caf50');
          fetchUsers();
          setShowCreateForms(false); // Hide form after creation
          setTimeout(() => setSuccessMessage(''), 2000);
        } else {
          Alert.alert('Error', data.message || 'Failed to create user');
        }
      })
      .catch((err) => {
        setCreatingUser(false);
        Alert.alert('Error', 'Network or server error');
        console.log('Create user error:', err);
      });
  };

  // Only one form/CRUD/camera view visible at a time
  const handleShowCreateForms = () => {
    setShowCreateForms(v => !v);
    if (!showCreateForms) {
      setShowBranchCrud(false);
      setShowCameras(false);
    }
  };
  const handleShowCameras = () => {
    setShowCameras(v => !v);
    if (!showCameras) {
      setShowBranchCrud(false);
      setShowCreateForms(false);
    }
  };

  const startEditCameraUrl = (branch) => {
    setEditCameraBranchId(branch.id);
    setEditCameraUrl(branch.camera_url || '');
  };
  const saveEditCameraUrl = () => {
    Alert.alert(
      'Confirm',
      'Save camera URL for this branch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            fetch(`${BASE_URL}/edit_camera_url.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: editCameraBranchId, camera_url: editCameraUrl }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setEditCameraBranchId(null);
                  setEditCameraUrl('');
                  setSuccessMessage('Camera URL updated!');
                  setSuccessColor('#2196f3');
                  fetchBranches();
                  setTimeout(() => setSuccessMessage(''), 2000);
                } else {
                  Alert.alert('Error', data.message || 'Failed to update camera URL');
                }
              });
          },
        },
      ]
    );
  };

  // Calculate stats
  const totalBranches = branches.length;
  const totalFranchisees = users.filter(u => u.role === 'Franchisee').length;
  const totalStudents = users.filter(u => u.role === 'Parent').length;

  // Attendance fetch logic
  const fetchAttendance = (branch, date = attendanceDate) => {
    setAttendanceLoading(true);
    console.log('Fetching attendance for branch:', branch, 'date:', date);
    fetch(`${BASE_URL}/get_attendance.php?branch=${encodeURIComponent(branch)}&date=${date}`)
      .then(res => res.json())
      .then(data => {
        console.log('Attendance API response:', data);
        setAttendanceList(data.attendance || []);
        setAttendanceLoading(false);
      })
      .catch((err) => {
        console.log('Attendance fetch error:', err);
        setAttendanceList([]);
        setAttendanceLoading(false);
        Alert.alert('Error', 'Failed to fetch attendance.');
      });
  };

  // Fee fetch logic (placeholder)
  const fetchKidsForFees = (branch) => {
    setFeeLoading(true);
    // TODO: Replace with real API call
    setTimeout(() => {
      setKidsList([
        { id: 1, name: 'Kid 1', fee_due: '500' },
        { id: 2, name: 'Kid 2', fee_due: '700' },
      ]);
      setFeeInputs({ 1: '500', 2: '700' });
      setFeeLoading(false);
    }, 1000);
  };

  const handleViewAttendance = (branch) => {
    const branchToFetch = branch || (branches.length > 0 ? branches[0].name : '');
    if (branchToFetch) {
      fetchAttendance(branchToFetch, attendanceDate);
      setAttendanceModalVisible(true); // Show modal after fetching
      // also refresh timetables for this branch
      fetchTimetables(branchToFetch);
    } else {
      Alert.alert('Error', 'No branch selected or available.');
    }
  };

  const fetchLiveAlerts = () => {
    setAlertsLoading(true);
    fetch(`${BASE_URL}/get_live_alerts.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLiveAlerts(data.alerts || []);
        }
      })
      .catch(err => console.log('Error fetching alerts:', err))
      .finally(() => setAlertsLoading(false));
  };

  const fetchTimetables = (branch = '') => {
    setTimetableLoading(true);
    let url = `${BASE_URL}/get_timetable.php`;
    if (branch) {
      url += `?branch=${encodeURIComponent(branch)}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTimetables(data.timetables || []);
        }
      })
      .catch(err => console.log('Error fetching timetables:', err))
      .finally(() => setTimetableLoading(false));
  };
  
  const handleCreateTimetable = async () => {
    if (!timetableTitle || !timetableDate) {
      Alert.alert('Error', 'Title and date are required for the timetable.');
      return;
    }
    const userId = await AsyncStorage.getItem('userId');
    const timetableData = {
      title: timetableTitle,
      description: timetableDesc,
      date: timetableDate.toISOString().split('T')[0],
      time: timetableDate.toLocaleTimeString(),
      branch: timetableBranch || null, // Send null if "All Branches"
      created_by: userId,
    };

    fetch(`${BASE_URL}/create_timetable.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timetableData),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Alert.alert('Success', 'Timetable created successfully!');
        // Reset form and refresh list
        setTimetableTitle('');
        setTimetableDesc('');
        setShowTimetableForm(false);
        fetchTimetables(selectedBranch);
      } else {
        Alert.alert('Error', data.message || 'Failed to create timetable.');
      }
    })
    .catch(err => Alert.alert('Error', 'Network error while creating timetable.'));
  };

  const renderAlertIcon = (type) => {
    switch (type) {
      case 'attendance':
        return <MaterialIcons name="check-circle" size={18} color="#4caf50" />;
      case 'new_admission':
        return <FontAwesome5 name="user-plus" size={16} color="#2196f3" />;
      case 'fee_payment':
        return <FontAwesome5 name="rupee-sign" size={18} color="#ff9800" />;
      default:
        return <Ionicons name="notifications" size={18} color="#888" />;
    }
  };

  const quickActions = [
    {
      id: 'manage-staff',
      gradientColors: ['#ff9a9e', '#fad0c4'],
      icon: <Ionicons name="people-outline" color="#fff" />,
      label: 'Manage Staff',
      onPress: () => navigation.navigate('ManageStaff'),
    },
    {
      id: 'manage-students',
      gradientColors: ['#a18cd1', '#fbc2eb'],
      icon: <Ionicons name="school-outline" color="#fff" />,
      label: 'Manage Students',
      onPress: () => navigation.navigate('ManageStudents'),
    },
    {
      id: 'view-cameras',
      gradientColors: ['#84fab0', '#8fd3f4'],
      icon: <Ionicons name="camera-outline" color="#fff" />,
      label: 'View All Cameras',
      onPress: () => navigation.navigate('AllCameras'),
    },
    {
      id: 'virtual-id',
      gradientColors: ['#fccb90', '#d57eeb'],
      icon: <Ionicons name="card-outline" color="#fff" />,
      label: 'Virtual ID Card',
      onPress: () => navigation.navigate('VirtualIDCard'),
    },
    {
      id: 'chat-franchisees',
      gradientColors: ['#00c6ff', '#0072ff'],
      icon: <Ionicons name="chatbubble-ellipses-outline" color="#fff" />,
      label: 'Chat with Franchisees',
      onPress: () => setChatModalVisible(true),
    },
    {
      id: 'homework',
      gradientColors: ['#ffecd2', '#fcb69f'],
      icon: <Ionicons name="document-text-outline" color="#fff" />,
      label: 'Homework',
      onPress: () => navigation.navigate('HomeworkScreen'),
    },
    {
      id: 'attendance',
      gradientColors: ['#ff9a9e', '#fecfef'],
      icon: <Ionicons name="calendar-outline" color="#fff" />,
      label: 'Attendance',
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
  ];

  // Fetch periods for selected day
  useEffect(() => {
    setLoadingPeriods(true);
    fetch(`${BASE_URL}/get_timetable_periods.php?day=${selectedTimetableDay}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.periods)) setPeriods(data.periods);
        else setPeriods([]);
        setLoadingPeriods(false);
      })
      .catch(() => { setPeriods([]); setLoadingPeriods(false); });
  }, [selectedTimetableDay]);

  // Add or edit period
  const handleSavePeriod = () => {
    if (!periodDesc) { Alert.alert('Error', 'Description required'); return; }
    const payload = {
      id: editingPeriod?.id,
      day: selectedTimetableDay,
      start: periodTime.start.toTimeString().slice(0,5),
      end: periodTime.end.toTimeString().slice(0,5),
      description: periodDesc,
    };
    fetch(`${BASE_URL}/set_timetable.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowPeriodModal(false);
          setEditingPeriod(null);
          setPeriodDesc('');
          setPeriodTime({ start: new Date(), end: new Date() });
          // Refresh periods
          fetch(`${BASE_URL}/get_timetable_periods.php?day=${selectedTimetableDay}`)
            .then(res => res.json())
            .then(data => setPeriods(data.success ? data.periods : []));
        } else {
          Alert.alert('Error', data.message || 'Failed to save period');
        }
      });
  };
  // Delete period
  const handleDeletePeriod = (id) => {
    fetch(`${BASE_URL}/set_timetable.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delete: true }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPeriods(periods.filter(p => p.id !== id));
        } else {
          Alert.alert('Error', data.message || 'Failed to delete period');
        }
      });
  };

  useEffect(() => {
    // Fetch all activities for administration (all branches)
    setLoadingActivities(true);
    fetch(`${BASE_URL}/get_activities.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activities) setActivities(data.activities);
        else setActivities([]);
        setLoadingActivities(false);
      })
      .catch(() => { setActivities([]); setLoadingActivities(false); });
  }, []);

  // Add this function to handle adding income as administration
  const handleAddExpense = async () => {
    if (!expenseFranchisee || !expenseAmount || !expenseDesc) {
      Alert.alert('Error', 'Please select a franchisee and fill all fields.');
      return;
    }
    setSubmittingExpense(true);
    try {
      const res = await fetch(`${BASE_URL}/create_income.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: expenseAmount,
          desc: expenseDesc,
          type: 'expense',
          branch: expenseFranchisee,
          date: new Date().toISOString().slice(0, 10),
          created_by_role: 'Administration',
          role: 'Franchisee',
          status: 'pending',
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'Expense added and pending franchisee approval.');
        setShowAddExpenseModal(false);
        setExpenseAmount('');
        setExpenseDesc('');
        setExpenseFranchisee('');
      } else {
        Alert.alert('Error', data.message || 'Failed to add expense.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network or server error');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const addIncome = async ({ amount, desc, type, branch }) => {
    try {
      const res = await fetch(`${BASE_URL}/create_income.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          desc,
          type, // 'income' or 'expense'
          branch,
          date: new Date().toISOString().slice(0, 10),
          created_by_role: 'Administration', // Mark as added by franchisor
          role: 'Franchisee',         // Franchisee must approve
          status: 'pending',
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'Income added and pending franchisee approval.');
        // Optionally refresh income list or UI here
      } else {
        Alert.alert('Error', data.message || 'Failed to add income.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network or server error');
    }
  };

  // Fetch recent transactions for the selected branch
  useEffect(() => {
    if (!selectedTrendBranch) return;
    setLoadingTransactions(true);
    fetch(`${BASE_URL}/get_income.php?branch=${encodeURIComponent(selectedTrendBranch)}&limit=5`)
      .then(res => res.json())
      .then(data => {
        setRecentTransactions(data.records ? data.records.slice(0, 5) : []);
        setLoadingTransactions(false);
      })
      .catch(() => {
        setRecentTransactions([]);
        setLoadingTransactions(false);
      });
  }, [selectedTrendBranch]);

  // Refetch trend data when filters change
  useEffect(() => {
    fetchTrendData(selectedTrendBranch, filterType, incomeExpenseDate, incomeExpenseMonth, incomeExpenseYear, dateRange);
  }, [filterType, incomeExpenseDate, incomeExpenseMonth, incomeExpenseYear, dateRange, selectedTrendBranch]);

  // --- Download ID Card Handler ---
  const handleDownloadIdCard = async (studentId) => {
    try {
      const res = await fetch(`${BASE_URL}/get_id_card.php?student_id=${studentId}`);
      const data = await res.json();
      if (data.success && data.file_path) {
        const fileUrl = BASE_URL + '/' + data.file_path;
        const fileName = data.file_path.split('/').pop() || 'id_card.jpg';
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.downloadAsync(fileUrl, fileUri);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { dialogTitle: 'Share or Save ID Card' });
        } else {
          Alert.alert('Downloaded', 'ID Card saved to your device.');
        }
      } else {
        Alert.alert('Not Found', data.message || 'ID Card not found for this student.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to download ID Card.');
    }
  };

  const fetchStaffReports = () => {
    setLoadingReports(true);
    let url = `${BASE_URL}/get_staff_reports.php?`;
    if (reportBranch) url += `branch=${encodeURIComponent(reportBranch)}&`;
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
    if (branches.length && users.length) fetchStaffReports();
  }, [reportBranch, reportStaff, reportDate, branches.length, users.length]);

  // Add file picker handler
  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      console.log('DocumentPicker result:', res);
      alert('Picker result: ' + JSON.stringify(res));
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setNewVersionFile(file);
        alert('File picked: ' + file.name);
      } else {
        alert('File picking cancelled or failed.');
      }
    } catch (e) {
      alert('File selection failed: ' + e.message);
    }
  };

  // Add upload handler
  const handleUploadVersion = async () => {
    if (uploading) return; // Prevent double upload
    if (!newVersionTitle || !newVersionNumber || !newVersionDescription || !newVersionChangelog || !newVersionFile) {
      alert('Please fill all fields and select a file.');
      return;
    }
    setUploading(true);
    try {
      console.log('Uploading file:', newVersionFile);
      const formData = new FormData();
      formData.append('title', newVersionTitle);
      formData.append('version', newVersionNumber);
      formData.append('description', newVersionDescription);
      formData.append('changelog', newVersionChangelog);
      formData.append('file', {
        uri: newVersionFile.uri,
        name: newVersionFile.name,
        type: newVersionFile.mimeType || 'application/octet-stream',
      });
      const response = await fetch(`${BASE_URL}/upload_app_version.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
      const data = await response.json();
      console.log('Upload response:', data);
      if (data.success) {
        alert('Version uploaded successfully!');
        setShowMasterSettings(false);
        setNewVersionTitle('');
        setNewVersionNumber('');
        setNewVersionDescription('');
        setNewVersionChangelog('');
        setNewVersionFile(null);
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const fetchAppFiles = async () => {
    try {
      const res = await fetch(`${BASE_URL}/list_app_versions.php`);
      const data = await res.json();
      setAppFiles(data.files || []);
    } catch (e) {
      setAppFiles([]);
    }
  };
  useEffect(() => {
    if (showMasterSettings) fetchAppFiles();
  }, [showMasterSettings]);

  const handleDeleteAppFile = async (file) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    const formData = new FormData();
    formData.append('file', file.name);
    const res = await fetch(`${BASE_URL}/delete_app_version.php`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      alert('File deleted');
      fetchAppFiles();
    } else {
      alert(data.message || 'Delete failed');
    }
  };

  const handlePushForDownload = async (file) => {
    const version = prompt('Enter version for this file:', '');
    if (!version) return;
    const title = prompt('Enter title:', '');
    const description = prompt('Enter description:', '');
    const changelog = prompt('Enter changelog:', '');
    const formData = new FormData();
    formData.append('file', file.name);
    formData.append('version', version);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('changelog', changelog);
    const res = await fetch(`${BASE_URL}/set_latest_version.php`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      alert('Set as latest version!');
      fetchAppFiles();
    } else {
      alert(data.message || 'Failed to set as latest');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {successMessage ? (
          <View style={{ backgroundColor: successColor, padding: 10, borderRadius: 8, marginBottom: 10 }}>
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>{successMessage}</Text>
          </View>
        ) : null}
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image source={administrationProfile.profilePic} style={styles.profilePic} />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{administrationProfile.name}</Text>
            <Text style={styles.profileRole}>{administrationProfile.role}</Text>
            <Text style={styles.profileLocation}>{administrationProfile.location}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={() => handleLogout(navigation)}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        {/* Top Section: Overall Income full-width, other three in a row below */}
        <SummaryCard
          gradientColors={['#00c6ff', '#0072ff']}
          icon={<MaterialIcons name="currency-rupee" size={28} color="#fff" />}
          label={<Text style={{color:'#fff', fontWeight:'bold', fontSize:15}}>This Month's Income</Text>}
          value={loadingMonthlyIncome ? 'Loading...' : `₹${monthlyIncome}`}
          style={{marginBottom: 16, width: '100%'}}
        />
        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 16}}>
          <SummaryCard
            gradientColors={['#43cea2', '#185a9d']}
            icon={<MaterialIcons name="location-city" size={28} color="#fff" />}
            label="Total Branches"
            value={totalBranches}
            style={{flex: 1, margin: 6}}
          />
          <SummaryCard
            gradientColors={['#f7971e', '#ffd200']}
            icon={<FontAwesome5 name="user-graduate" size={28} color="#fff" />}
            label="Total Students"
            value={totalStudents}
            style={{flex: 1, margin: 6}}
          />
          <SummaryCard
            gradientColors={['#f953c6', '#b91d73']}
            icon={<FontAwesome5 name="users" size={28} color="#fff" />}
            label="Total Franchisees"
            value={totalFranchisees}
            style={{flex: 1, margin: 6}}
          />
        </View>

        {/* Sliding Activity Screen */}
        <SlidingActivityScreen 
          activities={activities} 
          title="Recent Activities" 
          showDownload={true}
        />

        {/* Franchisee Expense Submission - Large Button Below Grid */}
       {/* <View style={{width: '100%', alignItems: 'center', marginBottom: 24}}>
          <Text style={{fontWeight:'bold', marginBottom: 4}}>Select Franchisee to Submit Expense:</Text>
          <Picker
            selectedValue={selectedFranchisee}
            onValueChange={value => setSelectedFranchisee(value)}
            style={{width:'100%', height: 48, borderWidth: 2, borderColor: 'green', backgroundColor: '#fff', marginBottom: 12}}
          >
            <Picker.Item label="Select Franchisee" value="" />
            {users.filter(u => (u.role || '').toLowerCase() === 'franchisee').length === 0 ? (
              <Picker.Item label="No franchisees available" value="" />
            ) : (
              users.filter(u => (u.role || '').toLowerCase() === 'franchisee').map(fr => (
                <Picker.Item key={fr.id} label={`${fr.name} (${fr.branch})`} value={fr.id.toString()} />
              ))
            )}
          </Picker>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 32,
              paddingVertical: 14,
              paddingHorizontal: 28,
              shadowColor: '#a6c1ee',
              shadowOpacity: 0.18,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
              opacity: selectedFranchisee ? 1 : 0.5,
              minWidth: 180,
              justifyContent: 'center',
            }}
            disabled={!selectedFranchisee}
            onPress={() => {
              const franchisee = users.find(u => u.id.toString() === selectedFranchisee);
              navigation.navigate('IncomeExpense', {
                role: 'Administration',
                branch: franchisee ? franchisee.branch : '',
                franchiseeName: franchisee ? franchisee.name : '',
                franchiseeId: franchisee ? franchisee.id : '',
                fromAdministration: true,
              });
            }}
          >
            <LinearGradient
              colors={selectedFranchisee ? ['#fbc2eb', '#a6c1ee'] : ['#eee', '#eee']}
              start={[0.1, 0.1]}
              end={[0.9, 0.9]}
              style={{ borderRadius: 32, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{color: '#fff', fontWeight: 'bold'}}>Submit Expense</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>*/}
        
        {/* Graph Placeholder */}
        <View style={styles.graphSection}>
          <Text style={styles.graphTitle}>Income/Expense Trend per Branch</Text>
          <View style={{marginBottom: 8}}>
            <Picker
              selectedValue={selectedTrendBranch}
              onValueChange={setSelectedTrendBranch}
              style={{backgroundColor:'#f5f7fa', borderRadius:8, borderWidth:1, borderColor:'#eee'}}>
              {branches.map(b => (
                <Picker.Item key={b.id} label={b.name} value={b.name} />
              ))}
            </Picker>
          </View>
          {trendLoading ? (
            <ActivityIndicator size="small" color="#009688" />
          ) : !Array.isArray(trendData) || trendData.length === 0 || trendData.some(d => isNaN(Number(d.total_income)) || isNaN(Number(d.total_expense))) ? (
            <View style={styles.graphPlaceholder}><Text>No valid data</Text></View>
          ) : (
            <>
              <LineChart
                data={{
                  labels: trendData.map(d => d.day || d.month.toString()),
                  datasets: [
                    {
                      data: trendData.map(d => Number(d.total_income) || 0),
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // green
                      strokeWidth: 2,
                    },
                    {
                      data: trendData.map(d => Number(d.total_expense) || 0),
                      color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // red
                      strokeWidth: 2,
                    },
                  ],
                  legend: ['Income', 'Expense'],
                }}
                width={Dimensions.get('window').width - 48} // from react-native
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#a084ca',
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
              <View style={{backgroundColor:'#fff', borderRadius:12, padding:12, marginTop:8}}>
              <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
                <TouchableOpacity style={[styles.createButton, {marginRight:8, backgroundColor: filterType==='day' ? '#a084ca' : '#FFD700'}]} onPress={() => setFilterType('day')}><Text style={styles.createButtonText}>Day</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.createButton, {marginRight:8, backgroundColor: filterType==='month' ? '#a084ca' : '#FFD700'}]} onPress={() => setFilterType('month')}><Text style={styles.createButtonText}>Month</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.createButton, {backgroundColor: filterType==='range' ? '#a084ca' : '#FFD700'}]} onPress={() => setFilterType('range')}><Text style={styles.createButtonText}>Range</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.createButton, {marginLeft:'auto', backgroundColor:'#4caf50'}]} onPress={handleDownloadCSV}>
                  <FontAwesome5 name="download" size={16} color="#fff" />
                  <Text style={[styles.createButtonText, {color:'#fff', marginLeft:4}]}>Download CSV</Text>
                </TouchableOpacity>
              </View>
              {/* Filter Pickers */}
              {filterType === 'day' && (
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowIncomeExpenseDatePicker(true)}>
                  <MaterialIcons name="date-range" size={22} color="#1a237e" />
                  <Text style={styles.dateText}>{incomeExpenseDate.toISOString().slice(0,10)}</Text>
                </TouchableOpacity>
              )}
              {showIncomeExpenseDatePicker && (
                <DateTimePicker
                  value={incomeExpenseDate}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowIncomeExpenseDatePicker(false);
                    if (d) setIncomeExpenseDate(d);
                  }}
                />
              )}
              {filterType === 'month' && (
                <View style={{flexDirection:'row', alignItems:'center', marginTop:8}}>
                  <Picker
                    selectedValue={incomeExpenseMonth}
                    style={{flex:1}}
                    onValueChange={setIncomeExpenseMonth}>
                    {[...Array(12)].map((_,i) => (
                      <Picker.Item key={i+1} label={`Month ${i+1}`} value={i+1} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={incomeExpenseYear}
                    style={{flex:1}}
                    onValueChange={setIncomeExpenseYear}>
                    {[...Array(5)].map((_,i) => (
                      <Picker.Item key={i} label={`${incomeExpenseYear-2+i}`} value={incomeExpenseYear-2+i} />
                    ))}
                  </Picker>
                </View>
              )}
              {filterType === 'range' && (
                <View style={{flexDirection:'row', alignItems:'center', marginTop:8}}>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => setShowIncomeExpenseDatePicker('start')}>
                    <MaterialIcons name="date-range" size={22} color="#1a237e" />
                    <Text style={styles.dateText}>Start: {dateRange.start.toISOString().slice(0,10)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => setShowIncomeExpenseDatePicker('end')}>
                    <MaterialIcons name="date-range" size={22} color="#1a237e" />
                    <Text style={styles.dateText}>End: {dateRange.end.toISOString().slice(0,10)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            </>
          )}
        </View>
        {/* Camera View Section - Only show if toggled */}
        {showCameras && (
          <View style={{marginVertical: 16}}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#1a237e'}}>All Branch Cameras</Text>
            {cameraBranches.map((branch, idx) => (
              <View key={branch.id || idx} style={styles.cameraCard}>
                <Text style={styles.cameraBranch}>{branch.name}</Text>
                <WebView
                  style={styles.cameraWebview}
                  source={{ uri: branch.stream_url }}
                  allowsFullscreenVideo
                />
                <TouchableOpacity
                  style={styles.cameraReportButton}
                  onPress={() => {
                    Alert.alert('Report Issue', `Report camera issue for ${branch.name}`);
                  }}
                >
                  <Text style={styles.cameraReportText}>Report Issue</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {/* Attendance List Section */}
        {/* Removed Attendance List Section */}
        {/* Assign/Update Fees Section */}
        {/* Removed Assign/Update Fees Section */}
        {/* Attendance List Modal */}
        <Modal
          visible={attendanceModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAttendanceModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#4b2996', marginBottom: 16, textAlign: 'center' }}>Attendance List</Text>
              
              {/* Branch and Date Selector */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', color: '#4b2996', marginBottom: 8 }}>Select Branch:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {branches.map(branch => (
                    <TouchableOpacity
                      key={branch.id || branch.name}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: selectedBranch === branch.name ? '#4b2996' : '#f0f0f0',
                        borderWidth: 1,
                        borderColor: selectedBranch === branch.name ? '#4b2996' : '#ddd'
                      }}
                      onPress={() => {
                        setSelectedBranch(branch.name);
                        handleViewAttendance(branch.name);
                      }}
                    >
                      <Text style={{
                        color: selectedBranch === branch.name ? '#fff' : '#333',
                        fontWeight: selectedBranch === branch.name ? 'bold' : 'normal',
                        fontSize: 12
                      }}>
                        {branch.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={{ fontWeight: 'bold', color: '#4b2996', marginBottom: 8 }}>Select Date:</Text>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: '#f0f0f0',
                    borderWidth: 1,
                    borderColor: '#ddd',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onPress={() => setShowAttendanceDatePicker(true)}
                >
                  <Text style={{ color: '#333' }}>{attendanceDate}</Text>
                  <MaterialIcons name="calendar-today" size={20} color="#4b2996" />
                </TouchableOpacity>
              </View>
              {attendanceLoading ? (
                <ActivityIndicator size="large" color="#a084ca" />
              ) : attendanceList.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#888' }}>No attendance records found for today.</Text>
              ) : (
                <FlatList
                  data={attendanceList}
                  keyExtractor={(item, idx) => item.id ? String(item.id) : String(idx)}
                  renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 }}>
                      <View style={{ flex: 2 }}>
                        <Text style={{ fontWeight: 'bold', color: '#4b2996' }}>{item.childName || item.name || 'N/A'}</Text>
                        <Text style={{ color: '#888', fontSize: 13 }}>{item.branch || 'N/A'}</Text>
                      </View>
                      <View style={{ flex: 3, alignItems: 'center' }}>
                        <Text style={{ color: '#333', fontSize: 13 }}>In: {item.in_time || '-'}</Text>
                        <Text style={{ color: '#333', fontSize: 13 }}>Out: {item.out_time || '-'}</Text>
                        <Text style={{ color: item.status === 'present' ? '#4caf50' : item.status === 'absent' ? '#e74c3c' : '#f39c12', fontWeight: 'bold' }}>{item.status || 'N/A'}</Text>
                      </View>
                    </View>
                  )}
                  style={{ maxHeight: 350 }}
                />
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity 
                  style={{ flex: 1, backgroundColor: '#4caf50', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} 
                  onPress={() => setShowAttendanceExport(true)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Export</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, backgroundColor: '#a084ca', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} 
                  onPress={() => setAttendanceModalVisible(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Attendance Date Picker */}
        {showAttendanceDatePicker && (
          <DateTimePicker
            value={new Date(attendanceDate)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowAttendanceDatePicker(false);
              if (selectedDate) {
                const newDate = selectedDate.toISOString().slice(0, 10);
                setAttendanceDate(newDate);
                if (selectedBranch) {
                  fetchAttendance(selectedBranch, newDate);
                }
              }
            }}
          />
        )}

        {/* Attendance Export Modal */}
        <Modal
          visible={showAttendanceExport}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAttendanceExport(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#4b2996', marginBottom: 16, textAlign: 'center' }}>Export Attendance</Text>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Export Type:</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[
                      { padding: 10, borderRadius: 8, borderWidth: 1, flex: 1 },
                      exportType === 'daily' ? { backgroundColor: '#4caf50', borderColor: '#4caf50' } : { backgroundColor: '#f0f0f0', borderColor: '#ddd' }
                    ]}
                    onPress={() => setExportType('daily')}
                  >
                    <Text style={[{ textAlign: 'center', fontWeight: 'bold' }, exportType === 'daily' ? { color: '#fff' } : { color: '#333' }]}>Daily</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      { padding: 10, borderRadius: 8, borderWidth: 1, flex: 1 },
                      exportType === 'monthly' ? { backgroundColor: '#4caf50', borderColor: '#4caf50' } : { backgroundColor: '#f0f0f0', borderColor: '#ddd' }
                    ]}
                    onPress={() => setExportType('monthly')}
                  >
                    <Text style={[{ textAlign: 'center', fontWeight: 'bold' }, exportType === 'monthly' ? { color: '#fff' } : { color: '#333' }]}>Monthly</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {exportType === 'daily' ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Date:</Text>
                  <TouchableOpacity
                    style={{ padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    onPress={() => {
                      // Show date picker
                      const picker = DateTimePicker.open({
                        value: new Date(exportDate),
                        mode: 'date',
                        onChange: (event, date) => {
                          if (date) setExportDate(date.toISOString().slice(0, 10));
                        }
                      });
                    }}
                  >
                    <Text>{exportDate}</Text>
                    <MaterialIcons name="calendar-today" size={20} color="#4b2996" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Month & Year:</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ marginBottom: 4 }}>Month:</Text>
                      <Picker
                        selectedValue={exportMonth}
                        onValueChange={(value) => setExportMonth(value)}
                        style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                      >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                          <Picker.Item key={month} label={month.toString()} value={month} />
                        ))}
                      </Picker>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ marginBottom: 4 }}>Year:</Text>
                      <Picker
                        selectedValue={exportYear}
                        onValueChange={(value) => setExportYear(value)}
                        style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                      >
                        {[2023, 2024, 2025].map(year => (
                          <Picker.Item key={year} label={year.toString()} value={year} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#4caf50', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                  onPress={handleAttendanceExport}
                  disabled={exportLoading}
                >
                  {exportLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Export CSV</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#a084ca', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                  onPress={() => setShowAttendanceExport(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Timetable Management Section */}
        <View style={{backgroundColor:'#fff', borderRadius:12, padding:16, marginVertical:16, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10, elevation:2}}>
          <Text style={{fontWeight:'bold', fontSize:17, marginBottom:10}}>Timetable Management</Text>
          <View style={{flexDirection:'row', justifyContent:'center', marginBottom:12}}>
            {daysOfWeek.map(day => (
              <TouchableOpacity key={day} onPress={() => setSelectedTimetableDay(day)} style={{padding:8, marginHorizontal:4, borderRadius:6, backgroundColor: selectedTimetableDay===day ? '#4F46E5' : '#eee'}}>
                <Text style={{color: selectedTimetableDay===day ? '#fff' : '#333', fontWeight:'bold'}}>{day.slice(0,3)}</Text>
          </TouchableOpacity>
            ))}
          </View>
          {loadingPeriods ? (
            <ActivityIndicator size="small" color="#4F46E5" style={{marginVertical:16}} />
          ) : periods.length === 0 ? (
            <Text style={{color:'#888', textAlign:'center', marginVertical:12}}>No periods for this day.</Text>
          ) : (
            <View>
              {periods.map(period => (
                <View key={period.id} style={{backgroundColor:'#f9f9f9', borderRadius:8, padding:10, marginBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                  <View>
                    <Text style={{fontWeight:'bold', fontSize:15}}>{period.start} - {period.end}</Text>
                    <Text style={{color:'#333'}}>{period.description}</Text>
                  </View>
                  <View style={{flexDirection:'row'}}>
                    <TouchableOpacity onPress={() => { setEditingPeriod(period); setPeriodDesc(period.description); setPeriodTime({ start: new Date(`1970-01-01T${period.start}:00`), end: new Date(`1970-01-01T${period.end}:00`) }); setShowPeriodModal(true); }} style={{marginRight:8}}>
                      <MaterialIcons name="edit" size={20} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePeriod(period.id)}>
                      <MaterialIcons name="delete" size={20} color="#e53935" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity onPress={() => { setEditingPeriod(null); setPeriodDesc(''); setPeriodTime({ start: new Date(), end: new Date() }); setShowPeriodModal(true); }} style={{marginTop:10, backgroundColor:'#4F46E5', borderRadius:8, padding:10, alignItems:'center'}}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>Add Period</Text>
          </TouchableOpacity>
          {/* Period Modal */}
          <Modal visible={showPeriodModal} transparent animationType="slide" onRequestClose={() => setShowPeriodModal(false)}>
            <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center', alignItems:'center'}}>
              <View style={{backgroundColor:'#fff', borderRadius:12, padding:20, width:'90%', maxWidth:400}}>
                <Text style={{fontWeight:'bold', fontSize:16, marginBottom:10}}>{editingPeriod ? 'Edit Period' : 'Add Period'}</Text>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={{marginBottom:8, backgroundColor:'#eee', borderRadius:6, padding:8}}>
                  <Text>Start Time: {periodTime.start.toTimeString().slice(0,5)}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={periodTime.start}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(e, d) => { setShowStartPicker(false); if (d) setPeriodTime(pt => ({...pt, start: d})); }}
                  />
                )}
                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={{marginBottom:8, backgroundColor:'#eee', borderRadius:6, padding:8}}>
                  <Text>End Time: {periodTime.end.toTimeString().slice(0,5)}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={periodTime.end}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(e, d) => { setShowEndPicker(false); if (d) setPeriodTime(pt => ({...pt, end: d})); }}
                  />
                )}
                <Picker
                  selectedValue={periodDay}
                  style={{backgroundColor:'#f9f9f9', borderRadius:6, marginBottom:10}}
                  onValueChange={setPeriodDay}
                >
                  {daysOfWeek.map(day => (
                    <Picker.Item key={day} label={day} value={day} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={periodBranch}
                  style={{backgroundColor:'#f9f9f9', borderRadius:6, marginBottom:10}}
                  onValueChange={setPeriodBranch}
                >
                  <Picker.Item label="All Branches" value="ALL" />
                  {branches.map(branch => (
                    <Picker.Item key={branch.id} label={branch.name} value={branch.name} />
                  ))}
                </Picker>
                <TextInput placeholder="Description" value={periodDesc} onChangeText={setPeriodDesc} style={{backgroundColor:'#f9f9f9', borderRadius:6, padding:8, marginBottom:10}} />
                <View style={{flexDirection:'row', justifyContent:'flex-end'}}>
                  <TouchableOpacity onPress={() => setShowPeriodModal(false)} style={{marginRight:12}}><Text style={{color:'#e53935'}}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleSavePeriod}><Text style={{color:'#4F46E5', fontWeight:'bold'}}>{editingPeriod ? 'Save' : 'Add'}</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
        {/* Transaction History Section */}
        {/* {selectedTrendBranch ? (
          <View style={{backgroundColor:'#fff', borderRadius:12, padding:16, marginVertical:16, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10, elevation:2, minHeight:120}}>
            <Text style={{fontWeight:'bold', fontSize:16, marginBottom:12}}>Recent Transactions ({selectedTrendBranch})</Text>
            {loadingTransactions ? (
              <ActivityIndicator size="small" color="#4F46E5" style={{marginTop:16}} />
            ) : recentTransactions.length === 0 ? (
              <Text style={{color:'#888', textAlign:'center', marginTop:16}}>No transactions found.</Text>
            ) : (
              <View style={{paddingBottom:8}}>
                {recentTransactions.map(item => (
                  <View key={item.id?.toString() || Math.random().toString()} style={{
                    backgroundColor: '#f9f9f9',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 10,
                    borderLeftWidth: 4,
                    borderLeftColor: item.type === 'income' ? '#43cea2' : '#e53935',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 1,
                  }}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                      <Text style={{fontWeight:'bold', color: item.type === 'income' ? '#43cea2' : '#e53935'}}>{item.type === 'income' ? 'Income' : 'Expense'}</Text>
                      <Text style={{fontSize:12, color:'#888'}}>{new Date(item.date.replace(' ', 'T')).toLocaleDateString()}</Text>
                    </View>
                    <Text style={{fontSize:15, fontWeight:'bold', marginVertical:2}}>₹{item.amount}</Text>
                    <Text style={{fontSize:14, color:'#333'}}>{item.description}</Text>
                    <Text style={{fontSize:12, color:'#888', marginTop:2}}>Status: <Text style={{color: item.status === 'approved' ? '#43cea2' : item.status === 'pending' ? '#FFD700' : '#e53935', fontWeight:'bold'}}>{item.status}</Text></Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null} */}
        {/* Button to navigate to Kids Activity Feed screen */}
        <View style={{alignItems: 'center', marginTop: 24, marginBottom: 24}}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('KidsActivityFeed')}
            style={{width: '90%', borderRadius: 16, shadowColor: '#009688', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4}}
          >
            <LinearGradient
              colors={['#43cea2', '#00c6ff']}
              start={[0, 0]}
              end={[1, 1]}
              style={{borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center'}}>
              <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 20, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: {width:0, height:1}, textShadowRadius:2}}>
                View Kids Activity Feed
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddExpenseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddExpenseModal(false)}
      >
        <BlurView intensity={40} tint="light" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <Picker
              selectedValue={expenseFranchisee}
              style={styles.pickerStyle}
              onValueChange={(itemValue) => setExpenseFranchisee(itemValue)}
            >
              <Picker.Item label="Select Franchisee..." value="" />
              {users.filter(u => u.role === 'Franchisee').map(fr => (
                <Picker.Item key={fr.id} label={`${fr.name} (${fr.branch})`} value={fr.branch} />
              ))}
            </Picker>
            <TextInput
              placeholder="Amount"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              style={styles.inputStyle}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Description"
              value={expenseDesc}
              onChangeText={setExpenseDesc}
              style={styles.inputStyle}
            />
            <TouchableOpacity
              style={[styles.buttonStyle, submittingExpense && styles.buttonDisabled]}
              onPress={handleAddExpense}
              disabled={submittingExpense}
            >
              {submittingExpense ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonTextStyle}>Submit Expense</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonStyle, styles.cancelButton]}
              onPress={() => setShowAddExpenseModal(false)}
            >
              <Text style={styles.buttonTextStyle}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isChatModalVisible}
        onRequestClose={() => {
          setChatModalVisible(false);
          setChatView('list');
          setSelectedUser(null);
        }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <ChatContainer
            chatView={chatView}
            setChatView={setChatView}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            closeModal={() => {
              setChatModalVisible(false);
              setChatView('list');
              setSelectedUser(null);
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryCard({ gradientColors, icon, label, value, style }) {
  const scale = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [value]);
  return (
    <Animated.View style={{
      ...style,
      // No minHeight, no height, no flex: 1
    }}>
      <LinearGradient colors={gradientColors} style={{ borderRadius: 18, padding: 0 }}>
        <BlurView intensity={30} tint="light" style={{ borderRadius: 18, padding: 12, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 32, padding: 10, marginBottom: 10, shadowColor: '#fff', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
            {icon}
          </View>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 2, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: {width:0, height:1}, textShadowRadius:2 }}>{label}</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: {width:0, height:2}, textShadowRadius:3 }}>{value}</Text>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}

function QuickActionButton({ gradientColors, icon, label, onPress, isFirst, isLast }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <Animated.View style={{
      width: 96,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: (isLast ? 0 : 10),
      marginLeft: (isFirst ? 0 : 10),
      marginBottom: 14,
      borderRadius: 24,
      backgroundColor: '#fff',
      shadowColor: gradientColors[1],
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ alignItems: 'center' }}
      >
        <LinearGradient
           colors={gradientColors.length > 2 ? gradientColors : [gradientColors[0], gradientColors[1], '#fff']}
           start={[0.1, 0.1]}
           end={[0.9, 0.9]}
           style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
            shadowColor: gradientColors[1],
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.7)',
          }}
        >
           {React.cloneElement(icon, { size: 22 })}
         </LinearGradient>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 12,
            color: '#333',
            textAlign: 'center',
            marginTop: 2,
            letterSpacing: 0.2,
            maxWidth: 80,
            paddingHorizontal: 2,
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Chat Components Start

const ChatListComponent = ({ onUserSelect, role }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/get_users.php?role=${role}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          setError(data.message || 'No users found for this role.');
        }
      })
      .catch(() => setError('Error fetching users.'))
      .finally(() => setLoading(false));
  }, [role]);

  if (loading) {
    return <View style={chatStyles.centerContainer}><ActivityIndicator size="large" color="#4F46E5" /><Text>Loading Users...</Text></View>;
  }

  if (error) {
    return <View style={chatStyles.centerContainer}><Text style={chatStyles.errorText}>{error}</Text></View>;
  }

  return (
    <View style={chatStyles.container}>
      <FlatList
        data={users}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={chatStyles.userItem} onPress={() => onUserSelect(item)}>
            <Image
              source={item.avatar ? { uri: item.avatar } : { uri: 'https://app.tnhappykids.in/assets/Avartar.png' }}
              style={chatStyles.avatar}
            />
            <View>
              <Text style={chatStyles.userName}>{item.name}</Text>
              <Text style={chatStyles.userBranch}>{item.branch}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={chatStyles.centerContainer}><Text>No users available to chat.</Text></View>}
      />
    </View>
  );
};

const ChatInterfaceComponent = ({ recipientUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef();

  useEffect(() => {
    const initialize = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id);
      if (!id || !recipientUser?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      fetch(`${BASE_URL}/get_messages.php?user1_id=${id}&user2_id=${recipientUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMessages(data.messages || []);
          } else {
            setMessages([]);
          }
        })
        .catch(() => setMessages([]))
        .finally(() => {
          setLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        });
    };
    initialize();
  }, [recipientUser]);

  const sendMessage = () => {
    if (!input.trim() || !currentUserId || !recipientUser?.id) return;

    const messageData = {
      sender_id: currentUserId,
      receiver_id: recipientUser.id,
      message: input.trim(),
    };

    fetch(`${BASE_URL}/send_message.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setMessages(prev => [...prev, { ...messageData, id: data.message_id, created_at: new Date().toISOString() }]);
        setInput('');
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        Alert.alert('Error', data.message || 'Failed to send message.');
      }
    })
    .catch(error => {
      Alert.alert('Error', 'A network error occurred.');
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={chatStyles.header}>
        <TouchableOpacity onPress={onBack} style={chatStyles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={chatStyles.headerText}>{recipientUser?.name || 'Chat'}</Text>
      </View>
      <ScrollView
        style={chatStyles.messagesContainer}
        ref={scrollViewRef}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {loading ? <ActivityIndicator size="large" color="#4F46E5" /> :
          messages.length === 0 ? (
            <Text style={chatStyles.emptyText}>No messages yet. Start the conversation!</Text>
          ) : (
            messages.map(msg => (
              <View key={msg.id} style={[
                chatStyles.messageBubble,
                msg.sender_id == currentUserId ? chatStyles.myMessage : chatStyles.theirMessage
              ]}>
                <Text style={chatStyles.messageText}>{msg.message}</Text>
                <Text style={chatStyles.timeText}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
              </View>
            ))
          )}
      </ScrollView>
      <View style={chatStyles.inputBar}>
        <TextInput
          style={chatStyles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={chatStyles.sendButton} onPress={sendMessage}>
          <MaterialIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const ChatContainer = ({ chatView, setChatView, selectedUser, setSelectedUser, closeModal }) => {
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setChatView('chat');
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setChatView('list');
  };

  return (
    <View style={{ flex: 1 }}>
      {chatView === 'list' ? (
        <>
          <View style={chatStyles.header}>
            <TouchableOpacity onPress={closeModal} style={chatStyles.backButton}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={chatStyles.headerText}>Chat with Franchisees</Text>
          </View>
          <ChatListComponent onUserSelect={handleUserSelect} role="Franchisee" />
        </>
      ) : (
        <ChatInterfaceComponent recipientUser={selectedUser} onBack={handleBackToList} />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerStyle: {
    width: '100%',
    height: 50,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },
  inputStyle: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  buttonStyle: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonTextStyle: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 16,
    backgroundColor: '#f5f7fa',
    paddingBottom: 32,
    paddingTop: 32,
    flexGrow: 1,
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
  topSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    minWidth: '45%',
    flex: 1,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  quickTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    margin: 4,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  formTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1a237e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pickerContainer: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 44,
  },
  createButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  createButtonText: {
    color: '#1a237e',
    fontWeight: 'bold',
    fontSize: 15,
  },
  graphSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a237e22',
  },
  graphTitle: {
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  graphPlaceholder: {
    height: 120,
    backgroundColor: '#e3e6f3',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsPanel: {
    backgroundColor: '#fff', // Ensuring this is white, not yellow
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  alertIcon: {
    fontSize: 22,
    marginRight: 8,
    color: '#FFD700',
  },
  alertsTitle: {
    fontWeight: 'bold',
    color: '#1a237e',
    fontSize: 16,
  },
  alertItem: {
    color: '#1a237e',
    marginBottom: 2,
    fontSize: 15,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 24, // Add margin top
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
    marginTop: 4, // Add margin top
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
  cameraCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  cameraBranch: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a237e',
    marginBottom: 8,
  },
  cameraWebview: {
    height: 200,
    width: '100%',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#e3e6f3',
  },
  cameraReportButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
    width: '80%',
  },
  cameraReportText: {
    color: '#1a237e',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a237e',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b2996',
    marginBottom: 16,
    textAlign: 'center',
  },
  branchBtn: {
    backgroundColor: '#ede7f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    width: 200,
  },
  branchBtnText: {
    color: '#4b2996',
    fontWeight: 'bold',
    fontSize: 16,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: 250,
  },
  attendanceName: {
    fontSize: 15,
    color: '#333',
  },
  attendanceStatus: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: '#a084ca',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: 300,
  },
  feeName: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  feeInput: {
    width: 60,
    backgroundColor: '#f7f6fd',
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ede7f6',
    fontSize: 15,
    textAlign: 'center',
  },
  feeUpdateBtn: {
    backgroundColor: '#a084ca',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  liveAlerts: {
    backgroundColor: '#fff', // Ensuring this is white, not yellow
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  timetableItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  timetableTitle: {
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a237e22',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
}); 