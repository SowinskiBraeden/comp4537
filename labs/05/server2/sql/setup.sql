-- Two database users, because the read route and the write route need
-- different privileges. The reader is what makes DROP, DELETE, UPDATE and
-- CREATE impossible from the query textarea.

CREATE DATABASE IF NOT EXISTS lab5 CHARACTER SET utf8mb4;

CREATE USER IF NOT EXISTS 'lab5_reader'@'%' IDENTIFIED BY 'change-me';
CREATE USER IF NOT EXISTS 'lab5_writer'@'%' IDENTIFIED BY 'change-me';

-- the reader can read and nothing else
GRANT SELECT ON lab5.* TO 'lab5_reader'@'%';

-- the writer can create the patient table and add rows to it,
-- but has no DROP, DELETE, UPDATE or ALTER
GRANT SELECT, INSERT, CREATE ON lab5.* TO 'lab5_writer'@'%';

FLUSH PRIVILEGES;
