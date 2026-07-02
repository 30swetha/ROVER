import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        primary: { DEFAULT: '#FF6B00', foreground: '#ffffff' },
        background: '#0A0A0A',
        foreground: '#ffffff',
        surface: '#141414',
        card: { DEFAULT: 'rgba(255,255,255,0.05)', foreground: '#ffffff' },
        muted: { DEFAULT: '#1A1A1A', foreground: '#9B9B9B' },
        border: 'rgba(255,107,0,0.2)',
        input: '#1A1A1A',
        ring: '#FF6B00',
        destructive: { DEFAULT: '#EF4444', foreground: '#ffffff' },
        success: '#22C55E',
        warning: '#F59E0B',
        gold: '#F6C90E',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
      },
      borderRadius: { lg: '0.75rem', md: '0.5rem', sm: '0.375rem' },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
