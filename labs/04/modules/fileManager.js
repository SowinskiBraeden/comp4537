const fs = require("fs");
const path = require("path");

class FileManager {
	constructor(baseDir) {
		this.baseDir = baseDir;
	}

	resolve(fileName) {
		return path.join(this.baseDir, path.basename(fileName));
	}

	exists(fileName) {
		return fs.existsSync(this.resolve(fileName));
	}

	append(fileName, text) {
		fs.appendFileSync(this.resolve(fileName), `${text}\n`);
	}

	read(fileName) {
		return fs.readFileSync(this.resolve(fileName), "utf8");
	}
}

module.exports = FileManager;
