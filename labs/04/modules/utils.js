class Utils {
	getDate() {
		return new Date().toString();
	}

	format(template, ...values) {
		return template.replace(/%(\d+)/g, (match, index) => {
			const value = values[Number(index) - 1];
			return value === undefined ? match : value;
		});
	}

	escapeHtml(text) {
		const entities = {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"};
		return text.replace(/[&<>"']/g, (char) => entities[char]);
	}
}

module.exports = Utils;
