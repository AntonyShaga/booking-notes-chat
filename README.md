# 🔐 Модульная система аутентификации с JWT, 2FA и OAuth

A complete and modern authentication system built on **Next.js App Router** with secure session management, two-factor authentication, and OAuth providers.

The system includes:

* Reliable login with username/password using **Argon2**
* Email verification and spam protection
* **2FA** (TOTP and Email codes)
* **OAuth** via Google (PKCE) and GitHub (state)
* Secure token storage (**JWT + HttpOnly cookies**)
* Automatic Access Token renewal
* Revocation of Refresh Tokens and active session control

---

## 🚀 Key Features

* ✅ **OAuth 2.0 с PKCE** (Google) and state (GitHub)
* ✅ **2FA**: TOTP (QR code) and one-time Email codes
* ✅ **JWT with refresh tokens and HttpOnly cookies**
* ✅ **Rate limiting** and spam protection with Redis
* ✅ **Email verification** with Resend
* ✅ **Zod** — strict validation of incoming data
* ✅ **Secure architecture**: jti, revocation, cookie protection

---

## ⚙️ Technologies Used

* **Next.js (App Router)** — frontend and server-side APIs
* **tRPC** — type-safe client-server architecture
* **Prisma + PostgreSQL** — ORM and database
* **Redis** — for rate limits, 2FA, and verification tokens
* **JWT (jsonwebtoken)** —  session management
* **Argon2** — secure password hashing
* **otplib** — TOTP and QR generation
* **google-auth-library** — Google ID token verification
* **Zod** — strict data validation
* **Resend** — email sending

---

## 🧭 Architecture and Flows

### 🔑 1.  User Login

* Login/password verification, IP-based rate limiting
* If 2FA is enabled, no tokens are issued; waits for confirmation
* Without 2FA, Access and Refresh tokens are immediately issued to cookies

### 🔐 2. 2FA Completion

* Enter a TOTP or Email code
* Success → token generation → cookie issuance

### 🌐 3. OAuth (Google / GitHub)

* Generate state (always), + code_challenge (Google only)
* After authorization, verify state / id_token
* User is created/updated in the database → tokens are issued

### ♻️ 4. Access Token Renewal

* Access token expires → API returns 401
* In `tRPC context` the refresh token from the cookie is checked
* If valid → a new token pair is generated → cookies are updated

### 🚪 5. Logout

* Refresh token is removed from the database (revocation)
* Cookies are cleared

### 📧 6. Email Verification

* Upon registration, a unique token with a TTL is generated
* Email is sent via Resend
* Endpoint activates email + protection against re-sending (cooldown)

---

## 🛠️ Setup and Running

### 📁 Environment Variables `.env`

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# JWT
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# GitHub OAuth
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Prisma / PostgreSQL
DATABASE_URL="postgresql://user:password@host:port/db"

# Redis
REDIS_URL="redis://localhost:6379"

# Email
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="no-reply@yourdomain.com"
```

### ⚙️ Getting Started

```bash
# 1. Clone the project
$ git clone <репозиторий>

# 2. Install dependencies
$ npm install

# 3. Configure .env

# 4. Run Prisma migrations and generate client
$ npx prisma migrate dev
$ npx prisma generate

# 5. Run the project
$ npm run dev
```

---

## 🔄 Отличие от “Next.js Login Page” от Corbado

The guide by Corbado implements a basic authentication (Pages Router + MongoDB + email OTP).

My version is a — **modern solution**:

* ✅ Uses App Router and `tRPC`
* ✅ Based on PostgreSQL + Prisma (type safety and control)
* ✅ Added full JWT tokens, refresh cookies, and revocation
* ✅ Supports  **двух видов 2FA**: QR codes and Email codes
* ✅ Login attempt limits, verification, and registration cooldowns
* ✅ Modular architecture, ready for production

---

