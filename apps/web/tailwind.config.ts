import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f8faf7',
        ink: '#163126',
        accent: '#39b54a',
        brand: '#39b54a',
        'brand-light': '#8cc63f',
        'brand-lime': '#b9e021',
        'brand-dark': '#00654a',
        'brand-muted': '#3fa535',
        surface: '#f8faf7',
        'surface-card': '#ffffff',
        'surface-border': '#e5eddf',
        'surface-muted': '#eff5eb'
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,101,74,0.08), 0 1px 2px -1px rgba(0,101,74,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,101,74,0.12), 0 2px 4px -1px rgba(0,101,74,0.08)'
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem'
      }
    }
  },
  plugins: []
};

export default config;
