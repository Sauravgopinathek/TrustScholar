# MongoDB Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

## Installation Options

### Option 1: Local MongoDB

1. **Download and Install MongoDB**
   - Windows: https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: Follow MongoDB official docs

2. **Start MongoDB Service**
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   brew services start mongodb-community
   # OR
   sudo systemctl start mongod
   ```

3. **Verify MongoDB is Running**
   ```bash
   mongosh
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env` file with your connection string

## Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

4. **Configure environment variables**
   
   For **Local MongoDB**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/scholarship_db
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

   For **MongoDB Atlas** (Cloud):
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/scholarship_db?retryWrites=true&w=majority
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the server**
   ```bash
   npm start
   # OR for development with auto-reload
   npm run dev
   ```

## Database Structure

The application uses the following MongoDB collections:

- **users** - User accounts (students, reviewers, admins)
- **scholarships** - Available scholarships
- **applications** - Scholarship applications
- **documents** - Uploaded documents
- **auditlogs** - Security audit trail
- **smsverifications** - SMS OTP codes

## Default Admin Account

On first run, the system creates a default admin account:

```
Email: admin@scholarship.com
Password: Admin@123
```

**⚠️ IMPORTANT: Change this password immediately after first login!**

## Verification

After starting the server, you should see:

```
✅ MongoDB connected successfully
✅ MongoDB indexes created successfully
✅ Database initialization complete
🚀 Server running on: http://localhost:5000
```

## Common Issues

### 1. Connection Failed
- Ensure MongoDB service is running
- Check MONGODB_URI in .env file
- For Atlas: Verify network access (IP whitelist)

### 2. Authentication Error
- For Atlas: Check username and password
- Ensure database user has read/write permissions

### 3. Module Not Found
```bash
npm install mongoose
```

## Next Steps

1. Start frontend application
2. Login with admin credentials
3. Change default admin password
4. Create scholarships and manage users

## MongoDB GUI Tools (Optional)

- **MongoDB Compass** (Official): https://www.mongodb.com/products/compass
- **Studio 3T**: https://studio3t.com/
- **Robo 3T**: https://robomongo.org/

These tools help visualize and manage your MongoDB data.
