sails-pg-session
===============

Adapter for Sails Js to store sessions in Postgres using a pool of connections.

The original implementation uses a single connection to the database. In case that connection is dropped by an external active element on the network (for instance, a firewall between the  the webapp and the database), the connection is no longer usable and the adapter doesn't notice it.

This fork uses a pool of connection.


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

Optionally, you can configure the pool of connection:
```
  pool: {
    poolSize: 10,
    poolIdleTimeout: 30000,
    reapIntervalMillis: 1000,
  }
```

In case the pool parameter is not supplied, default values will be assigned to its properties:

* poolSize: 10
* poolIdleTimeout: 30000
* reapIntervalMillis: 1000
