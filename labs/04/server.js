const http = require("http");
const fs = require("fs");
const path = require("path");
const Utils = require("./modules/utils");
const FileManager = require("./modules/fileManager");

const PORT = process.env.PORT || 8000;

class Server {
	constructor(port) {
		this.port = port;
		this.utils = new Utils();
		this.files = new FileManager(__dirname);
		this.strings = JSON.parse(fs.readFileSync(path.join(__dirname, "lang", "en", "en.json"), "utf8"));
	}

	start() {
		http.createServer((req, res) => this.handleRequest(req, res)).listen(this.port, () => {
			console.log(`listening on port :${this.port}`);
		});
	}

	handleRequest(req, res) {
		if (req.method !== "GET") {
			return this.send(res, 405, "text/plain", "Method not allowed");
		}

		const url = new URL(req.url, "http://localhost");

		try {
			if (url.pathname === "/") {
				return this.send(res, 200, "text/plain", "Server Status: OK");
			}
			if (/\/getDate\/?$/.test(url.pathname)) {
				return this.handleGetDate(url, res);
			}
			if (/\/writeFile\/?$/.test(url.pathname)) {
				return this.handleWriteFile(url, res);
			}
			const readMatch = url.pathname.match(/\/readFile\/(.+)$/);
			if (readMatch) {
				return this.handleReadFile(decodeURIComponent(readMatch[1]), res);
			}
			return this.send(res, 404, "text/plain", "Not found");
		} catch (err) {
			return this.send(res, 500, "text/plain", `Server error: ${err.message}`);
		}
	}

	handleGetDate(url, res) {
		const name = url.searchParams.get("name");
		if (!name) {
			return this.send(res, 400, "text/plain", "Missing required query parameter: name");
		}

		const message = this.utils.format(
			this.strings.greeting,
			this.utils.escapeHtml(name),
			this.utils.getDate()
		);
		const html = `<!DOCTYPE html><html><body><p style="color: blue;">${message}</p></body></html>`;
		return this.send(res, 200, "text/html", html);
	}

	handleWriteFile(url, res) {
		const text = url.searchParams.get("text");
		if (text === null) {
			return this.send(res, 400, "text/plain", "Missing required query parameter: text");
		}

		this.files.append("file.txt", text);
		return this.send(res, 200, "text/plain", `Appended a new line to file.txt`);
	}

	handleReadFile(fileName, res) {
		if (!this.files.exists(fileName)) {
			return this.send(res, 404, "text/plain", `File not found: ${fileName}`);
		}

		return this.send(res, 200, "text/plain; charset=utf-8", this.files.read(fileName));
	}

	send(res, status, contentType, body) {
		res.writeHead(status, {"Content-Type": contentType});
		res.end(body);
	}
}

new Server(PORT).start();
