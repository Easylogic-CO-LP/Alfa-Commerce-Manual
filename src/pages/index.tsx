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
  strokeWidth: 1.75,
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
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
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
        <path d="M9 3v4" />
        <path d="M15 3v4" />
        <path d="M6 7h12v4a6 6 0 0 1-12 0V7Z" />
        <path d="M12 17v4" />
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
        <path d="M12 3v12" />
        <path d="m7 11 5 5 5-5" />
        <path d="M4 20h16" />
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
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
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
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
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
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
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
        <path d="M7 4a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2" />
        <path d="M17 4a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2" />
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
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.5 2.5 4.5-4.5" />
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
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
        <path d="M5 17a3 3 0 0 1 3-3h11" />
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
