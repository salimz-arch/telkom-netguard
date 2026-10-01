import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#07111F',
        sidebar: '#0A1628',
        card: '#0E1B2E',
        'card-hover': '#13243A',
        border: '#1D3047',
        primary: { DEFAULT: '#E30613', soft: '#B91C1C' },
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        success: '#22C55E',
        warning: '#F59E0B',
        critical: '#EF4444',
        info: '#38BDF8',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { xl: '12px', '2xl': '16px' },
      transitionDuration: { '200': '200ms', '250': '250ms' },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}