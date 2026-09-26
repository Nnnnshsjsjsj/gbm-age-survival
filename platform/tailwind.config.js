/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        'accent-soft': 'var(--accent-soft)',
        'on-accent': 'var(--on-accent)',
        warn: 'var(--warn)',
        'warn-bg': 'var(--warn-bg)',
        'warn-line': 'var(--warn-line)',
        fail: 'var(--fail)',
        'fail-bg': 'var(--fail-bg)',
        'fail-line': 'var(--fail-line)',
        ok: 'var(--ok)',
        g1: 'var(--g1)',
        g2: 'var(--g2)',
        g3: 'var(--g3)',
        g4: 'var(--g4)',
      },
      fontFamily: {
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { md: '8px', lg: '10px' },
    },
  },
  plugins: [],
};
