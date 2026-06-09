import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/store-setup',
        'getting-started/project-structure',
        'getting-started/contributing',
        'getting-started/export-package',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/database-schema',
        'architecture/multilingual',
        'architecture/order-emails',
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
        'plugins/media-plugins',
      ],
    },
    {
      type: 'category',
      label: 'Helpers & Services',
      items: [
        {
          type: 'category',
          label: 'Cart & Checkout',
          items: ['helpers/cart-helper', 'helpers/order-place-helper'],
        },
        {
          type: 'category',
          label: 'Orders',
          items: ['helpers/order-helpers', 'helpers/order-payment-helper', 'helpers/order-shipment-helper'],
        },
        {
          type: 'category',
          label: 'Services',
          items: ['helpers/pricing', 'helpers/notifications'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Code Quality & CI',
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
      ],
    },
  ],
};

export default sidebars;
