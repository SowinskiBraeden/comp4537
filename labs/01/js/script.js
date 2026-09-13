import { STRINGS } from "../lang/messages/en/user.js";

class MemoryGame {
  constructor(ui) {
    this.ui = ui;

    this.buttons       = [];
    this.buttonCount   = 0;
    this.expectedOrder = 1;

    this.gameId = 0;
  }

  start() {
    this.ui.setGoHandler(() => {
      this.handleGo();
    });
  }

  handleGo() {
    this.ui.clearMessage();

    const count = this.ui.getButtonCount();

    if (!this.validateInput(count)) {
      this.ui.showMessage(STRINGS.INVALID_INPUT);
      return;
    }

    this.resetGame();

    this.buttonCount = count;
    this.createButtons();

    this.runGame(this.gameId);
  }

  validateInput(count) {
    return Number.isInteger(count) && count >= 3 && count <= 7;
  }

  resetGame() {
    this.gameId++;

    this.buttons       = [];
    this.buttonCount   = 0;
    this.expectedOrder = 1;

    this.ui.clearGameArea();
  }

  createButtons() {
    MemoryButton.resetColorPool();

    for (let i = 1; i <= this.buttonCount; i++) {
      const button = new MemoryButton(i, (clickedButton) => {
        this.handleButtonClick(clickedButton);
      });

      button.disable();

      this.buttons.push(button);
      this.ui.addGameButton(button.getElement());
    }
  }

  async runGame(currentGameId) {
    // memorize time
    await this.delay(this.buttonCount * 1000);

    if (currentGameId !== this.gameId) {
      return;
    }

    // move buttons every two seconds, n times.
    for (let i = 0; i < this.buttonCount; i++) {
      await this.delay(2000);

      if (currentGameId !== this.gameId) {
        return;
      }

      this.scrambleButtons();
    }

    this.hideAllNumbers();
    this.enableAllButtons();
  }

  scrambleButtons() {
    for (const button of this.buttons) {
      button.randomPosition();
    }
  }

  hideAllNumbers() {
    for (const button of this.buttons) {
      button.hideNumber();
    }
  }

  revealAllButtons() {
    for (const button of this.buttons) {
      button.showNumber();
    }
  }

  enableAllButtons() {
    for (const button of this.buttons) {
      button.enable();
    }
  }

  disableAllButtons() {
    for (const button of this.buttons) {
      button.disable();
    }
  }

  handleButtonClick(button) {
    if (button.order === this.expectedOrder) {
      this.handleCorrectClick(button);
    } else {
      this.handleWrongClick();
    }
  }

  handleCorrectClick(button) {
    button.showNumber();
    button.disable();

    this.expectedOrder++;

    if (this.expectedOrder > this.buttonCount) {
      this.handleWin();
    }
  }

  handleWrongClick() {
    this.revealAllButtons();
    this.disableAllButtons();

    this.ui.showMessage(STRINGS.WRONG_ORDER);
  }

  handleWin() {
    this.disableAllButtons();

    this.ui.showMessage(STRINGS.SUCCESS);
  }

  delay(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}

class MemoryButton {
  static COLORS = [
    "#ef5350",
    "#ffa726",
    "#ffee58",
    "#66bb6a",
    "#26c6da",
    "#5c6bc0",
    "#ab47bc",
  ];

  static colorPool = [];

  static resetColorPool() {
    // prevent original COLORS to be modified
    MemoryButton.colorPool = [...MemoryButton.COLORS];
  }

  static randomColor() {
    const idx = Math.floor(
      Math.random() * MemoryButton.colorPool.length
    );

    // remove and return one color
    return MemoryButton.colorPool.splice(idx, 1)[0];
  }

  constructor(order, clickHandler) {
    this.order = order;

    this.element = document.createElement("button");

    this.element.classList.add("memory-button");
    this.element.style.backgroundColor = MemoryButton.randomColor();

    this.element.textContent = this.order;

    this.element.addEventListener("click", () => {
      clickHandler(this);
    });
  }

  getElement() {
    return this.element;
  }

  showNumber() {
    this.element.textContent = this.order;
  }

  hideNumber() {
    this.element.textContent = "";
  }

  enable() {
    this.element.disabled = false;
  }

  disable() {
    this.element.disabled = true;
  }

  randomPosition() {
    const viewportWidth  = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const rect           = this.element.getBoundingClientRect();

    const maxX = Math.max(0, viewportWidth - rect.width);
    const maxY = Math.max(0, viewportHeight - rect.height);

    const x = Math.floor(Math.random() * (maxX + 1));
    const y = Math.floor(Math.random() * (maxY + 1));

    this.element.style.position = "fixed";
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }
}

class UIManager {
  constructor() {
    this.input      = document.getElementById("count-input");
    this.goButton   = document.getElementById("go-button");
    this.message    = document.getElementById("message");
    this.gameArea   = document.getElementById("game-area");
    this.countLabel = document.getElementById("count-label");
  }

  init() {
    document.title = STRINGS.PAGE_TITLE;

    this.countLabel.textContent = STRINGS.INPUT_LABEL;
    this.goButton.textContent = STRINGS.GO_BUTTON;
  }

  getButtonCount() {
    return Number(this.input.value);
  }

  setGoHandler(callback) {
    this.goButton.addEventListener("click", callback);
  }

  showMessage(message) {
    this.message.textContent = message;
  }

  clearMessage() {
    this.message.textContent = "";
  }

  clearGameArea() {
    this.gameArea.replaceChildren();
  }

  addGameButton(element) {
    this.gameArea.appendChild(element);
  }
}

const ui = new UIManager();
const game = new MemoryGame(ui);

ui.init();
game.start();
