# Chiron

Chiron — приложение для ветеринарной клиники: питомцы и прививки, запись на приём,
расписания врачей, уведомления и статистика. Роли: клиент, ветеринар и администратор.

## Стек

- **Бэкенд (`chiron/`):** Kotlin 2.3, Java 21, Spring Boot 4.1, Spring Security / JWT,
  Exposed, PostgreSQL 18, Flyway, WebSocket / STOMP, OpenAPI.
- **Фронтенд (`web-ui/`):** TypeScript, Next.js 16, React 19, Tailwind CSS 4.
  Пока это стартовая страница Next.js без подключения к API.
- **Запуск:** Docker Compose; для разработки без контейнера бэкенда — JDK 21 и Gradle Wrapper.

## Окружения и `.env`

Все команды ниже выполняются из корня репозитория, если не указано иначе.
Для контейнеров нужен Docker с Compose; JDK и Gradle на хосте не требуются.

| Режим | Spring-профиль | Файл переменных | API / PostgreSQL на хосте |
|---|---|---|---|
| Локальный | `local` | `.env` из `.env.example` | `localhost:8080` / `localhost:5432` |
| Production | `production` | `.env.production` из `.env.production.example` | `127.0.0.1:8080` / порт БД не публикуется |
| Демо | `local` | Не нужен: значения заданы в Compose | `127.0.0.1:8081` / `127.0.0.1:5433` |

Spring-профилей два: `local` и `production`. Демо — отдельный Compose с тестовыми данными.
Выбирайте один профиль; без профиля подключение к локальной БД не настроено, документация API закрыта.

Файлы `.env` и `.env.production` находятся **в корне**, исключены из Git и содержат секреты:

| Переменные | Что задать |
|---|---|
| `JWT_SECRET` | Собственный секрет; команды генерации есть в `.env.example`. Смена секрета делает все выданные JWT недействительными |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` | Первый администратор; создаётся при старте, если email ещё не занят. Изменение `.env` не меняет существующий аккаунт |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Пользователь, пароль и имя БД; смена значений не обновляет уже инициализированную БД |
| `FRONTEND_ORIGIN` | Для production: публичный origin фронтенда, например `https://chiron.example.com`, без пути и завершающего `/` |

Compose явно выбирает профиль. `--env-file` нужен для подстановки значений в Compose;
локальный Compose дополнительно передаёт `.env` бэкенду через `env_file`, production — через `environment`.
Переменные текущего shell имеют приоритет над `--env-file`.
**Spring Boot сам `.env` не читает**: при запуске из IDE или через Java переменные нужно передать процессу.

## Локальный запуск

Скопируйте `.env.example` в `.env` (`cp .env.example .env` в Linux/macOS/Git Bash
или `Copy-Item .env.example .env` в PowerShell). Задайте свой JWT-секрет и пароль администратора, затем:

```bash
docker compose --env-file .env -f docker/docker-compose.local.yaml up -d --build
docker compose --env-file .env -f docker/docker-compose.local.yaml ps
```

Поднимутся PostgreSQL и бэкенд. Flyway применит миграции автоматически.
Проверка готовности: [health/readiness](http://localhost:8080/actuator/health/readiness),
документация: [Scalar](http://localhost:8080/scalar.html).
Для входа используйте `ADMIN_EMAIL` и `ADMIN_PASSWORD` из `.env`.

### Бэкенд из IDE / Gradle

Нужен JDK 21. Поднимите только БД:

```bash
docker compose --env-file .env -f docker/docker-compose.local.yaml up -d postgres
```

Передайте процессу `JWT_SECRET` и `ADMIN_*` из `.env` и выберите `SPRING_PROFILES_ACTIVE=local`.
Профиль использует `jdbc:postgresql://localhost:5432/chiron`, логин и пароль `postgres`.
Если изменили `POSTGRES_*` или порт БД, задайте также `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME` и `SPRING_DATASOURCE_PASSWORD` с соответствующими значениями.
Запустите приложение из IDE либо из каталога `chiron/`:

```bash
./gradlew bootRun
```

В PowerShell используйте `.\gradlew.bat bootRun`. Контейнер бэкенда при таком запуске должен быть остановлен,
чтобы освободить порт `8080`.

## Production

Скопируйте `.env.production.example` в `.env.production` и заполните все пустые значения:
отдельный JWT-секрет, уникальные пароли БД и администратора, `FRONTEND_ORIGIN`.
На Linux ограничьте доступ к файлу: `chmod 600 .env.production`.

```bash
docker compose --env-file .env.production -f docker/docker-compose.production.yaml config --quiet
docker compose --env-file .env.production -f docker/docker-compose.production.yaml up -d --build
docker compose --env-file .env.production -f docker/docker-compose.production.yaml ps
```

Это самостоятельный Compose для одного сервера: БД и бэкенд с профилем `production`.
Бэкенд слушает только `127.0.0.1:8080`; настройте HTTPS reverse proxy на этом же хосте.
Фронтенд, reverse proxy и TLS в Compose не входят. Документация API отключена и заблокирована;
CORS разрешает `FRONTEND_ORIGIN`.

Для запуска без Docker соберите jar командой `./gradlew bootJar` из `chiron/` и запустите
`java -jar build/libs/chiron-0.0.1-SNAPSHOT.jar --spring.profiles.active=production`.
Передайте процессу `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`,
`FRONTEND_ORIGIN`, `JWT_SECRET` и `ADMIN_*`; PostgreSQL в этом случае запускается отдельно.

Перед обновлением сделайте резервную копию БД; для обновления контейнеров повторите `up -d --build`.
Не меняйте имя Compose-проекта `chiron-production`: к нему привязан том данных.
Локальный и production Compose используют один порт `8080`, поэтому одновременно требуют смены порта.

## Демо

Отдельные база и том, вымышленные данные: 600 клиентов, 900 питомцев, восемь врачей,
услуги, прививки, уведомления и двухлетняя история приёмов. `.env` не нужен.

```bash
docker compose -f docker/docker-compose.demo.yaml up -d --build
docker compose -f docker/docker-compose.demo.yaml logs -f seed seed-media
```

Дождитесь успешного завершения `seed` и `seed-media` (код `0`). `seed-media` проверяет загрузку, размеры,
подписанные ссылки, права, замену, удаление и фоновую очистку, затем добавляет фотографии восьми врачам и всем 900 демопитомцам. При следующих запусках данные сохраняются;
история привязана к дате первого заполнения.

| Доступ | Адрес / логин | Пароль |
|---|---|---|
| API / Scalar | [localhost:8081/scalar.html](http://localhost:8081/scalar.html) | — |
| Администратор | `admin@demo.chiron.local` | `demoAdmin123` |
| Врачи | `vet1@seed.chiron.local` … `vet8@seed.chiron.local` | `password123` |
| Клиенты | `client1@seed.chiron.local` … `client600@seed.chiron.local` | `password123` |
| Garage S3 | `localhost:3905` | Только подписанные ссылки |
| PostgreSQL | `localhost:5433`, база и пользователь `chiron_demo` | `demo_database_password` |

Демопорты доступны только с localhost; общеизвестные пароли и JWT-секрет предназначены для локального демо.

## Фронтенд

Нужны Node.js 20.9+ и npm. Из каталога `web-ui/`:

```bash
npm ci
npm run dev
```

Страница откроется на [localhost:3000](http://localhost:3000).
Для production-сборки: `npm run build`, затем `npm start`.
Переменные подключения к API пока не реализованы; `.env` бэкенда фронтенд не использует.

## Логи и остановка

Для выбранного окружения используйте те же `--env-file` и `-f`, что при запуске, заменив
`up -d --build` на `logs -f backend` для логов или на `down` для остановки.
**`down -v` удаляет данные БД выбранного окружения.**

## Документация

- [Руководство по API](docs/api.md) — авторизация, роли, основные сценарии, ответы и уведомления.
- В `local`: [Scalar](http://localhost:8080/scalar.html) (нужен интернет для CDN),
  [Swagger UI](http://localhost:8080/swagger-ui.html), [OpenAPI JSON](http://localhost:8080/v3/api-docs).
  В демо замените порт на `8081`.
- [Use case диаграмма](docs/usecase.excalidraw) — открыть в [Excalidraw](https://excalidraw.com).

## Фотографии ветеринаров и питомцев

Garage запускается вместе с каждым Compose-окружением. Бакет и доступ создаются автоматически;
данные и метаданные сохраняются в отдельных именованных томах. Пользователи фотографий не имеют.
При загрузке Chiron проверяет JPEG/PNG до 5 МБ и 20 млн пикселей, вырезает центральный квадрат
и сохраняет JPEG 64×64 и 512×512 без исходных метаданных. Прозрачность сводится на белый фон.
Оригинал не сохраняется. Версия 64×64 предназначена для аватаров до 32×32 CSS-пикселей на экранах 2×.

В БД хранится `photo_key`, API возвращает `photoUrl`, `photoThumbnailUrl` и `photoUrlExpiresAt`.
Бакет закрыт; ссылки действуют 15 минут. Обладатель ссылки может читать файл до её истечения
или физического удаления объекта; уже скачанные и кешированные копии отозвать нельзя.
Клиент должен повторно получать ссылки через существующий GET ресурса после их истечения.
Интеграция загрузки и отображения фотографий во фронтенд в эту задачу не входит.

Для прямого запуска бэкенда задайте `STORAGE_ACCESS_KEY` и `STORAGE_SECRET_KEY` из `.env.example`,
а Garage поднимите через выбранное Compose-окружение. В Compose внутренний адрес —
`http://garage:3900`, браузерный — `STORAGE_PUBLIC_ENDPOINT` (локально `http://localhost:3900`,
в демо `http://localhost:3905`). Для демо внешний адрес переопределяется отдельной переменной
`DEMO_STORAGE_PUBLIC_ENDPOINT`, чтобы локальный `.env` не подменял демопорт.
Для доступа с другого компьютера нужен внешний адрес вместо localhost.
Production требует собственных ключей, `GARAGE_RPC_SECRET` и внешнего HTTPS endpoint;
прокси для S3 должен сохранять Host, путь и query подписанного запроса. Служебные порты Garage не опубликованы.
Используемый single-node режим не имеет резервирования: нужны резервные копии БД, данных и метаданных Garage.
Тома не удалять при обычном перезапуске.

Миграция V04 сохраняет старые URL врачей в `legacy_photo_url`, но не скачивает их автоматически.
Они больше не используются для отображения; фотографии следует загрузить через новый API.
Объекты после замены/удаления ставятся в очередь в той же транзакции, в том числе при удалении сущности.
Очистка выполняется раз в минуту с повторными попытками. Незавершённые загрузки очищаются через 10 минут.

Демо использует 20 локальных фотографий из `chiron/scripts/fixtures/photos`: восемь портретов врачей
и 12 фотографий животных шести видов. Для питомцев фото выбирается по виду и стабильному ID.
Исходники, авторы, лицензии и параметры обрезки описаны в `photos/sources.json` и `photos/README.md`.
При запуске демо внешние сайты не используются. Два синтетических PNG остаются только для API-проверок.
При обновлении старого демо заглушки распознаются по хешам и заменяются фотографиями;
вручную загруженные фотографии и намеренно удалённые фото сохраняются.
Состояние `seed-media` хранится в `photo_seed_state`; новая база определяется по дате создания демоадминистратора.
Для переноса на другой S3-провайдер сначала скопируйте обе версии объектов с сохранением ключей,
настройте доступ и endpoint, затем проверьте загрузку, подпись URL и удаление.
