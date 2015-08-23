sails-pg-session
===============

Adapter for Sails Js to store sessions in Postgres


Usage with Sails.js: >10.0.x
----------------------------
Install support functions in the database:

  ```
   psql <databasename> < ./sql/sails-pg-session-support.sql
  ```
Add the following configuration to `config/session.js`:
```
  adapter: 'sails-pg-session',

  database: 'dbname',
  host: 'localhost',
  user: 'dbuser',
  password: 'dbpasswd',
  port: 5432
```