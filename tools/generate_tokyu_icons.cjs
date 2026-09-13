const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const original = fs.readFileSync(path.join(root, 'images/home/train_icon.svg'), 'utf8');
const colors = {blue:'#0000ff',limegreen:'#32cd32',red:'#ff0000',darkorange:'#ff8c00',forestgreen:'#228b22',orangered:'#ff4500'};
const output = path.join(root, 'images/home/tokyu');
fs.mkdirSync(output, {recursive:true});
for (const [name,color] of Object.entries(colors)) fs.writeFileSync(path.join(output, `train_icon_${name}.svg`), original.replace('#789',color));
