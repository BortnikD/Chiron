-- Test data for local development and manual testing (statistics, booking, schedules).
--
-- Run from the repository root while docker-compose.local.yaml is up and the application has started at least once
-- (Flyway creates the schema):
--   docker exec -i chiron-postgres psql -U postgres -d chiron -v ON_ERROR_STOP=1 < chiron/scripts/seed-test-data.sql
--
-- Re-runnable: everything seeded before (ids starting with 5eed and the rows that reference them) is removed first,
-- then inserted again. Appointment dates are relative to today in the clinic time zone (Europe/Moscow): from 90 days
-- ago to 30 days ahead, so the current month always has data. The pseudo-random choices are derived from hashes of
-- the date and slot, so a run on the same day produces the same appointments. Other data (the admin account, rows
-- created through the API that do not reference seeded rows) is left untouched.
--
-- Every seeded user has the password "password123"; emails end with @seed.chiron.local.
-- Veterinarians: vet1..vet4@seed.chiron.local; clients: client1..client15@seed.chiron.local.

BEGIN;

-- Cleanup ------------------------------------------------------------------------------------------------------------

DELETE FROM vaccination
WHERE pet_id IN (SELECT id FROM pet WHERE id::text LIKE '5eed%' OR owner_id::text LIKE '5eed%');

DELETE FROM appointment
WHERE veterinarian_id::text LIKE '5eed%'
   OR service_id::text LIKE '5eed%'
   OR pet_id IN (SELECT id FROM pet WHERE id::text LIKE '5eed%' OR owner_id::text LIKE '5eed%');

DELETE FROM pet WHERE id::text LIKE '5eed%' OR owner_id::text LIKE '5eed%' OR species_id::text LIKE '5eed%';
DELETE FROM veterinarian_species_permission WHERE veterinarian_id::text LIKE '5eed%' OR species_id::text LIKE '5eed%';
DELETE FROM work_schedule WHERE veterinarian_id::text LIKE '5eed%';
DELETE FROM schedule_exception WHERE veterinarian_id::text LIKE '5eed%';
DELETE FROM veterinarian WHERE id::text LIKE '5eed%' OR user_id::text LIKE '5eed%';
DELETE FROM service_species WHERE service_id::text LIKE '5eed%' OR species_id::text LIKE '5eed%';
DELETE FROM service WHERE id::text LIKE '5eed%';
DELETE FROM specialization WHERE id::text LIKE '5eed%';
DELETE FROM species WHERE id::text LIKE '5eed%';
-- notification rows of these users are removed by ON DELETE CASCADE
DELETE FROM users WHERE id::text LIKE '5eed%';

-- Reference data -----------------------------------------------------------------------------------------------------

INSERT INTO species (id, name)
VALUES ('5eed0001-0000-0000-0000-000000000001', 'Dog'),
       ('5eed0001-0000-0000-0000-000000000002', 'Cat'),
       ('5eed0001-0000-0000-0000-000000000003', 'Rabbit');

INSERT INTO specialization (id, name, description)
VALUES ('5eed0002-0000-0000-0000-000000000001', 'Therapy', 'General examinations, diagnostics and vaccination'),
       ('5eed0002-0000-0000-0000-000000000002', 'Surgery', 'Planned and emergency operations'),
       ('5eed0002-0000-0000-0000-000000000003', 'Dentistry', 'Oral cavity and teeth treatment');

INSERT INTO service (id, specialization_id, name, description, base_price, base_duration_min, buffer_after_min,
                     is_active, created_at, updated_at)
VALUES ('5eed0003-0000-0000-0000-000000000001', '5eed0002-0000-0000-0000-000000000001', 'General check-up',
        'Examination, weighing and owner consultation', 1500.00, 30, 0, TRUE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days'),
       ('5eed0003-0000-0000-0000-000000000002', '5eed0002-0000-0000-0000-000000000001', 'Vaccination',
        'Examination before vaccination and the injection', 1200.00, 20, 10, TRUE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days'),
       ('5eed0003-0000-0000-0000-000000000003', '5eed0002-0000-0000-0000-000000000002', 'Spaying',
        'Planned spaying under general anaesthesia', 8000.00, 90, 30, TRUE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days'),
       ('5eed0003-0000-0000-0000-000000000004', '5eed0002-0000-0000-0000-000000000003', 'Teeth cleaning',
        'Ultrasonic scaling and polishing', 4000.00, 60, 0, TRUE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days'),
       -- Inactive and without appointments: must not appear in the statistics by service.
       ('5eed0003-0000-0000-0000-000000000005', '5eed0002-0000-0000-0000-000000000001', 'Laser therapy',
        'Low-level laser therapy session', 2000.00, 30, 0, FALSE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days');

-- NULL duration / price = the base values of the service
INSERT INTO service_species (service_id, species_id, duration_min, price)
VALUES ('5eed0003-0000-0000-0000-000000000001', '5eed0001-0000-0000-0000-000000000001', NULL, NULL),
       ('5eed0003-0000-0000-0000-000000000001', '5eed0001-0000-0000-0000-000000000002', NULL, NULL),
       ('5eed0003-0000-0000-0000-000000000001', '5eed0001-0000-0000-0000-000000000003', 20, 1000.00),
       ('5eed0003-0000-0000-0000-000000000002', '5eed0001-0000-0000-0000-000000000001', NULL, NULL),
       ('5eed0003-0000-0000-0000-000000000002', '5eed0001-0000-0000-0000-000000000002', NULL, 1000.00),
       ('5eed0003-0000-0000-0000-000000000002', '5eed0001-0000-0000-0000-000000000003', NULL, 900.00),
       ('5eed0003-0000-0000-0000-000000000003', '5eed0001-0000-0000-0000-000000000001', 120, 10000.00),
       ('5eed0003-0000-0000-0000-000000000003', '5eed0001-0000-0000-0000-000000000002', NULL, NULL),
       ('5eed0003-0000-0000-0000-000000000004', '5eed0001-0000-0000-0000-000000000001', NULL, NULL),
       ('5eed0003-0000-0000-0000-000000000004', '5eed0001-0000-0000-0000-000000000002', 45, 3500.00),
       ('5eed0003-0000-0000-0000-000000000005', '5eed0001-0000-0000-0000-000000000001', NULL, NULL);

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
FROM (VALUES ('5eed0004-0000-0000-0000-000000000001', 'vet1@seed.chiron.local', 'Anna', 'Sergeevna', 'Ivanova',
              '+79000000001', 'VETERINARIAN', 200),
             ('5eed0004-0000-0000-0000-000000000002', 'vet2@seed.chiron.local', 'Pavel', NULL, 'Petrov',
              '+79000000002', 'VETERINARIAN', 200),
             ('5eed0004-0000-0000-0000-000000000003', 'vet3@seed.chiron.local', 'Elena', 'Viktorovna', 'Smirnova',
              '+79000000003', 'VETERINARIAN', 200),
             ('5eed0004-0000-0000-0000-000000000004', 'vet4@seed.chiron.local', 'Oleg', NULL, 'Kuznetsov',
              '+79000000004', 'VETERINARIAN', 200))
         AS u(id, email, first_name, middle_name, last_name, phone, role, age_days);

-- Clients registered every 8 days, from 120 days ago to 8 days ago.
INSERT INTO users (id, email, password_hash, first_name, middle_name, last_name, full_name, phone, role,
                   created_at, updated_at)
SELECT ('5eed0005-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
       'client' || i || '@seed.chiron.local',
       '$2a$10$d5If9kxcQ.rpioiVuQb0muhYKqYDOQyerCqMeDvbg6MKg8.k11iNS',
       first_names[i],
       NULL,
       last_names[i],
       upper(left(first_names[i], 1)) || '. ' || last_names[i],
       '+7910000' || lpad(i::text, 4, '0'),
       'CLIENT',
       now() - make_interval(days => i * 8),
       now() - make_interval(days => i * 8)
FROM generate_series(1, 15) AS i,
     (SELECT ARRAY ['Ivan', 'Maria', 'Dmitry', 'Olga', 'Sergey', 'Natalia', 'Alexey', 'Irina', 'Mikhail',
                    'Tatiana', 'Andrey', 'Ekaterina', 'Nikolay', 'Svetlana', 'Artem'] AS first_names,
             ARRAY ['Sokolov', 'Popova', 'Lebedev', 'Kozlova', 'Novikov', 'Morozova', 'Volkov', 'Pavlova',
                    'Semenov', 'Golubeva', 'Vinogradov', 'Bogdanova', 'Vorobyov', 'Fedorova', 'Mikhailov']
                 AS last_names) AS names;

-- Veterinarians ------------------------------------------------------------------------------------------------------

INSERT INTO veterinarian (id, user_id, specialization_id, bio, photo_url, experience_years, is_active,
                          created_at, updated_at)
VALUES ('5eed0006-0000-0000-0000-000000000001', '5eed0004-0000-0000-0000-000000000001',
        '5eed0002-0000-0000-0000-000000000001', 'Therapist, also treats rabbits', NULL, 12, TRUE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days'),
       ('5eed0006-0000-0000-0000-000000000002', '5eed0004-0000-0000-0000-000000000002',
        '5eed0002-0000-0000-0000-000000000001', 'Therapist', NULL, 4, TRUE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days'),
       ('5eed0006-0000-0000-0000-000000000003', '5eed0004-0000-0000-0000-000000000003',
        '5eed0002-0000-0000-0000-000000000002', 'Surgeon', NULL, 15, TRUE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days'),
       ('5eed0006-0000-0000-0000-000000000004', '5eed0004-0000-0000-0000-000000000004',
        '5eed0002-0000-0000-0000-000000000003', 'Dentist', NULL, 7, TRUE,
        now() - INTERVAL '200 days', now() - INTERVAL '200 days');

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

-- Monday to Friday 09:00-18:00 with a break 13:00-14:00; the first therapist also works on Saturday 10:00-15:00.
INSERT INTO work_schedule (veterinarian_id, day_of_week, start_time, end_time, break_start, break_end)
SELECT v.id::uuid, d, TIME '09:00', TIME '18:00', TIME '13:00', TIME '14:00'
FROM (VALUES ('5eed0006-0000-0000-0000-000000000001'), ('5eed0006-0000-0000-0000-000000000002'),
             ('5eed0006-0000-0000-0000-000000000003'), ('5eed0006-0000-0000-0000-000000000004')) AS v(id),
     generate_series(1, 5) AS d
UNION ALL
SELECT '5eed0006-0000-0000-0000-000000000001', 6, '10:00', '15:00', NULL, NULL;

-- The second therapist was on vacation 20-16 days ago: no appointments are generated for these days.
INSERT INTO schedule_exception (veterinarian_id, type, start_date, end_date, start_time, end_time, reason)
SELECT '5eed0006-0000-0000-0000-000000000002', 'ABSENCE', today - 20, today - 16, NULL, NULL, 'Vacation'
FROM (SELECT (now() AT TIME ZONE 'Europe/Moscow')::date AS today) AS t;

-- Pets ---------------------------------------------------------------------------------------------------------------

-- 24 pets of 15 clients; created shortly after the owner registered. Pets 7 and 19 are archived.
INSERT INTO pet (id, name, owner_id, species_id, birth_date, weight_kg, gender, notes, is_archived,
                 created_at, updated_at)
SELECT ('5eed0007-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
       names[i],
       owner.id,
       species.id,
       current_date - (365 + i * 97 % 2900),
       species.base_weight + i % 7,
       CASE WHEN i % 2 = 0 THEN 'MALE' ELSE 'FEMALE' END,
       NULL,
       i IN (7, 19),
       least(owner.created_at + make_interval(days => i % 5), now()),
       least(owner.created_at + make_interval(days => i % 5), now())
FROM generate_series(1, 24) AS i
         CROSS JOIN LATERAL (SELECT id, created_at
                             FROM users
                             WHERE id = ('5eed0005-0000-0000-0000-' || lpad(((i - 1) % 15 + 1)::text, 12, '0'))::uuid)
    AS owner
         CROSS JOIN LATERAL (SELECT ('5eed0001-0000-0000-0000-00000000000' ||
                                     CASE WHEN i % 5 IN (1, 2) THEN 1 WHEN i % 5 IN (3, 4) THEN 2 ELSE 3 END)::uuid AS id,
                                    CASE WHEN i % 5 IN (1, 2) THEN 8 WHEN i % 5 IN (3, 4) THEN 3 ELSE 1 END AS base_weight)
    AS species,
     (SELECT ARRAY ['Rex', 'Bella', 'Murka', 'Barsik', 'Krosh', 'Charlie', 'Luna', 'Max', 'Simba', 'Nyusha',
                    'Bunny', 'Rocky', 'Daisy', 'Tom', 'Snowball', 'Buddy', 'Molly', 'Felix', 'Coco', 'Oliver',
                    'Toby', 'Lucy', 'Leo', 'Fluffy'] AS names) AS n;

-- Appointments -------------------------------------------------------------------------------------------------------

-- Fixed daily slots per veterinarian (day_of_week NULL = Monday to Friday); slots never overlap and fit the working
-- hours for every species, including the service buffer. About 70% of past and 35% of future slots are booked.
INSERT INTO appointment (veterinarian_id, pet_id, service_id, start_at, end_at, status, price_snapshot,
                         client_comment, vet_notes, cancelled_by, cancelled_at, cancel_reason, created_at, updated_at)
WITH params AS (SELECT (now() AT TIME ZONE 'Europe/Moscow')::date AS today),
     slots(vet_n, day_of_week, slot_time, service_n) AS (
         VALUES (1, NULL, TIME '09:00', 1), (1, NULL, '09:30', 2), (1, NULL, '10:00', 1), (1, NULL, '10:30', 1),
                (1, NULL, '11:00', 2), (1, NULL, '11:30', 1), (1, NULL, '12:00', 1), (1, NULL, '14:00', 1),
                (1, NULL, '14:30', 2), (1, NULL, '15:00', 1), (1, NULL, '16:00', 1), (1, NULL, '17:00', 2),
                (1, 6, '10:00', 1), (1, 6, '11:00', 2), (1, 6, '12:00', 1),
                (2, NULL, '09:00', 1), (2, NULL, '10:00', 2), (2, NULL, '11:00', 1), (2, NULL, '12:00', 1),
                (2, NULL, '14:00', 2), (2, NULL, '15:00', 1), (2, NULL, '16:00', 1), (2, NULL, '17:00', 1),
                (3, NULL, '09:00', 3), (3, NULL, '14:00', 3),
                (4, NULL, '09:00', 4), (4, NULL, '10:00', 4), (4, NULL, '11:00', 4), (4, NULL, '12:00', 4),
                (4, NULL, '14:00', 4), (4, NULL, '15:00', 4), (4, NULL, '16:00', 4), (4, NULL, '17:00', 4)),
     candidates AS (
         SELECT ('5eed0006-0000-0000-0000-00000000000' || s.vet_n)::uuid AS veterinarian_id,
                ('5eed0003-0000-0000-0000-00000000000' || s.service_n)::uuid AS service_id,
                (d.day + s.slot_time) AT TIME ZONE 'Europe/Moscow' AS start_at,
                d.day || ' ' || s.slot_time || ' ' || s.vet_n AS seed,
                d.day < p.today AS is_past
         FROM params p
                  CROSS JOIN LATERAL generate_series(p.today - 90, p.today + 30, INTERVAL '1 day') AS g(day_ts)
                  CROSS JOIN LATERAL (SELECT g.day_ts::date AS day) AS d
                  JOIN slots s ON coalesce(s.day_of_week, 0) = CASE
                                                                   WHEN extract(ISODOW FROM d.day) <= 5 THEN 0
                                                                   ELSE extract(ISODOW FROM d.day) END
         WHERE mod(abs(hashtext(d.day || ' ' || s.slot_time || ' ' || s.vet_n || ' fill')::bigint), 100)
                   < CASE WHEN d.day < p.today THEN 70 ELSE 35 END
           AND NOT EXISTS (SELECT 1
                           FROM schedule_exception e
                           WHERE e.veterinarian_id = ('5eed0006-0000-0000-0000-00000000000' || s.vet_n)::uuid
                             AND e.type = 'ABSENCE'
                             AND d.day BETWEEN e.start_date AND e.end_date)),
     booked AS (
         SELECT c.*,
                pick.pet_id,
                pick.owner_id,
                v.user_id AS vet_user_id,
                c.start_at + make_interval(mins => pick.minutes) AS end_at,
                pick.price,
                mod(abs(hashtext(c.seed || ' status')::bigint), 100) AS r,
                least(c.start_at - make_interval(days => mod(abs(hashtext(c.seed || ' created')::bigint), 10)::int + 1),
                      now() - INTERVAL '1 hour') AS created_at
         FROM candidates c
                  JOIN veterinarian v ON v.id = c.veterinarian_id
                  CROSS JOIN LATERAL (
             -- A pet of a species the veterinarian treats and the service is available for, created before the visit;
             -- archived pets only have past appointments.
             SELECT p.id AS pet_id,
                    p.owner_id,
                    coalesce(ss.duration_min, s.base_duration_min) + s.buffer_after_min AS minutes,
                    coalesce(ss.price, s.base_price) AS price
             FROM pet p
                      JOIN veterinarian_species_permission vsp
                           ON vsp.species_id = p.species_id AND vsp.veterinarian_id = c.veterinarian_id
                      JOIN service_species ss ON ss.species_id = p.species_id AND ss.service_id = c.service_id
                      JOIN service s ON s.id = ss.service_id
             WHERE p.id::text LIKE '5eed%'
               AND (NOT p.is_archived OR c.is_past)
               AND p.created_at < c.start_at - INTERVAL '1 day'
             ORDER BY md5(c.seed || p.id::text)
             LIMIT 1) AS pick),
     statused AS (
         SELECT b.*,
                CASE
                    WHEN b.start_at < now() THEN CASE
                                                     WHEN b.r < 68 THEN 'COMPLETED'
                                                     WHEN b.r < 82 THEN 'CANCELLED'
                                                     WHEN b.r < 92 THEN 'NO_SHOW'
                                                     WHEN b.r < 97 THEN 'CONFIRMED'
                                                     ELSE 'PENDING' END
                    ELSE CASE
                             WHEN b.r < 12 THEN 'CANCELLED'
                             WHEN b.r < 55 THEN 'CONFIRMED'
                             ELSE 'PENDING' END
                    END AS status
         FROM booked b)
SELECT veterinarian_id,
       pet_id,
       service_id,
       start_at,
       end_at,
       status,
       price,
       CASE WHEN r % 4 = 0 THEN 'Please call before the visit' END,
       CASE WHEN status = 'COMPLETED' THEN 'Examination completed, no complications' END,
       CASE WHEN status = 'CANCELLED' THEN CASE WHEN r % 2 = 0 THEN owner_id ELSE vet_user_id END END,
       CASE WHEN status = 'CANCELLED' THEN created_at + (least(start_at, now()) - created_at) / 2 END,
       CASE
           WHEN status = 'CANCELLED' THEN CASE WHEN r % 2 = 0 THEN 'Owner cannot come' ELSE 'Veterinarian is ill' END
           END,
       created_at,
       CASE WHEN status = 'PENDING' THEN created_at ELSE greatest(created_at, least(end_at, now())) END
FROM statused;

-- Every third appointment that follows a completed one of the same pet and veterinarian within 30 days
-- becomes its follow-up.
UPDATE appointment b
SET follow_up_of = a.id
FROM appointment a
WHERE b.veterinarian_id::text LIKE '5eed%'
  AND a.veterinarian_id = b.veterinarian_id
  AND a.pet_id = b.pet_id
  AND a.status = 'COMPLETED'
  AND b.start_at > a.end_at
  AND b.start_at <= a.end_at + INTERVAL '30 days'
  AND mod(abs(hashtext(b.pet_id::text || b.start_at::text)::bigint), 3) = 0;

-- Vaccinations -------------------------------------------------------------------------------------------------------

INSERT INTO vaccination (pet_id, appointment_id, name, administered_on, next_due_on)
SELECT a.pet_id,
       a.id,
       CASE WHEN mod(abs(hashtext(a.id::text)::bigint), 2) = 0 THEN 'Rabies' ELSE 'Complex vaccine' END,
       (a.start_at AT TIME ZONE 'Europe/Moscow')::date,
       (a.start_at AT TIME ZONE 'Europe/Moscow')::date + 365
FROM appointment a
WHERE a.veterinarian_id::text LIKE '5eed%'
  AND a.service_id = '5eed0003-0000-0000-0000-000000000002'
  AND a.status = 'COMPLETED';

COMMIT;

-- Summary ------------------------------------------------------------------------------------------------------------

SELECT (SELECT count(*) FROM users WHERE id::text LIKE '5eed%')                 AS users,
       (SELECT count(*) FROM pet WHERE id::text LIKE '5eed%')                   AS pets,
       (SELECT count(*) FROM appointment WHERE veterinarian_id::text LIKE '5eed%') AS appointments,
       (SELECT count(*)
        FROM appointment
        WHERE veterinarian_id::text LIKE '5eed%'
          AND follow_up_of IS NOT NULL)                                         AS follow_ups,
       (SELECT count(*)
        FROM vaccination v
                 JOIN pet p ON p.id = v.pet_id
        WHERE p.id::text LIKE '5eed%')                                          AS vaccinations;
