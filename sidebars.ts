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
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: [
        {type: 'doc', id: 'getting-started/contributing', label: 'Overview'},
        {
          type: 'category',
          label: 'Automated Checks',
          items: [
            'tooling/workflows',
            'tooling/php-cs-fixer',
            'tooling/phpstan',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/database-schema',
        'architecture/background-work',
        'architecture/order-emails',
        'architecture/multilingual',
        'architecture/caches',
        'architecture/integrity-and-security',
      ],
    },
    {
      type: 'category',
      label: 'Plugin Development',
      items: [
        'plugins/overview',
        'plugins/payment-plugins',
        'plugins/shipment-plugins',
        'plugins/form-field-plugins',
        'plugins/item-field-plugins',
        'plugins/media-plugins',
        'plugins/search-plugins',
        {
          type: 'category',
          label: 'Feature plugins',
          items: ['plugins/admin-screen-plugins', 'plugins/admin-panels'],
        },
        'plugins/system-console-task-plugins',
      ],
    },
    {
      type: 'category',
      label: 'Events',
      items: [
        'events/how-events-reach-a-plugin',
        'events/flows',
        'events/order-and-cart-events',
        'events/item-and-catalogue-events',
        'events/stock-events',
        'events/document-events',
        'events/notification-and-setup-events',
        'events/event-index',
      ],
    },
    {
      type: 'category',
      label: 'Services',
      items: [
        'services/overview',
        'services/cart-and-checkout',
        'services/orders',
        'services/payments-and-shipments',
        'services/documents',
        'services/pricing',
        'services/stock',
        'services/notifications',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/glossary',
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
