# Compliance Tracker v1.0.0 - Desktop Application Release

## 🎉 Initial Release

This is the first official release of the Compliance Tracker Desktop Application, featuring both web and desktop deployment options.

## ✨ Features

### Web Application
- **Multi-user Authentication**: Secure JWT-based authentication with role-based access
- **User-specific Data Isolation**: Each user sees only their own projects and tasks
- **Project Management**: Create, update, and track compliance projects
- **Task Tracking**: Manage tasks with status updates and progress monitoring
- **Scheduled Notifications**: Automatic reminders Monday-Friday at 8:30 AM, 9:00 AM, and 10:00 AM
- **Login Notifications**: Instant notifications upon successful login
- **IBM Curator AI Integration**: Quick access button to IBM Curator AI assistant
- **Excel Import/Export**: Import project data from Excel templates
- **Responsive UI**: Modern React-based interface with real-time updates

### Desktop Application
- **Electron-based Desktop Wrapper**: Native Windows application experience
- **Docker Integration**: Automatic Docker Desktop management
- **System Tray**: Background operation with quick access menu
  - Show/Hide application window
  - View Docker logs
  - Restart containers
  - Quit application
- **Auto-launch**: Optional startup with Windows
- **Native Notifications**: Windows 10/11 notification support
- **Portable**: No installation required, extract and run

## 📦 Installation

### Web Application (Docker)
```bash
# Clone the repository
git clone https://github.com/naveenkumar091224/DS-P-Activity-Tracker-Notifier.git
cd DS-P-Activity-Tracker-Notifier

# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

### Desktop Application (Windows)
1. Download `Compliance-Tracker-1.0.0-Portable.zip` from the releases page
2. Extract the ZIP file to your desired location
3. Run `Compliance Tracker.exe`
4. The application will automatically:
   - Check for Docker Desktop
   - Start required containers
   - Launch the web interface

## 📋 Requirements

### Web Application
- Docker Desktop
- Docker Compose
- 4GB RAM minimum
- 10GB disk space

### Desktop Application
- Windows 10/11 (64-bit)
- Docker Desktop installed and running
- 4GB RAM minimum
- 10GB disk space

## 📚 Documentation

- [README.md](README.md) - Main project documentation
- [QUICK_START.md](QUICK_START.md) - Quick start guide for web application
- [DESKTOP_APP_GUIDE.md](DESKTOP_APP_GUIDE.md) - Comprehensive desktop app guide
- [QUICK_START_DESKTOP.md](QUICK_START_DESKTOP.md) - Quick reference for desktop app
- [NOTIFICATION_SYSTEM_GUIDE.md](NOTIFICATION_SYSTEM_GUIDE.md) - Notification system documentation
- [SCHEDULED_NOTIFICATIONS_GUIDE.md](SCHEDULED_NOTIFICATIONS_GUIDE.md) - Scheduled notifications guide

## 🔧 Technical Stack

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- JWT Authentication
- APScheduler for notifications
- PostgreSQL database

**Frontend:**
- React 18
- TypeScript
- Vite
- Axios for API calls

**Desktop:**
- Electron 28
- dockerode for Docker management
- auto-launch for startup integration

## 🐛 Known Issues

- Desktop app requires administrator privileges for Docker Desktop management
- Code signing not implemented (Windows SmartScreen warning may appear)
- Large file size due to embedded Python virtual environment

## 🚀 Future Enhancements

- Mobile application support
- Advanced reporting and analytics
- Integration with more AI assistants
- Email notification support
- Multi-language support

## 📝 Changelog

### v1.0.0 (2026-05-22)
- Initial release
- Web application with Docker deployment
- Desktop application for Windows
- Multi-user authentication and data isolation
- Scheduled notifications system
- IBM Curator AI integration
- Excel import/export functionality

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Naveen Kumar** - Initial work and development

## 🙏 Acknowledgments

- IBM Curator AI team for AI assistant integration
- Electron community for desktop framework
- FastAPI and React communities for excellent frameworks