import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/installation">
            Get Started
          </Link>
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
    title: 'Architecture',
    description: 'The MVC structure, event system, pricing engine, cart, and order lifecycle.',
    link: '/docs/architecture/overview',
    icon: (
      <svg {...svg}>
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Payment Plugins',
    description: 'Build payment gateway integrations — offline or any hosted provider.',
    link: '/docs/plugins/payment-plugins',
    icon: (
      <svg {...svg}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    title: 'Shipment Plugins',
    description: 'Build shipping method integrations — flat-rate, zone-based, or carrier-API.',
    link: '/docs/plugins/shipment-plugins',
    icon: (
      <svg {...svg}>
        <path d="M14 18V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" />
        <path d="M14 9h4l4 4v4a1 1 0 0 1-1 1h-1" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    ),
  },
  {
    title: 'REST API',
    description: 'JSON-API for products, orders, payments, shipments, and more.',
    link: '/docs/api/overview',
    icon: (
      <svg {...svg}>
        <path d="M7 4a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2" />
        <path d="M17 4a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2" />
      </svg>
    ),
  },
  {
    title: 'Pricing Engine',
    description: 'Multi-dimensional pricing by currency, user group, location, and quantity.',
    link: '/docs/helpers/pricing',
    icon: (
      <svg {...svg}>
        <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" />
        <circle cx="7.5" cy="7.5" r="1.2" />
      </svg>
    ),
  },
  {
    title: 'Automated Checks',
    description: 'Code style, static analysis, security scans, and AI review on every PR.',
    link: '/docs/tooling/workflows',
    icon: (
      <svg {...svg}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.5 2.5 4.5-4.5" />
      </svg>
    ),
  },
];

function Feature({title, description, link, icon, idx}: FeatureItem & {idx: number}) {
  return (
    <Link to={link} className={styles.card} style={{animationDelay: `${idx * 70}ms`}}>
      <span className={styles.iconWrap}>{icon}</span>
      <Heading as="h3" className={styles.cardTitle}>
        {title}
      </Heading>
      <p className={styles.cardDesc}>{description}</p>
      <span className={styles.cardArrow} aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Developer Documentation"
      description="Developer documentation for Alfa Commerce — the Joomla eCommerce platform by Easylogic">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className={styles.grid}>
              {FeatureList.map((props, idx) => (
                <Feature key={idx} idx={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
