/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind WHERE to look for class usage
  // It scans these files and removes unused classes in production
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Dark mode: 'class' means we toggle dark mode by adding class="dark" to <html>
  darkMode: 'class',

  // Touch screens keep :hover "stuck" after a tap. With this flag the
  // hover: variant only applies on devices that can really hover.
  future: {
    hoverOnlyWhenSupported: true,
  },

  theme: {
    extend: {
      // =============================================
      // Custom Color Palette — the "FIFA Career Manager" theme
      // =============================================
      colors: {
        // Dark navy surfaces (EA FC style)
        pitch: {
          950: '#04070d',   // deepest background / overlays
          900: '#070b14',   // main background
          850: '#0a101c',   // sheets, sidebar, nav bars
          800: '#0d1424',   // card surfaces
          750: '#111a2d',   // hovered cards
          700: '#17223a',   // borders / dividers
          600: '#1f2c48',   // raised controls / strong borders
          500: '#2b3a5c',   // focus rings / muted fills
          400: '#3d4f78',
          300: '#5a6b94',   // muted text on dark
        },
        // Electric green — primary accent (like FIFA UI)
        neon: {
          50:  '#e8fff5',
          100: '#c0ffe5',
          200: '#80ffc9',
          300: '#40ffad',
          400: '#00ff87',   // main neon green
          500: '#00d96e',
          600: '#00b359',
          700: '#008c45',
          800: '#006632',
          900: '#00401f',
        },
        // Secondary accent — electric blue (assists)
        electric: {
          300: '#5cdcff',
          400: '#00c8ff',
          500: '#0099cc',
          600: '#0077aa',
        },
        // Position group colors
        position: {
          gk:  '#f59e0b',   // Amber — goalkeepers
          def: '#3b82f6',   // Blue — defenders
          mid: '#10b981',   // Emerald — midfielders
          fwd: '#ef4444',   // Red — forwards
        },
      },

      // =============================================
      // Custom Font Family
      // =============================================
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      // Small captions used on dense mobile cards (11px)
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },

      // =============================================
      // Custom Animations
      // =============================================
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'dialog-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':   'fade-in 0.25s ease-out',
        'sheet-up':  'sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        'dialog-in': 'dialog-in 0.2s ease-out',
        'shimmer':   'shimmer 1.5s linear infinite',
      },

      // =============================================
      // Box Shadows — neon glow effects
      // =============================================
      boxShadow: {
        'neon-sm': '0 0 10px rgba(0, 255, 135, 0.25)',
        'neon':    '0 4px 20px rgba(0, 255, 135, 0.35)',
        'card':    '0 4px 24px rgba(0, 0, 0, 0.35)',
        'sheet':   '0 -12px 40px rgba(0, 0, 0, 0.5)',
      },

      // =============================================
      // Border radius
      // =============================================
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
