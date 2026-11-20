-- Curated demo data for booking, patient histories and clinic statistics.
-- From the repository root, run psql -X -v ON_ERROR_STOP=1 -f scripts/seed-test-data.sql against a dedicated development database.
-- This replaces 5eed demo rows and related data. Dates are relative to the clinic's local date.
-- All test users use password123: vet1..vet8 and client1..client8 at seed.chiron.local.

BEGIN;
SET LOCAL TIME ZONE 'Europe/Moscow';

-- Cleanup ------------------------------------------------------------------------------------------------------------

-- Delete inbox history in bulk before per-appointment foreign-key cascades.
DELETE
FROM notification
WHERE recipient_id::text LIKE '5eed%';

DELETE
FROM vaccination
WHERE pet_id IN (SELECT id
                 FROM pet
                 WHERE id::text LIKE '5eed%'
                    OR owner_id::text LIKE '5eed%'
                    OR species_id::text LIKE '5eed%');

DELETE
FROM appointment
WHERE veterinarian_id::text LIKE '5eed%'
   OR id IN (SELECT appointment_id FROM appointment_service WHERE service_id::text LIKE '5eed%')
   OR pet_id IN (SELECT id
                 FROM pet
                 WHERE id::text LIKE '5eed%'
                    OR owner_id::text LIKE '5eed%'
                    OR species_id::text LIKE '5eed%');

DELETE
FROM pet
WHERE id::text LIKE '5eed%'
   OR owner_id::text LIKE '5eed%'
   OR species_id::text LIKE '5eed%';
DELETE
FROM veterinarian_species_permission
WHERE veterinarian_id::text LIKE '5eed%'
   OR species_id::text LIKE '5eed%';
DELETE
FROM work_schedule
WHERE veterinarian_id::text LIKE '5eed%';
DELETE
FROM schedule_exception
WHERE veterinarian_id::text LIKE '5eed%';
DELETE
FROM veterinarian
WHERE id::text LIKE '5eed%'
   OR user_id::text LIKE '5eed%';
DELETE
FROM service_species
WHERE service_id::text LIKE '5eed%'
   OR species_id::text LIKE '5eed%';
DELETE
FROM service
WHERE id::text LIKE '5eed%';
DELETE
FROM specialization
WHERE id::text LIKE '5eed%';
DELETE
FROM species
WHERE id::text LIKE '5eed%';
-- notification rows of these users are removed by ON DELETE CASCADE
DELETE
FROM users
WHERE id::text LIKE '5eed%';

-- Reference data -----------------------------------------------------------------------------------------------------

INSERT INTO species (id, name)
VALUES ('5eed0001-0000-0000-0000-000000000001', 'Собака'),
       ('5eed0001-0000-0000-0000-000000000002', 'Кошка'),
       ('5eed0001-0000-0000-0000-000000000003', 'Кролик'),
       ('5eed0001-0000-0000-0000-000000000004', 'Морская свинка'),
       ('5eed0001-0000-0000-0000-000000000005', 'Хорёк'),
       ('5eed0001-0000-0000-0000-000000000006', 'Попугай');

INSERT INTO specialization (id, name, description)
VALUES ('5eed0002-0000-0000-0000-000000000001', 'Терапия', 'Осмотры, вакцинация и наблюдение'),
       ('5eed0002-0000-0000-0000-000000000002', 'Хирургия', 'Операции и послеоперационный уход'),
       ('5eed0002-0000-0000-0000-000000000003', 'Стоматология', 'Лечение зубов и полости рта'),
       ('5eed0002-0000-0000-0000-000000000004', 'Диагностика', 'УЗИ, рентгенография и лабораторные исследования');

INSERT INTO service (id, specialization_id, name, description, base_price, base_duration_min, buffer_after_min,
                     is_active, created_at, updated_at)
SELECT ('5eed0003-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
       ('5eed0002-0000-0000-0000-00000000000' || specialization_n)::uuid,
       name,
       description,
       price,
       minutes,
       buffer,
       n <> 5,
       now() - INTERVAL '900 days',
       now() - INTERVAL '900 days'
FROM (VALUES (1, 1, 'Первичный осмотр', 'Осмотр, взвешивание и консультация владельца', 1500, 30, 0),
             (2, 1, 'Вакцинация', 'Осмотр перед вакцинацией и введение вакцины', 1200, 20, 10),
             (3, 2, 'Операция на мягких тканях', 'Плановые операции на мягких тканях', 8000, 90, 30),
             (4, 3, 'Чистка зубов', 'Удаление зубного камня и полировка', 4000, 60, 0),
             (5, 1, 'Лазерная терапия', 'Сеанс низкоинтенсивной лазерной терапии', 2000, 30, 0),
             (6, 4, 'УЗИ брюшной полости', 'Ультразвуковое исследование органов брюшной полости', 2800, 30, 0),
             (7, 4, 'Общий анализ крови', 'Забор крови и лабораторное исследование', 1800, 20, 10),
             (8, 2, 'Обработка раны', 'Обработка раны и наложение швов при необходимости', 4500, 60, 30),
             (9, 3, 'Удаление зуба', 'Стоматологический осмотр и удаление зуба', 6500, 45, 15),
             (10, 1, 'Приём экзотического питомца', 'Осмотр мелких млекопитающих и птиц', 2200, 30, 0),
             (11, 1, 'Повторный осмотр', 'Контроль динамики после обследования или лечения', 900, 20, 10),
             (12, 2, 'Перевязка', 'Уход за послеоперационной раной', 1300, 30, 0),
             (13, 4, 'Рентгенография', 'Рентгеновские снимки в двух проекциях', 3200, 30, 0),
             (14, 1, 'Дерматологический осмотр', 'Осмотр кожи, ушей и шерсти', 1900, 30, 0),
             (15, 3, 'Контроль после стоматологии', 'Осмотр полости рта после процедуры', 1000, 20, 0))
         AS s(n, specialization_n, name, description, price, minutes, buffer);

-- NULL duration or price uses the base service value.
INSERT INTO service_species (service_id, species_id, duration_min, price)
SELECT ('5eed0003-0000-0000-0000-' || lpad(service_n::text, 12, '0'))::uuid,
       ('5eed0001-0000-0000-0000-00000000000' || species_n)::uuid,
       CASE
           WHEN (service_n, species_n) = (3, 1) THEN 120
           WHEN (service_n, species_n) = (4, 2) THEN 45 END,
       CASE
           WHEN (service_n, species_n) = (2, 2) THEN 1000
           WHEN (service_n, species_n) = (3, 1) THEN 10000
           WHEN (service_n, species_n) = (4, 2) THEN 3500 END
FROM (VALUES (1, ARRAY [1, 2]),
             (2, ARRAY [1, 2, 3, 5]),
             (3, ARRAY [1, 2]),
             (4, ARRAY [1, 2]),
             (5, ARRAY [1]),
             (6, ARRAY [1, 2]),
             (7, ARRAY [1, 2]),
             (8, ARRAY [1, 2]),
             (9, ARRAY [1, 2]),
             (10, ARRAY [3, 4, 5, 6]),
             (11, ARRAY [1, 2, 3, 4, 5, 6]),
             (12, ARRAY [1, 2]),
             (13, ARRAY [1, 2]),
             (14, ARRAY [1, 2]),
             (15, ARRAY [1, 2]))
         AS eligibility(service_n, species)
         CROSS JOIN LATERAL unnest(species) AS species_n;

-- Users --------------------------------------------------------------------------------------------------------------

-- full_name mirrors FullNameFormatter: "I. M. Lastname"
INSERT INTO users (id, email, password_hash, first_name, middle_name, last_name, full_name, phone, role,
                   created_at, updated_at)
SELECT u.id::uuid,
       u.email,
       '$2a$10$d5If9kxcQ.rpioiVuQb0muhYKqYDOQyerCqMeDvbg6MKg8.k11iNS',
       u.first_name,
       u.middle_name,
       u.last_name,
       concat_ws(' ', upper(left(u.first_name, 1)) || '.', upper(left(u.middle_name, 1)) || '.', u.last_name),
       u.phone,
       u.role,
       now() - make_interval(days => u.age_days),
       now() - make_interval(days => u.age_days)
FROM (VALUES ('5eed0004-0000-0000-0000-000000000001', 'vet1@seed.chiron.local', 'Анна', 'Сергеевна', 'Иванова',
              '+79000000001', 'VETERINARIAN', 900),
             ('5eed0004-0000-0000-0000-000000000002', 'vet2@seed.chiron.local', 'Павел', NULL, 'Петров',
              '+79000000002', 'VETERINARIAN', 900),
             ('5eed0004-0000-0000-0000-000000000003', 'vet3@seed.chiron.local', 'Елена', 'Викторовна', 'Смирнова',
              '+79000000003', 'VETERINARIAN', 900),
             ('5eed0004-0000-0000-0000-000000000004', 'vet4@seed.chiron.local', 'Олег', NULL, 'Кузнецов',
              '+79000000004', 'VETERINARIAN', 900),
             ('5eed0004-0000-0000-0000-000000000005', 'vet5@seed.chiron.local', 'София', NULL, 'Орлова',
              '+79000000005', 'VETERINARIAN', 600),
             ('5eed0004-0000-0000-0000-000000000006', 'vet6@seed.chiron.local', 'Роман', 'Олегович', 'Белов',
              '+79000000006', 'VETERINARIAN', 500),
             ('5eed0004-0000-0000-0000-000000000007', 'vet7@seed.chiron.local', 'Алина', NULL, 'Зайцева',
              '+79000000007', 'VETERINARIAN', 400),
             ('5eed0004-0000-0000-0000-000000000008', 'vet8@seed.chiron.local', 'Денис', NULL, 'Савин',
              '+79000000008', 'VETERINARIAN', 300))
         AS u(id, email, first_name, middle_name, last_name, phone, role, age_days);

INSERT INTO users (id, email, password_hash, first_name, last_name, full_name, phone, role, created_at, updated_at)
SELECT ('5eed0005-0000-0000-0000-00000000000' || n)::uuid,
       'client' || n || '@seed.chiron.local',
       '$2a$10$d5If9kxcQ.rpioiVuQb0muhYKqYDOQyerCqMeDvbg6MKg8.k11iNS',
       first_name,
       last_name,
       upper(left(first_name, 1)) || '. ' || last_name,
       '+7910000000' || n,
       'CLIENT',
       now() - INTERVAL '600 days',
       now() - INTERVAL '600 days'
FROM (VALUES (1, 'Иван', 'Соколов'),
             (2, 'Мария', 'Попова'),
             (3, 'Дмитрий', 'Лебедев'),
             (4, 'Ольга', 'Козлова'),
             (5, 'Сергей', 'Новиков'),
             (6, 'Наталья', 'Морозова'),
             (7, 'Алексей', 'Волков'),
             (8, 'Ирина', 'Павлова')) AS clients(n, first_name, last_name);

-- Veterinarians ------------------------------------------------------------------------------------------------------

INSERT INTO veterinarian (id, user_id, specialization_id, bio, photo_key, experience_years, is_active,
                          created_at, updated_at)
VALUES ('5eed0006-0000-0000-0000-000000000001', '5eed0004-0000-0000-0000-000000000001',
        '5eed0002-0000-0000-0000-000000000001', 'Ветеринарный терапевт, профилактика и болезни кожи', NULL, 12, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0006-0000-0000-0000-000000000002', '5eed0004-0000-0000-0000-000000000002',
        '5eed0002-0000-0000-0000-000000000001', 'Ветеринарный терапевт и специалист по лабораторной диагностике', NULL,
        4, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0006-0000-0000-0000-000000000003', '5eed0004-0000-0000-0000-000000000003',
        '5eed0002-0000-0000-0000-000000000002', 'Ветеринарный хирург', NULL, 15, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0006-0000-0000-0000-000000000004', '5eed0004-0000-0000-0000-000000000004',
        '5eed0002-0000-0000-0000-000000000003', 'Ветеринарный стоматолог', NULL, 7, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days');

INSERT INTO veterinarian (id, user_id, specialization_id, bio, experience_years, created_at, updated_at)
SELECT ('5eed0006-0000-0000-0000-00000000000' || n)::uuid,
       u.id,
       ('5eed0002-0000-0000-0000-00000000000' || specialization_n)::uuid,
       bio,
       experience,
       u.created_at,
       u.created_at
FROM (VALUES (5, 1, 'Ветеринарный терапевт и специалист по УЗИ', 6),
             (6, 2, 'Хирург по мягким тканям', 10),
             (7, 3, 'Ветеринарный стоматолог', 5),
             (8, 1, 'Специалист по экзотическим млекопитающим и птицам', 8)) AS v(n, specialization_n, bio, experience)
         JOIN users u ON u.id = ('5eed0004-0000-0000-0000-00000000000' || n)::uuid;

INSERT INTO veterinarian_specialization (veterinarian_id, specialization_id)
SELECT id, specialization_id
FROM veterinarian
WHERE id::text LIKE '5eed%'
UNION ALL
SELECT id, '5eed0002-0000-0000-0000-000000000004'::uuid
FROM veterinarian
WHERE id IN ('5eed0006-0000-0000-0000-000000000002', '5eed0006-0000-0000-0000-000000000005');

INSERT INTO veterinarian_species_permission (veterinarian_id, species_id)
VALUES ('5eed0006-0000-0000-0000-000000000001', '5eed0001-0000-0000-0000-000000000001'),
       ('5eed0006-0000-0000-0000-000000000001', '5eed0001-0000-0000-0000-000000000002'),
       ('5eed0006-0000-0000-0000-000000000001', '5eed0001-0000-0000-0000-000000000003'),
       ('5eed0006-0000-0000-0000-000000000002', '5eed0001-0000-0000-0000-000000000001'),
       ('5eed0006-0000-0000-0000-000000000002', '5eed0001-0000-0000-0000-000000000002'),
       ('5eed0006-0000-0000-0000-000000000003', '5eed0001-0000-0000-0000-000000000001'),
       ('5eed0006-0000-0000-0000-000000000003', '5eed0001-0000-0000-0000-000000000002'),
       ('5eed0006-0000-0000-0000-000000000004', '5eed0001-0000-0000-0000-000000000001'),
       ('5eed0006-0000-0000-0000-000000000004', '5eed0001-0000-0000-0000-000000000002');

INSERT INTO veterinarian_species_permission (veterinarian_id, species_id)
SELECT v.id, s.id
FROM veterinarian v
         CROSS JOIN species s
WHERE v.id::text BETWEEN '5eed0006-0000-0000-0000-000000000005' AND '5eed0006-0000-0000-0000-000000000008'
  AND s.id::text LIKE '5eed%'
  AND CASE
          WHEN v.id = '5eed0006-0000-0000-0000-000000000008'
              THEN s.name NOT IN ('Собака', 'Кошка')
          ELSE s.name IN ('Собака', 'Кошка') END;

-- Monday to Friday 09:00-18:00 with a break 13:00-14:00; the first therapist also works on Saturday 10:00-15:00.
INSERT INTO work_schedule (veterinarian_id, day_of_week, start_time, end_time, break_start, break_end)
SELECT v.id::uuid, d, TIME '09:00', TIME '18:00', TIME '13:00', TIME '14:00'
FROM veterinarian v,
     generate_series(1, 5) AS d
WHERE v.id::text LIKE '5eed%'
UNION ALL
SELECT '5eed0006-0000-0000-0000-000000000001', 6, '10:00', '15:00', NULL, NULL;

-- Two upcoming exceptions also demonstrate the booking calendar without invalidating seeded visits.
INSERT INTO schedule_exception (veterinarian_id, type, start_date, end_date, start_time, end_time, reason)
VALUES ('5eed0006-0000-0000-0000-000000000006', 'ABSENCE',
        current_date + 5, current_date + 10, NULL, NULL, 'Отпуск'),
       ('5eed0006-0000-0000-0000-000000000005', 'CUSTOM_HOURS',
        current_date + 7, current_date + 7, '10:00', '15:00', 'Обучение во второй половине дня');

-- Each pet ID has exactly one image in scripts/fixtures/photos/sources.json.
INSERT INTO pet (id, owner_id, species_id, name, breed, birth_date, weight_kg, gender, notes, is_archived,
                 created_at, updated_at)
SELECT ('5eed0107-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
       ('5eed0005-0000-0000-0000-00000000000' || owner_n)::uuid,
       ('5eed0001-0000-0000-0000-00000000000' || species_n)::uuid,
       name,
       breed,
       current_date - age_days,
       weight,
       gender,
       notes,
       n = 15,
       now() - INTERVAL '540 days',
       CASE WHEN n = 15 THEN now() - INTERVAL '15 days' ELSE now() END
FROM (VALUES (1, 1, 4, 'Шустрик', 'Гладкошёрстная', 950, 0.98, 'MALE', 'На осмотре спокойнее в своей переноске.'),
             (2, 1, 2, 'Плюша', NULL, 1820, 4.60, 'FEMALE',
              'Чувствительное пищеварение. Владелец ведёт дневник кормления.'),
             (3, 2, 2, 'Сима', 'Сиамская', 2140, 3.80, 'FEMALE',
              'В клинике прячется под пледом. Взвешивать вместе с переноской.'),
             (4, 1, 1, 'Персик', 'Померанский шпиц', 1310, 2.70, 'MALE',
              'Владелец приносит бумажный паспорт прививок.'),
             (5, 3, 1, 'Байтик', 'Китайская хохлатая', 1640, 4.90, 'MALE',
              'Чувствительная кожа, гуляет в лёгкой одежде.'),
             (6, 4, 1, 'Умка', 'Самоедская собака', 1790, 24.30, 'MALE', 'Активный, ходит в походы с владельцем.'),
             (7, 2, 2, 'Филя', NULL, 2970, 5.30, 'MALE', 'Дома предпочитает влажный корм. Ранее лечил зубы.'),
             (8, 4, 1, 'Рэй', 'Золотистый ретривер', 2530, 31.80, 'MALE',
              'После вмешательства владелец отмечает состояние шва.'),
             (9, 5, 1, 'Тайга', 'Сибирский хаски', 1920, 22.60, 'FEMALE',
              'Бегает с владельцем. Боится скользкого пола.'),
             (10, 3, 1, 'Кнопа', 'Такса', 2050, 7.40, 'FEMALE', 'Спокойно переносит осмотр рядом с владельцем.'),
             (11, 6, 1, 'Уголь', 'Лабрадор-ретривер', 2030, 30.20, 'MALE', 'На приёме легко отвлекается на лакомство.'),
             (12, 5, 2, 'Рыжик', NULL, 1440, 4.90, 'MALE', 'Живёт в квартире. Владелец недавно сменил корм.'),
             (13, 6, 2, 'Ириска', NULL, 1720, 4.10, 'FEMALE',
              'Во время осмотра лучше оставлять верх переноски открытым.'),
             (14, 7, 2, 'Снежка', NULL, 2210, 3.90, 'FEMALE', 'Раньше наблюдалась по поводу снижения аппетита.'),
             (15, 7, 2, 'Луна', NULL, 2570, 4.40, 'FEMALE', 'Переехала с владельцем. Карточка сохранена для истории.'),
             (16, 8, 3, 'Пончик', NULL, 1120, 1.80, 'MALE', 'Владелец записывает вес раз в неделю.'),
             (17, 8, 4, 'Фунтик', NULL, 1080, 1.12, 'MALE', 'Обычно ест сено охотно. При стрессе прячется в домик.'),
             (18, 2, 5, 'Пиксель', NULL, 1490, 1.25, 'MALE', 'Любопытный, на осмотре помогает знакомая игрушка.'),
             (19, 8, 6, 'Кеша', 'Сине-жёлтый ара', 3290, 1.05, 'MALE',
              'На приём привозят в клетке с привычной жердочкой.')) AS pets(n, owner_n, species_n, name, breed, age_days, weight, gender, notes);

-- Explicit visit stories. Signed dates shift weekends outwards to the nearest weekday.
CREATE TEMP TABLE seed_visit ON COMMIT DROP AS
SELECT ('5eed0108-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid                             AS id,
       ('5eed0107-0000-0000-0000-' || lpad(pet_n::text, 12, '0'))::uuid                         AS pet_id,
       ('5eed0006-0000-0000-0000-00000000000' || vet_n)::uuid                                   AS veterinarian_id,
       ('5eed0108-0000-0000-0000-' || lpad(follow_up_n::text, 12, '0'))::uuid                   AS follow_up_of,
       starts_at,
       CASE WHEN days > 0 THEN now() - INTERVAL '1 hour' ELSE starts_at - INTERVAL '3 days' END AS booked_at,
       status,
       planned,
       extra,
       complaint,
       outcome
FROM (VALUES (11, 1, 8, -34, '10:00', 'COMPLETED', ARRAY [10], NULL, NULL,
              'Шустрик начал оставлять твёрдые гранулы.',
              'Осмотрены резцы и ротовая полость. Владелец будет отмечать вес и аппетит.'),
             (12, 1, 8, -5, '11:00', 'COMPLETED', ARRAY [11], NULL, 11,
              'Принесли записи веса за месяц.', 'Вес стабилен, снова съедает обычную порцию сена и гранул.'),
             (21, 2, 2, -42, '09:30', 'COMPLETED', ARRAY [1], NULL, NULL,
              'После смены корма несколько раз была рвота.',
              'Осмотр проведён. Для уточнения причины назначены УЗИ и анализ крови.'),
             (22, 2, 5, -25, '11:00', 'COMPLETED', ARRAY [6, 7], NULL, 21,
              'Пришли на назначенное обследование.',
              'По УЗИ острых изменений нет. Результаты анализа обсуждены с владельцем.'),
             (23, 2, 2, 2, '10:00', 'CONFIRMED', ARRAY [11], NULL, 22,
              'Принесу дневник кормления после перехода на новый рацион.', NULL),
             (31, 3, 2, -108, '15:00', 'COMPLETED', ARRAY [1, 7], NULL, NULL,
              'Сима стала меньше есть и чаще подходит к воде.',
              'Взята кровь, согласовано дополнительное обследование брюшной полости.'),
             (32, 3, 5, -17, '10:00', 'COMPLETED', ARRAY [6], NULL, 31,
              'Продолжаем обследование после анализа крови.',
              'Результат УЗИ записан. Владелец отмечает аппетит и питьё.'),
             (33, 3, 2, 4, '11:00', 'PENDING', ARRAY [11], NULL, 32,
              'Хотим обсудить результаты и динамику веса.', NULL),
             (41, 4, 2, -104, '10:00', 'COMPLETED', ARRAY [1, 2], NULL, NULL,
              'Ежегодный осмотр и прививка по паспорту.',
              'Осмотр без отклонений. Комплексная вакцина внесена в карту.'),
             (42, 4, 2, -15, '16:00', 'COMPLETED', ARRAY [11], NULL, 41,
              'Контроль веса, принесли записи кормления.',
              'Вес держится в целевом диапазоне, замечаний по аппетиту нет.'),
             (43, 4, 1, -3, '16:00', 'CANCELLED', ARRAY [1], NULL, NULL,
              'Планировали осмотр перед поездкой.', 'Владелец перенёс поездку и отменил визит.'),
             (51, 5, 1, -70, '11:00', 'COMPLETED', ARRAY [1], NULL, NULL,
              'Появилось сухое пятно под шлейкой.', 'Осмотрено место раздражения, назначен контроль кожи.'),
             (52, 5, 1, -27, '14:00', 'COMPLETED', ARRAY [14], NULL, 51,
              'Пятно стало меньше, иногда чешется.', 'Покраснение почти исчезло, владелец заменил шлейку.'),
             (61, 6, 2, -84, '10:30', 'COMPLETED', ARRAY [1, 13], NULL, NULL,
              'Умка захромал после длинной прогулки.',
              'Сделаны снимки в двух проекциях. Признаков перелома не обнаружено.'),
             (62, 6, 2, -36, '14:30', 'COMPLETED', ARRAY [11], NULL, 61,
              'Принесли видео походки после отдыха.', 'Походка ровная. Владелец сообщил, что хромота не возвращалась.'),
             (63, 6, 2, 5, '14:00', 'CONFIRMED', ARRAY [2], NULL, NULL,
              'Записали Умку на ревакцинацию, паспорт у нас.', NULL),
             (71, 7, 4, -132, '14:00', 'COMPLETED', ARRAY [4], 9, NULL,
              'Филя жуёт одной стороной, появился запах из пасти.',
              'Удалён подвижный зуб, выполнена чистка. Обсуждён контроль заживления.'),
             (72, 7, 7, -115, '10:00', 'COMPLETED', ARRAY [15, 4], NULL, 71,
              'После процедуры снова ест с обеих сторон.',
              'Десна зажила. Повторная чистка по итогам осмотра не потребовалась.'),
             (81, 8, 6, -72, '09:00', 'COMPLETED', ARRAY [3], NULL, NULL,
              'Запланировано удаление подкожного образования.',
              'Образование удалено, материал передан на исследование.'),
             (82, 8, 6, -61, '10:00', 'COMPLETED', ARRAY [12], NULL, 81,
              'Плановая проверка шва.', 'Шов сухой, края раны сомкнуты.'),
             (91, 9, 3, -154, '10:00', 'COMPLETED', ARRAY [8], NULL, NULL,
              'Тайга порезала лапу во время прогулки.', 'Рана очищена и обработана, наложена повязка.'),
             (92, 9, 3, -145, '14:30', 'COMPLETED', ARRAY [12], NULL, 91,
              'Пришли сменить повязку и проверить лапу.', 'Рана заживает, Тайга уверенно опирается на лапу.'),
             (101, 10, 2, -168, '14:00', 'COMPLETED', ARRAY [1, 13], NULL, NULL,
              'Кнопа стала избегать лестницы.',
              'Снимки переданы врачу. Боль при движении уменьшилась к концу осмотра.'),
             (102, 10, 1, -151, '15:00', 'COMPLETED', ARRAY [11], NULL, 101,
              'Дома двигается охотнее, на лестницу не пускаем.',
              'На контрольном осмотре передвигается свободно, болезненность уменьшилась.'),
             (111, 11, 2, -58, '09:30', 'COMPLETED', ARRAY [1, 2], NULL, NULL,
              'Плановая прививка, жалоб нет.', 'Осмотр проведён, отметка о вакцинации внесена в паспорт.'),
             (112, 11, 1, -23, '14:30', 'COMPLETED', ARRAY [14], NULL, NULL,
              'Уголь чешет правое ухо после купания.',
              'Осмотрены оба уха. В правом умеренное раздражение, согласовано наблюдение.'),
             (121, 12, 1, -93, '11:30', 'COMPLETED', ARRAY [1], NULL, NULL,
              'Рыжик стал отказываться от утренней порции.',
              'Отмечена небольшая потеря веса, рекомендовано обследование.'),
             (122, 12, 5, -77, '15:00', 'COMPLETED', ARRAY [6, 7], NULL, 121,
              'На обследование записались после осмотра.', 'Кровь взята, по УЗИ признаков непроходимости нет.'),
             (131, 13, 7, -124, '11:00', 'COMPLETED', ARRAY [4], NULL, NULL,
              'Пришли на чистку по рекомендации врача.', 'Удалены зубные отложения, осмотрены дёсны.'),
             (132, 13, 1, -66, '14:00', 'COMPLETED', ARRAY [1], NULL, 131,
              'Хорошо ест после чистки, хотим сверить вес.',
              'Дёсны без видимого воспаления. Вес соответствует прошлому визиту.'),
             (141, 14, 5, -48, '14:30', 'COMPLETED', ARRAY [1, 7], NULL, NULL,
              'Снежка ест небольшими порциями.', 'Взята кровь, дата контрольного осмотра согласована.'),
             (142, 14, 5, -31, '09:30', 'COMPLETED', ARRAY [11], NULL, 141,
              'Аппетит улучшился, принесли журнал веса.', 'Вес стабилизировался, обсудили результаты анализа.'),
             (143, 14, 2, -7, '10:30', 'NO_SHOW', ARRAY [11], NULL, 142,
              'Запись на следующий контроль.', NULL),
             (151, 15, 1, -142, '10:00', 'COMPLETED', ARRAY [1, 2], NULL, NULL,
              'Плановый осмотр перед летней поездкой.', 'Осмотр проведён. Вакцинация внесена в паспорт.'),
             (152, 15, 1, -40, '14:30', 'COMPLETED', ARRAY [1], NULL, NULL,
              'Перед переездом попросили выписку из карты.', 'Питомец клинически здоров. Выписка передана владельцу.'),
             (161, 16, 8, -65, '09:30', 'COMPLETED', ARRAY [10], NULL, NULL,
              'Пончик стал выбирать только мягкие части сена.',
              'Проверены зубы и вес. Договорились начать взвешивать дома.'),
             (162, 16, 8, -29, '15:00', 'COMPLETED', ARRAY [11, 2], NULL, 161,
              'Вес в норме, принесли паспорт на плановую прививку.', 'Вес стабилен, вакцина внесена в паспорт.'),
             (171, 17, 8, -125, '14:30', 'COMPLETED', ARRAY [10], NULL, NULL,
              'Фунтик стал прятаться при кормлении.', 'Осмотрены резцы и слизистые, вес близок к обычному.'),
             (172, 17, 8, -89, '10:00', 'COMPLETED', ARRAY [11], NULL, 171,
              'После замены сенника ест охотнее.', 'Владелец принёс нормальный журнал веса. Замечаний по осмотру нет.'),
             (181, 18, 8, -52, '14:00', 'COMPLETED', ARRAY [10], NULL, NULL,
              'Пиксель линяет сильнее обычного.',
              'Осмотрены кожа и шерсть, расчёсов нет. Согласован повторный контроль.'),
             (182, 18, 8, -20, '11:30', 'COMPLETED', ARRAY [11], NULL, 181,
              'Шерсть восстанавливается, аппетит обычный.', 'Шерсть отросла равномерно, активность сохранена.'),
             (191, 19, 8, -113, '11:00', 'COMPLETED', ARRAY [10], NULL, NULL,
              'Кеша меньше пользуется одной жердочкой.',
              'Осмотрены лапы и хват. Владелец показал фотографии жердочки.'),
             (192, 19, 8, -78, '15:30', 'COMPLETED', ARRAY [11], NULL, 191,
              'После замены жердочки снова сидит на ней.',
              'Хват симметричный, кожа лап без следов раздражения.')) AS scenarios(n, pet_n, vet_n, days, start_time,
                                                                                   status, planned, extra, follow_up_n,
                                                                                   complaint, outcome)
         CROSS JOIN LATERAL (SELECT current_date + days AS target_day) AS target
         CROSS JOIN LATERAL (SELECT extract(isodow FROM target_day)::int AS weekday) AS local_day
         CROSS JOIN LATERAL (
    SELECT ((target_day + CASE
                              WHEN weekday <= 5 THEN 0
                              WHEN days > 0 THEN 8 - weekday
                              ELSE 5 - weekday END)
        + start_time::time)::timestamptz AS starts_at
    ) AS time_slot;

CREATE TEMP TABLE seed_visit_service ON COMMIT DROP AS
SELECT visit.id                                                         AS appointment_id,
       s.id                                                             AS service_id,
       s.name,
       coalesce(ss.price, s.base_price)                                 AS price,
       coalesce(ss.duration_min, s.base_duration_min)                   AS duration,
       s.buffer_after_min                                               AS buffer,
       service_n = ANY (visit.planned)                                  AS planned,
       CASE
           WHEN visit.status = 'COMPLETED'
               THEN NOT (visit.id = '5eed0108-0000-0000-0000-000000000072' AND service_n = 4)
           WHEN visit.status IN ('CANCELLED', 'NO_SHOW') THEN FALSE END AS performed
FROM seed_visit visit
         JOIN pet p ON p.id = visit.pet_id
         CROSS JOIN LATERAL unnest(visit.planned || visit.extra) AS service_n
         JOIN service s ON s.id = ('5eed0003-0000-0000-0000-' || lpad(service_n::text, 12, '0'))::uuid
         JOIN service_species ss ON ss.service_id = s.id AND ss.species_id = p.species_id;

INSERT INTO appointment (id, veterinarian_id, pet_id, follow_up_of, start_at, end_at, status, client_comment,
                         vet_notes, cancelled_by, cancelled_at, cancel_reason, created_at, updated_at)
SELECT visit.id,
       visit.veterinarian_id,
       visit.pet_id,
       visit.follow_up_of,
       visit.starts_at,
       timing.ends_at,
       visit.status,
       visit.complaint,
       CASE WHEN visit.status = 'COMPLETED' THEN visit.outcome END,
       CASE WHEN visit.status = 'CANCELLED' THEN p.owner_id END,
       CASE WHEN visit.status = 'CANCELLED' THEN visit.starts_at - INTERVAL '1 day' END,
       CASE WHEN visit.status = 'CANCELLED' THEN visit.outcome END,
       visit.booked_at,
       CASE
           WHEN visit.status IN ('COMPLETED', 'NO_SHOW') THEN timing.ends_at
           WHEN visit.status = 'CANCELLED' THEN visit.starts_at - INTERVAL '1 day'
           WHEN visit.status = 'CONFIRMED' THEN now() - INTERVAL '30 minutes'
           ELSE visit.booked_at END
FROM seed_visit visit
         JOIN pet p ON p.id = visit.pet_id
         CROSS JOIN LATERAL (
    SELECT visit.starts_at + make_interval(mins => sum(duration)::int + max(buffer)) AS ends_at
    FROM seed_visit_service
    WHERE appointment_id = visit.id
      AND planned
    ) AS timing;

INSERT INTO appointment_service (appointment_id, service_id, name_snapshot, price_snapshot, duration_min_snapshot,
                                 buffer_after_min_snapshot, is_planned, is_performed, added_by,
                                 created_at, updated_by, updated_at)
SELECT a.id,
       item.service_id,
       item.name,
       item.price,
       item.duration,
       item.buffer,
       item.planned,
       item.performed,
       CASE WHEN item.planned THEN p.owner_id ELSE v.user_id END,
       CASE WHEN item.planned THEN a.created_at ELSE a.updated_at END,
       CASE WHEN item.performed IS NOT NULL THEN v.user_id END,
       a.updated_at
FROM seed_visit_service item
         JOIN appointment a ON a.id = item.appointment_id
         JOIN pet p ON p.id = a.pet_id
         JOIN veterinarian v ON v.id = a.veterinarian_id;

DO
$$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM seed_visit visit
                   WHERE cardinality(visit.planned) + (visit.extra IS NOT NULL)::int
                             <> (SELECT count(*) FROM seed_visit_service WHERE appointment_id = visit.id)) THEN
            RAISE EXCEPTION 'A scripted visit includes a service unavailable for the pet species';
        END IF;
    END;
$$;

INSERT INTO vaccination (pet_id, appointment_id, name, administered_on, next_due_on)
SELECT a.pet_id,
       a.id,
       CASE
           WHEN p.species_id = '5eed0001-0000-0000-0000-000000000003'
               THEN 'Вирусная геморрагическая болезнь кроликов'
           ELSE 'Комплексная вакцина' END,
       a.start_at::date,
       a.start_at::date + 365
FROM appointment a
         JOIN pet p ON p.id = a.pet_id
         JOIN appointment_service item ON item.appointment_id = a.id AND item.is_performed
WHERE a.id::text LIKE '5eed0108-%'
  AND item.service_id = '5eed0003-0000-0000-0000-000000000002';

-- Two imported passports give the demo an upcoming and an overdue booster.
INSERT INTO vaccination (pet_id, name, administered_on, next_due_on)
VALUES ('5eed0107-0000-0000-0000-000000000002', 'Комплексная вакцина', current_date - 360, current_date + 5),
       ('5eed0107-0000-0000-0000-000000000006', 'Бешенство', current_date - 369, current_date - 4);

-- Populate the recent inbox with both unread events and already read history.
INSERT INTO notification (recipient_id, actor_id, type, title, body, appointment_id, pet_id, created_at, read_at)
SELECT recipient.id,
       event.actor_id,
       event.type,
       event.title,
       p.name || ' — ' || services.names || ', ' || to_char(a.start_at, 'DD.MM.YYYY HH24:MI')
           || ', врач ' || u.full_name || coalesce('. ' || a.cancel_reason, '.'),
       a.id,
       p.id,
       event.happened_at,
       CASE WHEN event.happened_at < now() - INTERVAL '7 days' THEN event.happened_at + INTERVAL '2 hours' END
FROM appointment a
         JOIN pet p ON p.id = a.pet_id
         JOIN veterinarian v ON v.id = a.veterinarian_id
         JOIN users u ON u.id = v.user_id
         CROSS JOIN LATERAL (
    SELECT string_agg(item.name_snapshot, ', ' ORDER BY item.service_id) AS names
    FROM appointment_service item
    WHERE item.appointment_id = a.id
      AND item.is_planned
    ) AS services
         CROSS JOIN LATERAL (
    SELECT 'APPOINTMENT_BOOKED'    AS type,
           'Новая запись на приём' AS title,
           a.created_at            AS happened_at,
           p.owner_id              AS actor_id
    UNION ALL
    SELECT 'APPOINTMENT_CONFIRMED', 'Запись подтверждена', a.updated_at, v.user_id
    WHERE a.status = 'CONFIRMED'
    UNION ALL
    SELECT 'APPOINTMENT_CANCELLED', 'Запись отменена', a.cancelled_at, a.cancelled_by
    WHERE a.status = 'CANCELLED'
    UNION ALL
    SELECT 'APPOINTMENT_NO_SHOW', 'Отмечена неявка на приём', a.updated_at, v.user_id
    WHERE a.status = 'NO_SHOW'
    UNION ALL
    SELECT 'APPOINTMENT_COMPLETED', 'Приём завершён', a.updated_at, v.user_id
    WHERE a.status = 'COMPLETED'
    UNION ALL
    SELECT 'FOLLOW_UP_SCHEDULED', 'Назначен повторный приём', a.created_at, v.user_id
    WHERE a.follow_up_of IS NOT NULL
    ) AS event
         CROSS JOIN LATERAL (VALUES (p.owner_id), (v.user_id)) AS recipient(id)
WHERE a.id::text LIKE '5eed0108-%'
  AND event.happened_at >= now() - INTERVAL '35 days'
  AND event.actor_id <> recipient.id;

INSERT INTO notification (recipient_id, type, title, body, pet_id, vaccination_id, reminder_due_on, created_at)
SELECT p.owner_id,
       CASE WHEN v.next_due_on < current_date THEN 'VACCINATION_OVERDUE' ELSE 'VACCINATION_DUE' END,
       CASE WHEN v.next_due_on < current_date THEN 'Ревакцинация просрочена' ELSE 'Скоро ревакцинация' END,
       p.name || ': срок ревакцинации «' || v.name || '» — ' || to_char(v.next_due_on, 'DD.MM.YYYY') || '.',
       p.id,
       v.id,
       v.next_due_on,
       CASE WHEN v.next_due_on < current_date THEN v.next_due_on + 1 ELSE v.next_due_on - 7 END
FROM vaccination v
         JOIN pet p ON p.id = v.pet_id
WHERE p.id::text LIKE '5eed0107-%'
  AND NOT p.is_archived
  AND v.next_due_on <= current_date + 7;

-- Fail before commit if the generated history violates its core assumptions.
\ir verify-test-data.sql

COMMIT;

-- Summary ------------------------------------------------------------------------------------------------------------

SELECT (SELECT count(*) FROM users WHERE id::text LIKE '5eed%')                    AS users,
       (SELECT count(*) FROM pet WHERE id::text LIKE '5eed%')                      AS pets,
       (SELECT count(*) FROM appointment WHERE veterinarian_id::text LIKE '5eed%') AS appointments,
       (SELECT count(*)
        FROM appointment
        WHERE veterinarian_id::text LIKE '5eed%'
          AND follow_up_of IS NOT NULL)                                            AS follow_ups,
       (SELECT count(*)
        FROM vaccination v
                 JOIN pet p ON p.id = v.pet_id
        WHERE p.id::text LIKE '5eed%')                                             AS vaccinations,
       (SELECT count(*) FROM notification WHERE recipient_id::text LIKE '5eed%')   AS notifications;
