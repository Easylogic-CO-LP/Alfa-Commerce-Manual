// Test helper: writes one generated plugin ZIP with the same code the page runs.
// node scripts/make-plugin.mjs <type> "<name>" <element> <Vendor> <out dir>
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {generate, zip, zipName} from '../src/components/PluginGenerator/core.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [type, name, element, vendor, outDir] = process.argv.slice(2);
const templates = JSON.parse(readFileSync(join(root, 'src/data/pluginTemplates.json'), 'utf8'));
const template = templates.find((t) => t.type === type);

if (!template) throw new Error('unknown type ' + type);

const input = {
  name, element, vendor,
  author: vendor + ' Ltd', authorEmail: 'dev@example.invalid', authorUrl: 'https://example.invalid',
  copyright: '(C) 2026 ' + vendor + ' Ltd', license: 'GNU General Public License version 3 or later',
  version: '0.1.0', description: name + ', a starter plugin.',
  creationDate: '2026-11-13', alfaVersion: '2.2.0',
};
const file = join(outDir, zipName(template, input));
writeFileSync(file, zip(generate(template, input)));
console.log(file);
