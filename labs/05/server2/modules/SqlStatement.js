const SELECT_PATTERN = /^select\b/i;
const INSERT_PATTERN = /^insert\b/i;

export class SqlStatement {
  constructor(text) {
    // a trailing semicolon is harmless, it only makes the url uglier
    this.text = String(text ?? "").trim().replace(/;+$/, "").trim();
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

  // a semicolon inside a quoted literal is data, not a second statement,
  // so blank the literals out before looking for one.
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
