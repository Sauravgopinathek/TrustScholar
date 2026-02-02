# TrustScholar - Scholarship Application and Verification System

A secure web application for managing scholarship applications with comprehensive security features following **NIST SP 800-63-2 E-Authentication Guidelines**.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Cloud) |
| Authentication | JWT, Email OTP (MFA) |
| Encryption | AES-256-CBC, RSA-2048 |
| Hashing | bcrypt, SHA-512 |
| Digital Signatures | RSA-SHA512 |

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Gmail account (for OTP emails)

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Create `backend/.env` file:
```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Server
PORT=5000
NODE_ENV=development

# JWT (Required)
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=24h

# Encryption (Required - must be 32 characters)
AES_SECRET_KEY=your_32_character_aes_key_here!

# Email (Gmail with App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

Create `frontend/.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run build
npx serve -s build
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🔐 Security Features Implemented

### 1. Authentication
- **Single-Factor Authentication**: Email/Password login with strong password requirements
- **Multi-Factor Authentication**: Password + Email OTP verification

### 2. Authorization - Access Control
- **Access Control Matrix/ACL** with 3 subjects (Student, Verifier, Admin) and 3+ objects
- **Policy Definition**: Role-based permissions clearly defined
- **Implementation**: Middleware-based access control enforcement

### 3. Encryption
- **Key Exchange Mechanism**: RSA-2048 key generation and exchange
- **Encryption/Decryption**: AES-256-CBC for sensitive data, Hybrid RSA+AES approach

### 4. Hashing & Digital Signature
- **Hashing with Salt**: bcrypt for passwords, SHA-512 for document integrity
- **Digital Signature**: RSA-SHA512 signatures for application authenticity

### 5. Encoding Techniques
- **Encoding Implementation**: Base64 for documents, QR codes for verification
- **Security Levels & Risks**: Documented in code
- **Possible Attacks**: Rate limiting, input validation, XSS protection

### 6. Audit Logging
- All user actions logged with readable descriptions
- Tracks: User, Action, Timestamp, IP Address, Status
- Admin can view security audit logs

## 📁 Project Structure

```
TrustScholar/
├── backend/                 # Node.js Express API
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   └── initDatabase.js  # Database initialization
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── authorization.js # RBAC & ACL
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   ├── Scholarship.js
│   │   ├── Application.js
│   │   ├── Document.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js          # Login, Register, MFA
│   │   ├── scholarships.js  # CRUD scholarships
│   │   ├── applications_mongodb.js  # Application management
│   │   ├── documents.js     # Encrypted file upload
│   │   └── users.js         # User management
│   ├── utils/
│   │   ├── encryption.js    # AES, RSA, Hashing
│   │   └── encoding.js      # Base64, QR codes
│   └── server.js            # Main entry point
│
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # All pages
│   │   └── services/        # API calls
│   └── public/
│
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas (Cloud) or local MongoDB
- npm or yarn

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env` file (see Quick Start section above)

4. Start the backend:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env` file

4. Start the application:
```bash
npm run build
npx serve -s build
```

5. Build for production:
```bash
npm run build
```

## 🔑 Access Control Matrix

| Subject    | Applications        | Scholarships  | Users         | Documents     |
|------------|---------------------|---------------|---------------|---------------|
| **Student**   | CRUD (own only)    | Read          | R/U (own)     | CRUD (own)    |
| **Verifier**  | Read/Update        | Read          | Read (limited)| Read          |
| **Admin**     | Full CRUD          | Full CRUD     | Full CRUD     | Full CRUD     |

## 🔒 Security Implementation Details

### NIST SP 800-63-2 Compliance
- Account lockout after 5 failed attempts
- Session management with token expiration
- Secure password requirements (8+ chars, mixed case, numbers, symbols)
- OTP expires in 5 minutes

### Encryption Algorithms
- **Symmetric**: AES-256-CBC with random IV
- **Asymmetric**: RSA-2048 for key exchange
- **Hashing**: bcrypt (cost factor 12) for passwords, SHA-512 for documents
- **Digital Signatures**: RSA-SHA512

## 📱 Features by Role

### Student
- Register and verify email with OTP
- Login with MFA (Password + Email OTP)
- Browse available scholarships
- Submit applications with RSA-SHA512 digital signature
- Upload encrypted documents (AES-256-CBC)
- Track application status
- Download certificate with QR code verification

### Officer (Verifier)
- Review submitted applications
- Verify digital signatures
- Verify document integrity (SHA-512 hash)
- Update application status (approve/reject)

### Admin
- All officer capabilities
- Create/manage scholarships
- Create/manage users
- Approve/reject applications
- View security audit logs
- Toggle user active status

## 🧪 Testing the System

1. **Register** as a student (password hashed with bcrypt)
2. **Verify email** with 6-digit OTP (expires in 5 minutes)
3. **Login** with MFA (Password + Email OTP)
4. **Browse** and apply for scholarships
5. **Upload documents** (encrypted with AES-256-CBC, hashed with SHA-512)
6. **Submit application** (digitally signed with RSA-SHA512)
7. **Scan QR code** on certificate to verify authenticity

## 📊 Database Collections (MongoDB)

- **users** - User accounts with encrypted keys
- **scholarships** - Available scholarships
- **applications** - Student applications with digital signatures
- **documents** - Encrypted document storage
- **auditlogs** - Security event logs

## 🌐 Deployment

### Option 1: Vercel (Frontend) + Render (Backend)

**Deploy Backend on Render:**
1. Create account at [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add environment variables

**Deploy Frontend on Vercel:**
1. Create account at [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Root Directory: `frontend`
4. Framework: Create React App
5. Add `REACT_APP_API_URL` = `https://your-backend.onrender.com/api`

### Option 2: Railway (All-in-One)
1. Create account at [railway.app](https://railway.app)
2. Deploy from GitHub repo
3. Railway auto-detects services
4. Add environment variables

### Access URLs
| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://your-app.vercel.app` |
| Backend API (Render) | `https://your-api.onrender.com/api` |

## 🛡️ Security Best Practices Used

1. Input validation on all endpoints
2. NoSQL injection prevention
3. XSS protection (React auto-escaping)
4. CSRF protection (SameSite cookies)
5. Rate limiting on auth endpoints (100 req/15 min)
6. Helmet.js security headers
7. Password strength requirements (8+ chars)
8. Secure session management with JWT
9. Audit logging with readable action descriptions
10. CORS protection for API endpoints

---

## 📄 License

This project is for educational purposes - Cyber Security Lab Project.

## 👨‍💻 Author

TrustScholar Team
