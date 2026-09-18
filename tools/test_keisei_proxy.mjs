import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../functions/api/keisei/[[path]].js", import.meta.url), "utf8");
const { onRequestGet } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const original = globalThis.fetch;
let calls = 0;
try {
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(new URL(url).origin, "https://zaisen.tid-keisei.jp");
    assert.equal(options.redirect, "manual");
    return Response.json({ fixture: true });
  };
  const get = path => onRequestGet({ request: new Request("https://local.test/api/keisei/" + path) });
  for (const path of ["traffic_info.json", "matsudo_date.json", "matsudo_train_info.json", "matsudo_status.json", "diainf/24B19.json", "diainf_SK/508.json"]) assert.equal((await get(path)).status, 200);
  assert.equal(calls, 6);
  for (const path of ["config.json", "https://other.test", "diainf/a%2Fb.json", "diainf/<script>.json"]) assert.equal((await get(path)).status, 404);
  assert.equal(calls, 6);
  globalThis.fetch = async () => new Response("Forbidden", { status: 403 });
  assert.equal((await get("traffic_info.json")).status, 502);
  globalThis.fetch = async () => new Response("<html>Forbidden</html>");
  assert.equal((await get("traffic_info.json")).status, 502);
} finally { globalThis.fetch = original; }
console.log("Keisei proxy: fixed host, path allowlist, errors passed.");
