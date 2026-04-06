/**
 * Gallery view — home page with card grid
 */

export default function galleryView() {
  return {
    title: 'Demo Gallery',
    pageClass: '',
    style: `
      .page { max-width: 960px; padding: 40px 20px; }
      .hero { text-align: center; margin-bottom: 40px; }
      .hero-logo { width: 48px; height: 48px; border-radius: 12px; background: var(--primary);
        display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
      .hero h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
      .hero p { font-size: 14px; color: var(--text-sec); max-width: 520px; margin: 0 auto; line-height: 1.6; }
      .hero .version { display: inline-block; margin-top: 10px; font-size: 11px; font-family: var(--mono);
        color: var(--text-muted); background: var(--surface); border: 1px solid var(--border);
        border-radius: 4px; padding: 2px 8px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
        overflow: hidden; transition: all 0.15s; text-decoration: none; color: inherit; display: flex; flex-direction: column; }
      .card:hover { border-color: var(--primary); box-shadow: 0 4px 16px rgba(76,110,245,0.1); transform: translateY(-2px); }
      .card-preview { height: 140px; background: var(--surface-alt); display: flex; align-items: center; justify-content: center;
        border-bottom: 1px solid var(--border-light); overflow: hidden; padding: 16px; }
      .card-body { padding: 16px; flex: 1; }
      .card-body h2 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      .card-body p { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
      .card-tag { display: inline-block; font-size: 10px; font-weight: 600; font-family: var(--mono);
        padding: 2px 6px; border-radius: 3px; margin-top: 8px; }
      .card-tag.chart { background: var(--primary-lt); color: var(--primary-dk); }
      .card-tag.demo { background: var(--success-lt); color: var(--success-dk); }
      .card-tag.new { background: var(--warning-lt); color: var(--warning); }
      .preview-bars { display: flex; align-items: flex-end; gap: 4px; height: 60px; }
      .preview-bars div { width: 16px; border-radius: 3px 3px 0 0; }
      .section { margin-top: 32px; margin-bottom: 16px; }
      .section h2 { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
      .footer { margin-top: 48px; text-align: center; font-size: 11px; color: var(--text-faint); }
    `,
    html: `
      <div class="hero">
        <div class="hero-logo">
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="7" width="3.5" height="8" rx="1" fill="#fff"/>
            <rect x="6.25" y="3" width="3.5" height="12" rx="1" fill="#fff"/>
            <rect x="11.5" y="1" width="3.5" height="14" rx="1" fill="#fff"/>
          </svg>
        </div>
        <h1>NewChart JS</h1>
        <p>Zero-dependency charting library built for professional business applications.
          Explore chart types, ERP patterns, and interactive examples below.</p>
        <span class="version">v0.1.0</span>
      </div>

      <div class="section"><h2>Chart Types</h2></div>
      <div class="grid">
        ${card('/bar', 'Bar Chart', 'Vertical/horizontal bars, grouped, stacked, and 100% stacked.', 'chart', '5 examples', barsPreview())}
        ${card('/line', 'Line Chart', 'Trend lines, multi-series, comparisons with dashed lines, crosshair.', 'chart', '5 examples', linePreview())}
        ${card('/area', 'Area Chart', 'Gradient-filled areas for cash flow, inventory, and stacked distributions.', 'chart new', '5 examples', areaPreview())}
        ${card('/pie', 'Pie & Donut', 'Distribution charts with hover-explode, center text, and label modes.', 'chart', '5 examples', donutPreview())}
        ${card('/gauge', 'Gauge', 'KPI gauges: arc, ring, linear, compact. Threshold zones, needle, targets.', 'chart new', '14 examples', gaugePreview())}
        ${card('/sparkline', 'Sparkline', 'Compact inline charts for KPI cards and table cells.', 'chart new', '5 examples', '')}
        ${card('/combo', 'Combo Chart', 'Mix bars and lines on shared axes — revenue vs. margin.', 'chart new', '5 examples', '')}
        ${card('/scatter', 'Scatter & Bubble', 'Correlation analysis, risk/reward matrices, bubble sizing.', 'chart new', '5 examples', '')}
        ${card('/kpicard', 'KPI Card', 'Config-driven KPI cards with value, trend sparkline, change badge.', 'chart new', '7 examples', '')}
      </div>

      <div class="section"><h2>Full Demos</h2></div>
      <div class="grid">
        ${card('/dashboard', 'ERP Dashboard', 'Complete sales dashboard with KPI cards, drill-down, table, CSV export.', 'demo', 'Full demo', '')}
      </div>

      <div class="footer">NewChart JS v0.1.0 &mdash; Zero-dependency charting for professional applications</div>
    `
  };
}

function card(href, title, desc, tagType, tagText, preview) {
  const tags = tagType.split(' ').map(t =>
    `<span class="card-tag ${t}">${t === 'new' ? 'NEW' : tagText}</span>`
  ).join(' ');
  // If tagType includes 'new', put the count first
  const tagHtml = tagType.includes('new')
    ? `<span class="card-tag ${tagType.split(' ')[0]}">${tagText}</span> <span class="card-tag new">NEW</span>`
    : `<span class="card-tag ${tagType}">${tagText}</span>`;

  return `
    <a href="${href}" class="card">
      <div class="card-preview">${preview}</div>
      <div class="card-body">
        <h2>${title}</h2>
        <p>${desc}</p>
        ${tagHtml}
      </div>
    </a>`;
}

function barsPreview() {
  const heights = [35,50,40,58,45,55,60];
  return `<div class="preview-bars">${heights.map(h =>
    `<div style="height:${h}px; background:var(--primary);"></div>`
  ).join('')}</div>`;
}

function linePreview() {
  return `<div style="width:120px;height:50px;">
    <svg viewBox="0 0 120 50" fill="none" style="width:100%;height:100%">
      <polyline points="5,40 20,28 40,32 55,18 70,22 85,12 100,16 115,8" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <polyline points="5,42 20,38 40,40 55,34 70,36 85,30 100,32 115,26" stroke="var(--text-faint)" stroke-width="1.5" stroke-dasharray="4 3" stroke-linecap="round" fill="none"/>
    </svg>
  </div>`;
}

function areaPreview() {
  return `<div style="width:120px;height:50px;">
    <svg viewBox="0 0 120 50" fill="none" style="width:100%;height:100%">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.02"/>
      </linearGradient></defs>
      <path d="M5,38 Q30,20 60,22 Q90,24 115,10 L115,48 L5,48 Z" fill="url(#ag)"/>
      <path d="M5,38 Q30,20 60,22 Q90,24 115,10" stroke="var(--primary)" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>
  </div>`;
}

function donutPreview() {
  return `<svg viewBox="0 0 70 70" width="70" height="70">
    <circle cx="35" cy="35" r="28" fill="none" stroke="var(--primary-lt)" stroke-width="10"/>
    <circle cx="35" cy="35" r="28" fill="none" stroke="var(--primary)" stroke-width="10" stroke-dasharray="110 66" transform="rotate(-90 35 35)"/>
    <circle cx="35" cy="35" r="28" fill="none" stroke="var(--success)" stroke-width="10" stroke-dasharray="40 136" stroke-dashoffset="-110" transform="rotate(-90 35 35)"/>
    <circle cx="35" cy="35" r="28" fill="none" stroke="var(--warning)" stroke-width="10" stroke-dasharray="26 150" stroke-dashoffset="-150" transform="rotate(-90 35 35)"/>
  </svg>`;
}

function gaugePreview() {
  return `<svg viewBox="0 0 80 55" width="80" height="55">
    <path d="M10,48 A30,30 0 1,1 70,48" fill="none" stroke="var(--border)" stroke-width="8" stroke-linecap="round"/>
    <path d="M10,48 A30,30 0 0,1 28,16" fill="none" stroke="var(--danger)" stroke-width="8" stroke-linecap="round"/>
    <path d="M28,16 A30,30 0 0,1 52,16" fill="none" stroke="var(--warning)" stroke-width="8" stroke-linecap="round"/>
    <path d="M52,16 A30,30 0 0,1 62,33" fill="none" stroke="var(--success)" stroke-width="8" stroke-linecap="round"/>
    <text x="40" y="45" text-anchor="middle" font-size="11" font-weight="700" font-family="var(--mono)" fill="var(--text)">78%</text>
  </svg>`;
}
