(function (root, factory) {
	const adapter = factory();
	if (typeof module === "object" && module.exports) module.exports = adapter;
	root.JrCentralOperationInfoAdapter = adapter;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
	"use strict";

	const LANGUAGE_MAP = {
		"ja": "ja",
		"en": "en",
		"tc": "zh-TW",
		"sc": "zh-CN",
		"kr": "ko"
	};

	function parse(rawData) {
		if (rawData && typeof rawData === "object") return rawData;
		const text = String(rawData || "").replace(/^\uFEFF/, "").trim();
		if (!text) return {};
		try {
			return JSON.parse(text);
		} catch (error) {
			return {};
		}
	}

	function localizedText(rows, lang) {
		if (!Array.isArray(rows)) return "";
		const sourceLang = LANGUAGE_MAP[lang] || lang || "ja";
		const row = rows.find((item) => item && item.lang === sourceLang) ||
			rows.find((item) => item && item.lang === "ja") || rows[0];
		if (!row) return "";
		return String(row.name || row.message || row.text || "").trim();
	}

	function lineNameOf(row, lang, property) {
		return localizedText(row && row[property], lang);
	}

	function lineKeyOf(row, property) {
		return localizedText(row && row[property], "ja");
	}

	function buildEventBody(event, lang) {
		const sectionFrom = localizedText(event && event.imp_sec_from, lang);
		const sectionTo = localizedText(event && event.imp_sec_to, lang);
		const direction = localizedText(event && event.direction, lang);
		const cause = localizedText(event && event.cause, lang);
		const status = localizedText(event && event.status, lang);
		const section = sectionFrom && sectionTo && sectionFrom !== sectionTo ?
			sectionFrom + "～" + sectionTo : (sectionFrom || sectionTo);
		const parts = [];
		if (section) parts.push(section + (direction ? "（" + direction + "）" : ""));
		if (cause) parts.push(cause);
		if (status) parts.push(status);
		return parts.join("：");
	}

	function severityOf(status, body) {
		const text = String(status || "") + " " + String(body || "");
		if (/運転見合わせ|運休|運転取り止め|運転中止/.test(text)) return "suspend";
		if (/遅れ|遅延/.test(text)) return "delay";
		return "notice";
	}

	function getNotices(rawData, lineNames, lang) {
		const data = parse(rawData);
		const targets = Array.isArray(lineNames) ? lineNames : [lineNames];
		const targetSet = new Set(targets.filter(Boolean).map(String));
		const messages = (Array.isArray(data.message_info) ? data.message_info : [])
			.map((row) => ({
				lineKey: lineKeyOf(row, "trainline"),
				lineName: lineNameOf(row, lang, "trainline"),
				body: localizedText(row && row.delivery_msg, lang)
			}))
			.filter((row) => targetSet.has(row.lineKey) && row.body);
		const events = (Array.isArray(data.events) ? data.events : [])
			.map((row) => ({
				source: row,
				lineKey: lineKeyOf(row, "imp_line"),
				lineName: lineNameOf(row, lang, "imp_line"),
				status: localizedText(row && row.status, lang)
			}))
			.filter((row) => targetSet.has(row.lineKey));
		const usedEvents = new Set();
		const notices = messages.map((message) => {
			const eventIndex = events.findIndex((event, index) =>
				!usedEvents.has(index) && event.lineKey === message.lineKey);
			const event = eventIndex >= 0 ? events[eventIndex] : null;
			if (eventIndex >= 0) usedEvents.add(eventIndex);
			const status = event ? event.status : "";
			return {
				lineName: message.lineName,
				status: status,
				title: [message.lineName, status].filter(Boolean).join(" "),
				body: message.body,
				severity: severityOf(status, message.body),
				updatedAt: String(data.create_time || "")
			};
		});
		events.forEach((event, index) => {
			if (usedEvents.has(index)) return;
			const body = buildEventBody(event.source, lang);
			notices.push({
				lineName: event.lineName,
				status: event.status,
				title: [event.lineName, event.status].filter(Boolean).join(" "),
				body: body,
				severity: severityOf(event.status, body),
				updatedAt: String(data.create_time || "")
			});
		});
		return notices.filter((row) => row.title || row.body);
	}

	function formatDate(value, lang) {
		const match = String(value || "").match(/^(\d{4})(\d{2})(\d{2})$/);
		if (!match) return "";
		if (lang === "en") return match[2] + "/" + match[3] + "/" + match[1];
		return Number(match[2]) + "月" + Number(match[3]) + "日更新";
	}

	return {
		formatDate: formatDate,
		getNotices: getNotices,
		parse: parse
	};
}));
