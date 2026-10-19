const SAMPLE_PATIENTS = `
    INSERT INTO patient (name, dateOfBirth) VALUES
    ('Sara Brown', '1901-01-01'),
    ('John Smith', '1941-01-01'),
    ('Jack Ma', '1961-01-30'),
    ('Elon Musk', '1999-01-01');
`;

const CREATE_PATIENT_TABLE = `
    CREATE TABLE IF NOT EXISTS patient (
        patientid INT(11) NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        dateOfBirth DATETIME NOT NULL,
        PRIMARY KEY (patientid)
    ) ENGINE=InnoDB;
`;

export class PatientRepository {
  constructor(database) {
    this.database = database;
  }

  // called before every insert, so a dropped table comes back on the next press
  async ensureTable() {
    await this.database.write(CREATE_PATIENT_TABLE);
  }

  async insertSamplePatients() {
    await this.ensureTable();
    return this.database.write(SAMPLE_PATIENTS);
  }

  async insert(statement) {
    await this.ensureTable();
    return this.database.write(statement.toString());
  }

  async select(statement) {
    return this.database.read(statement);
  }
}
