function setStatus(message, type = "") {
	const status = document.getElementById("adminStatus");
	status.textContent = message;
	status.className = "admin-status" + (type ? " " + type : "");
}

function getSelectedFile() {
	return document.getElementById("adminFileSelect").value;
}

function getEditor() {
	return document.getElementById("adminJsonEditor");
}

function getApiUrl(file) {
	return "./api/admin/mainte/" + encodeURIComponent(file);
}

async function logoutAdmin() {
	setStatus("ログアウト処理中...");
	getEditor().value = "";
	renderQuickActions(null);

	const logoutUrl = new URL("./admin.html?logout=" + Date.now(), location.href);
	logoutUrl.username = "logout";
	logoutUrl.password = String(Date.now());
	location.replace(logoutUrl.toString());
}

async function requestAdminJson(file) {
	const response = await fetch(getApiUrl(file), { credentials: "same-origin" });
	if (response.status === 404) {
		const fallbackResponse = await fetch("./mainte/" + encodeURIComponent(file) + "?" + Date.now());
		if (fallbackResponse.ok) return fallbackResponse.json();
	}
	if (!response.ok) {
		throw new Error("読み込みに失敗しました。status=" + response.status);
	}
	return response.json();
}

async function saveAdminJson(file, text) {
	const response = await fetch(getApiUrl(file), {
		method: "PUT",
		credentials: "same-origin",
		headers: {
			"content-type": "application/json; charset=utf-8"
		},
		body: text
	});
	const resultText = await response.text();
	let result = {};
	try {
		result = resultText ? JSON.parse(resultText) : {};
	} catch {
		result = { error: resultText };
	}
	if (!response.ok || result.ok === false) {
		throw new Error(result.error || "保存に失敗しました。status=" + response.status);
	}
	return result;
}

function formatEditorJson() {
	const editor = getEditor();
	const data = JSON.parse(editor.value);
	editor.value = JSON.stringify(data, null, "\t");
	renderQuickActions(data);
}

function getEditorData() {
	const editor = getEditor();
	if (!editor.value.trim()) return null;
	return JSON.parse(editor.value);
}

function setEditorData(data) {
	getEditor().value = JSON.stringify(data, null, "\t");
	renderQuickActions(data);
}

function getStatusBadge(status) {
	const enabled = Number(status) === 1;
	return '<span class="admin-status-badge ' + (enabled ? "enabled" : "disabled") + '">' + (enabled ? "有効" : "無効") + "</span>";
}

function renderLocationQuickActions(data) {
	const status = Number(data.status) === 1 ? 1 : 0;
	return [
		'<div class="admin-quick-header">',
		'<span class="admin-quick-title">サイト全体メンテナンス</span>',
		getStatusBadge(status),
		"</div>",
		'<div class="admin-quick-buttons">',
		'<button type="button" data-location-status="1">有効にする</button>',
		'<button type="button" class="disabled-action" data-location-status="0">無効にする</button>',
		"</div>"
	].join("");
}

function renderRosenQuickActions(data) {
	if (!Array.isArray(data.lines)) {
		return "<p>路線情報を読み込めませんでした。</p>";
	}

	const rows = data.lines.map((line, index) => {
		const status = Number(line.status) === 1 ? 1 : 0;
		const name = line.name || line.rosen || "路線";
		return [
			'<div class="admin-line-item">',
			'<div class="admin-line-name">' + escapeHtml(name) + "</div>",
			getStatusBadge(status),
			'<div class="admin-quick-buttons">',
			'<button type="button" data-rosen-index="' + index + '" data-rosen-status="1">有効</button>',
			'<button type="button" class="disabled-action" data-rosen-index="' + index + '" data-rosen-status="0">無効</button>',
			"</div>",
			"</div>"
		].join("");
	});

	return [
		'<div class="admin-quick-header">',
		'<span class="admin-quick-title">路線別メンテナンス</span>',
		'<div class="admin-quick-buttons">',
		'<button type="button" data-rosen-all-status="1">全路線を有効</button>',
		'<button type="button" class="disabled-action" data-rosen-all-status="0">全路線を無効</button>',
		"</div>",
		"</div>",
		'<div class="admin-line-list">',
		rows.join(""),
		"</div>"
	].join("");
}

function renderQuickActions(data) {
	const container = document.getElementById("adminQuickActions");
	if (!data) {
		container.innerHTML = "<p>JSONを読み込むと、ここに有効・無効の切替ボタンが表示されます。</p>";
		return;
	}

	const file = getSelectedFile();
	if (file === "location_maintenance.json") {
		container.innerHTML = renderLocationQuickActions(data);
		return;
	}
	if (file === "rosen_maintenance.json") {
		container.innerHTML = renderRosenQuickActions(data);
		return;
	}
	container.innerHTML = "<p>このファイルには簡単操作がありません。</p>";
}

function escapeHtml(text) {
	return String(text).replace(/[&<>"']/g, (value) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;"
	}[value]));
}

async function saveQuickAction(data, message) {
	const file = getSelectedFile();
	setEditorData(data);
	setStatus("保存中...");
	try {
		await saveAdminJson(file, getEditor().value);
		setStatus(message, "success");
	} catch (error) {
		setStatus(error.message, "error");
	}
}

async function loadSelectedFile() {
	const file = getSelectedFile();
	setStatus("読み込み中...");
	try {
		const data = await requestAdminJson(file);
		setEditorData(data);
		setStatus(file + " を読み込みました。", "success");
	} catch (error) {
		setStatus(error.message, "error");
	}
}

async function saveSelectedFile() {
	const file = getSelectedFile();
	const editor = getEditor();

	let formatted;
	try {
		const data = JSON.parse(editor.value);
		formatted = JSON.stringify(data, null, "\t");
		editor.value = formatted;
		renderQuickActions(data);
	} catch {
		setStatus("JSONの形式が正しくありません。", "error");
		return;
	}

	setStatus("保存中...");
	try {
		await saveAdminJson(file, formatted);
		setStatus(file + " を保存しました。", "success");
	} catch (error) {
		setStatus(error.message, "error");
	}
}

document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("adminLogoutBtn").addEventListener("click", logoutAdmin);
	document.getElementById("adminLoadBtn").addEventListener("click", loadSelectedFile);
	document.getElementById("adminSaveBtn").addEventListener("click", saveSelectedFile);
	document.getElementById("adminFileSelect").addEventListener("change", () => {
		getEditor().value = "";
		renderQuickActions(null);
		setStatus("編集するJSONを選択してください。");
	});
	document.getElementById("adminFormatBtn").addEventListener("click", () => {
		try {
			formatEditorJson();
			setStatus("JSONを整形しました。", "success");
		} catch {
			setStatus("JSONの形式が正しくありません。", "error");
		}
	});
	document.getElementById("adminQuickActions").addEventListener("click", async (event) => {
		const button = event.target.closest("button");
		if (!button) return;

		let data;
		try {
			data = getEditorData();
		} catch {
			setStatus("JSONの形式が正しくありません。", "error");
			return;
		}
		if (!data) {
			setStatus("先にJSONを読み込んでください。", "error");
			return;
		}

		if (button.dataset.locationStatus !== undefined) {
			data.status = Number(button.dataset.locationStatus);
			await saveQuickAction(data, "サイト全体メンテナンスを" + (data.status === 1 ? "有効" : "無効") + "にしました。");
			return;
		}

		if (button.dataset.rosenAllStatus !== undefined) {
			const status = Number(button.dataset.rosenAllStatus);
			if (Array.isArray(data.lines)) {
				data.lines.forEach((line) => {
					line.status = status;
				});
			}
			await saveQuickAction(data, "全路線のメンテナンスを" + (status === 1 ? "有効" : "無効") + "にしました。");
			return;
		}

		if (button.dataset.rosenIndex !== undefined) {
			const index = Number(button.dataset.rosenIndex);
			const status = Number(button.dataset.rosenStatus);
			if (!Array.isArray(data.lines) || !data.lines[index]) {
				setStatus("対象路線を取得できませんでした。", "error");
				return;
			}
			data.lines[index].status = status;
			await saveQuickAction(data, data.lines[index].name + " を" + (status === 1 ? "有効" : "無効") + "にしました。");
		}
	});
});
