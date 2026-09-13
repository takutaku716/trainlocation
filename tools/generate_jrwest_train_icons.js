const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const masterPath = path.join(root, "original", "jrwest_train_icon_master.json");
const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
const basePath = path.join(root, master.base_icon);
const outputDirectory = path.join(root, master.output_directory);
const baseSvg = fs.readFileSync(basePath, "utf8");

if (!/fill="#[0-9A-Fa-f]{3,8}"/.test(baseSvg)) {
  throw new Error(`No fill color was found in ${master.base_icon}`);
}

fs.mkdirSync(outputDirectory, { recursive: true });

for (const [iconCode, icon] of Object.entries(master.icons)) {
  const outputPath = path.join(outputDirectory, `train_icon_${iconCode}.svg`);
  const svg = baseSvg.replace(
    /fill="#[0-9A-Fa-f]{3,8}"/,
    `fill="${icon.color.toUpperCase()}"`
  );
  fs.writeFileSync(outputPath, svg, "utf8");
}

console.log(`Generated ${Object.keys(master.icons).length} JR West train icons.`);
