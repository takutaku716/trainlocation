const ADMIN_TOKEN_KEY = "trainlocation_admin_token";

function getAdminToken() {
	return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function setStatus(message, type = "") {
	const status = document.getElementById("adminStatus");
	status.textContent = message;
	status.className = "admin-status" + (type ? " " + type : "");
}

function getSelectedFile() {
	return document.getElementById("adminFileSelect").value;
}

function getApiUrl(file) {
	return "./api/admin/mainte/" + encodeURIComponent(file);
}

async function requestAdminJson(file) {
	const response = await fetch(getApiUrl(file), {
		headers: {
			"authorization": "Bearer " + getAdminToken()
		}
	});
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
		headers: {
			"authorization": "Bearer " + getAdminToken(),
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
	const editor = document.getElementById("adminJsonEditor");
	const data = JSON.parse(editor.value);
	editor.value = JSON.stringify(data, null, "\t");
}

async function loadSelectedFile() {
	const file = getSelectedFile();
	if (!getAdminToken()) {
		setStatus("管理トークンを入力してください。", "error");
		return;
	}
	setStatus("読み込み中...");
	try {
		const data = await requestAdminJson(file);
		document.getElementById("adminJsonEditor").value = JSON.stringify(data, null, "\t");
		setStatus(file + " を読み込みました。", "success");
	} catch (error) {
		setStatus(error.message, "error");
	}
}

async function saveSelectedFile() {
	const file = getSelectedFile();
	const editor = document.getElementById("adminJsonEditor");
	if (!getAdminToken()) {
		setStatus("管理トークンを入力してください。", "error");
		return;
	}

	let formatted;
	try {
		const data = JSON.parse(editor.value);
		formatted = JSON.stringify(data, null, "\t");
		editor.value = formatted;
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
	const tokenInput = document.getElementById("adminTokenInput");
	tokenInput.value = getAdminToken();

	document.getElementById("adminTokenSaveBtn").addEventListener("click", () => {
		sessionStorage.setItem(ADMIN_TOKEN_KEY, tokenInput.value);
		setStatus("管理トークンを適用しました。", "success");
	});

	document.getElementById("adminLoadBtn").addEventListener("click", loadSelectedFile);
	document.getElementById("adminSaveBtn").addEventListener("click", saveSelectedFile);
	document.getElementById("adminFormatBtn").addEventListener("click", () => {
		try {
			formatEditorJson();
			setStatus("JSONを整形しました。", "success");
		} catch {
			setStatus("JSONの形式が正しくありません。", "error");
		}
	});
});
