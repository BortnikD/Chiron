# Chiron

Chiron - ветеринарная клиника

## Backend
*chiron* - Kotlin Spring Boot Application

## Frontend
*web-ui* - Typescript Next.js Application

## Запуск бэкенда через Docker Compose

Понадобится установленный [Docker](https://docs.docker.com/get-docker/) с плагином Compose
(в Docker Desktop он уже есть). JDK и Gradle локально не нужны: jar собирается внутри образа.

Все команды выполняются из корня репозитория.

### 1. Создать файл `.env`

Скопируйте шаблон:

```bash
# Linux / macOS / Git Bash
cp .env.example .env
```

```powershell
# PowerShell
Copy-Item .env.example .env
```

Затем откройте `.env` и проверьте значения:

| Переменная | Назначение |
|---|---|
| `JWT_SECRET` | Секрет для подписи JWT. **Сгенерируйте свой** — команды есть в комментарии в `.env.example`. При смене секрета все выданные токены станут недействительными |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` | Первый администратор. Создаётся при старте, если пользователя с таким email ещё нет. **Смените пароль** |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Учётные данные и имя базы. Используются и контейнером PostgreSQL, и бэкендом |
| `SPRING_PROFILES_ACTIVE` | Необязательно. Активные Spring-профили через запятую |

Адрес базы для бэкенда (`SPRING_DATASOURCE_URL`) задаётся в `docker-compose.local.yaml` автоматически —
внутри сети compose база доступна по имени сервиса `postgres`, а не по `localhost`.

### 2. Собрать и запустить

```bash
docker compose -f docker-compose.local.yaml up -d --build
```

Поднимутся два контейнера:

| Контейнер | Что это | Порт на хосте |
|---|---|---|
| `chiron-postgres` | PostgreSQL 18 | `5432` |
| `chiron-backend` | Spring Boot приложение | `8080` |

Бэкенд стартует только после того, как база пройдёт healthcheck. Первая сборка образа занимает несколько минут
(скачиваются зависимости Gradle), последующие — быстрее за счёт кэша слоёв.

### 3. Проверить, что всё работает

```bash
docker compose -f docker-compose.local.yaml ps
docker compose -f docker-compose.local.yaml logs -f backend
```

У `chiron-backend` в колонке `STATUS` должно быть `(healthy)`: compose проверяет
`GET /actuator/health/readiness`. Вручную состояние можно посмотреть на http://localhost:8080/actuator/health
(ожидается `{"status":"UP"}`).

Когда в логах появится `Started ...Application`, откройте http://localhost:8080/scalar.html
(см. раздел [Документация](#документация)) и авторизуйтесь под администратором из `.env`.

### Полезные команды

| Действие | Команда |
|---|---|
| Остановить контейнеры | `docker compose -f docker-compose.local.yaml down` |
| Остановить и **удалить данные БД** | `docker compose -f docker-compose.local.yaml down -v` |
| Пересобрать бэкенд после изменений в коде | `docker compose -f docker-compose.local.yaml up -d --build backend` |
| Поднять только базу (например, чтобы запускать бэкенд из IDE) | `docker compose -f docker-compose.local.yaml up -d postgres` |
| Подключиться к базе через psql | `docker exec -it chiron-postgres psql -U postgres -d chiron` |

Если порт `5432` или `8080` уже занят на вашей машине, поменяйте левую часть в секции `ports`
в `docker-compose.local.yaml` (например, `"5433:5432"`).

## Документация

Подробное описание API: где открыть документацию, как авторизоваться и какие эндпоинты за что отвечают —
в [`docs/api.md`](docs/api.md).

После запуска бэкенда документация доступна по адресам:

| Что | Адрес |
|---|---|
| Scalar (основной вариант) | http://localhost:8080/scalar.html |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON (для Postman, генерации клиента) | http://localhost:8080/v3/api-docs |

Прочее:

- [`docs/usecase.excalidraw`](docs/usecase.excalidraw) — use case диаграмма; открывается на https://excalidraw.com
  или в VS Code с расширением Excalidraw.
