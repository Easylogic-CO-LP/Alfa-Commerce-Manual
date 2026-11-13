import type {ReactNode} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './index.module.css';

// The route of one order through the shop, as the events a plugin hears. Each stop opens the page that documents it.
const ROUTE = [
  {
    stop: 'Cart',
    event: 'onCalculateShippingCost',
    text: 'A shipping plugin prices the delivery.',
    to: '/docs/plugins/shipment-plugin-events',
  },
  {
    stop: 'Checkout',
    event: 'onOrderPlaceValidate',
    text: 'Any plugin may refuse the order.',
    to: '/docs/events/order-and-cart-events',
  },
  {
    stop: 'Order saved',
    event: 'onOrderAfterPlace',
    text: 'Payment and shipping plugins write their rows.',
    to: '/docs/plugins/payment-plugin-events',
  },
  {
    stop: 'Status change',
    event: 'onOrderStatusChange',
    text: 'Announced after the save, by background work.',
    to: '/docs/events/flows',
  },
  {
    stop: 'Document',
    event: 'onDocumentIssued',
    text: 'An invoice is issued and never changed.',
    to: '/docs/events/document-events',
  },
];

const CONTENTS = [
  {
    title: 'Getting started',
    text: 'What Alfa Commerce needs, how to install and update it, and the first steps of a new shop.',
    to: '/docs/getting-started/installation',
  },
  {
    title: 'Plugin development',
    text: 'Payment, shipping, form field, item field, media, search and feature plugins, each with a complete example.',
    to: '/docs/plugins/overview',
  },
  {
    title: 'Events',
    text: 'Every event the shop sends, when it is sent, and whether a listener can stop what is happening.',
    to: '/docs/events/flows',
  },
  {
    title: 'Services',
    text: 'Cart and checkout, orders, payments and shipments, documents, pricing, stock and notifications.',
    to: '/docs/services/overview',
  },
  {
    title: 'Architecture',
    text: 'The database, background work, order e-mails, languages, caches, integrity and security.',
    to: '/docs/architecture/overview',
  },
  {
    title: 'REST API',
    text: 'The token, every route, the filters of each list, and the known defects of this release.',
    to: '/docs/api/overview',
  },
  {
    title: 'Contributing',
    text: 'How to send a change, and what the automated checks do with it.',
    to: '/docs/getting-started/contributing',
  },
  {
    title: 'Glossary',
    text: 'The words this manual uses, each explained once.',
    to: '/docs/reference/glossary',
  },
];

const STARTERS = [
  ['payment', 'Payment'],
  ['shipping', 'Shipping'],
  ['itemfield', 'Item field'],
  ['formfield', 'Form field'],
  ['media', 'Media'],
  ['adminscreen', 'Admin screens'],
  ['adminpanel', 'Own admin screen'],
  ['system', 'Joomla system plugin'],
];

function Hero(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const release = String(siteConfig.customFields?.alfaVersion ?? '');

  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.lead}>
          <h1 className={styles.title}>The developer manual of Alfa Commerce</h1>
          <p className={styles.intro}>
            For developers who extend the shop: its plugins, its events, its services and its REST API. This manual
            documents Alfa Commerce {release}, and its examples were installed and run on that release.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} to="/docs/getting-started/installation">
              Install Alfa Commerce
            </Link>
            <Link className={styles.secondary} to="/docs/plugins/plugin-generator">
              Create a plugin
            </Link>
          </div>
        </div>

        <div className={styles.routeWrap}>
          <p className={styles.routeLabel} id="route-label">
            One order, and the events your plugin hears on its way
          </p>
          <ol className={styles.route} aria-labelledby="route-label">
            {ROUTE.map((r, i) => (
              <li key={r.event} className={styles.stop} style={{'--i': i} as React.CSSProperties}>
                <Link to={r.to} className={styles.stopLink}>
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.stopName}>{r.stop}</span>
                  <code className={styles.event}>{r.event}</code>
                  <span className={styles.stopText}>{r.text}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Developer manual"
      description="The developer manual of Alfa Commerce, the eCommerce component for Joomla by Easylogic: plugins, events, services and the REST API.">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </Head>
      <Hero />
      <main className={styles.main}>
        <section className={styles.contents} aria-labelledby="contents-title">
          <h2 id="contents-title" className={styles.sectionTitle}>
            Contents
          </h2>
          <ul className={styles.list}>
            {CONTENTS.map((c) => (
              <li key={c.to}>
                <Link to={c.to} className={styles.row}>
                  <span className={styles.rowTitle}>{c.title}</span>
                  <span className={styles.rowText}>{c.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.starter} aria-labelledby="starter-title">
          <div>
            <h2 id="starter-title" className={styles.sectionTitle}>
              Start from code that was tested
            </h2>
            <p className={styles.starterText}>
              The plugin generator takes a complete example of this manual, puts your names in it and gives you a
              ZIP that Joomla installs. Choose a type:
            </p>
          </div>
          <ul className={styles.chips}>
            {STARTERS.map(([type, label]) => (
              <li key={type}>
                <Link to={`/docs/plugins/plugin-generator?type=${type}`} className={styles.chip}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Layout>
  );
}
