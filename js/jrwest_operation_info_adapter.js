(function (root, factory) {
	const adapter = factory();
	if (typeof module === "object" && module.exports) module.exports = adapter;
	root.JrWestOperationInfoAdapter = adapter;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
	"use strict";

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

	function latestDetail(details) {
		return Array.isArray(details) && details.length > 0 ? details[0] : null;
	}

	function severityOf(row, detail) {
		const text = [
			row && row.conditionName,
			row && row.cause,
			row && row.supplementary,
			detail && detail.title,
			detail && detail.body
		].filter(Boolean).join(" ");
		if (/運転見合わせ|運転を見合わせ|運行を見合わせ|運転取り止め|運転中止|運休/.test(text)) {
			return "suspend";
		}
		if (/遅れ|遅延|振替輸送|運転変更|運行情報|お知らせ/.test(text)) return "delay";
		return "notice";
	}

	function noticeKey(row, detail, lineId) {
		if (row && row.trafficId !== undefined && row.trafficId !== null) {
			return "traffic:" + String(row.trafficId);
		}
		if (detail && detail.id !== undefined && detail.id !== null) {
			return "detail:" + String(detail.id);
		}
		return [
			String(lineId || ""),
			String(detail && detail.updatedAt || row && row.publicationDate || ""),
			String(detail && detail.title || ""),
			String(detail && detail.body || "")
		].join("|");
	}

	function getNotices(rawData, lineIds) {
		const data = parse(rawData);
		const targetIds = new Set((Array.isArray(lineIds) ? lineIds : [lineIds])
			.filter((value) => value !== undefined && value !== null && value !== "")
			.map((value) => String(value)));
		if (targetIds.size < 1) return [];

		const notices = [];
		const seen = new Map();
		const areas = Array.isArray(data.areaTrafficInfos) ? data.areaTrafficInfos : [];
		areas.forEach((area) => {
			const dailyData = Array.isArray(area && area.dailyData) ? area.dailyData : [];
			const today = dailyData[0];
			const places = today && Array.isArray(today.placeTrafficInfos) ? today.placeTrafficInfos : [];
			places.forEach((place) => {
				const lines = Array.isArray(place && place.conventionalLineTrafficInfos) ?
					place.conventionalLineTrafficInfos : [];
				lines.forEach((line) => {
					const lineId = String(line && line.id !== undefined ? line.id : "");
					if (!targetIds.has(lineId)) return;
					const rows = Array.isArray(line && line.conventionalLineTrafficInfoDetails) ?
						line.conventionalLineTrafficInfoDetails : [];
					rows.forEach((row) => {
						const detail = latestDetail(row && row.versionDetail);
						if (!detail || (!detail.title && !detail.body)) return;
						const key = noticeKey(row, detail, lineId);
						if (seen.has(key)) {
							const existing = seen.get(key);
							if (!existing.lineIds.includes(lineId)) existing.lineIds.push(lineId);
							if (line.lineName && !existing.lineNames.includes(line.lineName)) existing.lineNames.push(line.lineName);
							return;
						}
						const notice = {
							lineId: lineId,
							lineName: String(line && line.lineName || ""),
							lineIds: [lineId],
							lineNames: line && line.lineName ? [String(line.lineName)] : [],
							iconType: String(row && row.iconType || line && line.iconType || ""),
							conditionName: String(row && row.conditionName || ""),
							cause: String(row && row.cause || ""),
							supplementary: String(row && row.supplementary || ""),
							updatedAt: String(detail.updatedAt || row && row.publicationDate || ""),
							title: String(detail.title || ""),
							body: String(detail.body || ""),
							severity: severityOf(row, detail)
						};
						seen.set(key, notice);
						notices.push(notice);
					});
				});
			});
		});
		return notices;
	}

	return {
		getNotices: getNotices,
		parse: parse
	};
}));
