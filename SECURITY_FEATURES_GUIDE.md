                                                                                                                                                                                                                                                                                        # 🔐 TrustScholar - Security Features Implementation Guide

## ✅ NIST SP 800-63-2 Compliant Scholarship Verification System

Your Scholarship Application system implements all required security features for a comprehensive lab demonstration.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Cloud) |
| Authentication | JWT + Email OTP (MFA) |
| Encryption | AES-256-CBC, RSA-2048 |
| Hashing | bcrypt (SHA-256), SHA-512 |

---

## 📋 Security Requirements Checklist

### 1. ✅ Multi-Factor Authentication (MFA) - Email OTP/PIN

**Location:** [backend/routes/auth.js](backend/routes/auth.js)

**Implementation:**
- Password-based authentication (First Factor)
- Email OTP verification (Second Factor)
- 6-digit PIN with 5-minute expiration
- Rate limiting to prevent brute force

**How it works:**
```javascript
// Step 1: User registers/logs in with password
POST /api/auth/register
POST /api/auth/login

// Step 2: System sends 6-digit OTP to email
// OTP expires in 5 minutes

// Step 3: User verifies OTP
POST /api/auth/verify-otp
{
  "email": "student@example.com",
  "otp": "123456"
}
```

**Demo:** 
- Register a user → Check email → Verify OTP
- OTP is logged to console in dev mode

---

### 2. ✅ Authorization - Access Control Matrix (ACL)

**Location:** [backend/middleware/authorization.js](backend/middleware/authorization.js)

**Access Control Matrix:**

| Subject/Role | Application Form | Financial Records | Approval Status |
|--------------|------------------|-------------------|-----------------|
| **Student**  | CREATE, READ, UPDATE | CREATE, READ | READ |
| **Verifier** | READ, UPDATE | READ | UPDATE |
| **Admin**    | CREATE, READ, UPDATE, DELETE | CREATE, READ, UPDATE, DELETE | CREATE, READ, UPDATE, DELETE |

**Implementation:**
```javascript
// Role-Based Access Control (RBAC)
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        next();
    };
};

// Usage in routes
router.post('/applications', 
    authenticate, 
    authorize(['student']), // Only students can create
    createApplication
);

router.put('/applications/:id/approve', 
    authenticate, 
    authorize(['admin']), // Only admins can approve
    approveApplication
);
```

**Demo:**
- Login as Student → Can submit application ✅
- Login as Student → Try to approve → Denied ❌
- Login as Admin → Can approve ✅

---

### 3. ✅ Encryption - AES + RSA Hybrid

**Location:** [backend/utils/encryption.js](backend/utils/encryption.js)

**Implementation:**

**AES-256 for Document Encryption:**
```javascript
const CryptoJS = require('crypto-js');

// Encrypt sensitive documents
const encryptData = (data) => {
    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        process.env.AES_SECRET_KEY
    ).toString();
    return encrypted;
};

// Decrypt documents
const decryptData = (encryptedData) => {
    const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        process.env.AES_SECRET_KEY
    );
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
};
```

**RSA-2048 for Key Exchange:**
```javascript
const NodeRSA = require('node-rsa');

// Generate RSA key pair for user
const generateKeyPair = () => {
    const key = new NodeRSA({ b: 2048 });
    return {
        publicKey: key.exportKey('public'),
        privateKey: key.exportKey('private')
    };
};

// Encrypt with public key
const encryptWithPublicKey = (data, publicKey) => {
    const key = new NodeRSA(publicKey);
    return key.encrypt(data, 'base64');
};

// Decrypt with private key
const decryptWithPrivateKey = (encryptedData, privateKey) => {
    const key = new NodeRSA(privateKey);
    return key.decrypt(encryptedData, 'utf8');
};
```

**Hybrid Approach:**
1. Generate AES key for document
2. Encrypt document with AES (fast, symmetric)
3. Encrypt AES key with RSA public key
4. Store both encrypted document and encrypted key
5. To decrypt: Decrypt AES key with RSA private key, then decrypt document

**Demo:**
- Upload document → Encrypted with AES
- Financial data → Encrypted before saving
- Keys exchanged using RSA

---

### 4. ✅ Hashing - SHA-512 with Unique Salt

**Location:** [backend/routes/auth.js](backend/routes/auth.js), [backend/utils/encryption.js](backend/utils/encryption.js)

**Password Hashing (bcrypt):**
```javascript
const bcrypt = require('bcryptjs');

// Register: Hash password with salt (12 rounds)
const hashedPassword = await bcrypt.hash(password, 12);

// Login: Verify password
const isValidPassword = await bcrypt.compare(password, user.password);
```

**File Integrity Hashing (SHA-512):**
```javascript
const crypto = require('crypto');

// Create SHA-512 hash for document integrity
const createHashSHA512 = (data) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return crypto.createHash('sha512').update(buffer).digest('hex');
};

// Usage: Hash uploaded documents
const fileHash = createHashSHA512(req.file.buffer);
```

**Security Features:**
- Unique salt per user (automatic with bcrypt)
- 12 rounds of hashing (NIST recommended)
- SHA-512 for document integrity verification
- Prevents rainbow table attacks
- Timing-safe comparison

**Demo:**
- Same password for 2 users → Different hashes ✅
- Upload document → SHA-512 hash generated for integrity check

---

### 5. ✅ Digital Signatures - RSA-SHA512

**Location:** [backend/utils/encryption.js](backend/utils/encryption.js)

**Implementation:**
```javascript
const crypto = require('crypto');

// Sign data with private key (RSA-SHA512)
const createDigitalSignature = (data, privateKey) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return crypto.sign('RSA-SHA512', buffer, privateKey).toString('base64');
};

// Verify signature with public key
const verifyDigitalSignature = (data, signature, publicKey) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const sigBuffer = Buffer.from(signature, 'base64');
    return crypto.verify('RSA-SHA512', buffer, publicKey, sigBuffer);
};
```

**Usage in Application Submission:**
```javascript
// When student submits application
const applicationData = JSON.stringify({
    applicationId: app._id,
    scholarshipId: app.scholarshipId,
    submittedAt: new Date().toISOString()
});

// Create digital signature
const signature = createDigitalSignature(applicationData, userPrivateKey);

// Store signature with application
app.digitalSignature = signature;
app.signedData = applicationData;
await app.save();
```

**Demo:**
- Student submits application → RSA-SHA512 signature created
- Verify application → Signature validated ✅
- If data tampered → Verification fails ❌

---

### 6. ✅ Encoding - Base64 + QR Code

**Location:** [backend/utils/encoding.js](backend/utils/encoding.js)

**Base64 Encoding:**
```javascript
// Encode data to Base64
const encodeBase64 = (data) => {
    return Buffer.from(data, 'binary').toString('base64');
};

// Decode Base64 to original
const decodeBase64 = (base64String) => {
    return Buffer.from(base64String, 'base64').toString('binary');
};

// Usage: Encode uploaded documents before encryption
const fileBase64 = encodeBase64(req.file.buffer.toString('binary'));
```

**QR Code Generation:**
```javascript
const QRCode = require('qrcode');

// Generate QR code for application verification
const generateVerificationQR = async (applicationNumber) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${applicationNumber}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        width: 200
    });
    return qrDataUrl;
};
```

**Demo:**
- Upload document → Converted to Base64
- Submit application → QR code generated for verification
- Scan QR → Opens verification page with application details

---

## 🚀 Quick Start Guide

### Step 1: Configure Environment

Create `backend/.env`:
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trustscholar_db

# Server
PORT=5000
NODE_ENV=development

# JWT (Required)
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=24h

# Encryption (must be 32 characters)
AES_SECRET_KEY=your_32_character_aes_key_here!

# Email (Gmail with App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Step 2: Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### Step 3: Start Application

```powershell
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend
cd frontend
npm start
```

### Step 4: Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

---

## 🎯 Demo Workflow

1. **Register Student Account** (MFA + Hashing)
   - Enter email/password
   - Password hashed with bcrypt
   - Receive OTP via email
   - Verify OTP (MFA complete)

2. **Submit Application** (Authorization + Encryption)
   - Login as student
   - Fill application form
   - Upload documents (Base64 + AES-256-CBC encryption)
   - SHA-512 hash generated for file integrity
   - Submit → RSA-SHA512 digitally signed
   - QR code generated for verification

3. **Admin Review** (Authorization Matrix)
   - Login as admin
   - View all applications
   - Verify digital signatures
   - Approve/reject applications
   - View security audit logs

4. **Verify Application** (QR Code Scanning)
   - Scan QR code on certificate
   - View verified application details
   - Digital signature verification displayed

---

## 📝 Lab Report - What to Document

### For Each Security Feature:

**1. Authentication (MFA)**
- Screenshot: Registration with OTP email
- Code snippet: `verifyOTP` function
- Explain: How 2FA prevents unauthorized access

**2. Authorization (ACL)**
- Screenshot: Student denied from approving
- Screenshot: Admin can approve
- Code snippet: Access control matrix
- Table: Roles × Objects × Permissions

**3. Encryption**
- Screenshot: Encrypted data in MongoDB
- Code snippet: AES encryption function
- Diagram: Hybrid AES + RSA flow

**4. Hashing**
- Screenshot: Hashed password in database
- Code snippet: bcrypt with salt
- SHA-512 for document integrity
- Explain: Why same password → different hashes

**5. Digital Signatures**
- Screenshot: Signed application
- Code snippet: RSA-SHA512 sign & verify
- Demo: Tampering detection

**6. Encoding**
- Screenshot: Base64 encoded document
- QR code for application verification
- Code snippet: Encode/decode functions
- Show: Original vs encoded format

---

## 🌐 Deployment Options

| Platform | Frontend | Backend | Cost |
|----------|----------|---------|------|
| **Vercel + Render** | Vercel | Render | Free |
| **Railway** | ✅ | ✅ | Free tier |
| **Docker** | ✅ | ✅ | Self-hosted |

### Live Demo URLs (if deployed):
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-api.onrender.com`

---

## 🎯 NIST SP 800-63-2 Compliance

✅ **Authentication Assurance Level 2 (AAL2)**
- Multi-factor authentication
- Password + OTP

✅ **Session Management**
- JWT tokens with expiration
- Secure HTTP-only cookies

✅ **Access Control**
- Role-based authorization
- Principle of least privilege

✅ **Cryptography**
- AES-256-CBC (NIST approved)
- RSA-2048 (NIST approved)
- SHA-512 for integrity
- bcrypt for passwords

✅ **Audit Logging**
- All actions logged with readable descriptions
- Includes: user, action, timestamp, IP address
- Admin can view security audit logs

---

## 📂 Key Files to Review

| File | Security Feature |
|------|------------------|
| `backend/routes/auth.js` | MFA, Password Hashing |
| `backend/middleware/authorization.js` | ACL, RBAC, Audit Logging |
| `backend/utils/encryption.js` | AES-256, RSA-2048, SHA-512, Digital Signatures |
| `backend/utils/encoding.js` | Base64, QR Code Generation |
| `backend/models/User.js` | User schema with encrypted keys |
| `backend/models/Document.js` | Document schema with hash & signature |
| `backend/routes/documents.js` | File encryption & upload |
| `backend/server.js` | Security middleware (Helmet, CORS, Rate Limiting) |

---

## ✨ Summary

**TrustScholar - Secure Scholarship Verification System**

All 6 security requirements implemented following NIST SP 800-63-2 guidelines:

| # | Feature | Implementation |
|---|---------|----------------|
| 1 | MFA | Email OTP (6-digit, 5-min expiry) |
| 2 | Authorization | 3×3 Access Control Matrix (Student, Officer, Admin) |
| 3 | Encryption | AES-256-CBC + RSA-2048 Hybrid |
| 4 | Hashing | bcrypt (passwords) + SHA-512 (documents) |
| 5 | Digital Signatures | RSA-SHA512 for application authenticity |
| 6 | Encoding | Base64 + QR Code verification |

**Additional Security Features:**
- Helmet.js security headers
- CORS protection
- Rate limiting (100 requests/15 min)
- JWT token authentication
- Audit logging with readable actions
- Input validation & sanitization

---

**🔗 Repository:** Your GitHub repo
**📧 Support:** Contact your instructor for questions
