const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const master = JSON.parse(
  fs.readFileSync(path.join(root, "original", "jrwest_train_icon_master.json"), "utf8")
);
const baseSvg = fs.readFileSync(path.join(root, master.base_icon), "utf8");
const referencedCodes = [...new Set(Object.values(master.routes).flat())];
const missing = [];
const nonColorDifferences = [];

for (const iconCode of referencedCodes) {
  const iconPath = path.join(
    root,
    master.output_directory,
    `train_icon_${iconCode}.svg`
  );
  if (!master.icons[iconCode] || !fs.existsSync(iconPath)) {
    missing.push(iconCode);
  }
}

for (const [iconCode, icon] of Object.entries(master.icons)) {
  const iconPath = path.join(
    root,
    master.output_directory,
    `train_icon_${iconCode}.svg`
  );
  const svg = fs.readFileSync(iconPath, "utf8");
  const expectedFill = `fill="${icon.color.toUpperCase()}"`;
  const restored = svg.replace(expectedFill, 'fill="#789"');
  if (!svg.includes(expectedFill) || restored !== baseSvg) {
    nonColorDifferences.push(iconCode);
  }
}

const result = {
  routePages: Object.keys(master.routes).length,
  icons: Object.keys(master.icons).length,
  referencedColors: referencedCodes.length,
  missing,
  nonColorDifferences
};

console.log(JSON.stringify(result, null, 2));
if (missing.length || nonColorDifferences.length) {
  process.exitCode = 1;
}
