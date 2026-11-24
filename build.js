// Baut die drei eigenständigen HTML-Dateien aus den Quellteilen in src/.
// Aufruf: node build.js [ppt|xls|doc]   (ohne Argument: alle vorhandenen)
const fs = require('fs'), path = require('path');
const root = __dirname;
const inc = f => fs.readFileSync(path.join(root, 'src', f), 'utf8').replace(/\s+$/, '');
const apps = { ppt: 'powerpoint.html', xls: 'excel.html', doc: 'word.html' };
const want = process.argv[2] ? [process.argv[2]] : Object.keys(apps);
for (const a of want) {
  const tpl = path.join(root, 'src', a, 'template.html');
  if (!fs.existsSync(tpl)) { console.log('übersprungen:', a); continue; }
  const out = fs.readFileSync(tpl, 'utf8').replace(/@@include ([\w./-]+)@@/g, (_, f) => inc(f).replace(/<\/script/gi, '<\\/script'));
  fs.writeFileSync(path.join(root, apps[a]), out);
  console.log('gebaut:', apps[a], (out.length / 1024).toFixed(0) + ' kB');
}
