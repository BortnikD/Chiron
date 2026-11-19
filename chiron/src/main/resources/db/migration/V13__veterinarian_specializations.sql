CREATE TABLE veterinarian_specialization
(
    veterinarian_id   UUID NOT NULL REFERENCES veterinarian (id) ON DELETE CASCADE,
    specialization_id UUID NOT NULL REFERENCES specialization (id),
    PRIMARY KEY (veterinarian_id, specialization_id)
);

CREATE INDEX veterinarian_specialization_specialization_id_idx
    ON veterinarian_specialization (specialization_id, veterinarian_id);

INSERT INTO veterinarian_specialization (veterinarian_id, specialization_id)
SELECT id, specialization_id FROM veterinarian;

-- The profile and its assignments are written in the same transaction.
ALTER TABLE veterinarian
    ADD CONSTRAINT veterinarian_primary_specialization_fkey
        FOREIGN KEY (id, specialization_id)
        REFERENCES veterinarian_specialization (veterinarian_id, specialization_id)
        DEFERRABLE INITIALLY DEFERRED;
