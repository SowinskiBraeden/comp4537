import { ApiServer } from "./modules/ApiServer.js";
import { Database } from "./modules/Database.js";
import { PatientRepository } from "./modules/PatientRepository.js";
import { MESSAGES } from "./lang/messages/en/user.js";

const DEFAULT_PORT = 8080;

class Config {
  constructor(env) {
    this.port     = Number(env.PORT) || DEFAULT_PORT;
    this.host     = env.DB_HOST;
    this.dbPort   = Number(env.DB_PORT) || 3306;
    this.database = env.DB_NAME;

    this.readerUser     = env.DB_READER_USER;
    this.readerPassword = env.DB_READER_PASSWORD;
    this.writerUser     = env.DB_WRITER_USER;
    this.writerPassword = env.DB_WRITER_PASSWORD;

    // most hosted databases require tls, a local container does not
    this.ssl = env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined;
  }

  isComplete() {
    return Boolean(
      this.host
      && this.database
      && this.readerUser
      && this.readerPassword
      && this.writerUser
      && this.writerPassword
    );
  }

  toDatabaseConfig() {
    return {
      host:           this.host,
      port:           this.dbPort,
      database:       this.database,
      readerUser:     this.readerUser,
      readerPassword: this.readerPassword,
      writerUser:     this.writerUser,
      writerPassword: this.writerPassword,
      ssl:            this.ssl,
    };
  }
}

const config = new Config(process.env);

if (!config.isComplete()) {
  console.error(MESSAGES.MISSING_CONFIG);
  process.exit(1);
}

const database = new Database(config.toDatabaseConfig());
const patients = new PatientRepository(database);
const api      = new ApiServer(config.port, patients);

api.start();

try {
  const users = await database.testConnections();
  console.log(MESSAGES.CONNECTED + `${users.reader} / ${users.writer}`);
} catch (error) {
  console.error(MESSAGES.CONNECTION_FAILED + error.message);
}
