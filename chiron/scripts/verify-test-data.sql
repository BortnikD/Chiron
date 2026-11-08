-- Run automatically before seed commit, or independently with psql -v ON_ERROR_STOP=1 -f this-file.sql.
DO
$$
    DECLARE
        today date := (now() AT TIME ZONE 'Europe/Moscow')::date;
    BEGIN
        IF (SELECT count(*) FROM users WHERE id::text LIKE '5eed%' AND role = 'CLIENT') <> 600
            OR (SELECT count(*) FROM pet WHERE id::text LIKE '5eed%') <> 900
            OR (SELECT count(*) FROM veterinarian WHERE id::text LIKE '5eed%') <> 8
            OR (SELECT count(*) FROM appointment WHERE veterinarian_id::text LIKE '5eed%') < 10000
            OR (SELECT count(DISTINCT veterinarian_id) FROM appointment WHERE veterinarian_id::text LIKE '5eed%') <> 8
            OR (SELECT count(DISTINCT service_id) FROM appointment WHERE veterinarian_id::text LIKE '5eed%') <> 11
            OR (SELECT count(DISTINCT status) FROM appointment WHERE veterinarian_id::text LIKE '5eed%') <> 5
            OR (SELECT count(DISTINCT type) FROM notification WHERE recipient_id::text LIKE '5eed%') <> 8 THEN
            RAISE EXCEPTION 'Demo data volume or scenario coverage is incomplete';
        END IF;

        IF (SELECT count(DISTINCT date_trunc('month', start_at AT TIME ZONE 'Europe/Moscow'))
            FROM appointment
            WHERE veterinarian_id::text LIKE '5eed%') < 26
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
                            JOIN service s ON s.id = a.service_id
                            LEFT JOIN service_species ss ON ss.service_id = s.id AND ss.species_id = p.species_id
                            LEFT JOIN veterinarian_species_permission permission
                                      ON permission.veterinarian_id = v.id AND permission.species_id = p.species_id
                   WHERE a.veterinarian_id::text LIKE '5eed%'
                     AND (
                       ss.service_id IS NULL OR permission.veterinarian_id IS NULL
                           OR v.specialization_id <> s.specialization_id
                           OR extract(epoch FROM (a.end_at - a.start_at)) / 60
                           <> coalesce(ss.duration_min, s.base_duration_min) + s.buffer_after_min
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
