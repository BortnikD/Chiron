-- In-app notification inbox. title / body are rendered at the moment of the event, so they keep the state of that
-- moment even if the appointment changes later.
CREATE TABLE notification
(
    id             UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    recipient_id   UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- NULL = created by the system (scheduler)
    actor_id       UUID REFERENCES users (id) ON DELETE SET NULL,
    type           TEXT        NOT NULL CHECK (type IN (
                                   'APPOINTMENT_BOOKED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED',
                                   'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_NO_SHOW', 'FOLLOW_UP_SCHEDULED',
                                   'APPOINTMENT_REMINDER', 'VACCINATION_DUE')),
    title          TEXT        NOT NULL,
    body           TEXT        NOT NULL,
    appointment_id UUID REFERENCES appointment (id) ON DELETE CASCADE,
    pet_id         UUID REFERENCES pet (id) ON DELETE CASCADE,
    vaccination_id UUID REFERENCES vaccination (id) ON DELETE CASCADE,
    read_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (type IN ('APPOINTMENT_BOOKED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED',
                  'APPOINTMENT_NO_SHOW', 'FOLLOW_UP_SCHEDULED', 'APPOINTMENT_REMINDER')
            AND appointment_id IS NOT NULL)
            OR (type = 'VACCINATION_DUE' AND vaccination_id IS NOT NULL)
        )
);

CREATE INDEX notification_recipient_id_created_at_idx ON notification (recipient_id, created_at DESC);
-- Unread counter and "mark all as read"
CREATE INDEX notification_recipient_id_unread_idx ON notification (recipient_id) WHERE read_at IS NULL;

-- Scheduler idempotency: at most one reminder per appointment / vaccination (INSERT ... ON CONFLICT DO NOTHING)
CREATE UNIQUE INDEX notification_appointment_reminder_idx ON notification (appointment_id)
    WHERE type = 'APPOINTMENT_REMINDER';
CREATE UNIQUE INDEX notification_vaccination_due_idx ON notification (vaccination_id)
    WHERE type = 'VACCINATION_DUE';
