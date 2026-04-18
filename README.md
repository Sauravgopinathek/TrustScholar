---
title: TrustScholar Backend
emoji: ":graduation_cap:"
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# TrustScholar Backend

A secure Node.js Express API for scholarship verification.

## Features

- Authentication: JWT + Email OTP
- Authorization: Role-Based Access Control
- Encryption: AES-256 + RSA-2048
- Security: NIST SP 800-63-2 Guidelines

## Quick Links

- Health Check: GET /api/health
- Auth: POST /api/auth/login, POST /api/auth/register
- Scholarships: GET/POST /api/scholarships
- Applications: GET/POST /api/applications

## Environment Variables

MONGODB_URI, JWT_SECRET, FRONTEND_URL, PORT=7860
