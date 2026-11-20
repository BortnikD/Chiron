\set ON_ERROR_STOP on

-- The sentinel is inserted in the same transaction as the entire dataset.
SELECT EXISTS (SELECT 1 FROM pet WHERE id = '5eed0107-0000-0000-0000-000000000035')   AS expanded,
       EXISTS (SELECT 1 FROM users WHERE id = '5eed0004-0000-0000-0000-000000000001') AS seeded
\gset
\if :expanded
\echo 'Demo data already exists; keeping the current database.'
\elif :seeded
\echo 'Keeping the existing demo database. Use a separate Compose project to load the expanded demo.'
\else
\ir seed-test-data.sql
\endif
