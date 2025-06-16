## 🔑 GitHub OAuth Authentication

Процесс аутентификации:
1. Пользователь кликает "Login with GitHub".
2. Сервер генерирует `state` и `code_verifier`, перенаправляет на GitHub.
3. GitHub возвращает `code` в callback-URL.
4. Сервер:
    - Проверяет `state` и `code`.
    - Обменивает `code` на access token.
    - Получает данные пользователя (email, имя, аватар).
    - Создаёт/обновляет запись в БД.
    - Устанавливает JWT-токены в HttpOnly-куки.

Используемые технологии:
- PKCE (OAuth 2.0)
- JWT (access + refresh токены)
- Prisma (работа с БД)

## 🔑 Google OAuth Authentication

### Как это работает?
1. Пользователь кликает "Sign in with Google".
2. Сервер:
    - Генерирует PKCE-параметры (`code_verifier` и `code_challenge`).
    - Перенаправляет на Google OAuth.
3. Google возвращает `code` в callback-URL.
4. Сервер:
    - Проверяет CSRF-токен (`state`).
    - Обменивает `code` на ID-токен.
    - Верифицирует подпись токена.
    - Создает/обновляет пользователя в базе данных.
    - Устанавливает JWT-куки.

### Переменные окружения (`.env`)
```bash
GOOGLE_CLIENT_ID="ваш-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="ваш-секрет"
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Для разработки
```

🔐 Two-Factor Authentication (2FA)
Полноценная система двухфакторной аутентификации с поддержкой:

qr — подключение через Google Authenticator;

manual — ввод секрета вручную;

email — код подтверждения по почте.

Особенности:
Генерация и хранение TOTP-секретов;

Подтверждение кода (TOTP или email);

Ограничение попыток (Redis rate limit);

Статус 2FA и возможность отключения.

Архитектура:
Разделено на use-case роутеры:

ts
Копировать
Редактировать
export const twoFARouter = router({
  ...setupRouter,     // включение 2FA
  ...confirmRouter,   // подтверждение
  ...statusRouter,    // проверка статуса
  ...requestRouter,   // повторный код
  ...disable2FARouter // отключение
});
🛡️ Auth Router Structure (tRPC + 2FA + Redis)
📁 Структура
swift
Копировать
Редактировать
/trpc/routers/auth/
├── login.ts               // Процедура входа с защитой от спама
├── verify2FA.ts           // Подтверждение 2FA (email/QR/manual)
├── getCurrentUser.ts      // Получение текущего авторизованного пользователя
├── index.ts               // Сборка authRouter
🔒 Возможности
Логин с защитой от спама — Redis-rate limiter (/login)

2FA подтверждение после логина:

Email-код (через Redis и verifyEmail2FA)

QR-код / Manual secret (OTP otplib)

Авторизация через JWT:

Access / Refresh токены

Установка токенов в cookies

Проверка авторизации через getCurrentUser

🔄 login.ts
ts
Копировать
Редактировать
const login = publicProcedure.input(loginSchema).mutation(...);
Проверка email, пароля и статуса

Redis защита от частых логинов

Поддержка 2FA: если включено — requires2FA = true, иначе выдача токенов

🔁 verify2FA.ts
ts
Копировать
Редактировать
const verify2FAAfterLogin = publicProcedure.input(...).mutation(...);
Проверка 2FA по выбранному методу (email, qr, manual)

Удаляет Redis ключ сессии 2FA

Генерирует JWT и логирует вход

👤 getCurrentUser.ts
ts
Копировать
Редактировать
const getCurrentUser = publicProcedure.query(...);
Проверяет, что пользователь в сессии

Возвращает ctx.session.user
GET /api/trpc/getEmailStatus.getEmailStatus
🔐 Protected
Проверяет, верифицирован ли email текущего авторизованного пользователя.

Возвращает:

ts
Копировать
Редактировать
{
verified: boolean;
}
Использует: ctx.session.user.id

Источник: getEmailStatusRout.getEmailStatus

POST /api/trpc/logout.logout
🔓 Public (но работает только если есть refreshToken cookie)
Выход из аккаунта:

Удаляет refreshToken из activeRefreshTokens в базе данных.

Удаляет куки token и refreshToken.

Поведение:

Даже если кука отсутствует — возвращает success: true (чтобы UI не падал).

JWT проверяется перед удалением токена из БД.

Возвращает:

ts
Копировать
Редактировать
{
success: true;
message: string;
}
Источник: logoutRouter.logout

🧾 Auth API (tRPC Routers)
📌 registerRouter.register
Регистрация нового пользователя с валидацией, хэшированием пароля, защитой от спама и email-верификацией.

🔐 Input:
email: string (валидируется через zod)

password: string

⚙️ Процесс:
Rate limit по IP — защита от спама (Redis).

Проверка: существует ли пользователь с этим email.

Хэширование пароля через argon2.

Генерация токена верификации (UUID) и установка времени истечения (через date-fns).

Удаление старых неподтверждённых аккаунтов с истекшим токеном.

Создание пользователя и параллельная генерация refresh/access JWT токенов.

Сохранение verificationToken и tokenId в базе.

Отправка email со ссылкой на подтверждение почты.

Установка JWT токенов в cookies (через setAuthCookies).

✅ Output:
ts
Копировать
Редактировать
{
success: true,
message: "Регистрация прошла успешно. Подтвердите почту."
}
🔁 refreshTokenRouter.refreshToken
Обновление пары access/refresh токенов, если refresh токен ещё действителен и авторизован.

📥 Input:
Ничего, но refreshToken читается из cookies.

⚙️ Процесс:
Чтение refreshToken из cookie (через next/headers).

Декодирование payload (без верификации), проверка структуры и наличия userId, jti, isRefresh.

Поиск пользователя по userId.

Проверка: находится ли jti в массиве активных токенов пользователя (activeRefreshTokens[]).

Проверка подписи JWT (включая ignoreExpiration: true).

Генерация новой пары access/refresh токенов (через generateTokens).

Обновление activeRefreshTokens пользователя — старый jti удаляется, новый добавляется.

Установка новых токенов в cookies.

✅ Output:
ts
Копировать
Редактировать
{
success: true,
userId: string
}
🧰 Используемые технологии:
tRPC — typesafe-роутинг

argon2 — безопасное хэширование пароля

jsonwebtoken — генерация и проверка JWT токенов

Redis — защита от brute-force (rate limit)

Prisma — ORM для PostgreSQL/MySQL/SQLite и др.

Zod — схема валидации входных данных

next/headers — безопасный доступ к cookies на сервере

Resend/email — отправка писем (предположительно)
