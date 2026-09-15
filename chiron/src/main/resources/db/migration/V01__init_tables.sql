CREATE TABLE users
(
    id            UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    first_name    TEXT        NOT NULL,
    middle_name   TEXT,
    last_name     TEXT        NOT NULL,
    full_name     TEXT        NOT NULL,
    phone         TEXT        NOT NULL UNIQUE,
    role          TEXT        NOT NULL CHECK (role IN ('CLIENT', 'VETERINARIAN', 'ADMIN')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

CREATE TABLE species
(
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE pet
(
    id          UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    owner_id    UUID        NOT NULL REFERENCES users (id),
    species_id  UUID        NOT NULL REFERENCES species (id),
    birth_date  DATE,
    weight_kg   NUMERIC(6, 2) CHECK (weight_kg > 0),
    gender      TEXT        NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
    notes       TEXT,
    is_archived BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pet_owner_id_idx ON pet (owner_id);

CREATE TABLE specialization
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL
);

CREATE TABLE service
(
    id                UUID PRIMARY KEY                             DEFAULT gen_random_uuid(),
    specialization_id UUID REFERENCES specialization (id) NOT NULL,
    name              TEXT                                NOT NULL,
    description       TEXT                                NOT NULL,
    base_price        NUMERIC(13, 2)                      NOT NULL CHECK (base_price >= 0),
    base_duration_min INTEGER                             NOT NULL CHECK (base_duration_min > 0),
    buffer_after_min  INTEGER                             NOT NULL DEFAULT 0 CHECK (buffer_after_min >= 0),
    is_active         BOOLEAN                             NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ                         NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ                         NOT NULL DEFAULT now()
);

-- Наличие строки = услуга доступна для вида. NULL в duration_min/price = берутся базовые значения из service
CREATE TABLE service_species
(
    service_id   UUID REFERENCES service (id) NOT NULL,
    species_id   UUID REFERENCES species (id) NOT NULL,
    duration_min INTEGER CHECK (duration_min > 0),
    price        NUMERIC(13, 2) CHECK (price >= 0),
    PRIMARY KEY (service_id, species_id)
);

CREATE TABLE veterinarian
(
    id                UUID PRIMARY KEY                             DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users (id)          NOT NULL UNIQUE,
    specialization_id UUID REFERENCES specialization (id) NOT NULL,
    bio               TEXT,
    photo_url         TEXT,
    experience_years  INTEGER                             NOT NULL CHECK (experience_years >= 0),
    is_active         BOOLEAN                             NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ                         NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ                         NOT NULL DEFAULT now()
);

CREATE TABLE veterinarian_species_permission
(
    veterinarian_id UUID REFERENCES veterinarian (id) NOT NULL,
    species_id      UUID REFERENCES species (id)      NOT NULL,
    PRIMARY KEY (veterinarian_id, species_id)
);

-- day_of_week: 1 = понедельник ... 7 = воскресенье
CREATE TABLE work_schedule
(
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veterinarian_id UUID REFERENCES veterinarian (id) NOT NULL,
    day_of_week     INTEGER                           NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    start_time      TIME                              NOT NULL,
    end_time        TIME                              NOT NULL,
    break_start     TIME,
    break_end       TIME,
    UNIQUE (veterinarian_id, day_of_week),
    CHECK (start_time < end_time),
    CHECK (
        (break_start IS NULL AND break_end IS NULL)
            OR (break_start IS NOT NULL AND break_end IS NOT NULL
            AND start_time <= break_start AND break_start < break_end AND break_end <= end_time)
        )
);

CREATE TABLE schedule_exception
(
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veterinarian_id UUID REFERENCES veterinarian (id) NOT NULL,
    type            TEXT                              NOT NULL CHECK (type IN ('ABSENCE', 'CUSTOM_HOURS')),
    start_date      DATE                              NOT NULL,
    end_date        DATE                              NOT NULL,
    start_time      TIME,
    end_time        TIME,
    reason          TEXT,
    CHECK (end_date >= start_date),
    CHECK (
        (type = 'ABSENCE' AND start_time IS NULL AND end_time IS NULL)
            OR (type = 'CUSTOM_HOURS' AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
        )
);

-- end_at включает buffer_after_min услуги
CREATE TABLE appointment
(
    id              UUID PRIMARY KEY                           DEFAULT gen_random_uuid(),
    veterinarian_id UUID REFERENCES veterinarian (id) NOT NULL,
    pet_id          UUID REFERENCES pet (id)          NOT NULL,
    service_id      UUID REFERENCES service (id)      NOT NULL,
    follow_up_of    UUID REFERENCES appointment (id),
    start_at        TIMESTAMPTZ                       NOT NULL,
    end_at          TIMESTAMPTZ                       NOT NULL,
    status          TEXT                              NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    price_snapshot  NUMERIC(13, 2)                    NOT NULL CHECK (price_snapshot >= 0),
    client_comment  TEXT,
    vet_notes       TEXT,
    cancelled_by    UUID REFERENCES users (id),
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   TEXT,
    created_at      TIMESTAMPTZ                       NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ                       NOT NULL DEFAULT now(),
    CHECK (end_at > start_at)
);

CREATE INDEX appointment_veterinarian_start_idx ON appointment (veterinarian_id, start_at);
CREATE INDEX appointment_pet_id_idx ON appointment (pet_id);

CREATE TABLE vaccination
(
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID REFERENCES pet (id) NOT NULL,
    appointment_id  UUID REFERENCES appointment (id),
    name            TEXT                     NOT NULL,
    administered_on DATE                     NOT NULL,
    next_due_on     DATE CHECK (next_due_on > administered_on)
);

CREATE INDEX vaccination_pet_id_idx ON vaccination (pet_id);
