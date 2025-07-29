import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient'; // If using Expo, otherwise use a View with a gradient-like color
import { WebView } from 'react-native-webview';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';
import { BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleLogout } from '../utils/logout';
import SafeIcon from '../components/SafeIcon';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

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
  
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  
  // Error boundary effect
  useEffect(() => {
    // React Native doesn't have window.addEventListener, so we'll handle errors differently
    console.log('AdministrationDashboard mounted');
    
    // Check authentication with a small delay to ensure AsyncStorage is ready
    const checkAuth = async () => {
      try {
        // Add a small delay to ensure AsyncStorage is properly set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const userId = await AsyncStorage.getItem('userId');
        const role = await AsyncStorage.getItem('role');
        const userToken = await AsyncStorage.getItem('userToken');
        console.log('Auth check - userId:', userId, 'role:', role, 'userToken:', userToken);
        
        if (!userId || !userToken) {
          console.log('No authentication found, redirecting to login');
          navigation.replace('Login');
        } else {
          console.log('Authentication successful, staying on dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    
    checkAuth();
  }, [navigation]);

  // Monitor for any navigation focus changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('AdministrationDashboard focused');
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('AdministrationDashboard blurred');
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation]);
  
    if (hasError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#333', textAlign: 'center', marginBottom: 20 }}>
            Something went wrong with the dashboard. Please try again.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8 }}
            onPress={() => setHasError(false)}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Add try-catch wrapper for the entire render
  try {
    console.log('Rendering AdministrationDashboard...');
  } catch (error) {
    console.error('Render error in AdministrationDashboard:', error);
    setHasError(true);
    return null;
  }
  // Administration profile info
  const administrationProfile = {
    name: 'TN Happy Kids Administration',
    role: 'Administration',
    location: 'Pollachi',
    profilePic: require('../assets/Avartar.png'),
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
  const [showBranchCrud, setShowBranchCrud] = useState(false);
  const [editBranchId, setEditBranchId] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');
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
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [feeBranch, setFeeBranch] = useState('');
  const [kidsList, setKidsList] = useState([]);
  const [feeInputs, setFeeInputs] = useState({});
  const [feeLoading, setFeeLoading] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [selectedTrendBranch, setSelectedTrendBranch] = useState('');
  const [showIncomeExpense, setShowIncomeExpense] = useState(false);
  const [incomeExpenseDate, setIncomeExpenseDate] = useState(new Date());
  const [showIncomeExpenseDatePicker, setShowIncomeExpenseDatePicker] = useState(false);
  const [incomeExpenseMonth, setIncomeExpenseMonth] = useState((new Date()).getMonth() + 1);
  const [incomeExpenseYear, setIncomeExpenseYear] = useState((new Date()).getFullYear());
  const [filterType, setFilterType] = useState('day'); // 'day', 'month', 'range'
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
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
  const [incomeExpenseType, setIncomeExpenseType] = useState('all');

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

  const [activities, setActivities] = useState([]);
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

  const handleDownloadCSV = async () => {
    let csv = 'Date,Type,Amount,Description\n';
    trendData.forEach(row => {
      csv += `${row.day || row.date},${row.type || ''},${row.amount || row.total_income || row.total_expense},${row.description || ''}\n`;
    });
    const fileUri = FileSystem.cacheDirectory + 'income_expense.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Download Income/Expense CSV' });
  };

  // Fetch branches and users
  const fetchBranches = () => {
    setLoadingBranches(true);
    fetch(`${BASE_URL}/get_branches.php`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Branches response:', data); // Debug log
        if (data.success) setBranches(data.branches);
        setLoadingBranches(false);
      })
      .catch((err) => {
        console.log('Branches fetch error:', err); // Debug log
        setBranches([]); // Set empty array on error
        setLoadingBranches(false);
      });
  };
  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch(`${BASE_URL}/get_users.php`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setUsers(data.users);
          console.log('Fetched users:', data.users);
        }
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  };

  const fetchTrendData = (branch) => {
    setTrendLoading(true);
    fetch(`${BASE_URL}/get_income_trend.php?branch=${encodeURIComponent(branch)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTrendData(data.trend || []);
        setTrendLoading(false);
      })
      .catch(() => setTrendLoading(false));
  };

  useEffect(() => {
    console.log('Starting initialization...');
    const initializeData = async () => {
      try {
        console.log('Initializing data...');
        // Temporarily disable API calls to test if they're causing the issue
        // fetchBranches();
        // fetchUsers();
        
        // const response = await fetch(`${BASE_URL}/get_total_income.php`);
        // if (response.ok) {
        //   const data = await response.json();
        //   if (data.success) setTotalIncome(data.total_income || 0);
        // }
        console.log('Initialization completed successfully');
      } catch (error) {
        console.error('Initialization error:', error);
        // Continue with default values
      }
    };
    
    initializeData();
    // Temporarily disable these calls
    // fetchLiveAlerts();
    // fetchTimetables();

    // Set up a timer to refresh alerts every 30 seconds
    // const alertInterval = setInterval(fetchLiveAlerts, 30000);
    // return () => clearInterval(alertInterval);
  }, []);

  useEffect(() => {
    if (selectedTrendBranch) fetchTrendData(selectedTrendBranch);
  }, [selectedTrendBranch]);

  useEffect(() => {
    if (!showIncomeExpense) return;
    if (filterType === 'day') {
      fetchIncomeExpenseByDay();
    } else if (filterType === 'month') {
      fetchIncomeExpenseByMonth();
    } else if (filterType === 'range') {
      fetchIncomeExpenseByRange();
    }
  }, [showIncomeExpense, filterType, incomeExpenseDate, incomeExpenseMonth, incomeExpenseYear, dateRange]);

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

  const fetchIncomeExpenseByDay = () => {
    setTrendLoading(true);
    fetch(`${BASE_URL}/get_income_trend.php?date=${incomeExpenseDate.toISOString().slice(0,10)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTrendData(data.trend || []);
        setTrendLoading(false);
      })
      .catch(() => setTrendLoading(false));
  };
  const fetchIncomeExpenseByMonth = () => {
    setTrendLoading(true);
    fetch(`${BASE_URL}/get_income_trend.php?month=${incomeExpenseMonth}&year=${incomeExpenseYear}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTrendData(data.trend || []);
        setTrendLoading(false);
      })
      .catch(() => setTrendLoading(false));
  };
  const fetchIncomeExpenseByRange = () => {
    setTrendLoading(true);
    fetch(`${BASE_URL}/get_income_trend.php?start=${dateRange.start.toISOString().slice(0,10)}&end=${dateRange.end.toISOString().slice(0,10)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTrendData(data.trend || []);
        setTrendLoading(false);
      })
      .catch(() => setTrendLoading(false));
  };

  // 2. Update createBranch to show confirmation dialog and success color indicator
  const createBranch = () => {
    if (!branchName || !branchAddress) return;
    Alert.alert(
      'Confirm',
      `Create branch "${branchName}" at "${branchAddress}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            fetch(`${BASE_URL}/create_branch.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: branchName, address: branchAddress }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setBranchName('');
                  setBranchAddress('');
                  setSuccessMessage('Branch created successfully!');
                  setSuccessColor('#4caf50');
                  fetchBranches();
                  setShowBranchCrud(false); // Hide form after creation
                  setTimeout(() => setSuccessMessage(''), 2000);
                } else {
                  Alert.alert('Error', data.message || 'Failed to create branch');
                }
              });
          },
        },
      ]
    );
  };

  // Mockup edit branch
  const startEditBranch = (branch) => {
    setEditBranchId(branch.id);
    setEditBranchName(branch.name);
    setEditBranchAddress(branch.address);
  };
  // 3. Update saveEditBranch to show confirmation dialog
  const saveEditBranch = () => {
    Alert.alert(
      'Confirm',
      `Save changes to branch "${editBranchName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            fetch(`${BASE_URL}/edit_branch.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: editBranchId, name: editBranchName, address: editBranchAddress }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setEditBranchId(null);
                  setEditBranchName('');
                  setEditBranchAddress('');
                  setSuccessMessage('Branch updated successfully!');
                  setSuccessColor('#2196f3'); // blue for edit
                  fetchBranches();
                  setTimeout(() => setSuccessMessage(''), 2000);
                } else {
                  Alert.alert('Error', data.message || 'Failed to update branch');
                }
              });
          },
        },
      ]
    );
  };
  // 4. Update deleteBranch to show confirmation dialog
  const deleteBranch = (branch) => {
    Alert.alert(
      'Confirm',
      `Delete branch "${branch.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            fetch(`${BASE_URL}/delete_branch.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: branch.id }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setSuccessMessage('Branch deleted successfully!');
                  setSuccessColor('#e57373'); // red for delete
                  fetchBranches();
                  setTimeout(() => setSuccessMessage(''), 2000);
                } else {
                  Alert.alert('Error', data.message || 'Failed to delete branch');
                }
              });
          },
        },
      ]
    );
  };

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
  const handleShowBranchCrud = () => {
    setShowBranchCrud(v => !v);
    if (!showBranchCrud) {
      setShowCreateForms(false);
      setShowCameras(false);
    }
  };
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

  // Attendance fetch logic (placeholder)
  const fetchAttendance = (branch) => {
    setAttendanceLoading(true);
    console.log('Fetching attendance for branch:', branch);
    fetch(`${BASE_URL}/get_attendance.php?branch=${encodeURIComponent(branch)}`)
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
      fetchAttendance(branchToFetch);
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
      gradientColors: ['#43cea2', '#185a9d'],
      icon: <SafeIcon type="MaterialIcons" name="location-on" size={22} color="#fff" />,
      label: 'Manage Branches',
      onPress: handleShowBranchCrud,
    },
    {
      gradientColors: ['#f7971e', '#ffd200'],
      icon: <SafeIcon type="FontAwesome5" name="user-plus" size={22} color="#fff" />,
      label: 'Create/Assign Users',
      onPress: () => navigation.navigate('AssignUser'),
    },
    {
      gradientColors: ['#f953c6', '#b91d73'],
      icon: <FontAwesome5 name="users" color="#fff" />,
      label: 'Manage Users',
      onPress: () => navigation.navigate('ManageUsers'),
    },
    {
      gradientColors: ['#00c6ff', '#0072ff'],
      icon: <Ionicons name="chatbubble-ellipses-outline" color="#fff" />,
      label: 'Chat with Franchisees',
      onPress: () => navigation.navigate('ChatList', { role: 'Franchisee' }),
    },
    {
      gradientColors: ['#a6c1ee', '#fbc2eb'],
      icon: <Entypo name="video" color="#fff" />,
      label: 'View All Cameras',
      onPress: () => navigation.navigate('AllCameras'),
    },
    {
      gradientColors: ['#b2dfdb', '#4caf50'],
      icon: <Feather name="settings" color="#fff" />,
      label: 'Master Settings',
      onPress: () => setShowMasterSettings(true),
    },
    {
      gradientColors: ['#a084ca', '#FFD700'],
      icon: <MaterialIcons name="event-available" color="#fff" />,
      label: 'View Attendance',
      onPress: () => navigation.navigate('AttendanceReport'),
    },
    {
      gradientColors: ['#e75480', '#FFD700'],
      icon: <FontAwesome5 name="rupee-sign" color="#fff" />,
      label: 'Assign/Update Parent Fees',
      onPress: () => navigation.navigate('AssignFee'),
    },
    {
      gradientColors: ['#e53935', '#FFD700'],
      icon: <FontAwesome5 name="exclamation-circle" color="#fff" />,
      label: 'View All Pending Expenses',
      onPress: () => navigation.navigate('IncomeExpense', { showAllPending: true }),
    },
    {
      gradientColors: ['#2193b0', '#6dd5ed'],
      icon: <FontAwesome5 name="id-card" color="#fff" />,
      label: 'ID Card List',
      onPress: () => navigation.navigate('IDCardList'),
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
    Alert.alert(
      'Delete App Version',
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
    const formData = new FormData();
    formData.append('file', file.name);
              const res = await fetch(`${BASE_URL}/delete_app_version.php`, { 
                method: 'POST', 
                body: formData 
              });
    const data = await res.json();
    if (data.success) {
                Alert.alert('Success', 'App version deleted successfully!');
      fetchAppFiles();
    } else {
                Alert.alert('Error', data.message || 'Failed to delete app version');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error while deleting app version');
    }
          }
        }
      ]
    );
  };

  const handlePushForDownload = async (file) => {
    Alert.alert(
      'Push for Download',
      `Set "${file.name}" as the latest version for users to download?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Push for Download',
          onPress: async () => {
            try {
    const formData = new FormData();
    formData.append('file', file.name);
              formData.append('version', file.name.replace('.apk', '').replace('.aab', ''));
              formData.append('title', 'TN Happy Kids App Update');
              formData.append('description', 'Latest version of TN Happy Kids app');
              formData.append('changelog', 'Bug fixes and improvements');
              
              const res = await fetch(`${BASE_URL}/set_latest_version.php`, { 
                method: 'POST', 
                body: formData 
              });
    const data = await res.json();
    if (data.success) {
                Alert.alert('Success', 'App version pushed for download successfully!');
      fetchAppFiles();
    } else {
                Alert.alert('Error', data.message || 'Failed to push for download');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error while pushing for download');
    }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 }}>
          Administration Dashboard Test
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 }}>
          If you can see this, the dashboard is working!
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8 }}
          onPress={() => console.log('Test button pressed')}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>Test Button</Text>
        </TouchableOpacity>
      </View>
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

const styles = StyleSheet.create({
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
    marginBottom: 8,
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
    backgroundColor: 'rgba(255, 215, 0, 0.15)', // Lighter gold/yellow with transparency
    borderRadius: 12,
    padding: 16,
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
  alertItemText: {
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