// Reads the complete example plugins printed on the manual's pages and writes them as the
// templates of the plugin generator. The pages stay the one source: a template is never edited by hand.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANUAL = 'https://manual.alfacommerce.gr/docs/plugins/';

// mode "names": the element is an ordinary word, so only names are replaced.
// mode "global": the element is a made-up word, so every spelling of it is replaced.
const TEMPLATES = [
  {
    type: 'payment', label: 'Payment plugin', group: 'alfa-payments', element: 'offline', mode: 'names',
    page: 'payment-plugin-example.md', guide: 'payment-plugins',
    extra: [{path: 'params/params.xml', page: 'payment-plugins.md', heading: '## Method settings', lang: 'xml'}],
    demo: 'Records one pending payment when an order is placed. Staff press "Mark as paid" on the order, and the order moves to the status named in the method\'s settings.',
    starter: 'It is not connected to any payment provider. No money is requested, captured or refunded anywhere.',
    todo: [
      ['Send the shopper to your provider and handle the return', 'payment-plugin-events'],
      ['Record what the provider reports, settle, refund and receive webhooks', 'payment-plugin-money'],
      ['Add your own settings (keys, modes) to params/params.xml', 'payment-plugins#method-settings'],
    ],
  },
  {
    type: 'shipping', label: 'Shipping plugin', group: 'alfa-shipments', element: 'flat', mode: 'names',
    page: 'shipment-plugin-example.md', guide: 'shipment-plugins',
    demo: 'Charges the one price typed on the shipping method and records one pending parcel when an order is placed.',
    starter: 'It talks to no carrier: no label, no tracking number, no rates from outside.',
    todo: [
      ['Work out the price from your own rules or your carrier', 'shipment-plugin-events'],
      ['Add staff buttons, tracking and your own settings', 'shipment-plugins'],
    ],
  },
  {
    type: 'itemfield', label: 'Item field plugin', group: 'alfa-item-fields', element: 'picker', mode: 'names',
    page: 'item-field-plugin-example.md', guide: 'item-field-plugins',
    demo: 'Adds an item field type that draws its values as radio buttons on the item page, for a variant field and for an option.',
    starter: 'It draws one layout only and adds no settings of its own.',
    todo: [
      ['Draw your own control in tmpl/item-radio.php', 'item-field-plugins'],
      ['Handle the other events of an item field', 'item-field-plugin-events'],
    ],
  },
  {
    type: 'formfield', label: 'Form field plugin', group: 'alfa-form-fields', element: 'reference', mode: 'names',
    page: 'form-field-plugins.md', heading: '## A complete minimal plugin', guide: 'form-field-plugins',
    demo: 'Adds a form field type that is a one line text input in the registration and checkout forms.',
    starter: 'It validates nothing beyond what Alfa Commerce does for every field.',
    todo: [
      ['Change the input, its settings and its validation', 'form-field-plugins'],
    ],
  },
  {
    type: 'media', label: 'Media plugin', group: 'alfa-media', element: 'webp', mode: 'names',
    page: 'media-plugins.md', heading: '## A complete media plugin', guide: 'media-plugins',
    demo: 'Refuses very large pictures, stores every uploaded image as WebP and writes WebP thumbnails, using PHP\'s GD functions.',
    starter: 'It is a working example of the three media events, not a tuned image optimiser.',
    todo: [
      ['Replace the image work in write() with your own', 'media-plugins'],
    ],
  },
  {
    type: 'adminscreen', label: 'Feature plugin (admin screens)', group: 'alfa', element: 'keeplist', mode: 'global',
    page: 'admin-screen-example.md', guide: 'admin-screen-plugins',
    demo: 'Adds a "Kept" column to the Manufacturers list and refuses to delete the manufacturers whose ids are typed in the plugin\'s options.',
    starter: 'The column and the refusal are a demonstration on one screen.',
    todo: [
      ['Choose your own screens, columns, fields and refusals', 'admin-screen-plugins'],
      ['See every admin screen event', 'admin-screen-events'],
      ['Call your plugin from the browser', 'admin-screen-ajax'],
    ],
  },
  {
    type: 'adminpanel', label: 'Feature plugin (admin panel)', group: 'alfa', element: 'storenotes', mode: 'global',
    page: 'admin-panel-example.md', guide: 'admin-panels',
    demo: 'Adds its own screen to Alfa Commerce\'s menu: a list of notes with search, New, edit and Delete, stored in the plugin\'s own table.',
    starter: 'The notes are a demonstration. The table is created at installation and removed at uninstallation.',
    todo: [
      ['Replace the notes by your own records, form and table', 'admin-panels'],
    ],
  },
  {
    type: 'system', label: 'System plugin', group: 'system', element: 'shopnotes', mode: 'global',
    page: 'system-console-task-plugins.md', heading: '## A complete system plugin', guide: 'system-console-task-plugins',
    demo: 'Writes a line to a log file when an order is completed, and offers one button on Alfa Commerce\'s Tools screen.',
    starter: 'It listens to one order event as an example.',
    todo: [
      ['Listen to the events you need', 'system-console-task-plugins'],
    ],
  },
];

const MARK = /^(?:\*\*`?|###\s+`?|`)([A-Za-z0-9_./-]+\.(?:php|xml|ini|js|css|sql|json))`?(?:\*\*.*)?\s*$/;

function filesOfPage(page, heading) {
  const lines = readFileSync(join(root, 'docs/plugins', page), 'utf8').split('\n');
  let i = 0;
  let end = lines.length;

  if (heading) {
    i = lines.indexOf(heading);
    if (i < 0) throw new Error(`${page}: heading not found: ${heading}`);
    const next = lines.findIndex((l, n) => n > i && l.startsWith('## '));
    if (next > 0) end = next;
  }

  const files = {};

  for (; i < end; i++) {
    const m = MARK.exec(lines[i].trim());
    if (!m) continue;
    let j = i + 1;
    while (j < end && !lines[j].startsWith('```') && !MARK.test(lines[j].trim())) j++;
    if (j >= end || !lines[j].startsWith('```')) continue;
    let k = j + 1;
    while (!lines[k].startsWith('```')) k++;
    files[m[1].replace(/^plugins\/[^/]+\/[^/]+\//, '')] = lines.slice(j + 1, k).join('\n') + '\n';
    i = k;
  }

  return files;
}

function firstBlockAfter(page, heading, lang) {
  const lines = readFileSync(join(root, 'docs/plugins', page), 'utf8').split('\n');
  let i = lines.indexOf(heading);
  if (i < 0) throw new Error(`${page}: heading not found: ${heading}`);
  while (lines[i] !== '```' + lang) i++;
  let k = i + 1;
  while (!lines[k].startsWith('```')) k++;
  return lines.slice(i + 1, k).join('\n') + '\n';
}

const out = TEMPLATES.map((t) => {
  const files = filesOfPage(t.page, t.heading);
  for (const x of t.extra ?? []) files[x.path] = firstBlockAfter(x.page, x.heading, x.lang);
  const manifest = `${t.element}.xml`;
  if (!files[manifest]) throw new Error(`${t.type}: ${manifest} was not found on ${t.page}`);
  if (!Object.keys(files).some((f) => f.startsWith('src/Extension/'))) throw new Error(`${t.type}: no extension class on ${t.page}`);
  const {page, heading, extra, ...rest} = t;
  return {...rest, manual: MANUAL, files};
});

mkdirSync(join(root, 'src/data'), {recursive: true});
writeFileSync(join(root, 'src/data/pluginTemplates.json'), JSON.stringify(out, null, 1) + '\n');
console.log('plugin templates: ' + out.map((t) => `${t.type} (${Object.keys(t.files).length} files)`).join(', '));
