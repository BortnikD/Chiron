-- Preserve external URLs for an explicit import; they are not object storage keys.
ALTER TABLE veterinarian RENAME COLUMN photo_url TO legacy_photo_url;
ALTER TABLE veterinarian ADD COLUMN photo_key TEXT;
ALTER TABLE pet ADD COLUMN photo_key TEXT;

CREATE TABLE photo_cleanup (
    photo_key TEXT PRIMARY KEY,
    available_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX photo_cleanup_available_at_idx ON photo_cleanup (available_at);

CREATE FUNCTION enqueue_old_photo() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.photo_key IS NOT NULL THEN
        IF TG_OP = 'DELETE' THEN
            INSERT INTO photo_cleanup (photo_key) VALUES (OLD.photo_key) ON CONFLICT DO NOTHING;
        ELSIF OLD.photo_key IS DISTINCT FROM NEW.photo_key THEN
            INSERT INTO photo_cleanup (photo_key) VALUES (OLD.photo_key) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER veterinarian_photo_cleanup AFTER UPDATE OF photo_key OR DELETE ON veterinarian
    FOR EACH ROW EXECUTE FUNCTION enqueue_old_photo();
CREATE TRIGGER pet_photo_cleanup AFTER UPDATE OF photo_key OR DELETE ON pet
    FOR EACH ROW EXECUTE FUNCTION enqueue_old_photo();
