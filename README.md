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
