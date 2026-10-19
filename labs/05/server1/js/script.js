import { STRINGS } from "../lang/messages/en/user.js";

// server 2 lives on its own origin, change this one line when it moves
const API_BASE_URL = "http://localhost:8080";
const SQL_ROUTE    = "/lab5/api/v1/sql";

const SELECT_PATTERN = /^select\b/i;
const INSERT_PATTERN = /^insert\b/i;

class SqlStatement {
  constructor(text) {
    this.text = text.trim().replace(/;+$/, "").trim();
  }

  isEmpty() {
    return this.text.length === 0;
  }

  isSelect() {
    return SELECT_PATTERN.test(this.text);
  }

  isInsert() {
    return INSERT_PATTERN.test(this.text);
  }

  // a semicolon inside a quoted literal is data, not a second statement
  isSingleStatement() {
    const withoutLiterals = this.text
      .replace(/'(?:[^']|'')*'/g, "''")
      .replace(/"(?:[^"]|"")*"/g, '""');

    return !withoutLiterals.includes(";");
  }

  toString() {
    return this.text;
  }
}

class ApiClient {
  constructor(baseUrl, route) {
    this.baseUrl = baseUrl;
    this.route   = route;
  }

  getRouteUrl() {
    return `${this.baseUrl}${this.route}`;
  }

  buildQueryUrl(statement) {
    return `${this.getRouteUrl()}/${encodeURIComponent(statement.toString())}`;
  }

  select(statement) {
    return this.send(this.buildQueryUrl(statement), {
      method: "GET",
    });
  }

  insert(statement) {
    return this.send(this.getRouteUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: statement.toString() }),
    });
  }

  // an empty body tells server 2 to insert the four sample patients
  insertSamplePatients() {
    return this.send(this.getRouteUrl(), {
      method: "POST",
    });
  }

  async send(url, options) {
    const response = await fetch(url, options);
    const body     = await response.text();

    let payload;

    try {
      payload = JSON.parse(body);
    } catch {
      payload = { success: false, error: body };
    }

    return {
      ok: response.ok,
      status: response.status,
      payload: payload,
    };
  }
}

class ResponseView {
  constructor(responseElement, statusElement) {
    this.responseElement = responseElement;
    this.statusElement   = statusElement;
  }

  showStatus(message) {
    this.statusElement.textContent = message;
  }

  clear() {
    this.statusElement.textContent = "";
    this.responseElement.replaceChildren();
  }

  showMessage(message, className) {
    const paragraph = document.createElement("p");
    paragraph.classList.add(className);
    paragraph.textContent = message;

    this.responseElement.replaceChildren(paragraph);
  }

  showError(message) {
    this.showMessage(message, "error-message");
  }

  showRows(rows) {
    if (rows.length === 0) {
      this.showMessage(STRINGS.NO_ROWS, "empty-message");
      return;
    }

    this.responseElement.replaceChildren(this.buildTable(rows));
  }

  buildTable(rows) {
    const table   = document.createElement("table");
    const head    = document.createElement("thead");
    const body    = document.createElement("tbody");
    const columns = Object.keys(rows[0]);

    table.classList.add("result-table");
    head.appendChild(this.buildRow(columns, "th", (column) => column));

    for (const row of rows) {
      body.appendChild(this.buildRow(columns, "td", (column) => row[column]));
    }

    table.append(head, body);
    return table;
  }

  buildRow(columns, cellTag, getValue) {
    const tableRow = document.createElement("tr");

    for (const column of columns) {
      const cell = document.createElement(cellTag);
      cell.textContent = this.formatValue(getValue(column));
      tableRow.appendChild(cell);
    }

    return tableRow;
  }

  formatValue(value) {
    if (value === null || value === undefined) {
      return STRINGS.NULL_VALUE;
    }

    return String(value);
  }
}

class LabPage {
  constructor(api) {
    this.api = api;

    this.insertButton = document.getElementById("insert-button");
    this.queryButton  = document.getElementById("query-button");
    this.queryInput   = document.getElementById("query-input");

    this.view = new ResponseView(
      document.getElementById("response"),
      document.getElementById("status")
    );
  }

  init() {
    document.title = STRINGS.PAGE_TITLE;

    document.getElementById("page-title").textContent         = STRINGS.PAGE_TITLE;
    document.getElementById("student-name").textContent       = STRINGS.STUDENT_NAME;
    document.getElementById("insert-heading").textContent     = STRINGS.INSERT_HEADING;
    document.getElementById("insert-description").textContent = STRINGS.INSERT_DESCRIPTION;
    document.getElementById("query-heading").textContent      = STRINGS.QUERY_HEADING;
    document.getElementById("query-description").textContent  = STRINGS.QUERY_DESCRIPTION;
    document.getElementById("query-label").textContent        = STRINGS.QUERY_LABEL;
    document.getElementById("response-heading").textContent   = STRINGS.RESPONSE_HEADING;

    this.insertButton.textContent = STRINGS.INSERT_BUTTON;
    this.queryButton.textContent  = STRINGS.QUERY_BUTTON;
    this.queryInput.placeholder   = STRINGS.QUERY_PLACEHOLDER;

    this.view.showMessage(STRINGS.RESPONSE_EMPTY, "empty-message");

    this.insertButton.addEventListener("click", () => this.handleInsert());
    this.queryButton.addEventListener("click", () => this.handleQuery());
  }

  handleInsert() {
    this.sendRequest(() => this.api.insertSamplePatients());
  }

  handleQuery() {
    const statement = new SqlStatement(this.queryInput.value);

    if (statement.isEmpty()) {
      this.view.clear();
      this.view.showError(STRINGS.EMPTY_QUERY);
      return;
    }

    if (!statement.isSingleStatement()) {
      this.view.clear();
      this.view.showError(STRINGS.SINGLE_STATEMENT_ONLY);
      return;
    }

    // reads go out as GET, inserts as POST. anything else still goes out
    // as GET so the read only database user is the one that rejects it.
    if (statement.isInsert()) {
      this.sendRequest(() => this.api.insert(statement));
    } else {
      this.sendRequest(() => this.api.select(statement));
    }
  }

  async sendRequest(request) {
    this.view.clear();
    this.view.showStatus(STRINGS.SENDING);
    this.setBusy(true);

    try {
      this.showResult(await request());
    } catch (error) {
      this.view.showStatus("");
      this.view.showError(STRINGS.NETWORK_ERROR + error.message);
    } finally {
      this.setBusy(false);
    }
  }

  showResult(result) {
    const payload = result.payload;

    if (!result.ok || payload.success === false) {
      this.view.showStatus("");
      this.view.showError(STRINGS.SERVER_ERROR + (payload.error || result.status));
      return;
    }

    if (Array.isArray(payload.data)) {
      this.view.showStatus(STRINGS.ROWS_RETURNED + payload.data.length);
      this.view.showRows(payload.data);
      return;
    }

    this.view.showStatus(STRINGS.ROWS_INSERTED + (payload.rowCount ?? 0));
    this.view.showMessage(payload.message, "success-message");
  }

  setBusy(isBusy) {
    this.insertButton.disabled = isBusy;
    this.queryButton.disabled  = isBusy;
  }
}

const api = new ApiClient(API_BASE_URL, SQL_ROUTE);
new LabPage(api).init();
