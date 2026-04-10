import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'tutorial-basics/installation',
        'tutorial-basics/basic-usage',
      ],
    },
    {
      type: 'category',
      label: 'API & Advanced',
      items: [
        'tutorial-extras/api-reference',
        'tutorial-extras/middleware',
        'tutorial-extras/advanced-examples',
        'tutorial-extras/best-practices',
      ],
    },
    {
      type: 'category',
      label: 'Query API',
      items: [
        'tutorial-extras/query-overview',
        'tutorial-extras/query-getting-started',
        'tutorial-extras/query-middleware',
        'tutorial-extras/query-plugins',
        'tutorial-extras/query-advanced',
      ],
    },
    {
      type: 'category',
      label: 'I18n API',
      items: [
        'tutorial-extras/i18n-getting-started',
        'tutorial-extras/i18n-api-reference',
        'tutorial-extras/i18n-examples',
        'tutorial-extras/i18n-advanced',
        'tutorial-extras/i18n-best-practices',
      ],
    },
    {
      type: 'category',
      label: 'Hook Form API',
      items: [
        'tutorial-extras/hook-form-getting-started',
        'tutorial-extras/hook-form-api-reference',
        'tutorial-extras/hook-form-examples',
        'tutorial-extras/hook-form-advanced',
      ],
    },
    {
      type: 'category',
      label: 'Resources',
      items: [
        'tutorial-extras/comparison',
        'tutorial-extras/migration-guide',
        'tutorial-extras/faq',
      ],
    },
  ],
};

export default sidebars;
