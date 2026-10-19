# Lab 5 - DB Intro

Two origins, as the lab requires.

- `server1/` - static client. Plain HTML, CSS and ES modules, no build step.
- `server2/` - Node API server. Raw `node:http`, no Express and no routing modules.

The only dependency anywhere is `mysql2`, which the lab allows for database access.

## Database

Any MySQL or MariaDB instance works. Create the schema and the two users:

```sh
mysql -h <host> -u root -p < server2/sql/setup.sql
```

Change both passwords in that file before running it.

**Two users, on purpose.** The read route connects as `lab5_reader`, which holds nothing
but `SELECT`. That is what makes `DROP`, `DELETE`, `UPDATE` and `CREATE` impossible from
the query textarea - the refusal comes from the database itself, not from a check in the
JavaScript. The write route connects as `lab5_writer`, which holds `SELECT`, `INSERT` and
`CREATE` so it can build the `patient` table and add rows, and nothing else.

The `patient` table is created with `ENGINE=InnoDB` and is rebuilt automatically before
every insert, so dropping it by hand only lasts until the next press of the button.

## Running server2

```sh
cd server2
npm install
cp .env.example .env    # fill in the host, database and both user passwords
npm run dev             # or: npm start, when the host injects the variables itself
```

| Variable | Purpose |
| --- | --- |
| `PORT` | port to listen on, defaults to 8080 |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | where the database lives |
| `DB_SSL` | `true` for a hosted database that requires TLS |
| `DB_READER_USER`, `DB_READER_PASSWORD` | the SELECT-only user |
| `DB_WRITER_USER`, `DB_WRITER_PASSWORD` | the INSERT user |

### Endpoints

| Method | Path | Does |
| --- | --- | --- |
| `POST` | `/lab5/api/v1/sql` | empty body inserts the four sample patients; a `{"query": "INSERT ..."}` body inserts that row |
| `GET` | `/lab5/api/v1/sql/<url encoded sql>` | runs the query as the read-only user |

A query typed straight into the address bar, quotes and all:

```
https://<api-host>/lab5/api/v1/sql/%22select%20*%20from%20patient%22
```

## Running server1

Any static host. Point `API_BASE_URL` at the top of `server1/js/script.js` at server 2,
then upload the folder.

```sh
cd server1
python3 -m http.server 3000
```

Server 1 and server 2 must not share an origin.
