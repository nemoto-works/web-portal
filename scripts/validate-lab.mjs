import { lstat, readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const labRoot = join(root, 'lab');
const errors = [];

async function files(dir) {
  const entries = await readdir(dir);
  const result = [];
  for (const entry of entries) {
    const path = join(dir, entry);
    const linkInfo = await lstat(path);
    if (linkInfo.isSymbolicLink()) {
      errors.push(`${relative(root, path)}: symbolic links are not allowed in LAB`);
      continue;
    }
    const info = await stat(path);
    if (info.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

for (const required of ['index.html', 'README.md']) {
  try { await stat(join(labRoot, required)); }
  catch { errors.push(`Missing lab/${required}`); }
}

const all = await files(labRoot);
for (const path of all.filter((file) => extname(file) === '.html')) {
  const html = await readFile(path, 'utf8');
  const name = relative(root, path);
  if (!/<meta\s+name=["']viewport["']/i.test(html)) errors.push(`${name}: missing viewport meta tag`);
  if (!/<html[^>]+lang=["']ja["']/i.test(html)) errors.push(`${name}: missing lang=ja`);
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(target)) continue;
    const clean = target.split(/[?#]/, 1)[0];
    const destination = resolve(join(path, '..'), clean);
    if (!destination.startsWith(root)) errors.push(`${name}: link escapes repository: ${target}`);
  }
}

const index = await readFile(join(labRoot, 'index.html'), 'utf8');
const portalIndex = await readFile(join(root, 'index.html'), 'utf8');
for (const path of all.filter((file) => relative(labRoot, file).split('/').length === 2 && file.endsWith('/index.html'))) {
  const slug = relative(labRoot, join(path, '..'));
  const html = await readFile(path, 'utf8');
  const graduated = /<html[^>]+data-lab-graduated/i.test(html);
  if (graduated) {
    if (index.includes(`./${slug}/`)) errors.push(`lab/index.html: graduated app must not remain listed: ${slug}`);
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["'](https:\/\/[^"']+)/i)?.[1];
    if (!canonical) errors.push(`${relative(root, path)}: graduated app needs a public canonical URL`);
    else if (!portalIndex.includes(canonical)) errors.push(`index.html: graduated app needs a production link: ${canonical}`);
  } else if (!index.includes(`./${slug}/`)) {
    errors.push(`lab/index.html: missing link to ${slug}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`LAB validation passed (${all.length} files checked).`);
