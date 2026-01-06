/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Varela Round', 'sans-serif'],
        body: ['Nunito Sans', 'sans-serif'],
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#60A5FA',
        accent: '#8B5CF6',
        sage: '#90EE90',
        lavender: '#C8B6FF',
        cream: '#F5F5F0',
        'neumorphic-light': '#E8EEF5',
        'neumorphic-shadow': '#D1D9E6',
        'neumorphic-highlight': '#FFFFFF',
      },
      boxShadow: {
        'neumorphic': '6px 6px 12px #D1D9E6, -6px -6px 12px #FFFFFF',
        'neumorphic-inset': 'inset 4px 4px 8px #D1D9E6, inset -4px -4px 8px #FFFFFF',
        'neumorphic-soft': '4px 4px 8px #D1D9E6, -4px -4px 8px #FFFFFF',
        'neumorphic-hover': '8px 8px 16px #D1D9E6, -8px -8px 16px #FFFFFF',
      },
    },
  },
  plugins: [],
}