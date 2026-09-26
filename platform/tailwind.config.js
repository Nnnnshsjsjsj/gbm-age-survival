/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)', card: 'var(--card)', tint: 'var(--tint)', tint2: 'var(--tint2)',
        line: 'var(--line)', 'line-strong': 'var(--line-strong)',
        ink: 'var(--ink)', muted: 'var(--muted)', dim: 'var(--dim)',
        accent: 'var(--accent)', 'accent-hover': 'var(--accent-hover)', 'accent-text': 'var(--accent-text)',
        'accent-soft': 'var(--accent-soft)', 'on-accent': 'var(--on-accent)',
        brand: 'var(--brand)', warm: 'var(--warm)', 'warm-soft': 'var(--warm-soft)',
        red: 'var(--red)', 'red-soft': 'var(--red-soft)', gold: 'var(--gold)', 'gold-soft': 'var(--gold-soft)',
        blue: 'var(--blue)', 'blue-soft': 'var(--blue-soft)',
        g1: 'var(--g1)', g2: 'var(--g2)', g3: 'var(--g3)', g4: 'var(--g4)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: { sm: '8px', DEFAULT: '12px', md: '12px', lg: '16px', pill: '999px' },
      maxWidth: { shell: '1228px' },
    },
  },
  plugins: [],
};
