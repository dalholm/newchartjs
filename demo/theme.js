/**
 * NewChart Demo — Dark/Light theme bridge
 * Listens for postMessage from VitePress parent and toggles dark class on <html>.
 * Also reads initial theme from URL param ?theme=dark.
 */
(function () {
  // Dark mode overrides — applied via html.dark
  var style = document.createElement('style');
  style.textContent = [
    'html.dark { color-scheme: dark; }',
    'html.dark :root {',
    '  --bg: #1a1c2e;',
    '  --surface: #232538;',
    '  --surface-alt: #1e2035;',
    '  --border: #2e3150;',
    '  --border-light: #282a42;',
    '  --border-focus: #5c7cfa;',
    '  --text: #e0e4ef;',
    '  --text-sec: #a0a8c0;',
    '  --text-muted: #6b7394;',
    '  --text-faint: #4a5270;',
    '  --primary: #5c7cfa;',
    '  --primary-dk: #4c6ef5;',
    '  --primary-lt: #1e2249;',
    '  --primary-faint: #1a1f45;',
    '  --success: #20c997;',
    '  --success-dk: #0ca678;',
    '  --success-lt: #0d2e23;',
    '  --success-bg: #0b2a20;',
    '  --warning: #fcc419;',
    '  --warning-dk: #f08c00;',
    '  --warning-lt: #2e2510;',
    '  --danger: #ff6b6b;',
    '  --danger-dk: #e03131;',
    '  --danger-lt: #2e1215;',
    '  --danger-bg: #2a1012;',
    '}',
    // Override hardcoded backgrounds in demo pages
    'html.dark .example-header { background: var(--surface-alt, #1e2035) !important; }',
    'html.dark .card-preview { background: var(--surface-alt, #1e2035) !important; }',
    'html.dark .card-tag.chart { background: #1e2249; color: #5c7cfa; }',
    'html.dark .card-tag.demo { background: #0d2e23; color: #20c997; }',
    'html.dark .card-tag.new { background: #2e2510; color: #fcc419; }',
    // NewChart CSS tokens for chart dark mode
    'html.dark .chart-container {',
    '  --nc-background: #232538;',
    '  --nc-font-color: #e0e4ef;',
    '  --nc-grid-color: #2e3150;',
    '  --nc-axis-color: #6b7394;',
    '  --nc-tooltip-background: #1a1c2e;',
    '  --nc-tooltip-color: #e0e4ef;',
    '  --nc-tooltip-shadow: 0 8px 24px rgba(0,0,0,0.5);',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  function setTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
  }

  // Read initial theme from URL param or parent
  var params = new URLSearchParams(window.location.search);
  if (params.get('theme') === 'dark') {
    setTheme(true);
  }

  // Listen for theme changes from VitePress parent
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'newchart-theme') {
      setTheme(e.data.dark);
    }
  });
})();
