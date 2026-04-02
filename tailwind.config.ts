import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#F7F7F5',
        sidebar: {
          bg: '#1C1E22',
          text: '#C8CAD0',
          active: '#FFFFFF',
          border: '#2DBDAA',
        },
        topbar: {
          bg: '#FFFFFF',
          border: '#E5E5E3',
        },
        table: {
          bg: '#FFFFFF',
          hover: '#F0F0EE',
          groupHeader: '#EEEEEC',
        },
        teal: {
          DEFAULT: '#2DBDAA',
          50: '#E6F4F1',
          100: '#C0E6DF',
          500: '#2DBDAA',
          600: '#25A090',
        },
        amber: {
          tag: {
            bg: '#FFF3DC',
            text: '#B07D00',
          },
        },
        primary: {
          DEFAULT: '#1C1E22',
          hover: '#2A2D33',
        },
        border: '#E5E5E3',
        muted: '#8A8C92',
      },
      fontSize: {
        'table-header': ['11px', { lineHeight: '16px', letterSpacing: '0.06em', fontWeight: '600' }],
        'table-cell': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'cost': ['13px', { lineHeight: '20px', fontWeight: '500' }],
        'sidebar-nav': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'sidebar-filter': ['12px', { lineHeight: '18px', fontWeight: '400' }],
      },
      width: {
        sidebar: '240px',
      },
      height: {
        topbar: '48px',
      },
      minWidth: {
        app: '1280px',
      },
    },
  },
  plugins: [],
}

export default config
