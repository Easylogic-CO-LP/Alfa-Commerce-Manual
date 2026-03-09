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
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/plugins/overview"
            style={{marginLeft: '1rem'}}>
            Build Plugins
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
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Architecture',
    description: 'Understand the MVC structure, event system, pricing engine, cart, and order lifecycle.',
    link: '/docs/architecture/overview',
  },
  {
    title: 'Payment Plugins',
    description: 'Build payment gateway integrations — Stripe, PayPal, or any provider. Complete lifecycle guide.',
    link: '/docs/plugins/payment-plugins',
  },
  {
    title: 'Shipment Plugins',
    description: 'Build shipping method integrations — FedEx, DHL, or custom carriers. Zone-based or API-based.',
    link: '/docs/plugins/shipment-plugins',
  },
  {
    title: 'REST API',
    description: '17 JSON-API endpoints for products, orders, payments, shipments, and more.',
    link: '/docs/api/overview',
  },
  {
    title: 'Pricing Engine',
    description: 'Multi-dimensional pricing with currency, user group, location, and quantity-based calculations.',
    link: '/docs/architecture/pricing-engine',
  },
  {
    title: 'CI/CD & Tooling',
    description: 'Automated code quality checks, security scanning, and AI-powered code reviews on every PR.',
    link: '/docs/tooling/workflows',
  },
];

function Feature({title, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="padding-horiz--md padding-vert--lg">
        <Heading as="h3">
          <Link to={link}>{title}</Link>
        </Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Developer Documentation"
      description="Developer documentation for Alfa Commerce — the Joomla eCommerce platform by Easylogic">
      <HomepageHeader />
      <main>
        <section className="padding-vert--xl">
          <div className="container">
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
