/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Design tokens (spec §13). Keep in sync with src/ui/theme.ts.
        primary: {
          DEFAULT: '#12161F', // novxanibeton.az theme-color (deep graphite)
          foreground: '#FFFFFF',
        },
        // TODO(nurlan): confirm accent colour (spec §22 Q11)
        accent: {
          DEFAULT: '#F5A623',
          foreground: '#12161F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F3F4F6',
          dark: '#1C2230',
        },
        ink: {
          DEFAULT: '#12161F',
          muted: '#6B7280',
          inverse: '#F9FAFB',
        },
        danger: '#DC2626',
        success: '#16A34A',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
