/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Category gradient classes for PROFESSIONALS
    'from-purple-500', 'via-violet-500', 'to-indigo-600',
    'from-purple-100', 'via-violet-100', 'to-indigo-100', 
    'from-purple-600', 'via-violet-600', 'to-indigo-700',
    'from-indigo-500', 'to-purple-600',
    'from-purple-400/30', 'via-violet-400/30', 'to-indigo-400/30',
    'from-purple-500', 'via-violet-600', 'to-indigo-600',
    'from-sky-400', 'to-blue-600',
    'purple-50', 'purple-600', 'purple-900',
    
    // Category gradient classes for COMPANIES  
    'from-emerald-500', 'via-teal-500', 'to-cyan-600',
    'from-emerald-100', 'via-teal-100', 'to-cyan-100',
    'from-emerald-600', 'via-teal-600', 'to-cyan-700', 
    'from-teal-500', 'to-emerald-600',
    'from-emerald-400/30', 'via-teal-400/30', 'to-cyan-400/30',
    'from-emerald-500', 'via-teal-600', 'to-cyan-600',
    'from-emerald-400', 'to-green-600',
    'emerald-50', 'emerald-600', 'emerald-900',
    
    // Category gradient classes for PLACES
    'from-rose-500', 'via-pink-500', 'to-red-600',
    'from-rose-100', 'via-pink-100', 'to-red-100',
    'from-rose-600', 'via-pink-600', 'to-red-700',
    'from-pink-500', 'to-rose-600', 
    'from-rose-400/30', 'via-pink-400/30', 'to-red-400/30',
    'from-rose-500', 'via-pink-600', 'to-red-600',
    'from-rose-400', 'to-red-500',
    'rose-50', 'rose-600', 'rose-900',
    
    // Category gradient classes for PRODUCTS
    'from-amber-500', 'via-orange-500', 'to-yellow-600',
    'from-amber-100', 'via-orange-100', 'to-yellow-100',
    'from-amber-600', 'via-orange-600', 'to-yellow-700',
    'from-orange-500', 'to-amber-600',
    'from-amber-400/30', 'via-orange-400/30', 'to-yellow-400/30', 
    'from-amber-500', 'via-orange-600', 'to-yellow-600',
    'from-orange-400', 'to-yellow-500',
    'amber-50', 'amber-600', 'amber-900',
    
    // Background patterns
    'bg-gradient-to-br', 'bg-gradient-to-r', 'bg-gradient-to-tr',
    
    // Ring and border colors
    'ring-purple-600/30', 'ring-emerald-600/30', 'ring-rose-600/30', 'ring-amber-600/30',
    'border-purple-600', 'border-emerald-600', 'border-rose-600', 'border-amber-600',
    
    // Additional utility gradients
    'from-indigo-500', 'to-purple-600', 'from-teal-500', 'to-cyan-600',
    'from-pink-500', 'to-rose-600', 'from-cyan-500', 'to-blue-600',
    'from-violet-500', 'to-fuchsia-600', 'from-fuchsia-500', 'to-pink-600',
    'from-green-500', 'to-emerald-600', 'from-gray-400', 'to-gray-600'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ReviewInn Brand Colors - Elegant Purple & Coral Palette
        primary: {
          50: '#faf7ff',
          100: '#f3ebff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
