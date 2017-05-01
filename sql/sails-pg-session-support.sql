/*

minimal support table and functions in PostgreSQL database

for real use you probably want to at least implement some kind of expiry policy
and additionally put some data fields in their own table fields for easier
manipulation

*/


-- minimal table for session store
CREATE TABLE sails_session_store(
    sid text PRIMARY KEY,
    data json NOT NULL,
    created_at timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- set data for session
-- initial implementation changed to allow concurrency
-- credit goas to [stephen-denne](`http://stackoverflow.com/users/11721/stephen-denne`)
-- see [stackoverflow](http://stackoverflow.com/questions/1109061/insert-on-duplicate-update-in-postgresql/8702291
CREATE OR REPLACE FUNCTION sails_session_store_set(sid_in text, data_in json)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  LOOP
    -- first try to update the key
    UPDATE sails_session_store SET data = data_in WHERE sid = sid_in;
    IF found THEN
      RETURN;
    END IF;
    -- not there, so try to insert the key
    -- if someone else inserts the same key concurrently,
    -- we could get a unique-key failure
    BEGIN
      INSERT INTO sails_session_store(sid, data) VALUES(sid_in, data_in);
      RETURN;
    EXCEPTION WHEN unique_violation THEN
        -- do nothing, and loop to try the UPDATE again
    END;
  END LOOP;
END;
$$;

-- get stored session
CREATE OR REPLACE FUNCTION sails_session_store_get(sid_in text, OUT data_out json)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT data FROM sails_session_store WHERE sid = sid_in INTO data_out;
END;
$$;

-- destroy session
CREATE OR REPLACE FUNCTION sails_session_store_destroy(sid_in text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM sails_session_store WHERE sid = sid_in;
END;
$$;

-- count sessions
CREATE OR REPLACE FUNCTION sails_session_store_length(OUT length int)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT count(*) FROM sails_session_store INTO length;
END;
$$;

-- delete all sessions
CREATE OR REPLACE FUNCTION sails_session_store_clear()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM sails_session_store;
END;
$$;
