import mysql from "mysql2/promise";

export class Database {
  constructor(config) {
    this.readerPool = this.createPool(config, config.readerUser, config.readerPassword);
    this.writerPool = this.createPool(config, config.writerUser, config.writerPassword);
  }

  createPool(config, user, password) {
    return mysql.createPool({
      host:               config.host,
      port:               config.port,
      database:           config.database,
      user:               user,
      password:           password,
      ssl:                config.ssl,
      waitForConnections: true,
      connectionLimit:    5,

      // hand back DATETIME exactly as it is stored instead of a JS Date,
      // which would otherwise be shifted into UTC on the way to the client
      dateStrings:        true,

      // chained statements never even reach the database
      multipleStatements: false,
    });
  }

  async testConnections() {
    const [reader] = await this.readerPool.query("SELECT CURRENT_USER() AS user;");
    const [writer] = await this.writerPool.query("SELECT CURRENT_USER() AS user;");

    return {
      reader: reader[0].user,
      writer: writer[0].user,
    };
  }

  // reads go through the user that only holds SELECT
  async read(statement) {
    const [rows] = await this.readerPool.query(statement.toString());
    return rows;
  }

  // writes go through the user that holds SELECT, INSERT and CREATE, nothing else
  async write(sql) {
    const [result] = await this.writerPool.query(sql);
    return result;
  }
}
