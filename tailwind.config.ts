import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        body: ['var(--font-sans)'],
        headline: ['var(--font-sans)'],
      },
      colors: {
        // ShadCN/Radix compatibility (HSL tuples)
        border: 'hsl(var(--border-tw))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary-tw))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent-tw))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-tw-1))',
          '2': 'hsl(var(--chart-tw-2))',
          '3': 'hsl(var(--chart-tw-3))',
          '4': 'hsl(var(--chart-tw-4))',
          '5': 'hsl(var(--chart-tw-5))',
        },

        // Direct plan semantic tokens (CSS variable references)
        // Use as: bg-ws-bg, text-ws-text, border-ws-border, etc.
        ws: {
          bg: 'var(--bg)',
          'bg-elevated': 'var(--bg-elevated)',
          'bg-subtle': 'var(--bg-subtle)',
          'bg-sunken': 'var(--bg-sunken)',
          'bg-hover': 'var(--bg-hover)',
          border: 'var(--border)',
          'border-strong': 'var(--border-strong)',
          text: 'var(--text)',
          'text-muted': 'var(--text-muted)',
          'text-subtle': 'var(--text-subtle)',
          'text-on-primary': 'var(--text-on-primary)',
          primary: 'var(--primary)',
          'primary-hover': 'var(--primary-hover)',
          'primary-soft': 'var(--primary-soft)',
          'primary-strong': 'var(--primary-strong)',
          accent: 'var(--accent)',
          'accent-soft': 'var(--accent-soft)',
          error: 'var(--error)',
          'error-soft': 'var(--error-soft)',
          warning: 'var(--warning)',
          'warning-soft': 'var(--warning-soft)',
          recommendation: 'var(--recommendation)',
          'recommendation-soft': 'var(--recommendation-soft)',
          info: 'var(--info)',
          'info-soft': 'var(--info-soft)',
          success: 'var(--success)',
          'success-soft': 'var(--success-soft)',
          'canvas-bg': 'var(--canvas-bg)',
        },
      },
      borderRadius: {
        // Section 4.4
        sm: 'var(--radius-sm)',    // 6px — controls
        DEFAULT: 'var(--radius)',  // 10px — cards
        md: 'var(--radius)',       // 10px
        lg: 'var(--radius)',       // 10px — cards
        xl: 'var(--radius-lg)',    // 14px — dialogs
        '2xl': 'var(--radius-lg)',
        // Pill for badges/chips/progress
        full: '999px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
        focus: 'var(--focus-ring)',
      },
      fontSize: {
        // Section 4.3 type scale
        'hero': ['32px', { lineHeight: '1.25', fontWeight: '650', letterSpacing: '-0.02em' }],
        'h1':   ['26px', { lineHeight: '1.25', fontWeight: '650', letterSpacing: '-0.01em' }],
        'h2':   ['20px', { lineHeight: '1.25', fontWeight: '650', letterSpacing: '-0.01em' }],
        'h3':   ['16px', { lineHeight: '1.25', fontWeight: '650', letterSpacing: '-0.01em' }],
        'h4':   ['14px', { lineHeight: '1.25', fontWeight: '650', letterSpacing: '-0.01em' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'compact': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.5', fontWeight: '600' }],
        'hint':  ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'badge': ['11px', { lineHeight: '1', fontWeight: '650' }],
      },
      height: {
        'toolbar': '56px',
        'control': '34px',
        'control-sm': '28px',
        'badge': '20px',
        'progress': '8px',
      },
      width: {
        'nav-expanded': '232px',
        'nav-collapsed': '64px',
        'inspector': '420px',
        'inspector-sm': '340px',
        'config-panel': '380px',
      },
      zIndex: {
        'watermark': '10',
        'canvas-controls': '15',
        'canvas-overlay': '20',
        'menus': '30',
        'dialogs': '50',
        'toasts': '60',
        'skip-link': '100',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
        '250': '250ms',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'toast-in': 'toast-in 0.18s ease-out',
        'spin-slow': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
