/** @type {import('tailwindcss').Config} */
// Design tokens (spec §13). Keep in sync with src/ui/theme.ts.
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#12161F', // novxanibeton.az theme-color (deep graphite)
          foreground: '#FFFFFF',
          soft: '#E7E9EE',
        },
        // TODO(nurlan): confirm accent colour (spec §22 Q11)
        accent: {
          DEFAULT: '#F5A623',
          foreground: '#12161F',
          soft: '#FEF3DB',
          'soft-dark': '#3A2E12',
          strong: '#B86E00',
          light: '#FBBF24',
        },
        background: {
          DEFAULT: '#F6F7F9',
          dark: '#0B0E14',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#EEF0F3',
          dark: '#151A23',
          'muted-dark': '#1C2230',
        },
        ink: {
          DEFAULT: '#12161F',
          muted: '#6B7280',
          subtle: '#9CA3AF',
          inverse: '#F9FAFB',
          dark: '#F3F4F6',
          'muted-dark': '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
          dark: '#2A3140',
        },
        // *-soft: tint behind dark text (light mode); *-soft-dark + *-light: dark mode pair.
        info: { DEFAULT: '#2563EB', soft: '#DBEAFE', 'soft-dark': '#12284A', light: '#93C5FD' },
        warning: { DEFAULT: '#B45309', soft: '#FEF3C7', 'soft-dark': '#3B2A0E', light: '#FCD34D' },
        danger: { DEFAULT: '#DC2626', soft: '#FEE2E2', 'soft-dark': '#3B1212', light: '#FCA5A5' },
        success: { DEFAULT: '#15803D', soft: '#DCFCE7', 'soft-dark': '#10321C', light: '#86EFAC' },
      },
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
      fontSize: {
        display: ['34px', { lineHeight: '40px' }],
        title: ['28px', { lineHeight: '34px' }],
        heading: ['22px', { lineHeight: '28px' }],
        subheading: ['18px', { lineHeight: '24px' }],
        body: ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
        label: ['13px', { lineHeight: '18px' }],
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
};
