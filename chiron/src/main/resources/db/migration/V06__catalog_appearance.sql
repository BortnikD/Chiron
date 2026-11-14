ALTER TABLE species
    ADD COLUMN color    TEXT CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    ADD COLUMN icon_key TEXT;

ALTER TABLE specialization
    ADD COLUMN color TEXT CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
