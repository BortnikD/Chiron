-- Run automatically before seed commit, or independently with psql -v ON_ERROR_STOP=1 -f this-file.sql.
DO
$$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM (SELECT concat_ws(' ', first_name, middle_name, last_name, full_name) AS value
                         FROM users
                         WHERE id::text LIKE '5eed%'
                            OR email = 'admin@demo.chiron.local'
                         UNION ALL
                         SELECT name
                         FROM species
                         WHERE id::text LIKE '5eed%'
                         UNION ALL
                         SELECT concat_ws(' ', name, description)
                         FROM specialization
                         WHERE id::text LIKE '5eed%'
                         UNION ALL
                         SELECT concat_ws(' ', name, description)
                         FROM service
                         WHERE id::text LIKE '5eed%'
                         UNION ALL
                         SELECT bio
                         FROM veterinarian
                         WHERE id::text LIKE '5eed%'
                         UNION ALL
                         SELECT concat_ws(' ', name, breed, notes)
                         FROM pet
                         WHERE id::text LIKE '5eed%'
                         UNION ALL
                         SELECT reason
                         FROM schedule_exception
                         WHERE veterinarian_id::text LIKE '5eed%'
                         UNION ALL
                         SELECT concat_ws(' ', client_comment, vet_notes, cancel_reason)
                         FROM appointment
                         WHERE veterinarian_id::text LIKE '5eed%'
                         UNION ALL
                         SELECT v.name
                         FROM vaccination v
                                  JOIN pet p ON p.id = v.pet_id
                         WHERE p.id::text LIKE '5eed%'
                         UNION ALL
                         SELECT concat_ws(' ', title, body)
                         FROM notification
                         WHERE recipient_id::text LIKE '5eed%') AS texts
                   WHERE value ~ '[A-Za-z]') THEN
            RAISE EXCEPTION 'Demo display texts must be in Russian';
        END IF;
    END;
$$;

DO
$$
    DECLARE
        today date := (now() AT TIME ZONE 'Europe/Moscow')::date;
    BEGIN
        IF (SELECT count(*) FROM users WHERE id::text LIKE '5eed%' AND role = 'CLIENT') <> 8
            OR (SELECT count(*) FROM pet WHERE id::text LIKE '5eed%') <> 19
            OR (SELECT count(DISTINCT name) FROM pet WHERE id::text LIKE '5eed%') <> 19
            OR (SELECT count(*) FROM veterinarian WHERE id::text LIKE '5eed%') <> 8
            OR (SELECT count(*) FROM appointment WHERE id::text LIKE '5eed0108-%') <> 43
            OR (SELECT count(DISTINCT veterinarian_id) FROM appointment WHERE veterinarian_id::text LIKE '5eed%') <> 8
            OR (SELECT count(DISTINCT item.service_id)
                FROM appointment_service item
                         JOIN appointment a ON a.id = item.appointment_id
                WHERE a.id::text LIKE '5eed0108-%') <> 14
            OR (SELECT count(DISTINCT status) FROM appointment WHERE veterinarian_id::text LIKE '5eed%') <> 5
            OR (SELECT count(DISTINCT type) FROM notification WHERE recipient_id::text LIKE '5eed%') < 8 THEN
            RAISE EXCEPTION 'Demo data volume or scenario coverage is incomplete';
        END IF;

        IF NOT EXISTS (SELECT 1
                       FROM appointment_service item
                                JOIN appointment a ON a.id = item.appointment_id
                       WHERE a.veterinarian_id::text LIKE '5eed%'
                         AND item.is_planned
                       GROUP BY item.appointment_id
                       HAVING count(*) > 1)
            OR NOT EXISTS (SELECT 1
                           FROM appointment_service item
                                    JOIN appointment a ON a.id = item.appointment_id
                           WHERE a.veterinarian_id::text LIKE '5eed%'
                             AND NOT item.is_planned
                             AND item.is_performed) THEN
            RAISE EXCEPTION 'Demo multi-service and additional performed procedures are missing';
        END IF;

        IF EXISTS (SELECT 1
                   FROM pet p
                   WHERE p.id::text LIKE '5eed0107-%'
                     AND (SELECT count(*) FROM appointment a WHERE a.pet_id = p.id AND a.status = 'COMPLETED') < 2)
            OR (SELECT count(DISTINCT date_trunc('month', start_at AT TIME ZONE 'Europe/Moscow'))
                FROM appointment
                WHERE veterinarian_id::text LIKE '5eed%') < 6
            OR NOT EXISTS (SELECT 1
                           FROM appointment
                           WHERE veterinarian_id::text LIKE '5eed%'
                             AND follow_up_of IS NOT NULL)
            OR NOT EXISTS (SELECT 1
                           FROM vaccination v
                                    JOIN pet p ON p.id = v.pet_id
                           WHERE p.id::text LIKE '5eed%'
                             AND v.next_due_on < today)
            OR NOT EXISTS (SELECT 1
                           FROM vaccination v
                                    JOIN pet p ON p.id = v.pet_id
                           WHERE p.id::text LIKE '5eed%'
                             AND v.next_due_on BETWEEN today AND today + 7) THEN
            RAISE EXCEPTION 'Demo history, follow-ups or vaccination reminders are missing';
        END IF;

        IF EXISTS (SELECT 1
                   FROM appointment a
                            JOIN pet p ON p.id = a.pet_id
                            JOIN users owner ON owner.id = p.owner_id
                            JOIN veterinarian v ON v.id = a.veterinarian_id
                            JOIN appointment_service item ON item.appointment_id = a.id
                            JOIN service s ON s.id = item.service_id
                            LEFT JOIN service_species ss ON ss.service_id = s.id AND ss.species_id = p.species_id
                            LEFT JOIN veterinarian_species_permission permission
                                      ON permission.veterinarian_id = v.id AND permission.species_id = p.species_id
                            LEFT JOIN veterinarian_specialization assignment
                                      ON assignment.veterinarian_id = v.id
                                          AND assignment.specialization_id = s.specialization_id
                   WHERE a.veterinarian_id::text LIKE '5eed%'
                     AND (
                       ss.service_id IS NULL OR permission.veterinarian_id IS NULL
                           OR assignment.veterinarian_id IS NULL
                           OR (item.is_planned AND extract(epoch FROM (a.end_at - a.start_at)) / 60
                           <> (SELECT sum(planned.duration_min_snapshot) + max(planned.buffer_after_min_snapshot)
                               FROM appointment_service planned
                               WHERE planned.appointment_id = a.id
                                 AND planned.is_planned))
                           OR item.duration_min_snapshot <> coalesce(ss.duration_min, s.base_duration_min)
                           OR item.price_snapshot <> coalesce(ss.price, s.base_price)
                           OR item.buffer_after_min_snapshot <> s.buffer_after_min
                           OR (a.status = 'COMPLETED' AND item.is_performed IS NULL)
                           OR (a.status IN ('CANCELLED', 'NO_SHOW') AND item.is_performed IS DISTINCT FROM FALSE)
                           OR a.created_at < greatest(p.created_at, owner.created_at, v.created_at, s.created_at)
                           OR a.created_at >= a.start_at OR a.created_at > now() OR a.updated_at > now()
                           OR a.updated_at < a.created_at
                           OR (a.status IN ('COMPLETED', 'NO_SHOW') AND a.end_at > now())
                           OR (a.status IN ('PENDING', 'CONFIRMED') AND a.end_at < now() - INTERVAL '1 day')
                           OR (p.is_archived AND a.start_at > now())
                           OR (a.status = 'CANCELLED' AND (a.cancelled_by IS NULL OR a.cancelled_at IS NULL
                           OR a.cancelled_at < a.created_at OR a.cancelled_at > least(a.start_at, now())))
                           OR (a.status <> 'CANCELLED' AND (a.cancelled_by IS NOT NULL OR a.cancelled_at IS NOT NULL))
                       )) THEN
            RAISE EXCEPTION 'Demo appointments contain invalid references or chronology';
        END IF;

        IF EXISTS (SELECT 1
                   FROM appointment a
                            JOIN appointment b ON a.id < b.id
                       AND (a.veterinarian_id = b.veterinarian_id OR a.pet_id = b.pet_id)
                       AND a.start_at < b.end_at AND b.start_at < a.end_at
                   WHERE a.veterinarian_id::text LIKE '5eed%'
                     AND a.status <> 'CANCELLED'
                     AND b.status <> 'CANCELLED') THEN
            RAISE EXCEPTION 'Demo appointments overlap';
        END IF;

        IF EXISTS (SELECT 1
                   FROM appointment a
                            LEFT JOIN work_schedule w ON w.veterinarian_id = a.veterinarian_id
                       AND w.day_of_week = extract(isodow FROM a.start_at AT TIME ZONE 'Europe/Moscow')
                   WHERE a.veterinarian_id::text LIKE '5eed%'
                     AND (
                       w.id IS NULL
                           OR (a.start_at AT TIME ZONE 'Europe/Moscow')::time < w.start_time
                           OR (a.end_at AT TIME ZONE 'Europe/Moscow')::time > w.end_time
                           OR ((a.start_at AT TIME ZONE 'Europe/Moscow')::time < w.break_end
                           AND (a.end_at AT TIME ZONE 'Europe/Moscow')::time > w.break_start)
                           OR EXISTS (SELECT 1
                                      FROM schedule_exception e
                                      WHERE e.veterinarian_id = a.veterinarian_id
                                        AND (a.start_at AT TIME ZONE 'Europe/Moscow')::date BETWEEN e.start_date AND e.end_date
                                        AND (e.type = 'ABSENCE'
                                          OR (a.start_at AT TIME ZONE 'Europe/Moscow')::time < e.start_time
                                          OR (a.end_at AT TIME ZONE 'Europe/Moscow')::time > e.end_time))
                       )) THEN
            RAISE EXCEPTION 'Demo appointments fall outside working hours';
        END IF;

        IF EXISTS (SELECT 1
                   FROM appointment a
                            JOIN appointment original ON original.id = a.follow_up_of
                   WHERE a.veterinarian_id::text LIKE '5eed%'
                     AND (a.pet_id <> original.pet_id
                       OR original.status <> 'COMPLETED' OR original.end_at > a.created_at))
            OR EXISTS (SELECT 1
                       FROM vaccination v
                                JOIN pet p ON p.id = v.pet_id
                                LEFT JOIN appointment a ON a.id = v.appointment_id
                       WHERE p.id::text LIKE '5eed%'
                         AND (v.administered_on < p.birth_date
                           OR v.administered_on > today
                           OR (v.appointment_id IS NOT NULL AND (a.status <> 'COMPLETED' OR a.pet_id <> p.id))))
            OR EXISTS (SELECT 1
                       FROM notification n
                                JOIN users u ON u.id = n.recipient_id
                       WHERE n.recipient_id::text LIKE '5eed%'
                         AND (n.created_at > now() OR n.read_at > now() OR n.read_at < n.created_at
                           OR n.created_at < u.created_at)) THEN
            RAISE EXCEPTION 'Demo follow-ups, vaccinations or notifications have invalid chronology';
        END IF;
    END;
$$;
