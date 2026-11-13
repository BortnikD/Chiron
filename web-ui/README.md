# Chiron Web UI

Веб-интерфейс ветеринарной клиники на Next.js 15 (App Router), React 19, TypeScript
и Tailwind CSS 4. Иконки — Lucide React, уведомления — STOMP.
Интерфейс на русском языке, адаптируется к мобильным экранам, поддерживает светлую и тёмную темы.

## Возможности

- Гость: главная, услуги и цены, каталог и карточки врачей, вход и регистрация.
- Клиент: питомцы и фотографии, прививки, запись на доступное время, история и отмена приёмов, уведомления.
- Врач: приёмы, пациенты и прививки, повторная запись, график, профиль и фотография, уведомления.
- Администратор: статистика, записи, питомцы, прививки, пользователи, врачи, расписания и справочники.
- Личный профиль и настройки; печатная форма консультации.

## Структура

```text
src/
├── app/              # Страницы, кабинеты client/vet/admin, серверные прокси api и media
├── modules/          # API и типы предметных областей
├── shared/           # HTTP-клиент, общие типы, компоненты и WebSocket
├── components/       # Оболочка приложения и компоненты интерфейса
├── context/          # Авторизация и тема
├── styles/           # Дизайн-система chiron.css
└── utils/            # Имена врачей и определение режима окружения
```

HTTP-клиент использует относительные `/api/*`, добавляет Bearer JWT и разбирает `ApiResponse<T>`.
Серверный обработчик `src/app/api/[...path]/route.ts` передаёт запросы бэкенду;
`/actuator/*` перенаправляется через rewrites, `/media/*` — через отдельный серверный обработчик.
WebSocket подключается непосредственно к API, а при HTTPS — к `/ws` на домене фронта.

## Docker Compose

Команды выполняются из корня репозитория. Подготовка `.env`, production и демоаккаунты
описаны в [основном README](../README.md).

```bash
# PostgreSQL, Garage, API и фронтенд на http://localhost:3000
docker compose --env-file .env -f docker/docker-compose.local.yaml up -d --build

# Независимое демо на http://localhost:3001
docker compose -f docker/docker-compose.demo.yaml up -d --build
```

Dockerfile собирает standalone-сервер и запускает его от пользователя `node`.
Во всех окружениях используется production-сборка; для обновления исходников пересоберите `frontend`.
В демо дополнительно включены кнопки быстрого входа и подсказки разработчика.

## Разработка без контейнера фронтенда

Нужны Node.js 22+ и npm. API и Garage должны быть запущены.
Если контейнер `frontend` занимает порт `3000`, остановите его через Compose.
Из каталога `web-ui/`:

```bash
npm ci
npm run dev
```

Откройте [localhost:3000](http://localhost:3000). По умолчанию API — `http://localhost:8080`,
Garage — `http://localhost:3900`. Для подключения к демо создайте `web-ui/.env.local`:

```dotenv
API_PROXY_TARGET=http://localhost:8081
NEXT_PUBLIC_API_PROXY_TARGET=http://localhost:8081
MEDIA_PROXY_TARGET=http://localhost:3905
```

После изменения переменных перезапустите сервер разработки.

| Переменная | Назначение |
|---|---|
| `API_PROXY_TARGET` | Серверный адрес API; в Docker — `http://backend:8080`. Также задаёт `/actuator` rewrite при сборке |
| `MEDIA_PROXY_TARGET` | Серверный адрес Garage для `/media/*`; в Docker — `http://garage:3900` |
| `NEXT_PUBLIC_API_PROXY_TARGET` | Доступный браузеру адрес API; используется для WebSocket по HTTP и выбора демоаккаунтов |
| `NEXT_PUBLIC_WS_URL` | Явный URL WebSocket, если нужен вместо автоматического выбора |
| `NEXT_PUBLIC_DEV_MODE` | `true` включает быстрый вход и технические подсказки, `false` скрывает; по умолчанию зависит от `NODE_ENV` |

Корневой `.env` бэкенда автоматически не читается. `NEXT_PUBLIC_*` встраиваются при сборке,
поэтому изменение переменных запущенного production-контейнера их не обновляет.
Compose передаёт публичный адрес и деморежим через build args. В production адрес берётся
из `FRONTEND_ORIGIN`; HTTPS reverse proxy должен передавать `/ws` бэкенду с WebSocket Upgrade,
а остальные запросы — фронтенду. Адрес фотографий из API должен быть доступен браузеру.

## Проверка и сборка

```bash
npx tsc --noEmit
npm run build
npm start
```

В Docker запускается `.next/standalone/server.js`; локально `npm start` запускает Next.js из `.next`.
