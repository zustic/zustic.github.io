import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Zustic - Lightweight State Management Library for React',
  tagline: 'A lightweight, minimal state management library for React with middleware support',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://zustic.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'zustic', // Usually your GitHub org/user name.
  projectName: 'zustic.github.io', // Usually your repo name.
  deploymentBranch: 'main', // The branch to deploy to on GitHub Pages

  onBrokenLinks: 'warn',
  trailingSlash: false,
  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // SEO and head tags
  headTags: [
    {
      tagName:"meta",
      attributes:{
        name: 'google-site-verification',
        content: 'Mzcsku0UjQ2GKMEB0PlZIw3nmM7_YPpPbB8FF8VmV4o',
      }
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'description',
        content: 'Zustic - A lightweight, minimal state management library for React. Alternative to Redux, Zustand, MobX. Ultra-fast, zero dependencies, built-in middleware support.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'React state management, zustic, Redux alternative, Zustand alternative, state management library, React hooks, lightweight state management, MobX alternative, useSyncExternalStore, global state management',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'og:title',
        content: 'Zustic - Lightweight State Management Alternative to Redux & Zustand',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'og:description',
        content: 'A lightweight, minimal state management library for React with middleware support. Smaller than Redux, Zustand, and MobX. Perfect for React, Next.js, and React Native.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:title',
        content: 'Zustic - Better Alternative to Redux and Zustand',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:description',
        content: 'Ultra-lightweight state management (~500B). Redux alternative with zero dependencies and built-in middleware.',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'canonical',
        href: 'https://zustic.github.io/',
      },
    },
  ],
  

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          routeBasePath: 'blog',
          path: './blog',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Zustic',
      logo: {
        alt: 'Zustic Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {
          type: 'search',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/zustic',
          label: 'NPM',
          position: 'right',
        },
        {
          href: 'https://github.com/DeveloperRejaul/zustic',
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
              to: '/docs/intro',
            },
            {
              label: 'Installation',
              to: '/docs/tutorial-basics/installation',
            },
            {
              label: 'API Reference',
              to: '/docs/tutorial-extras/api-reference',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'GitHub Repository',
              href: 'https://github.com/DeveloperRejaul/zustic',
            },
            {
              label: 'NPM Package',
              href: 'https://www.npmjs.com/package/zustic',
            },
            {
              label: 'Issue Tracker',
              href: 'https://github.com/DeveloperRejaul/zustic/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Author GitHub',
              href: 'https://github.com/DeveloperRejaul',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Zustic. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
