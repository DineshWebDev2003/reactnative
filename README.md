# TN Happy Kids - School Management System

A comprehensive React Native mobile application for managing school operations, including student attendance, fee management, communication, and administrative tasks.

## 🚀 Features

### For Administrators
- **Dashboard Overview**: Real-time statistics and analytics
- **Branch Management**: Create, edit, and manage multiple school branches
- **User Management**: Add, edit, and manage staff, teachers, and parents
- **Fee Management**: Assign and track student fees
- **Attendance Reports**: View and manage student attendance
- **Income/Expense Tracking**: Monitor financial transactions
- **Timetable Management**: Create and manage class schedules
- **Staff Reports**: Track staff attendance and performance
- **App Version Management**: Upload and manage app updates

### For Teachers
- **Dashboard**: Overview of assigned classes and students
- **Attendance Management**: Mark daily student attendance
- **Homework Management**: Assign and review homework
- **Communication**: Chat with parents and administrators
- **Activity Posts**: Share classroom activities and updates
- **Student Profiles**: View detailed student information

### For Parents
- **Dashboard**: Overview of child's progress and activities
- **Attendance Tracking**: Monitor child's attendance
- **Fee Management**: View and pay fees
- **Communication**: Chat with teachers and administrators
- **Activity Feed**: View classroom activities and updates
- **Camera Access**: Live stream access to classroom cameras

### For Franchisees
- **Branch Dashboard**: Manage individual branch operations
- **Staff Management**: Oversee branch staff
- **Financial Reports**: Track branch income and expenses
- **Student Management**: Manage branch students

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: PHP with MySQL
- **Authentication**: AsyncStorage-based session management
- **UI Components**: React Native Paper, Custom Components
- **Icons**: Expo Vector Icons
- **Charts**: React Native Chart Kit
- **Navigation**: React Navigation v6
- **State Management**: React Hooks
- **File Handling**: Expo File System, Document Picker
- **Camera**: Expo Camera
- **WebView**: React Native WebView

## 📱 Screenshots

*[Add screenshots here]*

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tnhappykids-app.git
   cd tnhappykids-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure the backend URL**
   Edit `config.js` and update the `BASE_URL` to point to your backend server:
   ```javascript
   export const BASE_URL = "https://your-backend-server.com/backend";
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app on your phone

## 🏗️ Project Structure

```
v10/
├── api/                    # API endpoint files
├── assets/                 # Images, fonts, and static files
├── backend/                # PHP backend files
├── components/             # Reusable React components
├── screens/                # Screen components
├── utils/                  # Utility functions
├── App.js                  # Main app component
├── app.json               # Expo configuration
├── config.js              # App configuration
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
BASE_URL=https://your-backend-server.com/backend
```

### Backend Setup

1. Upload the `backend/` folder to your web server
2. Configure your MySQL database
3. Update database connection in `backend/db.php`
4. Ensure all PHP files are accessible via HTTPS

## 📦 Building for Production

### Android APK
```bash
eas build --platform android --profile preview
```

### Android App Bundle
```bash
eas build --platform android --profile production
```

### iOS
```bash
eas build --platform ios --profile production
```

## 🔐 Security Features

- Secure authentication with session management
- Role-based access control
- Input validation and sanitization
- Secure file upload handling
- HTTPS communication

## 📊 Database Schema

The application uses a MySQL database with the following main tables:
- `users` - User accounts and profiles
- `branches` - School branch information
- `students` - Student records
- `attendance` - Attendance tracking
- `fees` - Fee management
- `messages` - Communication system
- `activities` - Activity posts and updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@tnhappykids.in
- Website: https://tnhappykids.in
- Documentation: [Add documentation link]

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added camera integration and real-time features
- **v1.2.0** - Enhanced UI/UX and performance improvements

## 🙏 Acknowledgments

- React Native community
- Expo team for the amazing development platform
- All contributors and testers

---

**Made with ❤️ for TN Happy Kids** 