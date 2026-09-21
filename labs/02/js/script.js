import { STRINGS } from "../lang/messages/en/user.js";

const STORAGE_KEY = "comp4537-lab2-notes";
const UPDATE_INTERVAL = 2000;

class NoteButton {
  constructor(label, className, clickHandler) {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.classList.add(className);
    this.element.textContent = label;
    this.element.addEventListener("click", clickHandler);
  }

  getElement() {
    return this.element;
  }
}

class Note {
  constructor(id, content, removeHandler) {
    this.id = id;
    this.container = document.createElement("article");
    this.textArea = document.createElement("textarea");
    this.removeButton = new NoteButton(
      STRINGS.REMOVE_BUTTON,
      "remove-button",
      () => removeHandler(this)
    );

    this.container.classList.add("note");
    this.textArea.value = content;
    this.textArea.placeholder = STRINGS.NOTE_PLACEHOLDER;
    this.textArea.setAttribute("aria-label", STRINGS.NOTE_PLACEHOLDER);

    this.container.append(
      this.textArea,
      this.removeButton.getElement()
    );
  }

  getElement() {
    return this.container;
  }

  getData() {
    return {
      id: this.id,
      content: this.textArea.value,
    };
  }

  remove() {
    this.container.remove();
  }
}

class NoteStorage {
  load() {
    const storedNotes = localStorage.getItem(STORAGE_KEY);

    if (storedNotes === null) {
      return [];
    }

    try {
      const notes = JSON.parse(storedNotes);
      return Array.isArray(notes) ? notes : [];
    } catch {
      return [];
    }
  }

  save(notes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
}

class Writer {
  constructor(storage) {
    this.storage = storage;
    this.notes = [];
    this.notesElement = document.getElementById("notes");
    this.statusElement = document.getElementById("status");
    this.addButtonElement = document.getElementById("add-button");
  }

  init() {
    document.title = STRINGS.WRITER_TITLE;
    document.getElementById("page-title").textContent = STRINGS.WRITER_TITLE;
    document.getElementById("back-link").textContent = STRINGS.BACK_LINK;

    const addButton = new NoteButton(
      STRINGS.ADD_BUTTON,
      "add-button-control",
      () => this.addNote()
    );

    this.addButtonElement.replaceWith(addButton.getElement());

    for (const noteData of this.storage.load()) {
      this.createNote(noteData.id, noteData.content);
    }

    window.setInterval(() => this.saveNotes(), UPDATE_INTERVAL);
  }

  addNote() {
    const id = `${Date.now()}-${Math.random()}`;
    this.createNote(id, "");
  }

  createNote(id, content) {
    const note = new Note(id, content, (selectedNote) => {
      this.removeNote(selectedNote);
    });

    this.notes.push(note);
    this.notesElement.appendChild(note.getElement());
  }

  removeNote(note) {
    this.notes = this.notes.filter((currentNote) => currentNote !== note);
    note.remove();
    this.saveNotes();
  }

  saveNotes() {
    const noteData = this.notes.map((note) => note.getData());
    this.storage.save(noteData);
    this.statusElement.textContent = STRINGS.STORED_AT + this.getCurrentTime();
  }

  getCurrentTime() {
    return new Date().toLocaleTimeString();
  }
}

class Reader {
  constructor(storage) {
    this.storage = storage;
    this.notesElement = document.getElementById("notes");
    this.statusElement = document.getElementById("status");
  }

  init() {
    document.title = STRINGS.READER_TITLE;
    document.getElementById("page-title").textContent = STRINGS.READER_TITLE;
    document.getElementById("back-link").textContent = STRINGS.BACK_LINK;

    this.updateNotes();
    window.setInterval(() => this.updateNotes(), UPDATE_INTERVAL);
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        this.updateNotes();
      }
    });
  }

  updateNotes() {
    const notes = this.storage.load();
    this.notesElement.replaceChildren();

    if (notes.length === 0) {
      const message = document.createElement("p");
      message.classList.add("empty-message");
      message.textContent = STRINGS.EMPTY_NOTES;
      this.notesElement.appendChild(message);
    } else {
      for (const note of notes) {
        const noteElement = document.createElement("p");
        noteElement.classList.add("reader-note");
        noteElement.textContent = note.content;
        this.notesElement.appendChild(noteElement);
      }
    }

    this.statusElement.textContent = STRINGS.UPDATED_AT + this.getCurrentTime();
  }

  getCurrentTime() {
    return new Date().toLocaleTimeString();
  }
}

class LandingPage {
  init() {
    document.title = STRINGS.INDEX_TITLE;
    document.getElementById("page-title").textContent   = STRINGS.INDEX_TITLE;
    document.getElementById("writer-link").textContent  = STRINGS.WRITER_LINK;
    document.getElementById("reader-link").textContent  = STRINGS.READER_LINK;
    document.getElementById("student-name").textContent = STRINGS.STUDENT_NAME;
  }
}

const storage = new NoteStorage();
const pageName = window.location.pathname.split("/").pop() || "index.html";

if (pageName === "writer.html") {
  new Writer(storage).init();
} else if (pageName === "reader.html") {
  new Reader(storage).init();
} else {
  new LandingPage().init();
}
