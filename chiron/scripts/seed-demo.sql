\set ON_ERROR_STOP on

-- The sentinel is inserted in the same transaction as the entire dataset.
SELECT EXISTS (SELECT 1 FROM users WHERE id = '5eed0004-0000-0000-0000-000000000001') AS seeded
\gset
\if :seeded
\echo 'Demo data already exists; keeping the current database.'
\else
\ir seed-test-data.sql
\endif
