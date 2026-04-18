---
title: TrustScholar Backend
emoji: 🎓
colorFrom: blue
colorTo: purple
sdk: docker
sdk_version: latest
app_port: 7860
pinned: false
---

# TrustScholar - Scholarship Verification System Backend

A secure, full-featured backend API for the TrustScholar scholarship verification platform.

## 🚀 Features

- **Authentication**: Password + Email OTP (Multi-Factor Authentication)
- **Authorization**: Role-Based Access Control (RBAC)
- **Encryption**: AES-256 + RSA-2048 Hybrid encryption
- **Hashing**: bcrypt + SHA-512
- **Digital Signatures**: RSA-SHA512
- **Encoding**: Base64
- **Rate Limiting**: NIST-recommended brute force protection
- **MongoDB**: Secure database with indexed queries

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-mfa` - MFA verification
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/google` - Google OAuth login

### Scholarships
- `GET /api/scholarships` - List scholarships
- `POST /api/scholarships` - Create scholarship (admin)
- `PUT /api/scholarships/:id` - Update scholarship (admin)
- `DELETE /api/scholarships/:id` - Delete scholarship (admin)

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document
- `DELETE /api/documents/:id` - Delete document

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (admin)

## 🔒 Security

This backend follows NIST SP 800-63-2 E-Authentication Guidelines and implements industry-standard security practices.

## 🌐 Deployment

Deployed on Hugging Face Spaces with Docker support.

**API URL**: `https://sauravgek-trustscholar-backend.hf.space/api`

## 📚 Environment Variables

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_frontend_url
PORT=7860
```

## 📦 Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **crypto-js** - Encryption
- **node-rsa** - RSA encryption
