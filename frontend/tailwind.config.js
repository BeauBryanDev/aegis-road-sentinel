/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Aegis Road Sentinel — gold/amber HUD on black  
        cyber: {
          bg: '#05060a',  // background
          panel: '#0c0f16',  
          'panel-2': '#11151f',  
          border: '#2a2410', 
          // amber/gold accent scale (primary brand color)
          gold: '#ffc01e', // main accent (borders, headings, bbox, bars)
          'gold-bright': '#ffe27a', // highlights / hover glow
          'gold-dim': '#9a7b18',  
          green: '#3bd16f', // success / authorized
          red: '#ff3b3b', // alert / not-authorized
          text: '#e8d9a8', // body text (warm off-white)
          muted: '#7a6f4d', // secondary text
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['Orbitron', '"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 12px -2px rgba(255, 192, 30, 0.45)',
        'gold-inset': 'inset 0 0 0 1px rgba(255, 192, 30, 0.18)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.8' },
          '100%': { transform: 'translateY(2000%)', opacity: '0' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'bar-grow': {
          from: { width: '0%' },
        },
      },
      animation: {
        scan: 'scan 3.2s linear infinite',
        flicker: 'flicker 2s ease-in-out infinite',
        'bar-grow': 'bar-grow 0.9s ease-out',
      },
    },
  },
  plugins: [],
}
