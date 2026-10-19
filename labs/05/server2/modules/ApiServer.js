import http from "node:http";
import { SqlStatement } from "./SqlStatement.js";
import { MESSAGES } from "../lang/messages/en/user.js";

const SQL_ROUTE = "/lab5/api/v1/sql";

export class ApiServer {
  constructor(port, patients) {
    this.port     = port;
    this.patients = patients;
    this.server   = http.createServer((request, response) => this.handle(request, response));
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(MESSAGES.LISTENING + this.port);
    });
  }

  setCorsHeaders(response) {
    // the client is on another origin by design, so it needs to be let through
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  sendJson(response, status, payload) {
    this.setCorsHeaders(response);
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(payload));
  }

  sendError(response, status, message) {
    this.sendJson(response, status, { success: false, error: message });
  }

  readBody(request) {
    return new Promise((resolve, reject) => {
      let body = "";

      request.on("data", (chunk) => {
        body += chunk;
      });

      request.on("end", () => resolve(body));
      request.on("error", reject);
    });
  }

  // the query arrives as the tail of the path, url encoded and
  // sometimes wrapped in the quotes the lab sheet shows
  extractSql(pathname) {
    const prefix = `${SQL_ROUTE}/`;

    if (!pathname.startsWith(prefix)) {
      return "";
    }

    let sql = pathname.slice(prefix.length);

    try {
      sql = decodeURIComponent(sql);
    } catch {
      // a malformed escape stays as typed, the database will reject it
    }

    sql = sql.trim();

    if (this.isQuoted(sql)) {
      sql = sql.slice(1, -1).trim();
    }

    return sql;
  }

  isQuoted(text) {
    if (text.length < 2) {
      return false;
    }

    return (text.startsWith('"') && text.endsWith('"'))
      || (text.startsWith("'") && text.endsWith("'"));
  }

  async handleGet(request, response, url) {
    const statement = new SqlStatement(
      this.extractSql(url.pathname) || url.searchParams.get("query")
    );

    if (statement.isEmpty()) {
      return this.sendError(response, 400, MESSAGES.MISSING_QUERY);
    }

    if (!statement.isSingleStatement()) {
      return this.sendError(response, 400, MESSAGES.SINGLE_STATEMENT_ONLY);
    }

    // anything that is not a read is still handed to the reader user on
    // purpose, so the database privileges are what refuse it.
    try {
      const rows = await this.patients.select(statement);

      this.sendJson(response, 200, {
        success: true,
        query: statement.toString(),
        data: rows,
      });
    } catch (error) {
      this.sendJson(response, 403, {
        success: false,
        error: error.message,
        code: error.code,
      });
    }
  }

  async handlePost(request, response, url) {
    if (url.pathname !== SQL_ROUTE && url.pathname !== `${SQL_ROUTE}/`) {
      return this.sendError(response, 404, MESSAGES.INVALID_ENDPOINT);
    }

    const body      = await this.readBody(request);
    const statement = new SqlStatement(this.parseQuery(body));

    try {
      // an empty body means the insert button, which uses the fixed rows
      const result = statement.isEmpty()
        ? await this.patients.insertSamplePatients()
        : await this.insertCustom(response, statement);

      if (result === null) {
        return;
      }

      this.sendJson(response, 200, {
        success: true,
        message: MESSAGES.ROWS_INSERTED,
        rowCount: result.affectedRows,
      });
    } catch (error) {
      this.sendJson(response, 403, {
        success: false,
        error: error.message,
        code: error.code,
      });
    }
  }

  // the writer user is the only one that can change data, so this route
  // refuses anything that is not a single insert before it gets there.
  async insertCustom(response, statement) {
    if (!statement.isSingleStatement()) {
      this.sendError(response, 400, MESSAGES.SINGLE_STATEMENT_ONLY);
      return null;
    }

    if (!statement.isInsert()) {
      this.sendError(response, 403, MESSAGES.INSERT_ONLY);
      return null;
    }

    return this.patients.insert(statement);
  }

  parseQuery(body) {
    if (!body.trim()) {
      return "";
    }

    try {
      return JSON.parse(body).query ?? "";
    } catch {
      return body.trim();
    }
  }

  handle(request, response) {
    if (request.method === "OPTIONS") {
      this.setCorsHeaders(response);
      response.writeHead(204);
      return response.end();
    }

    const url = new URL(request.url, `http://${request.headers.host}`);

    if (!url.pathname.startsWith(SQL_ROUTE)) {
      return this.sendError(response, 404, MESSAGES.INVALID_ENDPOINT);
    }

    if (request.method === "GET") {
      return this.handleGet(request, response, url);
    }

    if (request.method === "POST") {
      return this.handlePost(request, response, url);
    }

    return this.sendError(response, 405, MESSAGES.METHOD_NOT_ALLOWED);
  }
}
