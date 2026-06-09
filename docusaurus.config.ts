import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Alfa Commerce',
  tagline: 'Developer Documentation for Alfa Commerce — Joomla eCommerce',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://manual.alfacommerce.gr',
  baseUrl: '/',

  organizationName: 'Easylogic-CO-LP',
  projectName: 'Alfa-Commerce-Manual',

  onBrokenLinks: 'throw',

  // Enable Mermaid diagrams in markdown
  markdown: {
    mermaid: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        docsRouteBasePath: '/docs',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/Easylogic-CO-LP/Alfa-Commerce-Manual/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    navbar: {
      title: 'Alfa Commerce',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://github.com/Easylogic-CO-LP/Alfa-Commerce',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture/overview',
            },
            {
              label: 'Plugin Development',
              to: '/docs/plugins/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/Easylogic-CO-LP/Alfa-Commerce/issues',
            },
            {
              label: 'Contributing',
              href: 'https://github.com/Easylogic-CO-LP/Alfa-Commerce/blob/main/CONTRIBUTING.md',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Easylogic',
              href: 'https://easylogic.gr',
            },
            {
              label: 'Postman API Collection',
              href: 'https://null.postman.co/collection/40562641-db6c701d-6cee-4955-96b3-d357447b9bfe',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Easylogic CO LP.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['php', 'bash', 'sql', 'xml-doc', 'ini', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
