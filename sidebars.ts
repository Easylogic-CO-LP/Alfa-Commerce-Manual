import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/project-structure',
        'getting-started/contributing',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/database-schema',
        'architecture/event-system',
        'architecture/pricing-engine',
        'architecture/pricing-examples',
        'architecture/cart-system',
        'architecture/order-system',
      ],
    },
    {
      type: 'category',
      label: 'Plugin Development',
      items: [
        'plugins/overview',
        'plugins/payment-plugins',
        'plugins/shipment-plugins',
        'plugins/custom-field-plugins',
      ],
    },
    {
      type: 'category',
      label: 'Helpers & Services',
      items: [
        'helpers/cart-helper',
        'helpers/order-place-helper',
        'helpers/order-payment-helper',
        'helpers/order-shipment-helper',
        'helpers/price-settings',
      ],
    },
    {
      type: 'category',
      label: 'CI/CD & Tooling',
      items: [
        'tooling/workflows',
        'tooling/php-cs-fixer',
        'tooling/phpstan',
      ],
    },
  ],
  apiSidebar: [
    {
      type: 'category',
      label: 'REST API',
      collapsed: false,
      items: [
        'api/overview',
        'api/endpoints',
      ],
    },
  ],
};

export default sidebars;
