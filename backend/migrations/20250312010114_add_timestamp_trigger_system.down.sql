-- Add down migration script here
-- Down migration
-- First drop the event trigger
DROP EVENT TRIGGER IF EXISTS auto_add_timestamp_trigger;

-- Then drop the function that adds triggers to tables
DROP FUNCTION IF EXISTS add_updated_at_trigger();

-- Optional: Remove all the timestamp triggers from existing tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_name LIKE 'update_%_timestamp'
        AND trigger_schema = (SELECT current_schema())
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I;', 
            r.trigger_name, 
            r.event_object_table
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Finally drop the update timestamp function if desired
-- Only do this if no other triggers use this function
DROP FUNCTION IF EXISTS update_timestamp();
