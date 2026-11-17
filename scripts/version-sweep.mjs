// Lists every place in the pages that speaks of a release instead of describing what the software does now:
// release numbers (2.x.y), release-history phrases and test-provenance phrases. Run it before a push:
//   node scripts/version-sweep.mjs
// Allowed: the requirements (Joomla 6.1, PHP 8.3, MySQL 8.0, MariaDB 10.6, which no pattern matches), the versions of
// the tools the checks run (PHPStan, Semgrep, TruffleHog), the invisible <AlfaVersion /> record, and code blocks, where a
// version is a value the code needs (a manifest, a minimum version). Version strings inside code blocks are counted
// and listed after the findings, for the reader to see.
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');

const patterns = [
  /\b[12]\.\d+\.\d+\b/,
  /\bsince 2\.\d/i,
  /\b(?:in|with|from|up to|before|after|until) 2\.\d/i,
  /\bas of\b/i,
  /\bchanged in\b/i,
  /\bnew in\b/i,
  /\bplanned for\b/i,
  // A stock state can be "not released"; a release cannot be "not yet released".
  /\bnot yet released\b/i,
  /\bnot released yet\b/i,
  /\b(?:unreleased|upcoming release|next release|future release)\b/i,
  /\bthe update to\b/i,
  /\btried on\b/i,
  /\btested (?:on|against)\b/i,
  /\bverified on\b/i,
  /\binstalled and tried\b/i,
  /\bwas tried\b/i,
  /\bfixed in\b/i,
  /\bknown defects? (?:in|of) \d/i,
  /\bdeprecated since\b/i,
  /\bremoved in \d/i,
  /\b(?:earlier|older|previous) (?:versions?|releases?)\b/i,
];

// What may name a version: what the shop needs, the tools the checks run, and the invisible record of each page.
// Each of these is erased from a line before the line is searched, so the rest of the line is still searched.
const allowed = [
  /<AlfaVersion verified="[^"]*" \/>/g,
  /\bPHPStan\b[^0-9\n]{0,60}2\.\d+\.\d+/g,
  /\bSemgrep\b[^0-9\n]{0,60}1\.\d+\.\d+/g,
  /\bTruffleHog\b[^0-9\n]{0,60}v?3\.\d+\.\d+/g,
  // The compatibility-range policy speaks of the lines an extension is tested on: a rule for extensions, not a
  // statement about this manual.
  /\bextension (?:was|is) tested on\b/g,
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.md') ? [path] : [];
  });
}

let count = 0;
const inCode = [];
for (const file of walk(docs).sort()) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let fenced = false;
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return;
    }
    if (fenced) {
      if (/\b[12]\.\d+\.\d+\b/.test(line)) {
        inCode.push(`${relative(root, file)}:${index + 1}: ${line.trim().slice(0, 160)}`);
      }
      return;
    }
    const rest = allowed.reduce((text, rx) => text.replace(rx, ''), line);
    const hit = patterns.find((rx) => rx.test(rest));
    if (hit) {
      count += 1;
      console.log(`${relative(root, file)}:${index + 1}: ${line.trim().slice(0, 160)}`);
    }
  });
}
console.log(`${count} line(s) found`);
console.log(`\nVersion values inside code blocks (${inCode.length}), kept because the code needs them:`);
inCode.forEach((line) => console.log(line));
process.exitCode = count === 0 ? 0 : 1;
