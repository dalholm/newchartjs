import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
  base: '/newchartjs/',
  title: 'NewChart JS',
  description: 'A zero-dependency charting library for professional business applications',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Components', link: '/components' },
      { text: 'Styling', link: '/styling' },
      { text: 'API', link: '/api-reference' },
      { text: 'Demo', link: '/demo' },
      { text: 'llms.txt', link: '/llms.txt', target: '_blank' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is NewChart JS?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' }
        ]
      },
      {
        text: 'Charts & Components',
        items: [
          { text: 'Components', link: '/components' }
        ]
      },
      {
        text: 'Customization',
        items: [
          { text: 'Styling & Theming', link: '/styling' },
          { text: 'API Reference', link: '/api-reference' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/dalholm/newchartjs' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Nyehandel'
    }
  },

  vite: {
    plugins: [
      llmstxt()
    ]
  }
})
