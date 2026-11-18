-- Preserve notification history when a vaccination is deleted.
ALTER TABLE notification
    DROP CONSTRAINT notification_type_check,
    DROP CONSTRAINT notification_check,
    DROP CONSTRAINT notification_vaccination_id_fkey,
    ADD CONSTRAINT notification_vaccination_id_fkey
        FOREIGN KEY (vaccination_id) REFERENCES vaccination (id) ON DELETE SET NULL,
    ADD CONSTRAINT notification_type_check CHECK (type IN (
                                                           'APPOINTMENT_BOOKED',
                                                           'APPOINTMENT_CONFIRMED',
                                                           'APPOINTMENT_CANCELLED',
                                                           'APPOINTMENT_RESCHEDULED',
                                                           'APPOINTMENT_NO_SHOW',
                                                           'APPOINTMENT_COMPLETED',
                                                           'APPOINTMENT_NOTES_UPDATED',
                                                           'SCHEDULE_CONFLICT',
                                                           'FOLLOW_UP_SCHEDULED',
                                                           'APPOINTMENT_REMINDER',
                                                           'VACCINATION_DUE',
                                                           'VACCINATION_OVERDUE',
                                                           'VACCINATION_CREATED',
                                                           'VACCINATION_UPDATED',
                                                           'VACCINATION_DELETED',
                                                           'ACCOUNT_UPDATED',
                                                           'PASSWORD_CHANGED',
                                                           'PET_UPDATED',
                                                           'PET_ARCHIVED',
                                                           'PET_RESTORED',
                                                           'ADMIN_MESSAGE'
        ));

CREATE UNIQUE INDEX notification_vaccination_overdue_idx
    ON notification (recipient_id, vaccination_id, reminder_due_on)
    WHERE type = 'VACCINATION_OVERDUE';

CREATE INDEX vaccination_pet_name_administered_idx ON vaccination (pet_id, lower(name), administered_on);
