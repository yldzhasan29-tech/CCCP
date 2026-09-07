/* Проверяет, что во всех языках одинаковый набор ключей.
   Запуск: node scripts/check-locales.js  */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..', 'src', 'locales');
const ctx = { window: {} };
vm.createContext(ctx);

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
for (const f of files) {
  vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, f);
}

const L = ctx.window.PP.L;
const base = Object.keys(L.ru);
let failed = false;

console.log(`Локалей: ${Object.keys(L).length}, ключей в ru: ${base.length}`);
for (const code of Object.keys(L)) {
  const missing = base.filter((k) => !(k in L[code]));
  const extra = Object.keys(L[code]).filter((k) => !base.includes(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${code}: не хватает [${missing.join(', ')}] лишние [${extra.join(', ')}]`);
  } else {
    console.log(`✓ ${code}`);
  }
}
process.exit(failed ? 1 : 0);
