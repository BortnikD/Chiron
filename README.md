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
| `SPRING_PROFILES_ACTIVE` | Для запуска из IDE / Java: `local` или `production`. Локальный Compose всегда задаёт `local` |

Адрес базы для бэкенда (`SPRING_DATASOURCE_URL`) задаётся в `docker/docker-compose.local.yaml` автоматически —
внутри сети compose база доступна по имени сервиса `postgres`, а не по `localhost`.
Параметр `--env-file .env` явно загружает переменные из корня репозитория; compose-файлы находятся в `docker/`.

### 2. Собрать и запустить

```bash
docker compose --env-file .env -f docker/docker-compose.local.yaml up -d --build
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
docker compose --env-file .env -f docker/docker-compose.local.yaml ps
docker compose --env-file .env -f docker/docker-compose.local.yaml logs -f backend
```

У `chiron-backend` в колонке `STATUS` должно быть `(healthy)`: compose проверяет
`GET /actuator/health/readiness`. Вручную состояние можно посмотреть на http://localhost:8080/actuator/health
(ожидается `{"status":"UP"}`).

Когда в логах появится `Started ...Application`, откройте http://localhost:8080/scalar.html
(см. раздел [Документация](#документация)) и авторизуйтесь под администратором из `.env`.

### Полезные команды

| Действие | Команда |
|---|---|
| Остановить контейнеры | `docker compose --env-file .env -f docker/docker-compose.local.yaml down` |
| Остановить и **удалить данные БД** | `docker compose --env-file .env -f docker/docker-compose.local.yaml down -v` |
| Пересобрать бэкенд после изменений в коде | `docker compose --env-file .env -f docker/docker-compose.local.yaml up -d --build backend` |
| Поднять только базу (например, чтобы запускать бэкенд из IDE) | `docker compose --env-file .env -f docker/docker-compose.local.yaml up -d postgres` |
| Подключиться к базе через psql | `docker exec -it chiron-postgres psql -U postgres -d chiron` |

Если порт `5432` или `8080` уже занят на вашей машине, поменяйте левую часть в секции `ports`
в `docker/docker-compose.local.yaml` (например, `"5433:5432"`).

## Демо с историей клиники

`docker/docker-compose.demo.yaml` запускается самостоятельно: `.env` не нужен. У деморежима отдельные сеть,
том базы и порты, поэтому локальная и production-базы не затрагиваются.

```bash
docker compose -f docker/docker-compose.demo.yaml up -d --build
docker compose -f docker/docker-compose.demo.yaml logs -f seed
```

После миграций Flyway и готовности бэкенда контейнер `seed` заполнит базу и завершится с кодом `0`.
Дождитесь таблицы с итоговыми количествами в его логах, прежде чем открывать данные.
При повторном запуске данные сохраняются: наличие контрольного демопользователя означает, что вся
транзакция заполнения уже прошла успешно. История привязана к дате **первого заполнения**, а не перезапуска.

В наборе 600 клиентов, 900 питомцев шести видов, восемь врачей, три специализации и 12 услуг
(одна неактивная). За два года создаются более 10 тысяч приёмов с сезонностью и ростом загрузки,
завершениями, отменами и неявками; ещё на 60 дней вперёд — подтверждённые и ожидающие записи.
Есть повторные визиты, медицинские заметки, архивные питомцы, прививки с просроченными и близкими
сроками ревакцинации, прочитанные и непрочитанные уведомления, отпуска и изменённые часы работы.
Исторические цены ниже текущих. Объёмы приёмов зависят от даты заполнения.

| Доступ | Адрес / логин | Пароль |
|---|---|---|
| API и Scalar | http://localhost:8081/scalar.html | — |
| Администратор | `admin@demo.chiron.local` | `demoAdmin123` |
| Врачи | `vet1@seed.chiron.local` … `vet8@seed.chiron.local` | `password123` |
| Клиенты | `client1@seed.chiron.local` … `client600@seed.chiron.local` | `password123` |
| PostgreSQL | `localhost:5433`, база / пользователь `chiron_demo` | `demo_database_password` |

Compose поднимает бэкенд и базу; интерфейс админки должен обращаться к API `http://localhost:8081`.
Для графиков можно выбрать текущий месяц, год или весь двухлетний период. Все данные вымышленные;
общеизвестные демопароли и JWT-секрет подходят только для локального запуска. Порты доступны с localhost.

```bash
# Stop and keep the data
docker compose -f docker/docker-compose.demo.yaml down

# Verify the generated history again
docker compose -f docker/docker-compose.demo.yaml run --rm seed psql -X -v ON_ERROR_STOP=1 -f /seed/verify-test-data.sql

# Recreate the history relative to today; deletes only this demo database
docker compose -f docker/docker-compose.demo.yaml down -v
docker compose -f docker/docker-compose.demo.yaml up -d --build
```

Существующий `chiron/scripts/seed-test-data.sql` также можно выполнять вручную после миграций
через `psql -v ON_ERROR_STOP=1 -f ...`. Вместе с ним нужны `verify-test-data.sql` в той же папке и
актуальная схема. Он повторно создаёт все строки с ID `5eed…` и зависимые от них записи, включая
созданные вручную записи, связанные с демоданными. Это отличается от автоматического запуска
`seed-demo.sql`, который пропускает уже заполненную базу. Проверки целостности выполняются до коммита.
Ручное перезаполнение существующей истории может занимать несколько минут из-за каскадных связей.

## Запуск бэкенда в production

`docker/docker-compose.production.yaml` — самостоятельный файл для одного сервера с PostgreSQL и бэкендом.
Он запускается отдельно от локального Compose, без объединения через несколько `-f`.
Образ собирается на сервере из текущего исходного кода тем же Dockerfile.

1. Скопируйте `.env.production.example` в `.env.production` и заполните пустые значения.
   Сгенерируйте отдельный `JWT_SECRET` командами из `.env.example`, задайте уникальные пароли БД и администратора.
   `FRONTEND_ORIGIN` — публичный origin фронтенда, например `https://chiron.example.com`, без пути и завершающего `/`.
   `.env.production` исключён из Git; на Linux ограничьте доступ: `chmod 600 .env.production`.
2. Проверьте конфигурацию и запустите контейнеры:

   ```bash
   docker compose --env-file .env.production -f docker/docker-compose.production.yaml config --quiet
   docker compose --env-file .env.production -f docker/docker-compose.production.yaml up -d --build
   ```

3. Проверьте состояние и логи:

   ```bash
   docker compose --env-file .env.production -f docker/docker-compose.production.yaml ps
   docker compose --env-file .env.production -f docker/docker-compose.production.yaml logs -f backend
   ```

Compose требует непустые секреты, учётные данные и `FRONTEND_ORIGIN`. Профиль `production` задан явно:
документация API отключена, CORS использует указанный origin. Переменные передаются через `environment`;
`--env-file .env.production` нужен во всех командах, чтобы не подставить локальные значения из `.env`.
Переменные текущего shell имеют приоритет над `--env-file`, поэтому не экспортируйте локальные секреты на сервере.

PostgreSQL не публикует порт на хосте. Бэкенд доступен только по `127.0.0.1:8080`:
настройте HTTPS reverse proxy на этом же хосте с upstream `http://127.0.0.1:8080`.
Фронтенд, reverse proxy и TLS в этот Compose не входят.

Проект Compose называется `chiron-production`, данные хранятся в отдельном volume
`chiron-production_postgres_data`. Не меняйте имя проекта при обновлении — другое имя создаст другой volume.
Оба варианта используют порт хоста `8080`, поэтому одновременный запуск на одном хосте требует смены порта одного из них.

Для обновления повторите команду `up -d --build`. Для остановки используйте:

```bash
docker compose --env-file .env.production -f docker/docker-compose.production.yaml down
```

Не добавляйте `-v`: это удалит данные БД. Перед первым запуском и обновлениями настройте резервное копирование
существующей БД; смена `POSTGRES_*` не меняет учётные данные уже инициализированного volume.

## Окружения

Общие настройки находятся в `chiron/src/main/resources/application.yaml`, различия — в
`application-local.yaml` и `application-production.yaml` рядом с ним.

- `local`: локальная БД, CORS для localhost:3000 и localhost:5173, открытая документация API.
- `production`: документация отключена и заблокирована. Production Compose задаёт подключение к своей БД
  и передаёт `FRONTEND_ORIGIN`, `JWT_SECRET` и `ADMIN_*` из `.env.production`.
  При запуске без Compose задайте `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`,
  `SPRING_DATASOURCE_PASSWORD`, `FRONTEND_ORIGIN`, `JWT_SECRET` и `ADMIN_*` самостоятельно.

При запуске из IDE задайте `SPRING_PROFILES_ACTIVE=local` и переменные JWT / администратора в окружении
конфигурации запуска. Spring Boot сам не загружает `.env`; локальный Compose использует `env_file`,
production Compose — явный `environment`. Для production используйте `SPRING_PROFILES_ACTIVE=production`. Выбирайте один профиль.
Без профиля локальные настройки БД не подставляются, документация закрыта.

## HTTP-логи

Бэкенд пишет на уровне INFO метод, путь, HTTP-статус и время обработки каждого запроса, например:
`POST /api/v1/auth/login -> 200 (18 ms)`. Фильтр работает перед Spring Security и учитывает ответы `401/403`.
Тела запросов и ответов, query-параметры и заголовки этим фильтром не логируются.
В Docker записи доступны через `docker compose ... logs -f backend` с параметрами выбранного окружения.

## Документация

Подробное описание API: где открыть документацию, как авторизоваться и какие эндпоинты за что отвечают —
в [`docs/api.md`](docs/api.md).

После запуска бэкенда с профилем `local` документация доступна по адресам:

| Что | Адрес |
|---|---|
| Scalar (основной вариант) | http://localhost:8080/scalar.html |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON (для Postman, генерации клиента) | http://localhost:8080/v3/api-docs |

Прочее:

- [`docs/usecase.excalidraw`](docs/usecase.excalidraw) — use case диаграмма; открывается на https://excalidraw.com
  или в VS Code с расширением Excalidraw.
