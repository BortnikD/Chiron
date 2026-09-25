# Документация API Chiron

Документация API генерируется автоматически из кода бэкенда (springdoc-openapi). Отдельно её поддерживать не нужно:
описания эндпоинтов берутся из аннотаций `@Operation` и `@Tag` в контроллерах.

## Как открыть

Сначала запустите бэкенд (`chiron`). По умолчанию он слушает порт `8080`.

| Вариант | Адрес | Когда использовать |
|---|---|---|
| **Scalar** | http://localhost:8080/scalar.html | Основной вариант: удобный поиск, примеры запросов на разных языках, отправка запросов из браузера. Загружается с CDN, нужен интернет |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | Классический интерфейс; работает без интернета |
| **OpenAPI JSON** | http://localhost:8080/v3/api-docs | Сырая спецификация: импорт в Postman / Insomnia / Bruno, генерация клиента для фронтенда |
| **Use case диаграмма** | [`docs/usecase.excalidraw`](./usecase.excalidraw) | Открыть на https://excalidraw.com (Open → выбрать файл) или в VS Code с расширением Excalidraw |

Документация (`/scalar.html`, `/swagger-ui.html`, `/v3/api-docs`) доступна без авторизации.

## Проверка состояния (health check)

Эндпоинты Spring Boot Actuator. Доступны **без токена**, только `GET`. В документации они в группе `Actuator`.

| Эндпоинт | Что проверяет | Когда использовать |
|---|---|---|
| `GET /actuator/health` | Приложение и подключение к базе данных | Общая проверка «бэкенд работает»: индикатор на фронтенде, мониторинг |
| `GET /actuator/health/readiness` | Приложение запущено и база данных доступна | Можно ли уже отправлять запросы (используется в healthcheck Docker Compose) |
| `GET /actuator/health/liveness` | Процесс приложения жив (базу **не** проверяет) | Нужно ли перезапускать контейнер |

Ответ **не** обёрнут в `ApiResponse`. Подробности о компонентах (версия БД, место на диске и т. п.) не
отдаются, только итоговый статус:

```json
{ "status": "UP" }
```

| HTTP-статус | `status` | Значение |
|---|---|---|
| `200` | `UP` | Всё работает |
| `503` | `DOWN` / `OUT_OF_SERVICE` | Бэкенд запущен, но не готов, например недоступна база данных |
| нет ответа / сетевая ошибка | — | Бэкенд не запущен или недоступен по сети |

Пример проверки на фронтенде:

```ts
export async function isBackendHealthy(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:8080/actuator/health", {
      signal: AbortSignal.timeout(3000),
    });
    // 503 comes with a JSON body too, so checking response.ok is enough.
    return response.ok;
  } catch {
    // Network error or timeout: the backend is not reachable.
    return false;
  }
}
```

CORS для этих эндпоинтов настроен так же, как для остального API (origin'ы из `cors.allowed-origins`).

## Авторизация

API использует JWT-токен. Токен один и живёт 30 дней, refresh-токена нет.

1. Получите токен:
   - `POST /api/v1/auth/register` — регистрация, всегда создаёт пользователя с ролью `CLIENT`;
   - `POST /api/v1/auth/login` — вход по email и паролю.
2. Возьмите `result.accessToken` из ответа.
3. Передавайте его в заголовке `Authorization: Bearer <token>`.
   - В Scalar: блок **Authentication** → `bearerAuth` → вставить токен.
   - В Swagger UI: кнопка **Authorize** → вставить токен (без слова `Bearer`).
4. `GET /api/v1/auth/me` — проверить, под кем вы авторизованы.

Первый администратор создаётся при старте приложения из переменных `ADMIN_*` в файле `chiron/.env`
(шаблон — `chiron/.env.example`). Ветеринаров и других администраторов создаёт администратор через
`POST /api/v1/admin/users`.

## Что куда

Эндпоинты разделены по ролям. Раздел в документации соответствует префиксу URL, а группы (теги) подписаны
префиксом роли.

| Префикс | Доступ | Группы в документации | Что внутри |
|---|---|---|---|
| `/api/v1/auth` | регистрация и вход — всем, `/me` — с токеном | `Auth` | Регистрация, вход, текущий пользователь |
| `/api/v1/...` (GET) | всем, без токена | `Species`, `Specializations`, `Services`, `Service species`, `Veterinarians`, `Veterinarian species permissions`, `Work schedules`, `Schedule exceptions`, `Appointments` | Справочники клиники: виды животных, специализации, услуги и их цены по видам, врачи и какие виды они лечат, расписание врачей, проверка свободного слота |
| `/api/v1/client/...` | `CLIENT` | `Client: Pets`, `Client: Appointments`, `Client: Vaccinations` | Свои питомцы; запись на приём, список и отмена своих записей; прививки своих питомцев |
| `/api/v1/veterinarian/...` | `VETERINARIAN` | `Veterinarian: Profile`, `Veterinarian: Appointments`, `Veterinarian: Pets`, `Veterinarian: Vaccinations` | Свой профиль; свои записи — смена статуса и заметки врача; пациенты (питомцы, у которых была запись к этому врачу) и их прививки |
| `/api/v1/admin/...` | `ADMIN` | `Admin: *` | Полное управление: пользователи, питомцы, записи, прививки, врачи и их допуски к видам, расписания и исключения из расписания, справочники |

Клиент и ветеринар видят только свои данные. Попытка обратиться к чужому ресурсу возвращает `403`.
Администратор работает с данными любых пользователей.

## Типичный сценарий записи на приём

1. `GET /api/v1/services` и `GET /api/v1/services/{serviceId}/species` — выбрать услугу, доступную для вида питомца.
2. `GET /api/v1/veterinarians` и `GET /api/v1/veterinarians/{id}/species` — выбрать врача, который лечит этот вид.
3. `GET /api/v1/work-schedules?veterinarianId=...` и `GET /api/v1/schedule-exceptions?veterinarianId=...` — посмотреть
   расписание врача.
4. `GET /api/v1/appointments/availability` — проверить, свободен ли слот.
5. `POST /api/v1/client/appointments` — записаться. Запись создаётся в статусе `PENDING`, цену считает сервер.
6. Врач подтверждает и завершает приём через `PATCH /api/v1/veterinarian/appointments/{id}`.

Все обновления — `PATCH`: поля, отсутствующие в теле запроса, не меняются; явный `null` очищает nullable-поле.

Статусы записи: `PENDING → CONFIRMED | CANCELLED`, `CONFIRMED → COMPLETED | CANCELLED | NO_SHOW`.
`COMPLETED`, `CANCELLED` и `NO_SHOW` — конечные.

## Формат ответа

Любой ответ с телом обёрнут в `ApiResponse`:

```json
{
  "success": true,
  "result": { },
  "error": null,
  "timestamp": "2026-09-15T10:00:00Z"
}
```

При ошибке `success = false`, `result = null`, а в `error` лежат имя исключения, сообщение, HTTP-статус, путь запроса
и, для ошибок валидации, список нарушений по полям (`violations`).

Постраничные списки — `GET /api/v1/admin/{appointments,users,pets,vaccinations,schedule-exceptions}`,
`GET /api/v1/client/appointments`, `GET /api/v1/veterinarian/{appointments,vaccinations}` — принимают `page`
(с 0, по умолчанию 0) и `size` (1–100, по умолчанию 20), а в `result` возвращают страницу:

```json
{
  "items": [ ],
  "page": 0,
  "size": 20,
  "totalElements": 41,
  "totalPages": 3
}
```

`totalElements` — сколько записей подходит под фильтр всего, а не на текущей странице. Фильтры необязательны
и объединяются через AND; несколько статусов передаются повтором параметра: `?status=PENDING&status=CONFIRMED`.
Текстовые фильтры (`search`, `name`) ищут подстроку без учёта регистра. Публичные `GET /api/v1/services`
и `GET /api/v1/veterinarians` отдают только активные записи; все записи, включая неактивные, — в
`GET /api/v1/admin/services` и `GET /api/v1/admin/veterinarians`.

| Статус | Когда |
|---|---|
| `200` / `201` / `204` | Успех; `201` — при создании, `204` — при удалении (без тела) |
| `400` | Ошибка валидации или некорректный запрос |
| `401` | Нет токена, токен недействителен или истёк, неверный логин/пароль |
| `403` | Недостаточно прав или чужой ресурс |
| `404` | Сущность не найдена |
| `409` | Конфликт: такая запись уже существует или на неё ссылаются другие данные |
| `422` | Нарушено бизнес-правило (слот занят, питомец в архиве, врач не лечит этот вид и т. п.) |
| `503` | База данных недоступна |
