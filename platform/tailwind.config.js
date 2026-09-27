/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // legacy names kept so existing utility classes keep working on the new tokens
        paper: 'var(--bg)', card: 'var(--elev)', tint: 'var(--surface-2)', tint2: 'var(--surface-3)',
        bg: 'var(--bg)', surface: 'var(--surface)', 'surface-2': 'var(--surface-2)', elev: 'var(--elev)',
        line: 'var(--line)', 'line-strong': 'var(--line-strong)',
        ink: 'var(--ink)', muted: 'var(--muted)', dim: 'var(--dim)', faint: 'var(--faint)',
        accent: 'var(--accent)', 'accent-hover': 'var(--accent)', 'accent-text': 'var(--accent-ink)', 'accent-ink': 'var(--accent-ink)',
        'accent-soft': 'var(--accent-soft)', 'on-accent': 'var(--on-accent)',
        brand: 'var(--green)', warm: 'var(--warm)', 'warm-soft': 'var(--warm-soft)',
        red: 'var(--red)', 'red-soft': 'var(--red-soft)', gold: 'var(--gold)', 'gold-soft': 'var(--gold-soft)',
        blue: 'var(--blue)', 'blue-soft': 'var(--blue-soft)',
        g1: 'var(--g1)', g2: 'var(--g2)', g3: 'var(--g3)', g4: 'var(--g4)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: { sm: '8px', DEFAULT: '10px', md: '10px', lg: '14px', xl: '20px', pill: '999px' },
      maxWidth: { shell: '1228px' },
    },
  },
  plugins: [],
};
