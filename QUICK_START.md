# Quick Start Guide

## ✅ Current Status
- Frontend: Running (http://localhost:3000)
- Backend: Needs MongoDB

## 🚀 3 Options to Start Backend:

### Option 1: MongoDB Atlas (Cloud - FASTEST - 2 minutes)
1. Go to: https://mongodb.com/cloud/atlas/register
2. Create FREE account
3. Create cluster (M0 Free Tier)
4. Click "Connect" → "Connect your application"
5. Copy connection string
6. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scholarship_db
   ```
7. Run: `cd backend; npm start`

### Option 2: Install MongoDB Locally
1. Download: https://www.mongodb.com/try/download/community
2. Install (keep defaults)
3. Start service: `net start MongoDB`
4. Run: `cd backend; npm start`

### Option 3: Docker (if Desktop running)
1. Start Docker Desktop
2. Run: `docker run -d -p 27017:27017 --name mongodb mongo`
3. Run: `cd backend; npm start`

## 📧 Email OTP Setup (Optional - for production)
Update `backend/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**For development:** OTPs are logged to console (no email needed)

## ✅ Once Backend Starts

You'll see:
```
✅ MongoDB connected successfully
✅ Default admin user created
   Email: admin@scholarship.com
   Password: Admin@123
🚀 Server running on: http://localhost:5000
```

Then open: http://localhost:3000

## 🔐 Test Login
```
Email: admin@scholarship.com
Password: Admin@123
OTP: (check backend console)
```

## ❓ Problems?

**Frontend not connecting to backend?**
- Check `frontend/.env` has: `REACT_APP_API_URL=http://localhost:5000/api`
- Restart frontend: `cd frontend; npm start`

**OTP failing?**
- Check backend console for OTP code
- Use that code to login

**Google Sign-In?**
- Get Google OAuth Client ID: https://console.cloud.google.com/
- Update `frontend/.env` and `backend/.env`
