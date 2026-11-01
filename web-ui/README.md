# Chiron Web UI

Современный веб-интерфейс для системы ветеринарной клиники **Chiron**.

## Технологический стек

* **Фреймворк:** [Next.js](https://nextjs.org/) 15 (App Router)
* **Библиотека интерфейса:** [React](https://react.dev/) 19
* **Язык:** [TypeScript](https://www.typescriptlang.org/)
* **Стилизация:** [Tailwind CSS](https://tailwindcss.com/) v4
* **Иконки (строго SVG, без эмодзи):** [Lucide React](https://lucide.dev/)
* **Сетевой слой:** Нативный Fetch с автоматической подстановкой Bearer-токена и обработкой `ApiResponse<T>` / ошибок валидации Spring Boot.

---

## Архитектура проекта

```
web-ui/
├── src/
│   ├── api/                 # Типизированный клиент и сервисы эндпоинтов (auth, client, vet, admin)
│   ├── app/                 # Next.js App Router (страницы и макеты)
│   │   ├── layout.tsx       # Корневой макет с AuthProvider, Navbar и Footer
│   │   ├── page.tsx         # Главная витрина клиники
│   │   ├── services/        # Каталог услуг и цен с фильтрами
│   │   ├── veterinarians/   # Список врачей и стажа
│   │   ├── login/           # Авторизация (клиенты, врачи, админы)
│   │   ├── register/        # Регистрация нового владельца
│   │   ├── client/          # Личный кабинет клиента (питомцы, записи, онлайн-визард записи)
│   │   ├── vet/             # Кабинет врача (очередь приемов, пациенты, прививки, профиль)
│   │   └── admin/           # Консоль администратора (пользователи, прейскурант, клиника)
│   ├── components/
│   │   ├── layout/          # Navbar, Footer, ProtectedRoute
│   │   └── ui/              # Базовые UI-компоненты (Button, Input, Select, Badge, Modal, Card, EmptyState)
│   ├── context/             # AuthContext (управление JWT сессией и ролями)
│   └── types/               # Модели данных TypeScript (зеркало DTO бэкенда)
└── next.config.ts           # Проксирование /api и /actuator на http://localhost:8080
```

---

## Интеграция с бэкендом (Docker)

Бэкенд в Docker слушает порт `8080`. 
В файле `next.config.ts` настроен автоматический прокси (`rewrites`):
* Все запросы вида `/api/*` прозрачно перенаправляются на `http://localhost:8080/api/*`.
* Проверка состояния `/actuator/*` перенаправляется на `http://localhost:8080/actuator/*`.
* Это полностью устраняет любые проблемы с CORS при локальной разработке.

---

## Запуск приложения

1. Убедитесь, что бэкенд запущен в Docker:
```bash
docker compose -f docker-compose.local.yaml ps
```

2. Перейдите в каталог фронтенда и установите зависимости (если еще не установлены):
```bash
cd web-ui
npm install
```

3. Запустите сервер разработки:
```bash
npm run dev
```

Приложение будет доступно по адресу: **http://localhost:3000**
