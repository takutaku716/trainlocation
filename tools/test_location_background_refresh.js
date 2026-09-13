const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "location.js"), "utf8");

function extractFunction(name) {
	const start = source.indexOf("function " + name + "(");
	assert.notStrictEqual(start, -1, name + " was not found");
	const bodyStart = source.indexOf("{", start);
	let depth = 0;
	for (let index = bodyStart; index < source.length; index += 1) {
		if (source[index] === "{") depth += 1;
		if (source[index] === "}") depth -= 1;
		if (depth === 0) return source.slice(start, index + 1);
	}
	throw new Error(name + " is incomplete");
}

const context = {
	Date,
	document: { visibilityState: "hidden" },
	refreshCount: 0,
	startCount: 0,
	stopCount: 0,
	wakeLockCount: 0,
	releaseCount: 0,
	get_param_rosen: () => "74",
	is_location_auto_refresh_allowed: () => true,
	refresh_location_positions: () => { context.refreshCount += 1; },
	start_location_auto_refresh: () => { context.startCount += 1; },
	stop_location_auto_refresh: () => { context.stopCount += 1; },
	update_location_wake_lock: () => { context.wakeLockCount += 1; },
	release_location_wake_lock: () => { context.releaseCount += 1; }
};

vm.createContext(context);
vm.runInContext(`
	let locationAutoRefreshEnabled = true;
	let locationPageWasBackgrounded = false;
	let lastLocationForegroundRefreshAt = 0;
	const LOCATION_FOREGROUND_REFRESH_DEBOUNCE = 1000;
	${extractFunction("resume_location_after_background")}
	${extractFunction("handle_page_visibility_change")}
`, context);

vm.runInContext("handle_page_visibility_change()", context);
assert.strictEqual(context.stopCount, 1, "backgrounding must stop the timer");
assert.strictEqual(context.releaseCount, 1, "backgrounding must release the wake lock");
assert.strictEqual(context.refreshCount, 0, "backgrounding must not refresh");

context.document.visibilityState = "visible";
vm.runInContext("handle_page_visibility_change()", context);
assert.strictEqual(context.refreshCount, 1, "foregrounding must refresh immediately");
assert.strictEqual(context.startCount, 1, "foregrounding must restart the timer");

vm.runInContext("handle_page_visibility_change()", context);
assert.strictEqual(context.refreshCount, 1, "duplicate foreground events must not refresh twice");
assert.strictEqual(context.startCount, 1, "duplicate foreground events must not restart twice");

console.log("Location background refresh behavior: ok");
