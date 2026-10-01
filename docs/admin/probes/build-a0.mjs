// Run run-a0.mjs first. Builds only the disposable snapshot, never the working blog.
import { readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const [hugoArg, siteArg, outputArg] = process.argv.slice(2);
assert(hugoArg && siteArg && outputArg, 'Provide Hugo executable, snapshot and results paths');
const hugo = resolve(hugoArg), site = resolve(siteArg), out = resolve(outputArg);
assert(site.includes('.runtime') && out.includes('.runtime') && !existsSync(join(site, '.git')), 'Only disposable snapshots are allowed');
function build(name, drafts = true) {
  const result = spawnSync(hugo, ['--source', site, '--destination', join(out, name), '--cacheDir', join(out, 'hugo-cache'), '--environment', drafts ? 'development' : 'production', '--noBuildLock', ...(drafts ? ['--buildDrafts'] : [])], { encoding: 'utf8' });
  writeFileSync(join(out, `${name}.log`), (result.stdout ?? '') + (result.stderr ?? ''));
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  console.log(`${name}: success`);
}
cpSync(join(out, 'before/content'), join(site, 'content'), { recursive: true });
build('build-before');
cpSync(join(out, 'after/content'), join(site, 'content'), { recursive: true });
build('build-after');
build('build-production', false);
const target = join(site, 'content/posts/a0-中文文章/index.md');
const source = readFileSync(target, 'utf8');
const prefix = source.match(/^\+\+\+\r?\n[\s\S]*?\r?\n\+\+\+\r?\n/)[0];
try {
  writeFileSync(target, prefix + readFileSync(join(out, 'richtext.after.md'), 'utf8'));
  build('build-richtext');
} finally {
  writeFileSync(target, source);
}
const verification = spawnSync(process.execPath, [join(import.meta.dirname, 'verify-hugo.mjs'), out], { encoding: 'utf8' });
console.log(verification.stdout);
assert.equal(verification.status, 0, verification.stderr);
