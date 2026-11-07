const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}
function lines(value) { return value ? value.split(/\r?\n/).filter(Boolean) : []; }
const mode = process.argv.includes('--ci') ? 'ci' : 'local';
const sha = git('rev-parse', 'HEAD');

const trackedAssets = lines(git('ls-files', '--', 'assets'));
const missingAssets = trackedAssets.filter((file) => !fs.existsSync(file));
if (missingAssets.length) {
  console.error('Release blocked: committed assets are missing from this checkout:\n' + missingAssets.join('\n'));
  process.exit(1);
}

if (mode === 'local') {
  const modified = lines(git('ls-files', '--modified'));
  const deleted = lines(git('ls-files', '--deleted'));
  const untracked = lines(git('ls-files', '--others', '--exclude-standard'));
  const ignoredAssets = lines(git('ls-files', '--others', '--ignored', '--exclude-standard', '--', 'assets', 'backgrounds', 'bridge-vistas', 'credits', 'picture-events', 'skins'));
  const generated = /^(?:\.preview[^/]*|playwright-output(?:-[^/]*)?|test-results|playwright-report|dist|web-build|debug\.log)(?:\/|$)/;
  const sourceUntracked = untracked.filter((file) => !generated.test(file));
  const cached = lines(git('diff', '--cached', '--name-only'));
  const dirty = [...new Set([...modified, ...deleted, ...cached, ...sourceUntracked, ...ignoredAssets])];
  if (dirty.length) {
    console.error('Release blocked: files differ from the committed release snapshot. Commit intended source and assets before pushing; remove only known generated output.\n' + dirty.join('\n'));
    process.exit(1);
  }
}
console.log(`Release source guard passed (${mode}; commit ${sha}; ${trackedAssets.length} committed asset files present).`);
