ALTER TABLE notification
    ADD COLUMN reminder_start_at TIMESTAMPTZ,
    ADD COLUMN reminder_due_on   DATE;

UPDATE notification n
SET reminder_start_at = a.start_at
FROM appointment a
WHERE n.appointment_id = a.id
  AND n.type = 'APPOINTMENT_REMINDER';

UPDATE notification n
SET reminder_due_on = v.next_due_on
FROM vaccination v
WHERE n.vaccination_id = v.id
  AND n.type = 'VACCINATION_DUE';

DROP INDEX notification_appointment_reminder_idx;
DROP INDEX notification_vaccination_due_idx;

CREATE UNIQUE INDEX notification_appointment_reminder_idx
    ON notification (recipient_id, appointment_id, reminder_start_at)
    WHERE type = 'APPOINTMENT_REMINDER';
CREATE UNIQUE INDEX notification_vaccination_due_idx
    ON notification (recipient_id, vaccination_id, reminder_due_on)
    WHERE type = 'VACCINATION_DUE';

ALTER TABLE notification
    DROP CONSTRAINT notification_type_check,
    DROP CONSTRAINT notification_check,
    DROP CONSTRAINT notification_appointment_id_fkey,
    ADD CONSTRAINT notification_appointment_id_fkey
        FOREIGN KEY (appointment_id) REFERENCES appointment (id) ON DELETE SET NULL,
    ADD CONSTRAINT notification_type_check CHECK (type IN (
                                                           'APPOINTMENT_BOOKED', 'APPOINTMENT_CONFIRMED',
                                                           'APPOINTMENT_CANCELLED',
                                                           'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_NO_SHOW',
                                                           'APPOINTMENT_COMPLETED',
                                                           'APPOINTMENT_NOTES_UPDATED', 'SCHEDULE_CONFLICT',
                                                           'FOLLOW_UP_SCHEDULED',
                                                           'APPOINTMENT_REMINDER', 'VACCINATION_DUE', 'ADMIN_MESSAGE')),
    -- Appointment notifications keep their text after the linked cancelled appointment is deleted.
    ADD CONSTRAINT notification_check CHECK (
        type IN (
                 'APPOINTMENT_BOOKED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED',
                 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_NO_SHOW', 'APPOINTMENT_COMPLETED',
                 'APPOINTMENT_NOTES_UPDATED', 'SCHEDULE_CONFLICT', 'FOLLOW_UP_SCHEDULED',
                 'APPOINTMENT_REMINDER', 'ADMIN_MESSAGE')
            OR (type = 'VACCINATION_DUE' AND vaccination_id IS NOT NULL)
        );
