/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        tablet: '1024px', // Tablet: 1024px-1279px - Requirement 8.1
        desktop: '1280px', // Desktop: 1280px+ - Requirement 8.1
      },
      colors: {
        // Brand Colors - Based on Sabaya Logo
        brand: {
          // Primary: Deep Burgundy/Maroon
          primary: {
            DEFAULT: '#560001',
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#560001', // Main brand color
            950: '#3d0001',
          },
          // Secondary: Warm Gold/Beige
          secondary: {
            DEFAULT: '#eacb95',
            50: '#fdfbf7',
            100: '#faf6ed',
            200: '#f5edd9',
            300: '#f0e3c5',
            400: '#eacb95', // Main brand color
            500: '#e5b97d',
            600: '#dfa765',
            700: '#d9954d',
            800: '#c07a35',
            900: '#a05f1d',
          },
          // Neutral: Off-White
          offwhite: {
            DEFAULT: '#fafaf9',
            50: '#ffffff',
            100: '#fafaf9', // Main brand color
            200: '#f5f5f4',
            300: '#e7e5e4',
            400: '#d6d3d1',
            500: '#a8a29e',
            600: '#78716c',
            700: '#57534e',
            800: '#44403c',
            900: '#292524',
          },
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      keyframes: {
        'slide-down': {
          '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translate(-50%, 0)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -100%)', opacity: '0' },
        },
      },
      animation: {
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
