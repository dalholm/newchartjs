/**
 * NewChart Demo — Theme Selector
 * Floating UI with dark/light toggle + color palette presets.
 *
 * Token architecture:
 *   :root (set by applyTheme)
 *     ├── --primary, --primary-dk, --primary-lt, --primary-faint  ← derived from palette accent
 *     ├── --border-focus                                          ← palette accent
 *     ├── --nc-palette-1 … --nc-palette-10                        ← chart colors (cascade to all containers)
 *     └── dark-mode base tokens via <style> block
 *
 *   .chart-container
 *     └── inherits --nc-palette-* from :root (no per-element overrides needed)
 */
(function () {
  // ── Color utilities ───────────────────────────────────────────────────
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
  }

  function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

  /** Mix two hex colors. amount=0 → base, amount=1 → target */
  function mix(base, target, amount) {
    var b = hexToRgb(base), t = hexToRgb(target);
    return rgbToHex(
      b.r + (t.r - b.r) * amount,
      b.g + (t.g - b.g) * amount,
      b.b + (t.b - b.b) * amount
    );
  }

  // ── Dark-mode CSS overrides ──────────────────────────────────────────
  // Base dark tokens — palette-derived inline styles on :root override these
  var darkCSS = document.createElement('style');
  darkCSS.textContent = `
    html.dark { color-scheme: dark; }
    html.dark {
      --bg: #1a1c2e;
      --surface: #232538;
      --surface-alt: #1e2035;
      --border: #2e3150;
      --border-light: #282a42;
      --border-focus: #5c7cfa;
      --text: #e0e4ef;
      --text-sec: #a0a8c0;
      --text-muted: #6b7394;
      --text-faint: #4a5270;
      --primary: #5c7cfa;
      --primary-dk: #4c6ef5;
      --primary-lt: #1e2249;
      --primary-faint: #1a1f45;
      --success: #20c997;
      --success-dk: #0ca678;
      --success-lt: #0d2e23;
      --success-bg: #0b2a20;
      --warning: #fcc419;
      --warning-dk: #f08c00;
      --warning-lt: #2e2510;
      --danger: #ff6b6b;
      --danger-dk: #e03131;
      --danger-lt: #2e1215;
      --danger-bg: #2a1012;
    }

    /* Gallery cards (index.html) */
    html.dark .card-preview { background: var(--surface-alt) !important; }
    html.dark .card-tag.chart { background: var(--primary-faint); color: var(--primary); }
    html.dark .card-tag.demo  { background: var(--success-lt); color: var(--success); }
    html.dark .card-tag.new   { background: var(--warning-lt); color: var(--warning); }

    /* Example cards (all sub-pages) */
    html.dark .example-header { background: var(--surface-alt) !important; }
    html.dark .example-card   { background: var(--surface); border-color: var(--border); }

    /* Data tables */
    html.dark .data-table th       { background: var(--surface-alt) !important; color: var(--text-muted); border-bottom-color: var(--border); }
    html.dark .data-table td       { border-bottom-color: var(--border-light); color: var(--text); }
    html.dark .data-table td.name  { color: var(--text); }
    html.dark .data-table td.right { color: var(--text-sec); }
    html.dark .data-table tr:hover { background: var(--primary-lt) !important; }

    /* Badges */
    html.dark .badge.up   { color: var(--success); background: var(--success-lt); }
    html.dark .badge.down { color: var(--danger); background: var(--danger-lt); }

    /* KPI cards */
    html.dark .kpi-card        { background: var(--surface); border-color: var(--border); }
    html.dark .kpi-value       { color: var(--text); }
    html.dark .kpi-label       { color: var(--text-muted); }
    html.dark .kpi-change.up   { color: var(--success); }
    html.dark .kpi-change.down { color: var(--danger); }

    /* Sparkline demo borders */
    html.dark .spark-demo          { border-color: var(--border-light) !important; background: var(--surface); }
    html.dark .variant-item .label { color: var(--text-muted); }

    /* Code blocks */
    html.dark .example-body code { background: var(--surface-alt); color: var(--text); }

    /* Buttons */
    html.dark .btn           { background: var(--surface); border-color: var(--border); color: var(--text); }
    html.dark .btn:hover     { background: var(--surface-alt); border-color: var(--text-muted); }
    html.dark .btn.green     { color: var(--success); }

    /* Code hint */
    html.dark .code-hint { background: var(--surface-alt) !important; color: var(--text-sec); border-color: var(--border); }

    /* Dashboard tooltip */
    html.dark .chart-tooltip { background: var(--surface-alt); color: var(--text); }

    /* Index page inline gradient previews */
    html.dark .card-preview[style*="linear-gradient"] { filter: brightness(0.5) saturate(0.7); }

    /* Chart containers — NC token defaults for dark */
    html.dark .chart-container {
      --nc-background: var(--surface);
      --nc-font-color: var(--text);
      --nc-grid-color: var(--border);
      --nc-axis-color: var(--text-muted);
      --nc-tooltip-background: var(--bg);
      --nc-tooltip-color: var(--text);
      --nc-tooltip-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
  `;
  document.head.appendChild(darkCSS);

  // ── Palette presets ──────────────────────────────────────────────────
  var PALETTES = {
    default: {
      label: 'Default',
      light: null,
      dark: null
    },
    ocean: {
      label: 'Ocean',
      light: ['#0077b6','#00b4d8','#0096c7','#48cae4','#023e8a','#0a9396','#005f73','#94d2bd','#468faf','#2c7da0'],
      dark:  ['#48cae4','#00b4d8','#90e0ef','#0096c7','#468faf','#0a9396','#94d2bd','#76c893','#5390d9','#80b4e0']
    },
    sunset: {
      label: 'Sunset',
      light: ['#e63946','#f4a261','#e76f51','#2a9d8f','#264653','#a8dadc','#d4a373','#e9c46a','#606c38','#bc6c25'],
      dark:  ['#ff6b6b','#ffa94d','#ff8a65','#4fd1c5','#81e6d9','#90cdf4','#f6ad55','#fbd38d','#a3be8c','#dda15e']
    },
    forest: {
      label: 'Forest',
      light: ['#2d6a4f','#40916c','#52b788','#74c69d','#95d5b2','#8b6914','#d4a373','#a68a64','#344e41','#588157'],
      dark:  ['#52b788','#74c69d','#95d5b2','#b7e4c7','#40916c','#f6ad55','#dda15e','#c9b384','#588157','#6baa75']
    },
    corporate: {
      label: 'Corporate',
      light: ['#1e3a5f','#4a90d9','#7fb3e0','#2c5f2d','#97d098','#5c5c5c','#a0a0a0','#d4a843','#8b5e3c','#3d3d6b'],
      dark:  ['#5ba3e6','#7fb3e0','#a8d0f0','#6bc96d','#97d098','#8c8c8c','#b8b8b8','#f0c75e','#c9926b','#7a7ab8']
    },
    candy: {
      label: 'Candy',
      light: ['#e84393','#6c5ce7','#00cec9','#fdcb6e','#e17055','#0984e3','#00b894','#fd79a8','#a29bfe','#ffeaa7'],
      dark:  ['#fd79a8','#a29bfe','#55efc4','#ffeaa7','#fab1a0','#74b9ff','#55efc4','#ff7675','#b8a9fe','#fff1b0']
    },
    mono: {
      label: 'Mono',
      light: ['#212529','#495057','#6c757d','#868e96','#adb5bd','#ced4da','#343a40','#5a6370','#798490','#a1aab4'],
      dark:  ['#e9ecef','#ced4da','#adb5bd','#868e96','#6c757d','#495057','#dee2e6','#b0b8c2','#8c95a0','#6d767e']
    }
  };

  // UI tokens derived from palette accent color
  var UI_TOKENS = ['--primary', '--primary-dk', '--primary-lt', '--primary-faint', '--border-focus'];
  var PALETTE_SIZE = 10;

  // ── State ────────────────────────────────────────────────────────────
  var state = loadState();

  function loadState() {
    try {
      var saved = localStorage.getItem('newchart-theme-state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { dark: false, palette: 'default' };
  }

  function saveState() {
    try {
      localStorage.setItem('newchart-theme-state', JSON.stringify(state));
    } catch (e) {}
  }

  // ── Theme application ────────────────────────────────────────────────
  function applyTheme() {
    var root = document.documentElement;

    // Toggle dark class
    root.classList.toggle('dark', state.dark);

    var palette = PALETTES[state.palette];
    var colors = palette ? (state.dark ? palette.dark : palette.light) : null;

    // Clear previous tokens from :root inline styles
    var i;
    for (i = 1; i <= PALETTE_SIZE; i++) {
      root.style.removeProperty('--nc-palette-' + i);
    }
    UI_TOKENS.forEach(function (t) { root.style.removeProperty(t); });

    if (colors) {
      // Set chart palette tokens on :root — cascades to all chart containers
      colors.forEach(function (c, idx) {
        root.style.setProperty('--nc-palette-' + (idx + 1), c);
      });

      // Derive UI accent tokens from primary palette color
      var accent = colors[0];
      var bgTarget = state.dark ? '#1a1c2e' : '#ffffff';

      root.style.setProperty('--primary', accent);
      root.style.setProperty('--primary-dk', mix(accent, '#000000', 0.2));
      root.style.setProperty('--primary-lt', mix(accent, bgTarget, state.dark ? 0.85 : 0.9));
      root.style.setProperty('--primary-faint', mix(accent, bgTarget, state.dark ? 0.92 : 0.95));
      root.style.setProperty('--border-focus', accent);
    }

    updateUI();
    saveState();
  }

  // ── UI ───────────────────────────────────────────────────────────────
  var panel, toggleBtn;

  function createUI() {
    var css = document.createElement('style');
    css.textContent = `
      .nc-theme-toggle {
        position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        width: 44px; height: 44px; border-radius: 12px;
        background: var(--surface, #fff); border: 1px solid var(--border, #dfe1e6);
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; font-size: 20px; line-height: 1;
      }
      .nc-theme-toggle:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }

      .nc-theme-panel {
        position: fixed; bottom: 72px; right: 20px; z-index: 9999;
        width: 240px; background: var(--surface, #fff);
        border: 1px solid var(--border, #dfe1e6); border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        padding: 16px; font-family: var(--font, Inter, sans-serif);
        transform: translateY(8px); opacity: 0; pointer-events: none;
        transition: all 0.2s ease;
      }
      .nc-theme-panel.open { transform: translateY(0); opacity: 1; pointer-events: auto; }

      .nc-theme-panel h3 {
        font-size: 11px; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.6px; color: var(--text-muted, #8993a4);
        margin: 0 0 10px 0;
      }

      .nc-mode-row { display: flex; gap: 6px; margin-bottom: 14px; }
      .nc-mode-btn {
        flex: 1; padding: 7px 0; border-radius: 8px; border: 1px solid var(--border, #dfe1e6);
        background: transparent; color: var(--text-sec, #5e6c84);
        font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;
        font-family: inherit;
      }
      .nc-mode-btn:hover { border-color: var(--primary, #4c6ef5); color: var(--text, #172b4d); }
      .nc-mode-btn.active {
        background: var(--primary, #4c6ef5); color: #fff;
        border-color: var(--primary, #4c6ef5);
      }

      .nc-palette-grid { display: flex; flex-direction: column; gap: 6px; }
      .nc-palette-item {
        display: flex; align-items: center; gap: 10px; padding: 6px 8px;
        border-radius: 8px; border: 1.5px solid transparent;
        cursor: pointer; transition: all 0.15s;
      }
      .nc-palette-item:hover { background: var(--primary-lt, #edf2ff); }
      .nc-palette-item.active { border-color: var(--primary, #4c6ef5); background: var(--primary-lt, #edf2ff); }
      .nc-palette-dots { display: flex; gap: 3px; }
      .nc-palette-dot {
        width: 14px; height: 14px; border-radius: 50%;
        border: 1.5px solid rgba(0,0,0,0.08);
      }
      html.dark .nc-palette-dot { border-color: rgba(255,255,255,0.1); }
      .nc-palette-label {
        font-size: 12px; font-weight: 500; color: var(--text, #172b4d);
      }
    `;
    document.head.appendChild(css);

    // Toggle button
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'nc-theme-toggle';
    toggleBtn.title = 'Theme settings';
    toggleBtn.setAttribute('aria-label', 'Toggle theme panel');
    document.body.appendChild(toggleBtn);

    // Panel
    panel = document.createElement('div');
    panel.className = 'nc-theme-panel';
    panel.innerHTML = buildPanelHTML();
    document.body.appendChild(panel);

    // Events
    toggleBtn.addEventListener('click', function () {
      panel.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && !toggleBtn.contains(e.target)) {
        panel.classList.remove('open');
      }
    });

    panel.querySelector('[data-mode="light"]').addEventListener('click', function () {
      state.dark = false; applyTheme();
    });
    panel.querySelector('[data-mode="dark"]').addEventListener('click', function () {
      state.dark = true; applyTheme();
    });

    Object.keys(PALETTES).forEach(function (key) {
      var item = panel.querySelector('[data-palette="' + key + '"]');
      if (item) {
        item.addEventListener('click', function () {
          state.palette = key; applyTheme();
        });
      }
    });
  }

  function buildPanelHTML() {
    var html = '<h3>Mode</h3>';
    html += '<div class="nc-mode-row">';
    html += '<button class="nc-mode-btn" data-mode="light">&#9788; Light</button>';
    html += '<button class="nc-mode-btn" data-mode="dark">&#9790; Dark</button>';
    html += '</div>';

    html += '<h3>Palette</h3>';
    html += '<div class="nc-palette-grid">';

    Object.keys(PALETTES).forEach(function (key) {
      var p = PALETTES[key];
      var colors = p.light || ['#4c6ef5','#0ca678','#f08c00','#e03131','#7048e8'];
      html += '<div class="nc-palette-item" data-palette="' + key + '">';
      html += '<div class="nc-palette-dots">';
      for (var i = 0; i < Math.min(5, colors.length); i++) {
        html += '<div class="nc-palette-dot" style="background:' + colors[i] + '"></div>';
      }
      html += '</div>';
      html += '<span class="nc-palette-label">' + p.label + '</span>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  function updateUI() {
    if (!toggleBtn || !panel) return;

    toggleBtn.textContent = state.dark ? '\u{1F319}' : '\u{2600}\uFE0F';

    var lightBtn = panel.querySelector('[data-mode="light"]');
    var darkBtn = panel.querySelector('[data-mode="dark"]');
    lightBtn.classList.toggle('active', !state.dark);
    darkBtn.classList.toggle('active', state.dark);

    panel.querySelectorAll('.nc-palette-item').forEach(function (item) {
      var key = item.getAttribute('data-palette');
      item.classList.toggle('active', key === state.palette);

      var p = PALETTES[key];
      var colors = (state.dark ? p.dark : p.light) || ['#4c6ef5','#0ca678','#f08c00','#e03131','#7048e8'];
      var dots = item.querySelectorAll('.nc-palette-dot');
      dots.forEach(function (dot, i) {
        if (colors[i]) dot.style.background = colors[i];
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────

  var params = new URLSearchParams(window.location.search);
  if (params.get('theme') === 'dark') {
    state.dark = true;
  } else if (params.get('theme') === 'light') {
    state.dark = false;
  }

  // Apply dark class immediately to avoid flash
  document.documentElement.classList.toggle('dark', state.dark);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      createUI();
      applyTheme();
    });
  } else {
    createUI();
    applyTheme();
  }

  // Listen for theme changes from VitePress parent
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'newchart-theme') {
      state.dark = e.data.dark;
      applyTheme();
    }
  });

  // Re-apply when new .chart-container elements appear (SPA navigation)
  if (typeof MutationObserver !== 'undefined') {
    var chartObserver = new MutationObserver(function (mutations) {
      var needsApply = false;
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) {
            if (n.classList && n.classList.contains('chart-container')) needsApply = true;
            if (n.querySelector && n.querySelector('.chart-container')) needsApply = true;
          }
        });
      });
      if (needsApply) applyTheme();
    });
    chartObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
