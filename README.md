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
