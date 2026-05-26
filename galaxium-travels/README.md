# 🚀 Galaxium Travels - Interplanetary Booking System

A complete full-stack application for booking interplanetary space travel, featuring a modern React frontend and a FastAPI backend with dual REST and MCP protocol support.

## 🌟 Features

- **Seat Classes** - Choose from Economy 🪑, Business 💼, or Galaxium ⭐ classes with independent pricing
- **Modern Space-Themed UI** - Beautiful, responsive interface with animated starfield
- **Full Booking System** - Browse flights, make bookings, manage reservations
- **Dual Protocol Backend** - REST API and MCP (Model Context Protocol) support
- **Type-Safe** - Full TypeScript frontend and Python type hints with JSDoc comments
- **Real-Time Updates** - Live flight availability and booking status per class
- **User Management** - Simple name/email authentication
- **Docker Ready** - Complete containerized deployment with docker-compose

## 🏗️ Architecture

```
galaxium-travels-infrastructure/
├── booking_system_backend/     # FastAPI backend (Python)
│   ├── server.py              # Main server with REST & MCP
│   ├── services/              # Business logic layer
│   ├── models.py              # SQLAlchemy ORM models
│   └── tests/                 # Test suite
│
├── booking_system_frontend/    # React frontend (TypeScript)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API integration
│   │   └── types/            # TypeScript definitions
│   └── dist/                 # Production build
│
├── start.sh                   # Unix/Mac startup script
└── start.bat                  # Windows startup script
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** - [Download](https://www.docker.com/get-started) (Recommended)
- OR **Python 3.8+** and **Node.js 20+** for manual setup

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

Access at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- API Docs: http://localhost:8080/docs

### Option 2: Shell Scripts

#### On macOS/Linux:
```bash
./start.sh
```

#### On Windows:
```bash
start.bat
```

This will automatically:
- ✅ Install all dependencies
- ✅ Start the backend server on port 8080
- ✅ Start the frontend dev server on port 5173
- ✅ Open both in separate terminal windows

### Option 3: Manual Start

#### Start Backend:
```bash
cd booking_system_backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

#### Start Frontend (in a new terminal):
```bash
cd booking_system_frontend
npm install
npm run dev
```

## 🌐 Access the Application

Once started, access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **MCP Endpoint**: http://localhost:8080/mcp

## 📚 Documentation

### Backend
See [booking_system_backend/README.md](booking_system_backend/README.md) for:
- API endpoints documentation
- MCP tools reference
- Database schema
- Testing instructions

### Frontend
See [booking_system_frontend/README.md](booking_system_frontend/README.md) for:
- Component documentation
- Styling guide
- Build instructions
- Deployment options

## 🎯 User Guide

### Seat Classes

Choose from three travel classes:
- **🪑 Economy** - Base price, comfortable seating
- **💼 Business** - 2x price, premium service with extra legroom
- **⭐ Galaxium** - 4x price, luxury experience with exclusive perks

### Booking a Flight

1. **Browse Flights** - See available routes with "From $X" pricing
2. **Select Flight** - Click "Book Now" to see seat class options
3. **Choose Class** - Pick Economy, Business, or Galaxium based on availability
4. **Sign In/Register** - Enter your name and email
5. **Confirm Booking** - Review details and complete reservation
6. **Manage Bookings** - View bookings with class badges in "My Bookings"

### Demo Data

The system comes pre-seeded with:
- **10 Users** - Alice, Bob, Charlie, Diana, Eve, Frank, Grace, Heidi, Ivan, Judy
- **10 Flights** - Routes between Earth, Mars, Moon, Venus, Jupiter, Europa, Pluto
- **20 Sample Bookings** - Various booking statuses

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **FastMCP** - MCP protocol support
- **SQLite** - Lightweight database
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 🧪 Testing

### Backend Tests
```bash
cd booking_system_backend
pytest
```

### Frontend Build Test
```bash
cd booking_system_frontend
npm run build
```

## 📦 Production Deployment

### Docker (Recommended)
```bash
docker-compose up -d --build
```

### Manual Deployment

**Backend:**
```bash
cd booking_system_backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8080
```

**Frontend:**
```bash
cd booking_system_frontend
npm run build
# Deploy 'dist' folder to hosting service
```

## 🎨 Customization

### Change API URL
Edit `booking_system_frontend/.env`:
```env
VITE_API_URL=https://your-api-url.com
```

### Modify Theme Colors
Edit `booking_system_frontend/tailwind.config.js`:
```js
colors: {
  'cosmic-purple': '#6366F1',
  'nebula-pink': '#EC4899',
  // Add your colors
}
```

## 🐛 Troubleshooting

### Docker Issues
- Check containers: `docker-compose ps`
- View logs: `docker-compose logs -f`
- Rebuild: `docker-compose up -d --build`
- Stop: `docker-compose down`

### Backend won't start
- Ensure Python 3.8+ installed: `python --version`
- Check port 8080 availability
- Verify dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Ensure Node.js 20+ installed: `node --version`
- Check port 5173 availability
- Reinstall: `rm -rf node_modules && npm install`

### Connection Issues
- Verify backend at http://localhost:8080
- Check `.env` file in frontend
- Ensure CORS settings in backend

## 📄 License

This project is part of the Galaxium Travels booking system.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues or questions:
- Check the documentation in each component's README
- Review the troubleshooting section above
- Open an issue on GitHub

---

**Built with ❤️ for space travelers** 🚀✨

*Explore the cosmos, one booking at a time!*