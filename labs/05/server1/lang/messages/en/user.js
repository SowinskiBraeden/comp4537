export const STRINGS = {
  PAGE_TITLE:            "Lab 5: DB Intro",
  STUDENT_NAME:          "Braeden Sowinski",

  INSERT_HEADING:        "Insert Patients",
  INSERT_DESCRIPTION:    "Sends a POST request to server 2 that inserts the four sample patients. Press it as often as you like, the table keeps growing.",
  INSERT_BUTTON:         "Insert Rows",

  QUERY_HEADING:         "Run a Query",
  QUERY_DESCRIPTION:     "SELECT statements are sent with GET, INSERT statements are sent with POST. Anything else is still sent, and the read only database user is what refuses it.",
  QUERY_LABEL:           "SQL query",
  QUERY_PLACEHOLDER:     "SELECT * FROM patient",
  QUERY_BUTTON:          "Send Query",

  RESPONSE_HEADING:      "Server Response",
  RESPONSE_EMPTY:        "No request has been sent yet.",

  SENDING:               "Sending request...",
  ROWS_RETURNED:         "Rows returned: ",
  ROWS_INSERTED:         "Rows inserted: ",
  NO_ROWS:               "The query returned no rows.",
  NULL_VALUE:            "NULL",

  EMPTY_QUERY:           "Please enter a SQL query first.",
  SINGLE_STATEMENT_ONLY: "Please send one statement at a time.",
  SERVER_ERROR:          "Server responded with an error: ",
  NETWORK_ERROR:         "Could not reach the API server: ",
};
