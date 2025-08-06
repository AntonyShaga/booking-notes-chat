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
* ✅ **Безопасная архитектура**: jti, revocation, cookie protection

---

## ⚙️ Technologies Used

* **Next.js (App Router)** — фронтенд и серверные API
* **tRPC** — типобезопасная клиент-сервер архитектура
* **Prisma + PostgreSQL** — ORM и база данных
* **Redis** — для лимитов, 2FA и верификационных токенов
* **JWT (jsonwebtoken)** — управление сессиями
* **Argon2** — безопасное хеширование паролей
* **otplib** — генерация TOTP и QR
* **google-auth-library** — проверка ID токенов Google
* **Zod** — строгая валидация данных
* **Resend** — отправка email-писем

---

## 🧭 Архитектура и Потоки

### 🔑 1. Вход в систему

* Проверка логина/пароля, rate limit по IP
* Если 2FA включена — токены не выдаются, ожидание подтверждения
* Без 2FA — сразу выдаются Access и Refresh токены в куки

### 🔐 2. Прохождение 2FA

* Ввод TOTP или Email-кода
* Успех → генерация токенов → установка куков

### 🌐 3. OAuth (Google / GitHub)

* Генерация state (всегда), + code\_challenge (только Google)
* После авторизации — верификация state/id\_token
* Пользователь создаётся/обновляется в базе → выдача токенов

### ♻️ 4. Обновление Access токена

* Access токен истёк → API возвращает 401
* В `tRPC context` проверяется refresh токен из cookie
* Если валиден → генерация новой пары → обновление куков

### 🚪 5. Logout

* Refresh токен удаляется из базы (revocation)
* Куки очищаются

### 📧 6. Email верификация

* При регистрации генерируется уникальный токен с TTL
* Письмо отправляется через Resend
* Эндпоинт активирует email + защита от повторной отправки (cooldown)

---

## 🛠️ Настройка и запуск

### 📁 Переменные окружения `.env`

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

### ⚙️ Шаги запуска

```bash
# 1. Клонировать проект
$ git clone <репозиторий>

# 2. Установить зависимости
$ npm install

# 3. Настроить .env

# 4. Выполнить миграции и генерацию Prisma
$ npx prisma migrate dev
$ npx prisma generate

# 5. Запустить проект
$ npm run dev
```

---

## 🔄 Отличие от “Next.js Login Page” от Corbado

Руководство от Corbado реализует базовую аутентификацию (Pages Router + MongoDB + email OTP).

Моя версия — **современное решение**:

* ✅ Использует App Router и `tRPC`
* ✅ Основана на PostgreSQL + Prisma (типобезопасность и контроль)
* ✅ Добавлены полноценные JWT токены, refresh-куки, revocation
* ✅ Поддержка **двух видов 2FA**: QR-коды и Email-коды
* ✅ Ограничения по попыткам входа, верификации и регистрации
* ✅ Модульная архитектура, готовая к продакшену

---

