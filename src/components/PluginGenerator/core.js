// The plugin generator's logic: no browser and no Node API, so the page and the test script run the same code.
// It never writes code of its own. It takes a complete example printed in the manual and replaces
// names and manifest details in it.

// Words PHP does not accept as a class name.
const RESERVED = new Set(
  (
    'abstract and array as break callable case catch class clone const continue declare default do echo else ' +
    'elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval exit extends false final finally ' +
    'fn for foreach function global goto if implements include instanceof insteadof interface isset list match ' +
    'namespace new null or parent print private protected public readonly require return self static switch throw ' +
    'trait true try unset use var while xor yield int float bool string iterable object mixed void never'
  ).split(' '),
);

// Elements Alfa Commerce ships itself, by plugin group.
const SHIPPED = {
  'alfa-payments': ['standard'],
  'alfa-shipments': ['standard'],
  'alfa-form-fields': ['text', 'textarea', 'tel', 'choice', 'country'],
  'alfa-item-fields': ['choice'],
  system: ['alfasync'],
};

// The Alfa Commerce release the examples were installed and tested on.
export const TESTED_AGAINST = '2.2.0';

export function elementFrom(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^[0-9]+/, '');
}

export function vendorFrom(name) {
  const clean = String(name || '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
    .replace(/^[0-9]+/, '');

  return clean;
}

const ucfirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** What is wrong with the form, as a list of sentences. Empty when the plugin can be generated. */
export function problems(template, input) {
  const out = [];
  const element = input.element || '';
  const vendor = input.vendor || '';

  if (!String(input.name || '').trim()) out.push('Give the plugin a name.');

  if (!/^[a-z][a-z0-9]{1,39}$/.test(element)) {
    out.push('The element must be 2 to 40 lower case letters or digits and start with a letter.');
  } else if (RESERVED.has(element)) {
    out.push(`"${element}" is a word of PHP and cannot name the plugin's class. Choose another element.`);
  } else if ((SHIPPED[template.group] || []).includes(element)) {
    out.push(`Alfa Commerce ships a plugin named "${element}" in this group. Choose another element.`);
  }

  if (!/^[A-Z][A-Za-z0-9]{1,39}$/.test(vendor)) {
    out.push('The vendor must be 2 to 40 letters or digits and start with a capital letter. It becomes the first part of the PHP namespace.');
  }

  if (!/^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$/.test(String(input.version || ''))) {
    out.push('The version must look like 1.0.0.');
  }

  return out;
}

const xml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// A language file's value is between double quotes.
const ini = (s) => String(s).replace(/"/g, "'").replace(/[\r\n]+/g, ' ').trim();

function setTag(manifest, tag, value, after) {
  const re = new RegExp(`(<${tag}>)[^<]*(</${tag}>)`);

  if (re.test(manifest)) {
    return manifest.replace(re, (m, a, b) => a + xml(value) + b);
  }

  if (!value) return manifest;

  const anchor = new RegExp(`^([ \\t]*)<${after}>[^\\n]*\\n`, 'm');

  return manifest.replace(anchor, (line, indent) => `${line}${indent}<${tag}>${xml(value)}</${tag}>\n`);
}

function header(template, input, e) {
  const todo = template.todo
    .map(([what, page]) => ` *   - ${what}:\n *     ${template.manual}${page}`)
    .join('\n');

  return [
    '/**',
    ` * ${ini(input.name)}: a starter plugin for Alfa Commerce ${input.alfaVersion}.`,
    ' *',
    ` * Made from the manual's tested example "${template.element}" (${template.label.toLowerCase()}), with the names changed.`,
    ' *',
    ' * WHAT THE EXAMPLE CODE IN THIS PLUGIN DOES',
    ` *   ${template.demo}`,
    ' *',
    ' * WHAT IT IS NOT',
    ` *   ${template.starter}`,
    ' *   It is a starting point, not a finished integration.',
    ' *',
    ' * TODO, YOURS TO WRITE',
    todo,
    ' *',
    ` * The guide: ${template.manual}${template.guide}`,
    ' */',
  ].join('\n');
}

function readme(template, input, e) {
  const todo = template.todo.map(([what, page]) => `- ${what}: ${template.manual}${page}`).join('\n');

  return [
    `# ${ini(input.name)}`,
    '',
    `A starter plugin for Alfa Commerce ${input.alfaVersion}, group \`${template.group}\`, element \`${e}\`.`,
    `It was made from the manual's tested example "${template.element}" (${template.label.toLowerCase()}) by changing the names.`,
    '',
    '## What the example code does',
    '',
    template.demo,
    '',
    '## What it is not',
    '',
    `${template.starter} It is a starting point, not a finished integration.`,
    '',
    '## To do',
    '',
    todo,
    '',
    '## Install',
    '',
    'In the Joomla administrator: System, Install, Extensions, upload this ZIP. A new plugin is installed disabled:',
    'enable it under System, Plugins.',
    '',
    `The guide: ${template.manual}${template.guide}`,
    '',
  ].join('\n');
}

/**
 * The files of the new plugin, as {path: text}.
 *
 * @param template One entry of pluginTemplates.json.
 * @param input    name, element, vendor, author, authorEmail, authorUrl, copyright, license, version, description,
 *                 creationDate, alfaVersion.
 */
export function generate(template, input) {
  input = {alfaVersion: TESTED_AGAINST, ...input};
  const wrong = problems(template, input);

  if (wrong.length) throw new Error(wrong.join(' '));

  const from = template.element;
  const From = ucfirst(from);
  const FROM = from.toUpperCase();
  const e = input.element;
  const E = ucfirst(e);
  const EU = e.toUpperCase();
  const groupKey = template.group.replace(/-/g, '_').toUpperCase();
  const keyFrom = `PLG_${groupKey}_${FROM}`;
  const keyTo = `PLG_${groupKey}_${EU}`;
  const out = {};

  for (const [path, original] of Object.entries(template.files)) {
    let text = original;
    const code = /\.(php|xml|sql)$/.test(path);

    // Language keys and their prefix, in every file.
    text = text.replace(new RegExp(escapeRe(keyFrom) + '(?![A-Z0-9])', 'g'), keyTo);

    // The vendor part of the namespace.
    text = text.replace(/Acme\\Plugin\\/g, `${input.vendor}\\Plugin\\`);

    if (template.mode === 'global') {
      // A made-up word: every spelling of it is the plugin's name.
      text = text
        .replace(new RegExp(escapeRe(FROM), 'g'), EU)
        .replace(new RegExp(escapeRe(From), 'g'), E)
        .replace(new RegExp(escapeRe(from), 'g'), e);
    } else {
      if (code) {
        // The class and the last part of the namespace.
        text = text.replace(new RegExp(`\\b${escapeRe(From)}\\b`, 'g'), E);
      }

      // The element, only where it is a name.
      text = text
        .replace(new RegExp(`plugin="${escapeRe(from)}"`, 'g'), `plugin="${e}"`)
        .replace(new RegExp(`(getPlugin\\('[^']+', ')${escapeRe(from)}('\\))`, 'g'), `$1${e}$2`)
        .replace(new RegExp(`(plg_[a-z-]+_)${escapeRe(from)}(\\.sys\\.ini|\\.ini|</name>)`, 'g'), `$1${e}$2`);
    }

    // File and folder names.
    const newPath = path
      .split('/')
      .map((part) =>
        part
          .replace(new RegExp(`^${escapeRe(from)}\\.xml$`), `${e}.xml`)
          .replace(new RegExp(`^${escapeRe(From)}\\.php$`), `${E}.php`)
          .replace(new RegExp(`_${escapeRe(from)}(\\.sys\\.ini|\\.ini)$`), `_${e}$1`),
      )
      .join('/');

    out[newPath] = text;
  }

  // The manifest's details.
  const manifestPath = `${e}.xml`;
  let manifest = out[manifestPath];
  manifest = setTag(manifest, 'author', input.author || input.vendor, 'name');
  manifest = setTag(manifest, 'creationDate', input.creationDate, 'author');
  manifest = setTag(manifest, 'copyright', input.copyright || '', 'creationDate');
  manifest = setTag(manifest, 'license', input.license || 'GNU General Public License version 3 or later', 'creationDate');
  manifest = setTag(manifest, 'authorEmail', input.authorEmail || '', 'author');
  manifest = setTag(manifest, 'authorUrl', input.authorUrl || '', 'author');
  manifest = setTag(manifest, 'version', input.version, 'author');
  out[manifestPath] = manifest;

  // The name and the description shown in Joomla's plugin list.
  for (const path of Object.keys(out)) {
    if (!/\.ini$/.test(path)) continue;

    out[path] = out[path]
      .replace(new RegExp(`^${keyTo}="[^\\n]*"$`, 'm'), `${keyTo}="${ini(input.name)}"`)
      .replace(
        new RegExp(`^${keyTo}_XML_DESCRIPTION="[^\\n]*"$`, 'm'),
        `${keyTo}_XML_DESCRIPTION="${ini(input.description || input.name)}"`,
      );
  }

  // What is an example and what is the developer's, said at the top of the plugin's class and in a README.
  const classPath = Object.keys(out).find((p) => p === `src/Extension/${E}.php`);
  out[classPath] = out[classPath].replace(/^<\?php\n/, `<?php\n\n${header(template, input, e)}\n`);
  out['README.md'] = readme(template, input, e);

  return out;
}

export function zipName(template, input) {
  return `plg_${template.group}_${input.element}.zip`;
}

// A ZIP archive with stored (not compressed) entries: small files, no library needed.
let crcTable;

function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);

    for (let n = 0; n < 256; n++) {
      let c = n;

      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;

      crcTable[n] = c >>> 0;
    }
  }

  let crc = 0xffffffff;

  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);

  return (crc ^ 0xffffffff) >>> 0;
}

/** {path: text} as the bytes of a ZIP file. */
export function zip(files, date = new Date()) {
  const enc = new TextEncoder();
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const parts = [];
  const central = [];
  let offset = 0;

  for (const path of Object.keys(files).sort()) {
    const name = enc.encode(path);
    const data = enc.encode(files[path]);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // names are UTF-8
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), name, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true);
    entry.setUint16(12, time, true);
    entry.setUint16(14, day, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }

  const centralSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  const count = Object.keys(files).length;
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, count, true);
  end.setUint16(10, count, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const bytes = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let at = 0;

  for (const p of all) {
    bytes.set(p, at);
    at += p.length;
  }

  return bytes;
}
