-- Test data for local development and manual testing (statistics, booking, schedules).
--
-- Run from the repository root while docker/docker-compose.local.yaml is up and the application has started at least once
-- (Flyway creates the schema):
--   docker cp chiron/scripts chiron-postgres:/tmp/chiron-seed
--   docker exec chiron-postgres psql -U postgres -d chiron -v ON_ERROR_STOP=1 -f /tmp/chiron-seed/seed-test-data.sql
--
-- Re-runnable: everything seeded before (ids starting with 5eed and the rows that reference them) is removed first,
-- then inserted again. Appointment dates are relative to today in the clinic time zone (Europe/Moscow): from 730 days
-- ago to 60 days ahead, so the current month always has data. The pseudo-random choices are derived from hashes of
-- the date and slot; eligibility and current-day statuses advance with the clock. Other data (the admin account, rows
-- created through the API that do not reference seeded rows) is left untouched.
--
-- Every seeded user has the password "password123"; emails end with @seed.chiron.local.
-- Veterinarians: vet1..vet8@seed.chiron.local; clients: client1..client600@seed.chiron.local.

BEGIN;
SET LOCAL TIME ZONE 'Europe/Moscow';

-- Cleanup ------------------------------------------------------------------------------------------------------------

-- Delete inbox history in bulk before per-appointment foreign-key cascades.
DELETE
FROM notification
WHERE recipient_id::text LIKE '5eed%';

DELETE
FROM vaccination
WHERE pet_id IN (SELECT id FROM pet WHERE id::text LIKE '5eed%' OR owner_id::text LIKE '5eed%');

DELETE
FROM appointment
WHERE veterinarian_id::text LIKE '5eed%'
   OR service_id::text LIKE '5eed%'
   OR pet_id IN (SELECT id FROM pet WHERE id::text LIKE '5eed%' OR owner_id::text LIKE '5eed%');

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
VALUES ('5eed0001-0000-0000-0000-000000000001', 'Dog'),
       ('5eed0001-0000-0000-0000-000000000002', 'Cat'),
       ('5eed0001-0000-0000-0000-000000000003', 'Rabbit'),
       ('5eed0001-0000-0000-0000-000000000004', 'Guinea pig'),
       ('5eed0001-0000-0000-0000-000000000005', 'Ferret'),
       ('5eed0001-0000-0000-0000-000000000006', 'Parrot');

INSERT INTO specialization (id, name, description)
VALUES ('5eed0002-0000-0000-0000-000000000001', 'Therapy', 'General examinations, diagnostics and vaccination'),
       ('5eed0002-0000-0000-0000-000000000002', 'Surgery', 'Planned and emergency operations'),
       ('5eed0002-0000-0000-0000-000000000003', 'Dentistry', 'Oral cavity and teeth treatment');

INSERT INTO service (id, specialization_id, name, description, base_price, base_duration_min, buffer_after_min,
                     is_active, created_at, updated_at)
VALUES ('5eed0003-0000-0000-0000-000000000001', '5eed0002-0000-0000-0000-000000000001', 'General check-up',
        'Examination, weighing and owner consultation', 1500.00, 30, 0, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0003-0000-0000-0000-000000000002', '5eed0002-0000-0000-0000-000000000001', 'Vaccination',
        'Examination before vaccination and the injection', 1200.00, 20, 10, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0003-0000-0000-0000-000000000003', '5eed0002-0000-0000-0000-000000000002', 'Soft tissue surgery',
        'Planned and emergency soft tissue operations', 8000.00, 90, 30, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0003-0000-0000-0000-000000000004', '5eed0002-0000-0000-0000-000000000003', 'Teeth cleaning',
        'Ultrasonic scaling and polishing', 4000.00, 60, 0, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       -- Inactive and without appointments: must not appear in the statistics by service.
       ('5eed0003-0000-0000-0000-000000000005', '5eed0002-0000-0000-0000-000000000001', 'Laser therapy',
        'Low-level laser therapy session', 2000.00, 30, 0, FALSE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days');

INSERT INTO service (id, specialization_id, name, description, base_price, base_duration_min, buffer_after_min,
                     created_at, updated_at)
SELECT ('5eed0003-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
       ('5eed0002-0000-0000-0000-00000000000' || specialization_n)::uuid,
       name,
       description,
       price,
       minutes,
       buffer,
       now() - INTERVAL '900 days',
       now() - INTERVAL '900 days'
FROM (VALUES (6, 1, 'Ultrasound', 'Abdominal ultrasound examination', 2800, 30, 0),
             (7, 1, 'Blood test', 'Blood sampling and laboratory panel', 1800, 20, 10),
             (8, 2, 'Wound treatment', 'Wound cleaning and suturing', 4500, 60, 30),
             (9, 3, 'Tooth extraction', 'Dental examination and extraction', 6500, 45, 15),
             (10, 1, 'Exotic pet consultation', 'Small mammal and bird examination', 2200, 30, 0),
             (11, 1, 'Follow-up examination', 'Assessment of treatment progress', 900, 20, 10),
             (12, 2, 'Dressing change', 'Postoperative wound care', 1300, 30, 0))
         AS s(n, specialization_n, name, description, price, minutes, buffer);

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

INSERT INTO service_species (service_id, species_id, duration_min, price)
SELECT s.id,
       p.id,
       NULL,
       CASE WHEN p.name IN ('Rabbit', 'Guinea pig', 'Parrot') THEN round(s.base_price * 0.8, 2) END
FROM service s
         CROSS JOIN species p
WHERE s.id::text LIKE '5eed%'
  AND p.id::text LIKE '5eed%'
  AND ((s.id::text >= '5eed0003-0000-0000-0000-000000000006'
    AND (s.specialization_id = '5eed0002-0000-0000-0000-000000000001' OR p.name IN ('Dog', 'Cat')))
    OR (s.id IN ('5eed0003-0000-0000-0000-000000000001', '5eed0003-0000-0000-0000-000000000002')
        AND p.name IN ('Guinea pig', 'Ferret')));

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
              '+79000000001', 'VETERINARIAN', 900),
             ('5eed0004-0000-0000-0000-000000000002', 'vet2@seed.chiron.local', 'Pavel', NULL, 'Petrov',
              '+79000000002', 'VETERINARIAN', 900),
             ('5eed0004-0000-0000-0000-000000000003', 'vet3@seed.chiron.local', 'Elena', 'Viktorovna', 'Smirnova',
              '+79000000003', 'VETERINARIAN', 900),
             ('5eed0004-0000-0000-0000-000000000004', 'vet4@seed.chiron.local', 'Oleg', NULL, 'Kuznetsov',
              '+79000000004', 'VETERINARIAN', 900),
             ('5eed0004-0000-0000-0000-000000000005', 'vet5@seed.chiron.local', 'Sofia', NULL, 'Orlova',
              '+79000000005', 'VETERINARIAN', 600),
             ('5eed0004-0000-0000-0000-000000000006', 'vet6@seed.chiron.local', 'Roman', 'Olegovich', 'Belov',
              '+79000000006', 'VETERINARIAN', 500),
             ('5eed0004-0000-0000-0000-000000000007', 'vet7@seed.chiron.local', 'Alina', NULL, 'Zaitseva',
              '+79000000007', 'VETERINARIAN', 400),
             ('5eed0004-0000-0000-0000-000000000008', 'vet8@seed.chiron.local', 'Denis', NULL, 'Savin',
              '+79000000008', 'VETERINARIAN', 300))
         AS u(id, email, first_name, middle_name, last_name, phone, role, age_days);

-- Registration dates span the history; reused names have unique emails and phone numbers.
INSERT INTO users (id, email, password_hash, first_name, middle_name, last_name, full_name, phone, role,
                   created_at, updated_at)
SELECT ('5eed0005-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
       'client' || i || '@seed.chiron.local',
       '$2a$10$d5If9kxcQ.rpioiVuQb0muhYKqYDOQyerCqMeDvbg6MKg8.k11iNS',
       first_names[(i - 1) % 15 + 1],
       NULL,
       last_names[(i - 1) % 15 + 1],
       upper(left(first_names[(i - 1) % 15 + 1], 1)) || '. ' || last_names[(i - 1) % 15 + 1],
       '+7910000' || lpad(i::text, 4, '0'),
       'CLIENT',
       now() - make_interval(days => 1 + i * 137 % 810),
       now() - make_interval(days => 1 + i * 137 % 810)
FROM generate_series(1, 600) AS i,
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
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0006-0000-0000-0000-000000000002', '5eed0004-0000-0000-0000-000000000002',
        '5eed0002-0000-0000-0000-000000000001', 'Therapist', NULL, 4, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0006-0000-0000-0000-000000000003', '5eed0004-0000-0000-0000-000000000003',
        '5eed0002-0000-0000-0000-000000000002', 'Surgeon', NULL, 15, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days'),
       ('5eed0006-0000-0000-0000-000000000004', '5eed0004-0000-0000-0000-000000000004',
        '5eed0002-0000-0000-0000-000000000003', 'Dentist', NULL, 7, TRUE,
        now() - INTERVAL '900 days', now() - INTERVAL '900 days');

INSERT INTO veterinarian (id, user_id, specialization_id, bio, experience_years, created_at, updated_at)
SELECT ('5eed0006-0000-0000-0000-00000000000' || n)::uuid,
       u.id,
       ('5eed0002-0000-0000-0000-00000000000' || specialization_n)::uuid,
       bio,
       experience,
       u.created_at,
       u.created_at
FROM (VALUES (5, 1, 'General practitioner and ultrasound specialist', 6),
             (6, 2, 'Soft tissue surgeon', 10),
             (7, 3, 'Veterinary dentist', 5),
             (8, 1, 'Exotic mammals and birds specialist', 8)) AS v(n, specialization_n, bio, experience)
         JOIN users u ON u.id = ('5eed0004-0000-0000-0000-00000000000' || n)::uuid;

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
              THEN s.name NOT IN ('Dog', 'Cat')
          ELSE s.name IN ('Dog', 'Cat') END;

-- Monday to Friday 09:00-18:00 with a break 13:00-14:00; the first therapist also works on Saturday 10:00-15:00.
INSERT INTO work_schedule (veterinarian_id, day_of_week, start_time, end_time, break_start, break_end)
SELECT v.id::uuid, d, TIME '09:00', TIME '18:00', TIME '13:00', TIME '14:00'
FROM veterinarian v,
     generate_series(1, 5) AS d
WHERE v.id::text LIKE '5eed%'
UNION ALL
SELECT '5eed0006-0000-0000-0000-000000000001', 6, '10:00', '15:00', NULL, NULL;

-- The second therapist was on vacation 20-16 days ago: no appointments are generated for these days.
INSERT INTO schedule_exception (veterinarian_id, type, start_date, end_date, start_time, end_time, reason)
SELECT '5eed0006-0000-0000-0000-000000000002', 'ABSENCE', today - 20, today - 16, NULL, NULL, 'Vacation'
FROM (SELECT (now() AT TIME ZONE 'Europe/Moscow')::date AS today) AS t;

INSERT INTO schedule_exception (veterinarian_id, type, start_date, end_date, start_time, end_time, reason)
SELECT v.id, 'ABSENCE', today - 180 + n, today - 174 + n, NULL, NULL, 'Annual leave'
FROM veterinarian v
         CROSS JOIN (VALUES (0), (-365)) AS periods(n)
         CROSS JOIN (SELECT (now() AT TIME ZONE 'Europe/Moscow')::date AS today) AS t
WHERE v.id::text LIKE '5eed%'
UNION ALL
SELECT '5eed0006-0000-0000-0000-000000000005',
       'CUSTOM_HOURS',
       today + 3,
       today + 3,
       TIME '10:00',
       TIME '15:00',
       'Training in the afternoon'
FROM (SELECT (now() AT TIME ZONE 'Europe/Moscow')::date AS today) AS t;

-- Pets ---------------------------------------------------------------------------------------------------------------

-- Every client has a pet; half have a second one. Archived patients retain their history.
INSERT INTO pet (id, name, owner_id, species_id, birth_date, weight_kg, gender, notes, is_archived,
                 created_at, updated_at)
SELECT ('5eed0007-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
       names[(i - 1) % 24 + 1],
       owner.id,
       species.id,
       owner.created_at::date - (365 + i * 97 % 2900),
       species.base_weight + (i % 7) * 0.1,
       CASE WHEN i % 2 = 0 THEN 'MALE' ELSE 'FEMALE' END,
       CASE
           WHEN i % 5 = 0 THEN 'Sensitive to handling; allow time to settle'
           WHEN i % 7 = 0 THEN 'Food allergy; owner follows a special diet' END,
       i % 37 = 0,
       least(owner.created_at + make_interval(days => i % 5), now()),
       least(owner.created_at + make_interval(days => i % 5), now())
FROM generate_series(1, 900) AS i
         CROSS JOIN LATERAL (SELECT id, created_at
                             FROM users
                             WHERE id = ('5eed0005-0000-0000-0000-' || lpad(((i - 1) % 600 + 1)::text, 12, '0'))::uuid)
    AS owner
         CROSS JOIN LATERAL (SELECT ('5eed0001-0000-0000-0000-00000000000' ||
                                     CASE
                                         WHEN i % 20 < 9 THEN 1
                                         WHEN i % 20 < 16 THEN 2
                                         WHEN i % 20 = 16 THEN 3
                                         WHEN i % 20 = 17 THEN 4
                                         WHEN i % 20 = 18 THEN 5
                                         ELSE 6 END)::uuid AS id,
                                    CASE
                                        WHEN i % 20 < 9 THEN 8
                                        WHEN i % 20 < 16 THEN 3
                                        WHEN i % 20 = 19 THEN 0.3
                                        ELSE 1 END         AS base_weight)
    AS species,
     (SELECT ARRAY ['Rex', 'Bella', 'Murka', 'Barsik', 'Krosh', 'Charlie', 'Luna', 'Max', 'Simba', 'Nyusha',
                 'Bunny', 'Rocky', 'Daisy', 'Tom', 'Snowball', 'Buddy', 'Molly', 'Felix', 'Coco', 'Oliver',
                 'Toby', 'Lucy', 'Leo', 'Fluffy'] AS names) AS n;

-- Appointments -------------------------------------------------------------------------------------------------------

ANALYZE pet, veterinarian, service_species, veterinarian_species_permission;

-- Fixed daily slots per veterinarian (day_of_week NULL = Monday to Friday); slots never overlap and fit the working
-- hours for every species, including the service buffer. Demand grows over time and peaks in spring and autumn.
INSERT INTO appointment (veterinarian_id, pet_id, service_id, start_at, end_at, status, price_snapshot,
                         client_comment, vet_notes, cancelled_by, cancelled_at, cancel_reason, created_at, updated_at)
WITH params AS (SELECT (now() AT TIME ZONE 'Europe/Moscow')::date AS today),
     slots(vet_n, day_of_week, slot_time, service_n) AS (VALUES (1, NULL, TIME '09:00', 1),
                                                                (1, NULL, '09:30', 2),
                                                                (1, NULL, '10:00', 1),
                                                                (1, NULL, '10:30', 1),
                                                                (1, NULL, '11:00', 2),
                                                                (1, NULL, '11:30', 1),
                                                                (1, NULL, '12:00', 1),
                                                                (1, NULL, '14:00', 1),
                                                                (1, NULL, '14:30', 2),
                                                                (1, NULL, '15:00', 1),
                                                                (1, NULL, '16:00', 1),
                                                                (1, NULL, '17:00', 2),
                                                                (1, 6, '10:00', 1),
                                                                (1, 6, '11:00', 2),
                                                                (1, 6, '12:00', 1),
                                                                (2, NULL, '09:00', 1),
                                                                (2, NULL, '10:00', 2),
                                                                (2, NULL, '11:00', 1),
                                                                (2, NULL, '12:00', 1),
                                                                (2, NULL, '14:00', 2),
                                                                (2, NULL, '15:00', 1),
                                                                (2, NULL, '16:00', 1),
                                                                (2, NULL, '17:00', 1),
                                                                (3, NULL, '09:00', 3),
                                                                (3, NULL, '14:00', 3),
                                                                (4, NULL, '09:00', 4),
                                                                (4, NULL, '10:00', 4),
                                                                (4, NULL, '11:00', 4),
                                                                (4, NULL, '12:00', 4),
                                                                (4, NULL, '14:00', 4),
                                                                (4, NULL, '15:00', 4),
                                                                (4, NULL, '16:00', 4),
                                                                (4, NULL, '17:00', 4)),
     expanded_slots AS (SELECT *
                        FROM slots
                        UNION ALL
                        SELECT copies.vet_n,
                               s.day_of_week,
                               s.slot_time,
                               CASE WHEN copies.vet_n = 8 THEN 10 ELSE s.service_n END
                        FROM slots s
                                 JOIN (VALUES (5, 2), (6, 3), (7, 4), (8, 2)) AS copies(vet_n, template_n)
                                      ON s.vet_n = copies.template_n),
     candidates AS (SELECT ('5eed0006-0000-0000-0000-00000000000' || s.vet_n)::uuid                              AS veterinarian_id,
                           ('5eed0003-0000-0000-0000-' || lpad((CASE
                                                                    WHEN s.service_n = 1
                                                                        THEN (ARRAY [1, 6, 7, 11])[1 + extract(hour FROM s.slot_time)::int % 4]
                                                                    WHEN s.service_n = 3 AND extract(hour FROM s.slot_time) = 14
                                                                        THEN CASE WHEN extract(day FROM d.day)::int % 2 = 0 THEN 8 ELSE 12 END
                                                                    WHEN s.service_n = 4 AND extract(hour FROM s.slot_time)::int % 2 = 0
                                                                        THEN 9
                                                                    WHEN s.service_n = 10 AND extract(hour FROM s.slot_time)::int % 2 = 0
                                                                        THEN 7
                                                                    ELSE s.service_n END)::text, 12,
                                                               '0'))::uuid                                       AS service_id,
                           s.vet_n,
                           d.day,
                           (d.day + s.slot_time) AT TIME ZONE 'Europe/Moscow'                                    AS start_at,
                           d.day || ' ' || s.slot_time || ' ' || s.vet_n                                         AS seed,
                           d.day < p.today                                                                       AS is_past
                    FROM params p
                             CROSS JOIN LATERAL generate_series(p.today - 730, p.today + 60, INTERVAL '1 day') AS g(day_ts)
                             CROSS JOIN LATERAL (SELECT g.day_ts::date AS day) AS d
                             JOIN expanded_slots s ON coalesce(s.day_of_week, 0) = CASE
                                                                                       WHEN extract(ISODOW FROM d.day) <= 5
                                                                                           THEN 0
                                                                                       ELSE extract(ISODOW FROM d.day) END
                    WHERE mod(abs(hashtext(d.day || ' ' || s.slot_time || ' ' || s.vet_n || ' fill')::bigint), 100)
                        < CASE
                              WHEN d.day < p.today THEN 48 + (d.day - (p.today - 730)) / 25
                              WHEN d.day <= p.today + 7 THEN 65
                              WHEN d.day <= p.today + 30 THEN 40
                              ELSE 20 END
                              + CASE WHEN extract(month FROM d.day) IN (3, 4, 5, 9, 10) THEN 12 ELSE 0 END
                              - CASE WHEN s.vet_n IN (3, 6) THEN 10 ELSE 0 END
                      AND NOT EXISTS (SELECT 1
                                      FROM schedule_exception e
                                      WHERE e.veterinarian_id = ('5eed0006-0000-0000-0000-00000000000' || s.vet_n)::uuid
                                        AND e.type = 'ABSENCE'
                                        AND d.day BETWEEN e.start_date AND e.end_date)
                      AND NOT EXISTS (SELECT 1
                                      FROM schedule_exception e
                                      WHERE e.veterinarian_id = ('5eed0006-0000-0000-0000-00000000000' || s.vet_n)::uuid
                                        AND e.type = 'CUSTOM_HOURS'
                                        AND d.day BETWEEN e.start_date AND e.end_date
                                        AND (s.slot_time < e.start_time OR
                                             s.slot_time + INTERVAL '1 hour' > e.end_time))),
     booked AS (SELECT c.*,
                       pick.pet_id,
                       pick.owner_id,
                       v.user_id                                            AS vet_user_id,
                       c.start_at + make_interval(mins => pick.minutes)     AS end_at,
                       round(pick.price * CASE
                                              WHEN c.day < (now() AT TIME ZONE 'Europe/Moscow')::date - 365
                                                  THEN 0.85
                                              ELSE 1 END, 2)                AS price,
                       mod(abs(hashtext(c.seed || ' status')::bigint), 100) AS r,
                       greatest(pick.pet_created_at, v.created_at,
                                least(c.start_at -
                                      make_interval(days => mod(abs(hashtext(c.seed || ' created')::bigint), 10)::int + 1),
                                      now() - INTERVAL '1 hour'))           AS created_at
                FROM candidates c
                         JOIN veterinarian v ON v.id = c.veterinarian_id
                         CROSS JOIN LATERAL (
                    -- A pet of a species the veterinarian treats and the service is available for, created before the visit;
                    -- archived pets only have past appointments.
                    SELECT p.id                                                                AS pet_id,
                           p.owner_id,
                           p.created_at                                                        AS pet_created_at,
                           coalesce(ss.duration_min, s.base_duration_min) + s.buffer_after_min AS minutes,
                           coalesce(ss.price, s.base_price)                                    AS price
                    FROM pet p
                             JOIN veterinarian_species_permission vsp
                                  ON vsp.species_id = p.species_id AND vsp.veterinarian_id = c.veterinarian_id
                             JOIN service_species ss ON ss.species_id = p.species_id AND ss.service_id = c.service_id
                             JOIN service s ON s.id = ss.service_id
                    WHERE p.id::text LIKE '5eed%'
                      AND (NOT p.is_archived OR c.is_past)
                      AND mod(abs(hashtext(p.owner_id::text || c.day)::bigint), 8) + 1 = c.vet_n
                      AND p.created_at < c.start_at - INTERVAL '1 day'
                      AND v.created_at < c.start_at - INTERVAL '1 day'
                    ORDER BY md5(c.seed || p.id::text)
                    LIMIT 1) AS pick),
     unique_visits AS (
         -- An owner sees one veterinarian per day, and each pet has at most one visit per day.
         SELECT DISTINCT ON (pet_id, day) * FROM booked ORDER BY pet_id, day, start_at),
     statused AS (SELECT b.*,
                         CASE
                             WHEN b.end_at < now() THEN CASE
                                                            WHEN b.r < 80 THEN 'COMPLETED'
                                                            WHEN b.r < 94 THEN 'CANCELLED'
                                                            ELSE 'NO_SHOW' END
                             ELSE CASE
                                      WHEN b.r < 12 THEN 'CANCELLED'
                                      WHEN b.r < 55 THEN 'CONFIRMED'
                                      ELSE 'PENDING' END
                             END AS status
                  FROM unique_visits b)
SELECT veterinarian_id,
       pet_id,
       service_id,
       start_at,
       end_at,
       status,
       price,
       CASE
           WHEN r % 4 = 0 THEN (ARRAY ['Please call before the visit', 'Reduced appetite for two days',
               'Routine preventive visit', 'Recheck after treatment'])[1 + r % 7 % 4] END,
       CASE
           WHEN status = 'COMPLETED' THEN (ARRAY ['Examination completed; preventive care discussed',
               'Condition improved; continue treatment for seven days', 'Procedure tolerated well; recheck recommended',
               'Results reviewed with owner; monitor appetite and activity'])[1 + r % 4] END,
       CASE WHEN status = 'CANCELLED' THEN CASE WHEN r % 2 = 0 THEN owner_id ELSE vet_user_id END END,
       CASE WHEN status = 'CANCELLED' THEN created_at + (least(start_at, now()) - created_at) / 2 END,
       CASE
           WHEN status = 'CANCELLED' THEN CASE WHEN r % 2 = 0 THEN 'Owner cannot come' ELSE 'Veterinarian is ill' END
           END,
       created_at,
       CASE WHEN status = 'PENDING' THEN created_at ELSE greatest(created_at, least(end_at, now())) END
FROM statused;

ANALYZE appointment;

-- Use the latest completed visit of the same pet, including referrals to a different specialist.
UPDATE appointment b
SET follow_up_of = (SELECT a.id
                    FROM appointment a
                    WHERE a.pet_id = b.pet_id
                      AND a.status = 'COMPLETED'
                      AND b.start_at > a.end_at
                      AND b.start_at <= a.end_at + INTERVAL '60 days'
                      AND a.end_at <= b.created_at
                    ORDER BY a.end_at DESC, a.id
                    LIMIT 1)
WHERE b.veterinarian_id::text LIKE '5eed%'
  AND mod(abs(hashtext(b.pet_id::text || b.start_at::text)::bigint), 3) = 0;

-- Vaccinations -------------------------------------------------------------------------------------------------------

INSERT INTO vaccination (pet_id, appointment_id, name, administered_on, next_due_on)
SELECT DISTINCT ON (a.pet_id) a.pet_id,
                              a.id,
                              CASE
                                  WHEN mod(abs(hashtext(a.pet_id::text)::bigint), 2) = 0 THEN 'Rabies'
                                  ELSE 'Complex vaccine' END,
                              (a.start_at AT TIME ZONE 'Europe/Moscow')::date,
                              (a.start_at AT TIME ZONE 'Europe/Moscow')::date + 365
FROM appointment a
WHERE a.veterinarian_id::text LIKE '5eed%'
  AND a.service_id = '5eed0003-0000-0000-0000-000000000002'
  AND a.status = 'COMPLETED'
ORDER BY a.pet_id, a.start_at DESC;

-- Imported vaccination passports also give new patients overdue, upcoming and later booster dates.
INSERT INTO vaccination (pet_id, name, administered_on, next_due_on)
SELECT p.id,
       'Complex vaccine',
       coalesce(v.administered_on - 365, today - 365 + (right(p.id::text, 4)::int % 120 - 60)),
       coalesce(v.administered_on, today + (right(p.id::text, 4)::int % 120 - 60))
FROM pet p
         LEFT JOIN vaccination v ON v.pet_id = p.id
         CROSS JOIN (SELECT (now() AT TIME ZONE 'Europe/Moscow')::date AS today) AS t
WHERE p.id::text LIKE '5eed%'
  AND p.species_id <> '5eed0001-0000-0000-0000-000000000006';

-- Notifications ------------------------------------------------------------------------------------------------------

INSERT INTO notification (recipient_id, actor_id, type, title, body, appointment_id, pet_id, created_at, read_at)
SELECT recipient.id,
       event.actor_id,
       event.type,
       CASE event.type
           WHEN 'APPOINTMENT_BOOKED' THEN 'Новая запись на приём'
           WHEN 'APPOINTMENT_CONFIRMED' THEN 'Запись подтверждена'
           WHEN 'APPOINTMENT_CANCELLED' THEN 'Запись отменена'
           WHEN 'APPOINTMENT_NO_SHOW' THEN 'Отмечена неявка на приём'
           WHEN 'APPOINTMENT_RESCHEDULED' THEN 'Запись перенесена'
           WHEN 'FOLLOW_UP_SCHEDULED' THEN 'Назначен повторный приём'
           WHEN 'APPOINTMENT_REMINDER' THEN 'Напоминание о приёме' END,
       p.name || ' — ' || s.name || ', ' || to_char(a.start_at AT TIME ZONE 'Europe/Moscow', 'DD.MM.YYYY HH24:MI')
           || ', врач ' || u.full_name || coalesce('. ' || a.cancel_reason, '.'),
       a.id,
       p.id,
       event.at,
       CASE
           WHEN event.at < now() - INTERVAL '7 days' OR right(p.id::text, 4)::int % 3 <> 0
               THEN least(event.at + INTERVAL '2 hours', now()) END
FROM appointment a
         JOIN pet p ON p.id = a.pet_id
         JOIN service s ON s.id = a.service_id
         JOIN veterinarian v ON v.id = a.veterinarian_id
         JOIN users u ON u.id = v.user_id
         CROSS JOIN LATERAL (
    SELECT 'APPOINTMENT_BOOKED' AS type, a.created_at AS at, p.owner_id AS actor_id
    UNION ALL
    SELECT 'APPOINTMENT_CONFIRMED', a.created_at + INTERVAL '1 hour', v.user_id
    WHERE a.status IN ('CONFIRMED', 'COMPLETED', 'NO_SHOW')
    UNION ALL
    SELECT 'APPOINTMENT_CANCELLED', a.cancelled_at, a.cancelled_by
    WHERE a.status = 'CANCELLED'
    UNION ALL
    SELECT 'APPOINTMENT_NO_SHOW', a.end_at, v.user_id
    WHERE a.status = 'NO_SHOW'
    UNION ALL
    SELECT 'FOLLOW_UP_SCHEDULED', a.created_at, v.user_id
    WHERE a.follow_up_of IS NOT NULL
    UNION ALL
    SELECT 'APPOINTMENT_RESCHEDULED', a.created_at + INTERVAL '2 hours', p.owner_id
    WHERE a.status <> 'CANCELLED'
      AND right(p.id::text, 4)::int % 11 = 0
    UNION ALL
    SELECT 'APPOINTMENT_REMINDER', a.start_at - INTERVAL '24 hours', NULL::uuid
    WHERE a.status IN ('PENDING', 'CONFIRMED', 'COMPLETED')
      AND a.start_at - INTERVAL '24 hours' > a.created_at
    ) AS event
         CROSS JOIN LATERAL (
    SELECT p.owner_id AS id
    UNION ALL
    SELECT v.user_id
    WHERE event.type <> 'APPOINTMENT_REMINDER'
    ) AS recipient
WHERE a.veterinarian_id::text LIKE '5eed%'
  AND event.at <= now()
  AND (event.type <> 'APPOINTMENT_REMINDER' OR recipient.id = p.owner_id);

INSERT INTO notification (recipient_id, type, title, body, pet_id, vaccination_id, created_at, read_at)
SELECT p.owner_id,
       'VACCINATION_DUE',
       'Скоро ревакцинация',
       p.name || ': срок ревакцинации «' || v.name || '» — ' || to_char(v.next_due_on, 'DD.MM.YYYY') || '.',
       p.id,
       v.id,
       greatest(owner.created_at, (v.next_due_on - 7)::timestamp AT TIME ZONE 'Europe/Moscow'),
       CASE
           WHEN v.next_due_on < today - 7
               THEN least(now(),
                          greatest(owner.created_at, (v.next_due_on - 6)::timestamp AT TIME ZONE 'Europe/Moscow')) END
FROM vaccination v
         JOIN pet p ON p.id = v.pet_id
         JOIN users owner ON owner.id = p.owner_id
         CROSS JOIN (SELECT (now() AT TIME ZONE 'Europe/Moscow')::date AS today) AS t
WHERE p.id::text LIKE '5eed%'
  AND NOT p.is_archived
  AND v.next_due_on <= today + 7;

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
