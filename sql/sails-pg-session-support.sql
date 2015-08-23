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
CREATE OR REPLACE FUNCTION sails_session_store_set(sid_in text, data_in json)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- delete current session data if it exists so the next insert succeeds
  DELETE FROM sails_session_store WHERE sid = sid_in;
  INSERT INTO sails_session_store(sid, data) VALUES(sid_in, data_in);
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
