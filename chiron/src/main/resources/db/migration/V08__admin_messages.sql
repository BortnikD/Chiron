ALTER TABLE notification
    DROP CONSTRAINT notification_type_check,
    DROP CONSTRAINT notification_check,
    ADD CONSTRAINT notification_type_check CHECK (type IN (
                                                           'APPOINTMENT_BOOKED',
                                                           'APPOINTMENT_CONFIRMED',
                                                           'APPOINTMENT_CANCELLED',
                                                           'APPOINTMENT_RESCHEDULED',
                                                           'APPOINTMENT_NO_SHOW',
                                                           'FOLLOW_UP_SCHEDULED',
                                                           'APPOINTMENT_REMINDER',
                                                           'VACCINATION_DUE',
                                                           'ADMIN_MESSAGE')),
    ADD CONSTRAINT notification_check CHECK (
        (type IN (
                  'APPOINTMENT_BOOKED',
                  'APPOINTMENT_CONFIRMED',
                  'APPOINTMENT_CANCELLED',
                  'APPOINTMENT_RESCHEDULED',
                  'APPOINTMENT_NO_SHOW',
                  'FOLLOW_UP_SCHEDULED',
                  'APPOINTMENT_REMINDER'
            )
            AND appointment_id IS NOT NULL)
            OR (type = 'VACCINATION_DUE' AND vaccination_id IS NOT NULL)
            OR type = 'ADMIN_MESSAGE'
        );
