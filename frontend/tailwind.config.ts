import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        foreground: '#f1f5f9',
        void: '#07080c',
        surface: {
          DEFAULT: '#0f111a',
          muted: '#141824',
          subtle: '#1a1f2e',
          border: '#242a3d',
          accent: '#2f3750',
        },
        medusa: {
          red: '#ef4444',
          amber: '#f59e0b',
          green: '#10b981',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          slate: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'tactical': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)',
        'tactical-hover': '0 0 0 1px rgba(245, 158, 11, 0.4), 0 6px 16px rgba(0, 0, 0, 0.6)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.25)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
