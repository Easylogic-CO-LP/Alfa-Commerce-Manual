import React, {useEffect, useMemo, useState} from 'react';
import CodeBlock from '@theme/CodeBlock';
import templates from '@site/src/data/pluginTemplates.json';
import {TESTED_AGAINST, elementFrom, generate, problems, vendorFrom, zip, zipName} from './core';
import type {Input, Template} from './core';

const TEMPLATES = templates as unknown as Template[];

const LANGUAGE: Record<string, string> = {php: 'php', xml: 'xml', ini: 'ini', sql: 'sql', md: 'markdown'};

function today(): string {
  const d = new Date();
  const two = (n: number) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

/**
 * The plugin generator. It runs in the visitor's browser and sends nothing anywhere: it takes one of the
 * complete examples printed in this manual, replaces the names and the manifest details, and offers the
 * result as a ZIP file.
 */
export default function PluginGenerator(): React.ReactElement {
  const [type, setType] = useState(TEMPLATES[0].type);
  const [name, setName] = useState('');
  const [element, setElement] = useState('');
  const [elementTyped, setElementTyped] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendor, setVendor] = useState('');
  const [vendorTyped, setVendorTyped] = useState(false);
  const [author, setAuthor] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorUrl, setAuthorUrl] = useState('');
  const [copyright, setCopyright] = useState('');
  const [license, setLicense] = useState('GNU General Public License version 3 or later');
  const [version, setVersion] = useState('1.0.0');
  const [description, setDescription] = useState('');
  const [shown, setShown] = useState('');

  // A page of one plugin type opens the generator with that type chosen (?type=payment).
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get('type');

    if (asked && TEMPLATES.some((t) => t.type === asked)) {
      setType(asked);
    }
  }, []);

  const template = TEMPLATES.find((t) => t.type === type) ?? TEMPLATES[0];
  const theElement = elementTyped ? element : elementFrom(name);
  const theVendor = vendorTyped ? vendor : vendorFrom(vendorName);

  const input: Input = {
    name: name.trim(),
    element: theElement,
    vendor: theVendor,
    author: author.trim() || vendorName.trim(),
    authorEmail: authorEmail.trim(),
    authorUrl: authorUrl.trim(),
    copyright: copyright.trim(),
    license: license.trim(),
    version: version.trim(),
    description: description.trim(),
    creationDate: today(),
    alfaVersion: TESTED_AGAINST,
  };

  const wrong = problems(template, input);
  const files = useMemo(
    () => (wrong.length ? null : generate(template, input)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(input), template.type],
  );
  const paths = files ? Object.keys(files).sort() : [];
  const current = files && paths.includes(shown) ? shown : paths.find((p) => p.startsWith('src/Extension/')) ?? '';

  function download(): void {
    if (!files) {
      return;
    }

    const blob = new Blob([zip(files)], {type: 'application/zip'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipName(template, input);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    more: {placeholder?: string; help?: string; type?: string} = {},
  ) => (
    <div className="alfa-generator__field">
      <label htmlFor={`pg-${id}`}>{label}</label>
      <input
        id={`pg-${id}`}
        type={more.type ?? 'text'}
        value={value}
        placeholder={more.placeholder}
        onChange={(e) => set(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {more.help ? <small>{more.help}</small> : null}
    </div>
  );

  return (
    <div className="alfa-generator">
      <div className="alfa-generator__form">
        <div className="alfa-generator__field">
          <label htmlFor="pg-type">Plugin type</label>
          <select id="pg-type" value={type} onChange={(e) => setType(e.target.value)}>
            {TEMPLATES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
          <small>
            Group <code>{template.group}</code>. Made from the example <code>{template.element}</code>.
          </small>
        </div>

        {field('name', 'Plugin name', name, setName, {placeholder: 'My Gateway', help: "Shown in Joomla's plugin list."})}

        {field(
          'element',
          'Element',
          theElement,
          (v) => {
            setElementTyped(true);
            setElement(v);
          },
          {help: 'Lower case letters and digits. It names the folder, the files, the class and the language keys.'},
        )}

        {field('vendorname', 'Vendor name', vendorName, setVendorName, {placeholder: 'Acme Ltd'})}

        {field(
          'vendor',
          'Namespace vendor',
          theVendor,
          (v) => {
            setVendorTyped(true);
            setVendor(v);
          },
          {help: 'The first part of the PHP namespace.'},
        )}

        {field('author', 'Author name', author, setAuthor, {placeholder: vendorName || 'Acme Ltd'})}
        {field('email', 'Author e-mail', authorEmail, setAuthorEmail, {type: 'email'})}
        {field('url', 'Author URL', authorUrl, setAuthorUrl, {type: 'url'})}
        {field('copyright', 'Copyright', copyright, setCopyright, {placeholder: `(C) ${new Date().getFullYear()} Acme Ltd`})}
        {field('license', 'Licence', license, setLicense)}
        {field('version', 'Version', version, setVersion)}
        {field('description', 'Description', description, setDescription, {help: "Shown under the name in Joomla's plugin list."})}
      </div>

      <div className="alfa-generator__about">
        <p>
          <strong>What the example code does.</strong> {template.demo}
        </p>
        <p>
          <strong>What it is not.</strong> {template.starter} It is a starting point, not a finished integration.
        </p>
      </div>

      {wrong.length ? (
        <ul className="alfa-generator__problems">
          {wrong.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : (
        <>
          <p>
            <button type="button" className="button button--primary" onClick={download}>
              Download {zipName(template, input)}
            </button>
          </p>

          <div className="alfa-generator__field">
            <label htmlFor="pg-file">The files ({paths.length})</label>
            <select id="pg-file" value={current} onChange={(e) => setShown(e.target.value)}>
              {paths.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {files && current ? (
            <CodeBlock language={LANGUAGE[current.split('.').pop() ?? ''] ?? 'text'} title={current}>
              {files[current]}
            </CodeBlock>
          ) : null}
        </>
      )}
    </div>
  );
}
