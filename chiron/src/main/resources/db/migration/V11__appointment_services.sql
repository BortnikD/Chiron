CREATE TABLE appointment_service
(
    appointment_id            UUID REFERENCES appointment (id) ON DELETE CASCADE NOT NULL,
    service_id                UUID REFERENCES service (id)                       NOT NULL,
    name_snapshot             TEXT                                               NOT NULL,
    price_snapshot            NUMERIC(13, 2)                                     NOT NULL CHECK (price_snapshot >= 0),
    duration_min_snapshot     INTEGER CHECK (duration_min_snapshot > 0),
    buffer_after_min_snapshot INTEGER CHECK (buffer_after_min_snapshot >= 0),
    is_planned                BOOLEAN                                            NOT NULL DEFAULT TRUE,
    is_performed              BOOLEAN,
    added_by                  UUID                                               REFERENCES users (id) ON DELETE SET NULL,
    created_at                TIMESTAMPTZ                                        NOT NULL DEFAULT now(),
    updated_by                UUID                                               REFERENCES users (id) ON DELETE SET NULL,
    updated_at                TIMESTAMPTZ                                        NOT NULL DEFAULT now(),
    PRIMARY KEY (appointment_id, service_id),
    CHECK ((duration_min_snapshot IS NULL) = (buffer_after_min_snapshot IS NULL)),
    CHECK (is_planned OR is_performed IS NOT NULL)
);

CREATE INDEX appointment_service_service_id_idx ON appointment_service (service_id);

-- The historical component durations are unknown; the original booked interval and price remain authoritative.
INSERT INTO appointment_service (appointment_id, service_id, name_snapshot, price_snapshot, is_planned,
                                 is_performed, created_at, updated_at)
SELECT a.id,
       a.service_id,
       s.name,
       a.price_snapshot,
       TRUE,
       CASE
           WHEN a.status = 'COMPLETED' THEN TRUE
           WHEN a.status IN ('CANCELLED', 'NO_SHOW') THEN FALSE END,
       a.created_at,
       a.updated_at
FROM appointment a
         JOIN service s ON s.id = a.service_id;

ALTER TABLE appointment
    DROP COLUMN service_id,
    DROP COLUMN price_snapshot;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Existing overlaps must be resolved before rollout; this migration never moves or discards appointments.
ALTER TABLE appointment
    ADD CONSTRAINT appointment_veterinarian_no_overlap
        EXCLUDE USING gist (veterinarian_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&)
        WHERE (status <> 'CANCELLED');
