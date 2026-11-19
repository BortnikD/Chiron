# Бэкенд Chiron

Chiron предоставляет REST API для записи на приём, ведения карточек питомцев и истории вакцинаций,
управления расписанием врачей и просмотра статистики клиники. По WebSocket сервер доставляет уведомления
о событиях и напоминания.

## Локальный запуск

### Демо API через Docker Compose

Из корня репозитория запустите бэкенд, PostgreSQL, Garage и загрузку демоданных. Нужен только Docker с Compose.

```bash
docker compose -f docker/docker-compose.demo.yaml up -d --build backend seed seed-media
docker compose -f docker/docker-compose.demo.yaml ps -a
```

API доступен на `http://localhost:8081`. Проверьте, что `backend` стал `healthy`, а `seed` и `seed-media`
завершились с кодом `0`. `seed` заполняет БД, `seed-media` загружает фотографии через API.

В PowerShell войдите под демо-клиентом и запросите его сводку. В ней есть счётчики питомцев, приёмов и прививок,
сведения о ближайшем приёме и число непрочитанных уведомлений.

```powershell
$api = 'http://localhost:8081/api/v1'
$login = Invoke-RestMethod -Method Post -Uri "$api/auth/login" -ContentType 'application/json' `
  -Body (@{ email = 'client1@seed.chiron.local'; password = 'password123' } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.result.accessToken)" }
Invoke-RestMethod -Uri "$api/client/summary" -Headers $headers | Select-Object -ExpandProperty result
```

Схемы и интерактивные запросы доступны в [Swagger UI](http://localhost:8081/swagger-ui.html)
и [Scalar](http://localhost:8081/scalar.html). Машиночитаемая спецификация — [OpenAPI JSON](http://localhost:8081/v3/api-docs).

### Разработка на JDK 21

В корне репозитория скопируйте [`.env.example`](../.env.example) в `.env` и задайте `JWT_SECRET` в Base64
и `ADMIN_PASSWORD`. Из того же каталога запустите PostgreSQL и Garage.

```bash
docker compose --env-file .env -f docker/docker-compose.local.yaml up -d postgres garage
```

Установите `SPRING_PROFILES_ACTIVE=local` и передайте в окружение процесса `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`ADMIN_PHONE`, `STORAGE_ACCESS_KEY` и `STORAGE_SECRET_KEY` из `.env`. При запуске напрямую Spring Boot не загружает
`.env` автоматически. В IDE переменные передаются в конфигурации запуска. Если меняли имя БД или реквизиты
PostgreSQL, укажите `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` и `SPRING_DATASOURCE_PASSWORD`.
Если меняли настройки хранилища или имя администратора, передайте соответствующие `STORAGE_*` и `ADMIN_*`.

С JDK 21 в `JAVA_HOME` или `PATH` выполните из `chiron/` команду `./gradlew bootRun` (`.\gradlew.bat bootRun`
в PowerShell) либо запустите `ChironApplicationKt` в IDE. API будет доступен на `http://localhost:8080`.
Flyway применит миграции, а приложение создаст администратора, если `ADMIN_EMAIL` ещё не занят.
Для входа используйте `ADMIN_EMAIL` и `ADMIN_PASSWORD`.

`GET /actuator/health/readiness` проверяет готовность приложения, подключение к БД и доступ к бакету.
При исправных зависимостях возвращает `200` и `{"status":"UP"}`, при недоступной зависимости — `503`.
Причину сбоя можно найти в логах `bootRun` или в `docker compose -f docker/docker-compose.demo.yaml logs backend postgres garage`
для демо.

## Возможности API

Все прикладные REST-маршруты начинаются с `/api/v1`. Вход и регистрация возвращают `result.accessToken`.
В защищённых запросах передавайте `Authorization: Bearer <token>`. Публичная регистрация создаёт `CLIENT`.
JWT живёт 30 дней по умолчанию. После истечения срока нужно войти снова.

| Раздел | Что доступно |
|---|---|
| Публичные GET | Виды животных, специализации, услуги с ценой и длительностью по видам, врачи и их допуски, расписания и исключения, поиск и проверка слотов |
| `/users/me`, `/notifications` | Свой профиль и смена пароля, список уведомлений, счётчик непрочитанных и отметка о прочтении |
| `/client/...` | Свои питомцы и их фотографии, запись на приём и отмена, история вакцинаций, сводка кабинета |
| `/veterinarian/...` | Свой профиль и фото, назначенные приёмы, заметки, оказанные услуги, повторные приёмы, пациенты и их вакцинации |
| `/admin/...` | Пользователи, врачи, питомцы, прививки, приёмы, расписания, справочники, личные сообщения пользователям и статистика по периодам, врачам, услугам и видам животных |

- **Запись на приём.** Клиент выбирает питомца, одну или несколько услуг и свободный слот. Для плана все услуги
  должны относиться к одной специализации врача и быть доступны для вида питомца. Длительность слота равна сумме
  длительностей услуг плюс наибольший буфер. По умолчанию начало слота привязано к сетке в 15 минут в часовом поясе
  `Europe/Moscow`. При сохранении сервер повторно проверяет расписание, а ограничение PostgreSQL защищает от
  одновременного бронирования пересекающихся приёмов. Сохранённые цены используются при расчёте стоимости и статистики.
- **Уведомления.** Сервер сохраняет их в PostgreSQL и после фиксации транзакции отправляет в активные сессии.
  Для подключения к `/ws` передайте Bearer-токен в заголовке STOMP `CONNECT` и подпишитесь на
  `/user/queue/notifications`. Пропущенные уведомления можно получить через REST. Планировщик раз в 5 минут ищет
  приёмы на ближайшие 24 часа, а ежедневно в 09:00 по времени клиники проверяет приближающиеся и просроченные прививки.
  Встроенный STOMP-брокер доставляет сообщения в пределах одного экземпляра бэкенда.
- **Фотографии.** API принимает JPEG и PNG до 5 МБ. Бэкенд сохраняет JPEG 64×64 и 512×512 в закрытом S3-бакете,
  записывает ключ в PostgreSQL и возвращает ссылки, подписанные на 15 минут по умолчанию. Для получения новой ссылки
  повторно запросите карточку питомца или врача. Удаление старых объектов выполняется в фоне.

Успешный REST-ответ с телом содержит `success`, `result`, `error` и `timestamp`.
Фильтры, пагинация, статусы приёма, форматы ошибок и примеры запросов описаны в [руководстве по API](../docs/api.md).

## Стек

- Kotlin 2.3.21, Java 21 и Gradle Wrapper 9.7.1.
- Spring Boot 4.1.2, Spring MVC и Bean Validation.
- Spring Security и JWT — авторизация и разграничение доступа.
- Exposed 1.5 / JDBC и Flyway — доступ к данным и миграции.
- WebSocket / STOMP — уведомления; OpenAPI, Swagger UI и Scalar — документация API.
- AWS SDK for Java — работа с S3-совместимым хранилищем.
- PostgreSQL 18 — основная БД, Garage 2.5 — S3-совместимое хранилище фотографий.

## Архитектура

Исходники бэкенда находятся в [`src/main/kotlin/com/bortnik/chiron`](src/main/kotlin/com/bortnik/chiron).
HTTP-запрос проходит через контроллер и сценарий использования к интерфейсу репозитория,
который реализован на Exposed. Код `domain` не зависит от Spring и Exposed.

- `presentation` — REST-контроллеры, входные и выходные DTO, обработка ошибок, доставка по STOMP.
- `application` — транзакционные сценарии в `usecase/{admin,client,veterinarian,common}` и проверка доступа к ресурсам.
- `domain` — сущности, правила валидации и расписания, интерфейсы репозиториев и хранилища фотографий.
- `infrastructure` — SQL-запросы Exposed, клиент S3, JWT, настройка WebSocket, планировщики и создание администратора.

## Конфигурация, миграции и тесты

- Общие настройки находятся в [`application.yaml`](src/main/resources/application.yaml). В нём заданы
  `clinic.zone`, `clinic.slot-step-min`, JWT, расписание напоминаний и время действия ссылок на фотографии.
  Профиль [`local`](src/main/resources/application-local.yaml) включает документацию API и разрешает
  браузерные запросы с локальных origin. Профиль [`production`](src/main/resources/application-production.yaml)
  использует параметры развёртывания и закрывает документацию. `STORAGE_ENDPOINT` задаёт адрес для сервера,
  а `STORAGE_PUBLIC_ENDPOINT` — адрес, который попадёт в подписанные ссылки.
- Схема PostgreSQL управляется [миграциями Flyway](src/main/resources/db/migration). При обновлении старой БД
  до `V11` устраните пересечения неотменённых приёмов у одного врача. Если `btree_gist` ещё не установлен,
  установите расширение заранее или дайте пользователю Flyway право на его установку.
- Демо загружает данные после применения миграций. [`seed-demo.sql`](scripts/seed-demo.sql) проверяет наличие
  набора перед загрузкой. Прямой запуск [`seed-test-data.sql`](scripts/seed-test-data.sql) пересоздаёт тестовые
  записи вместе со связанными данными. Используйте его только в отдельной БД для разработки.

Тесты бэкенда используют JUnit 5 и Mockito. Запускайте их из каталога `chiron/` с JDK 21.

```bash
./gradlew test
```

В PowerShell команда — `.\gradlew.bat test`. HTML-отчёт появится в `build/reports/tests/test/index.html`.

## Документация

- [Руководство по API](../docs/api.md).
- [Развёртывание проекта через Docker](../README.md#запуск-через-docker).
- Локальный API: [Scalar](http://localhost:8080/scalar.html),
  [Swagger UI](http://localhost:8080/swagger-ui.html), [OpenAPI JSON](http://localhost:8080/v3/api-docs).
  Для демо используйте порт `8081`.
