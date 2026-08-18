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

  theme: {
    extend: {
      // =============================================
      // Custom Color Palette — the "FIFA Career Manager" theme
      // =============================================
      colors: {
        // Dark backgrounds
        pitch: {
          950: '#050508',   // deepest background
          900: '#0a0a0f',   // main background
          850: '#0d0d14',   // slightly lighter
          800: '#111118',   // card surfaces
          750: '#14141d',
          700: '#18182a',   // card borders / dark UI elements
          600: '#1e1e30',   // slightly lighter border / hover states
          500: '#2a2a42',   // medium surface / ring focus
          400: '#3a3a58',   // lighter surface
          300: '#4a4a6a',   // text on dark
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
        // Secondary accent — electric blue
        electric: {
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
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // =============================================
      // Custom Animations
      // =============================================
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0, 255, 135, 0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(0, 255, 135, 0.7)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
      },

      // =============================================
      // Box Shadows — neon glow effects
      // =============================================
      boxShadow: {
        'neon-sm': '0 0 8px rgba(0, 255, 135, 0.3)',
        'neon':    '0 0 15px rgba(0, 255, 135, 0.4)',
        'neon-lg': '0 0 30px rgba(0, 255, 135, 0.5)',
        'card':    '0 4px 24px rgba(0, 0, 0, 0.6)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.8)',
      },

      // =============================================
      // Border radius
      // =============================================
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },

      // =============================================
      // Background gradients
      // =============================================
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'neon-gradient': 'linear-gradient(135deg, #00ff87, #00c8ff)',
        'pitch-gradient': 'linear-gradient(180deg, #0a1a0a 0%, #0a0a0f 100%)',
      },
    },
  },
  plugins: [],
}
