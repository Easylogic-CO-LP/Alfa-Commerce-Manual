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
        'architecture/multilingual',
        'architecture/order-emails',
      ],
    },
    {
      type: 'category',
      label: 'Plugin Development',
      items: [
        'plugins/overview',
        {
          type: 'category',
          label: 'Payment plugins',
          items: [
            {type: 'doc', id: 'plugins/payment-plugins', label: 'Guide'},
            {type: 'doc', id: 'plugins/payment-plugin-events', label: 'Events'},
            {type: 'doc', id: 'plugins/payment-plugin-money', label: 'Payments, refunds and webhooks'},
            {type: 'doc', id: 'plugins/payment-plugin-example', label: 'Complete example'},
          ],
        },
        {
          type: 'category',
          label: 'Shipping plugins',
          items: [
            {type: 'doc', id: 'plugins/shipment-plugins', label: 'Guide'},
            {type: 'doc', id: 'plugins/shipment-plugin-events', label: 'Events'},
            {type: 'doc', id: 'plugins/shipment-plugin-example', label: 'Complete example'},
          ],
        },
        'plugins/form-field-plugins',
        {
          type: 'category',
          label: 'Item field plugins',
          items: [
            {type: 'doc', id: 'plugins/item-field-plugins', label: 'Guide'},
            {type: 'doc', id: 'plugins/item-field-plugin-events', label: 'Events'},
            {type: 'doc', id: 'plugins/item-field-plugin-example', label: 'Complete example'},
          ],
        },
        'plugins/media-plugins',
        'plugins/search-plugins',
        {
          type: 'category',
          label: 'Feature plugins',
          items: [
            {type: 'doc', id: 'plugins/admin-screen-plugins', label: 'Extending admin screens'},
            {type: 'doc', id: 'plugins/admin-screen-events', label: 'Admin screen events'},
            {type: 'doc', id: 'plugins/admin-screen-example', label: 'Complete example'},
            {type: 'doc', id: 'plugins/admin-screen-ajax', label: 'Calling your plugin from the browser'},
            {type: 'doc', id: 'plugins/admin-panels', label: 'Creating an admin panel'},
            {type: 'doc', id: 'plugins/admin-panel-example', label: 'Complete admin panel example'},
          ],
        },
        'plugins/system-console-task-plugins',
      ],
    },
    {
      type: 'category',
      label: 'Events',
      items: [
        'events/how-events-reach-a-plugin',
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
