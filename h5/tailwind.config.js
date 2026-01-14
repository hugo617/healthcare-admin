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
        heading: ['var(--font-varela-round)', 'sans-serif'],
        body: ['var(--font-nunito-sans)', 'sans-serif'],
        sans: ['var(--font-nunito-sans)', 'sans-serif'],
      },
      colors: {
        // 健康主题 - 翡翠绿配色
        primary: '#10B981',
        secondary: '#34D399',
        accent: '#F59E0B',
        sage: '#6EE7B7',
        'sage-light': '#A7F3D0',
        'health-bg': '#F0FDF4',
        'health-text': '#064E3B',
        // 保留兼容的颜色
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