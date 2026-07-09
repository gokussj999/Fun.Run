-- Fun.Run V2 — PostgreSQL initialization script
-- Runs once on first Docker Compose startup.

CREATE DATABASE funrun_test;
GRANT ALL PRIVILEGES ON DATABASE funrun_test TO funrun;
GRANT ALL PRIVILEGES ON DATABASE funrun_dev TO funrun;

-- Enable required extensions
\connect funrun_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- trigram index for name/symbol search

\connect funrun_test
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
