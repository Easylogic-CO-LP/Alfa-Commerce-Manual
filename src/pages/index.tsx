import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

// The Alfa Commerce mark, as on alfacommerce.gr.
const ALPHA =
  'M399.099 298.081c-17.492 65.238-74.455 108.753-145.743 110.293-88.66 1.004-159.807-76.017-154.92-166.634 4.865-80.87 69.18-145.184 150.054-145.184 72.343-.066 135.223 49.654 151.84 120.062l105.058 274.565h100.716L500.871 204.722C449.23 65.377 371.274 3.002 246.541.054 114.023-2.838 0 112.143 0 245.646c0 145.191 114.022 263.108 256.28 260.17 77.563-1.642 140.068-35.558 183.994-95.344z';

function HomepageHeader() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <svg className={styles.mark} viewBox="-12 -12 631 530" aria-hidden="true" focusable="false">
          <path className={styles.markLine} d={ALPHA} pathLength={1} />
          <path className={styles.markFill} d={ALPHA} />
        </svg>
        <div>
          <Heading as="h1" className={styles.title}>
            Alfa Commerce developer manual
          </Heading>
          <p className={styles.tagline}>
            How to extend Alfa Commerce, the eCommerce component for Joomla: its plugins, events, services and
            REST API.
          </p>
          <div className={styles.buttons}>
            <Link className={styles.primary} to="/docs/getting-started/installation">
              Get started
            </Link>
            <Link className={styles.secondary} to="/docs/plugins/plugin-generator">
              Create a plugin
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  description: ReactNode;
  link: string;
  icon: ReactNode;
  /** The pages people look for most, as [label, address]. */
  pages: [string, string][];
};

const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Getting started',
    description: 'What Alfa Commerce needs, how to install and update it, and the first steps of a new shop.',
    link: '/docs/getting-started/installation',
    pages: [['Installation', '/docs/getting-started/installation'], ['Your first shop', '/docs/getting-started/store-setup'], ['Project structure', '/docs/getting-started/project-structure']],
    icon: (
      <svg {...svg}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <path d="M4 22v-7" />
      </svg>
    ),
  },
  {
    title: 'Plugin development',
    description: 'Payment, shipping, form field, item field, media, search and feature plugins, each with a complete example.',
    link: '/docs/plugins/overview',
    pages: [['Payment', '/docs/plugins/payment-plugins'], ['Shipping', '/docs/plugins/shipment-plugins'], ['Form field', '/docs/plugins/form-field-plugins'], ['Item field', '/docs/plugins/item-field-plugins'], ['Admin screens', '/docs/plugins/admin-screen-plugins']],
    icon: (
      <svg {...svg}>
        <path d="M12 22v-5" />
        <path d="M9 8V2" />
        <path d="M15 8V2" />
        <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
      </svg>
    ),
  },
  {
    title: 'Plugin generator',
    description: 'Choose a plugin type, type its name and your details, and download a working starter plugin as a ZIP.',
    link: '/docs/plugins/plugin-generator',
    pages: [['Payment starter', '/docs/plugins/plugin-generator?type=payment'], ['Shipping starter', '/docs/plugins/plugin-generator?type=shipping'], ['Admin screen starter', '/docs/plugins/plugin-generator?type=adminscreen']],
    icon: (
      <svg {...svg}>
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    title: 'Events',
    description: 'Every event the shop sends, when it is sent, and whether a listener can stop what is happening.',
    link: '/docs/events/flows',
    pages: [['How events reach a plugin', '/docs/events/how-events-reach-a-plugin'], ['Event flows', '/docs/events/flows'], ['Event index', '/docs/events/event-index']],
    icon: (
      <svg {...svg}>
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Services',
    description: 'Cart and checkout, orders, payments and shipments, documents, pricing, stock and notifications.',
    link: '/docs/services/overview',
    pages: [['Cart and checkout', '/docs/services/cart-and-checkout'], ['Orders', '/docs/services/orders'], ['Pricing', '/docs/services/pricing'], ['Stock', '/docs/services/stock']],
    icon: (
      <svg {...svg}>
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3" />
      </svg>
    ),
  },
  {
    title: 'Architecture',
    description: 'The database, background work, order e-mails, languages, caches, integrity and security.',
    link: '/docs/architecture/overview',
    pages: [['Database schema', '/docs/architecture/database-schema'], ['Background work', '/docs/architecture/background-work'], ['Caches', '/docs/architecture/caches']],
    icon: (
      <svg {...svg}>
        <rect x="16" y="16" width="6" height="6" rx="1" />
        <rect x="2" y="16" width="6" height="6" rx="1" />
        <rect x="9" y="2" width="6" height="6" rx="1" />
        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
        <path d="M12 12V8" />
      </svg>
    ),
  },
  {
    title: 'REST API',
    description: 'The token, every route, the filters of each list, and the Postman collection.',
    link: '/docs/api/overview',
    pages: [['Overview and token', '/docs/api/overview'], ['Catalogue', '/docs/api/catalogue'], ['Orders', '/docs/api/orders']],
    icon: (
      <svg {...svg}>
        <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
        <path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
      </svg>
    ),
  },
  {
    title: 'Contributing',
    description: 'How to send a change to Alfa Commerce, and what the automated checks do with it.',
    link: '/docs/getting-started/contributing',
    pages: [['How to contribute', '/docs/getting-started/contributing'], ['Automated checks', '/docs/tooling/workflows'], ['PHPStan', '/docs/tooling/phpstan']],
    icon: (
      <svg {...svg}>
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <path d="M6 9v12" />
      </svg>
    ),
  },
  {
    title: 'Glossary',
    description: 'The words this manual uses, each explained once.',
    link: '/docs/reference/glossary',
    pages: [],
    icon: (
      <svg {...svg}>
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </svg>
    ),
  },
];

function Feature({title, description, link, icon, pages, idx}: FeatureItem & {idx: number}) {
  return (
    <div className={styles.card} style={{animationDelay: `${idx * 60}ms`}}>
      <span className={styles.iconWrap}>{icon}</span>
      <Heading as="h2" className={styles.cardTitle}>
        <Link to={link} className={styles.cardLink}>
          {title}
        </Link>
      </Heading>
      <p className={styles.cardDesc}>{description}</p>
      {pages.length > 0 && (
        <ul className={styles.pages}>
          {pages.map(([label, to]) => (
            <li key={to}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Developer manual"
      description="The developer manual of Alfa Commerce, the eCommerce component for Joomla by Easylogic: plugins, events, services and the REST API.">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className={styles.grid}>
              {FeatureList.map((props, idx) => (
                <Feature key={props.link} idx={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
