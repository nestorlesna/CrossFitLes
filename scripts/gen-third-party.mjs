// Genera el listado de licencias de terceros a partir de las dependencias de producción.
//   - src/data/thirdPartyLicenses.json → lo muestra Acerca de → Licencias de terceros
//   - THIRD_PARTY_NOTICES.md           → textos completos de licencia (en el repo)
// Uso: npm run licenses   (volver a correrlo al agregar o actualizar dependencias)

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const deps = Object.keys(pkg.dependencies ?? {}).sort();

function repoUrl(p) {
  const r = typeof p.repository === 'string' ? p.repository : p.repository?.url;
  const url = p.homepage || r || '';
  return url.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://');
}

function licenseText(dir) {
  const file = readdirSync(dir).find(f => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
  return file ? readFileSync(join(dir, file), 'utf8').trim() : null;
}

const list = [];
let notices = '# Avisos de terceros\n\nFitLesUY Session Tracker incluye las siguientes bibliotecas de código abierto.\n';

for (const name of deps) {
  const dir = join(root, 'node_modules', name);
  if (!existsSync(join(dir, 'package.json'))) {
    console.warn(`No está instalado: ${name}`);
    continue;
  }
  const p = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const license = typeof p.license === 'string' ? p.license : p.license?.type ?? 'Ver repositorio';
  const url = repoUrl(p);
  list.push({ name, version: p.version, license, url });
  notices += `\n## ${name} ${p.version}\n\nLicencia: ${license}${url ? ` · ${url}` : ''}\n`;
  const text = licenseText(dir);
  if (text) notices += `\n\`\`\`text\n${text}\n\`\`\`\n`;
}

writeFileSync(join(root, 'src/data/thirdPartyLicenses.json'), JSON.stringify(list, null, 2) + '\n');
writeFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), notices);
console.log(`Licencias generadas: ${list.length} paquetes.`);
