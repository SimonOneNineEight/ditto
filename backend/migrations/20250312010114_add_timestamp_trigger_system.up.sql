-- Add up migration script here

-- Create the timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to add the trigger to a table
CREATE OR REPLACE FUNCTION add_updated_at_trigger()
RETURNS event_trigger AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE' LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = (SELECT current_schema())
            AND table_name = (SELECT relname FROM pg_class WHERE oid = r.objid)
            AND column_name = 'updated_at'
        ) THEN
            EXECUTE format('
                CREATE TRIGGER update_%s_timestamp
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_timestamp();',
                (SELECT relname FROM pg_class WHERE oid = r.objid),
                (SELECT relname FROM pg_class WHERE oid = r.objid)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create an event trigger aht fires when a table is created
CREATE EVENT TRIGGER auto_add_timestamp_trigger ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE PROCEDURE add_updated_at_trigger();


-- Add auto update trigger to existing tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = (SELECT current_schema())
    LOOP
        -- Check if trigger already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_' || r.table_name || '_timestamp' 
            AND tgrelid = (r.table_name)::regclass
        ) THEN
            EXECUTE format('
                CREATE TRIGGER update_%s_timestamp 
                BEFORE UPDATE ON %I 
                FOR EACH ROW 
                EXECUTE FUNCTION update_timestamp();',
                r.table_name, r.table_name
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

