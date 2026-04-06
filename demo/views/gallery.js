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
        ${card('/sparkline', 'Sparkline', 'Compact inline charts for KPI cards and table cells.', 'chart new', '5 examples', sparkPreview())}
        ${card('/combo', 'Combo Chart', 'Mix bars and lines on shared axes — revenue vs. margin.', 'chart new', '5 examples', comboPreview())}
        ${card('/scatter', 'Scatter & Bubble', 'Correlation analysis, risk/reward matrices, bubble sizing.', 'chart new', '5 examples', scatterPreview())}
        ${card('/kpicard', 'KPI Card', 'Config-driven KPI cards with value, trend sparkline, change badge.', 'chart new', '7 examples', kpiPreview())}
        ${card('/trendbadge', 'TrendBadge', 'Inline trend indicators with change chip, value formatting, and sparkline.', 'chart new', '7 examples', trendbadgePreview())}
        ${card('/networkball', 'AI Network Ball', 'Circular node network with a traveling AI cursor. Visualize processing and connections.', 'chart new', '4 examples', networkballPreview())}
      </div>

      <div class="section"><h2>E-Commerce & Insights</h2></div>
      <div class="grid">
        ${card('/funnel', 'Funnel Chart', 'Conversion funnels — website visits to purchase with drop-off rates.', 'chart new', '2 examples', funnelPreview())}
        ${card('/waterfall', 'Waterfall Chart', 'Revenue bridge: gross to net, monthly deltas, running totals.', 'chart new', '2 examples', waterfallPreview())}
        ${card('/heatmap', 'Heatmap', 'Color-coded grids for sales by hour, category performance, patterns.', 'chart new', '2 examples', heatmapPreview())}
        ${card('/cohort', 'Cohort Chart', 'Customer retention analysis — track cohort behavior over time.', 'chart new', '1 example', cohortPreview())}
        ${card('/bullet', 'Bullet Chart', 'Compact actual-vs-target for KPI dashboards. Stephen Few pattern.', 'chart new', '1 example', bulletPreview())}
        ${card('/sankey', 'Sankey Chart', 'Traffic and revenue flow diagrams between stages and touchpoints.', 'chart new', '1 example', sankeyPreview())}
        ${card('/treemap', 'Treemap', 'Nested rectangles — size shows revenue, labels show growth rate.', 'chart new', '1 example', treemapPreview())}
        ${card('/range', 'Range Chart', 'Timeline with campaign zones, event annotations, and trend lines.', 'chart new', '1 example', rangePreview())}
        ${card('/kpicomparison', 'KPI Comparison', 'Enhanced KPI cards with sparkline, target progress, trend badge.', 'chart new', '6 examples', kpiComparisonPreview())}
      </div>

      <div class="section"><h2>Full Demos</h2></div>
      <div class="grid">
        ${card('/dashboard', 'ERP Dashboard', 'Complete sales dashboard with KPI cards, drill-down, table, CSV export.', 'demo', 'Full demo', dashboardPreview())}
        ${card('/ecommerce', 'E-Commerce Dashboard', 'Webshop analytics: funnel, sankey, treemap, heatmap, cohort, waterfall, bullet.', 'demo new', 'Full demo', ecommercePreview())}
        ${card('/largedata', 'Large Datasets', 'Auto label rotation, thinning, and horizontal scroll for 50–100+ bars.', 'demo new', '4 examples', largedataPreview())}
        ${card('/livewidgets', 'Live Widgets', 'Real-time e-commerce widgets: visitors, revenue ticker, order feed, conversion pulse.', 'demo new', '4 widgets', livePreview())}
        ${card('/drilldown', 'Drill-Down', 'Click bars to zoom into sub-data. Client-side children, server-side callbacks, breadcrumb nav.', 'demo new', '3 examples', drilldownPreview())}
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
  // Points on circle center=(40,48) r=30, arc from (10,48) to (70,48) through top
  // f=0→(10,48), f=1/3→(25,22), f=2/3→(55,22), f=0.78→(63,29), f=1→(70,48)
  return `<svg viewBox="0 0 80 55" width="80" height="55">
    <path d="M10,48 A30,30 0 1,1 70,48" fill="none" stroke="var(--border)" stroke-width="8" stroke-linecap="round"/>
    <path d="M10,48 A30,30 0 0,1 25,22" fill="none" stroke="var(--danger)" stroke-width="8" stroke-linecap="butt"/>
    <path d="M25,22 A30,30 0 0,1 55,22" fill="none" stroke="var(--warning)" stroke-width="8" stroke-linecap="butt"/>
    <path d="M55,22 A30,30 0 0,1 63,29" fill="none" stroke="var(--success)" stroke-width="8" stroke-linecap="butt"/>
    <text x="40" y="45" text-anchor="middle" font-size="11" font-weight="700" font-family="var(--mono)" fill="var(--text)">78%</text>
  </svg>`;
}

function sparkPreview() {
  return `<div style="display:flex;gap:12px;align-items:center;">
    <svg width="80" height="24" viewBox="0 0 80 24">
      <polyline points="2,18 10,14 18,16 26,10 34,12 42,8 50,10 58,6 66,8 74,4 78,3" stroke="var(--primary)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <circle cx="78" cy="3" r="2" fill="var(--primary)"/>
    </svg>
    <svg width="80" height="24" viewBox="0 0 80 24">
      <rect x="2" y="8" width="6" height="14" rx="1" fill="var(--success)"/>
      <rect x="12" y="4" width="6" height="18" rx="1" fill="var(--success)"/>
      <rect x="22" y="12" width="6" height="10" rx="1" fill="var(--danger)"/>
      <rect x="32" y="6" width="6" height="16" rx="1" fill="var(--success)"/>
      <rect x="42" y="10" width="6" height="12" rx="1" fill="var(--danger)"/>
      <rect x="52" y="2" width="6" height="20" rx="1" fill="var(--success)"/>
      <rect x="62" y="8" width="6" height="14" rx="1" fill="var(--success)"/>
      <rect x="72" y="5" width="6" height="17" rx="1" fill="var(--success)"/>
    </svg>
  </div>`;
}

function comboPreview() {
  return `<div style="display:flex;align-items:flex-end;gap:3px;height:60px;position:relative;">
    <div style="height:30px;width:14px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
    <div style="height:42px;width:14px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
    <div style="height:35px;width:14px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
    <div style="height:50px;width:14px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
    <div style="height:38px;width:14px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
    <div style="height:55px;width:14px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
    <div style="height:45px;width:14px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
    <svg viewBox="0 0 98 60" style="position:absolute;left:0;bottom:0;width:100%;height:100%;" fill="none">
      <polyline points="7,48 21,38 35,42 49,28 63,34 77,22 91,18" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>`;
}

function scatterPreview() {
  return `<svg width="120" height="80" viewBox="0 0 120 80">
    <circle cx="20" cy="55" r="5" fill="var(--primary)" opacity="0.7"/>
    <circle cx="35" cy="40" r="8" fill="var(--primary)" opacity="0.7"/>
    <circle cx="55" cy="30" r="12" fill="var(--success)" opacity="0.6"/>
    <circle cx="75" cy="45" r="6" fill="var(--warning)" opacity="0.7"/>
    <circle cx="90" cy="20" r="10" fill="var(--purple)" opacity="0.6"/>
    <circle cx="45" cy="60" r="4" fill="var(--danger)" opacity="0.7"/>
    <circle cx="100" cy="50" r="7" fill="var(--success)" opacity="0.7"/>
    <circle cx="65" cy="15" r="9" fill="var(--primary)" opacity="0.6"/>
  </svg>`;
}

function kpiPreview() {
  return `<div style="display:flex;gap:8px;align-items:center;">
    <div style="background:var(--surface);border:1.5px solid var(--primary);border-radius:8px;padding:8px 14px;box-shadow:0 0 0 3px rgba(76,110,245,0.09);">
      <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Revenue</div>
      <div style="font-size:16px;font-weight:700;font-family:var(--mono);color:var(--text);">$38.9M</div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
        <span style="font-size:7px;font-weight:600;color:var(--success-dk);background:var(--success-bg);padding:0 3px;border-radius:2px;">+20.1%</span>
        <svg width="40" height="12" viewBox="0 0 40 12"><polyline points="2,10 8,7 14,9 20,5 26,6 32,3 38,2" stroke="var(--primary)" stroke-width="1" fill="none"/></svg>
      </div>
    </div>
  </div>`;
}

function trendbadgePreview() {
  return `<div style="display:flex;gap:12px;align-items:center;">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 10px;display:flex;align-items:center;gap:8px;">
      <div>
        <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;">Revenue</div>
        <div style="font-size:13px;font-weight:700;font-family:var(--mono);color:var(--text);">38.9k</div>
      </div>
      <span style="font-size:7px;font-weight:600;color:var(--success-dk);background:var(--success-bg);padding:1px 4px;border-radius:3px;">&#9650; 20.1%</span>
      <svg width="40" height="14" viewBox="0 0 40 14"><polyline points="2,12 8,9 14,10 20,6 26,7 32,4 38,2" stroke="var(--primary)" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>
    </div>
    <div style="display:flex;gap:6px;">
      <span style="font-size:8px;font-weight:600;color:var(--success-dk);background:var(--success-bg);padding:2px 5px;border-radius:3px;">&#9650; 12.3%</span>
      <span style="font-size:8px;font-weight:600;color:var(--danger);background:var(--danger-bg);padding:2px 5px;border-radius:3px;">&#9660; 5.7%</span>
    </div>
  </div>`;
}

function networkballPreview() {
  return `<svg width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="38" fill="none" stroke="var(--text-muted)" stroke-width="1" opacity="0.4"/>
    <line x1="30" y1="35" x2="55" y2="25" stroke="var(--text-muted)" stroke-width="0.8" opacity="0.15"/>
    <line x1="55" y1="25" x2="70" y2="40" stroke="var(--text-muted)" stroke-width="0.8" opacity="0.15"/>
    <line x1="70" y1="40" x2="65" y2="65" stroke="var(--text-muted)" stroke-width="0.8" opacity="0.15"/>
    <line x1="65" y1="65" x2="40" y2="70" stroke="var(--text-muted)" stroke-width="0.8" opacity="0.15"/>
    <line x1="40" y1="70" x2="30" y2="35" stroke="var(--text-muted)" stroke-width="0.8" opacity="0.15"/>
    <line x1="50" y1="50" x2="70" y2="40" stroke="var(--success)" stroke-width="1.5" opacity="0.5"/>
    <line x1="50" y1="50" x2="30" y2="35" stroke="var(--success)" stroke-width="1.5" opacity="0.5"/>
    <circle cx="30" cy="35" r="3" fill="var(--text-muted)" opacity="0.5"/>
    <circle cx="55" cy="25" r="3" fill="var(--text-muted)" opacity="0.5"/>
    <circle cx="70" cy="40" r="3" fill="var(--text-muted)" opacity="0.5"/>
    <circle cx="65" cy="65" r="3" fill="var(--text-muted)" opacity="0.5"/>
    <circle cx="40" cy="70" r="3" fill="var(--text-muted)" opacity="0.5"/>
    <circle cx="50" cy="50" r="8" fill="var(--success)" opacity="0.15"/>
    <circle cx="50" cy="50" r="4" fill="var(--success)"/>
    <circle cx="50" cy="50" r="1.5" fill="#fff"/>
  </svg>`;
}

function funnelPreview() {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;width:120px;">
    <div style="width:100%;height:10px;background:var(--primary);border-radius:2px;"></div>
    <div style="width:80%;height:10px;background:var(--success);border-radius:2px;"></div>
    <div style="width:55%;height:10px;background:var(--warning);border-radius:2px;"></div>
    <div style="width:35%;height:10px;background:var(--danger);border-radius:2px;"></div>
    <div style="width:22%;height:10px;background:var(--purple);border-radius:2px;"></div>
  </div>`;
}

function waterfallPreview() {
  return `<svg width="120" height="60" viewBox="0 0 120 60">
    <rect x="5" y="5" width="14" height="50" rx="2" fill="var(--success)"/>
    <rect x="23" y="15" width="14" height="12" rx="2" fill="var(--danger)"/>
    <rect x="41" y="20" width="14" height="8" rx="2" fill="var(--danger)"/>
    <rect x="59" y="24" width="14" height="10" rx="2" fill="var(--danger)"/>
    <rect x="77" y="30" width="14" height="6" rx="2" fill="var(--danger)"/>
    <rect x="95" y="30" width="14" height="25" rx="2" fill="var(--primary)"/>
    <line x1="19" y1="5" x2="23" y2="5" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="2 1"/>
    <line x1="37" y1="15" x2="41" y2="15" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="2 1"/>
  </svg>`;
}

function heatmapPreview() {
  const colors = ['#e8f5e9','#a5d6a7','#66bb6a','#388e3c','#1b5e20'];
  let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;width:100px;">';
  for (let i = 0; i < 28; i++) {
    const c = colors[Math.floor(Math.random() * colors.length)];
    html += `<div style="width:12px;height:10px;background:${c};border-radius:1px;"></div>`;
  }
  html += '</div>';
  return html;
}

function cohortPreview() {
  return `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;width:90px;">
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.9;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.7;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.5;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.35;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.2;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.85;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.65;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.45;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.25;"></div>
    <div style="height:12px;background:transparent;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.8;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.55;"></div>
    <div style="height:12px;background:#1565c0;border-radius:1px;opacity:0.3;"></div>
    <div style="height:12px;background:transparent;"></div>
    <div style="height:12px;background:transparent;"></div>
  </div>`;
}

function bulletPreview() {
  return `<div style="display:flex;flex-direction:column;gap:6px;width:120px;">
    <div style="position:relative;height:14px;background:linear-gradient(to right,#f1f3f5 60%,#dee2e6 80%,#ced4da 100%);border-radius:2px;">
      <div style="position:absolute;top:3px;left:0;height:8px;width:75%;background:var(--primary);border-radius:2px;"></div>
      <div style="position:absolute;top:1px;left:82%;height:12px;width:2px;background:var(--text);"></div>
    </div>
    <div style="position:relative;height:14px;background:linear-gradient(to right,#f1f3f5 60%,#dee2e6 80%,#ced4da 100%);border-radius:2px;">
      <div style="position:absolute;top:3px;left:0;height:8px;width:60%;background:var(--success);border-radius:2px;"></div>
      <div style="position:absolute;top:1px;left:70%;height:12px;width:2px;background:var(--text);"></div>
    </div>
    <div style="position:relative;height:14px;background:linear-gradient(to right,#f1f3f5 60%,#dee2e6 80%,#ced4da 100%);border-radius:2px;">
      <div style="position:absolute;top:3px;left:0;height:8px;width:88%;background:var(--warning);border-radius:2px;"></div>
      <div style="position:absolute;top:1px;left:90%;height:12px;width:2px;background:var(--text);"></div>
    </div>
  </div>`;
}

function sankeyPreview() {
  return `<svg width="120" height="70" viewBox="0 0 120 70">
    <path d="M5,5 C40,5 60,10 95,10 L95,20 C60,20 40,15 5,15 Z" fill="var(--primary)" opacity="0.3"/>
    <path d="M5,20 C40,20 60,30 95,25 L95,35 C60,40 40,30 5,30 Z" fill="var(--success)" opacity="0.3"/>
    <path d="M5,35 C40,35 60,50 95,40 L95,50 C60,60 40,45 5,45 Z" fill="var(--warning)" opacity="0.3"/>
    <path d="M5,50 C40,50 60,55 95,55 L95,65 C60,65 40,60 5,60 Z" fill="var(--purple)" opacity="0.3"/>
    <rect x="0" y="3" width="6" height="60" rx="2" fill="var(--primary)"/>
    <rect x="93" y="8" width="6" height="60" rx="2" fill="var(--success)"/>
  </svg>`;
}

function treemapPreview() {
  return `<div style="display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:2px;width:100px;height:60px;">
    <div style="background:var(--primary);border-radius:3px;grid-row:span 2;"></div>
    <div style="background:var(--success);border-radius:3px;"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;">
      <div style="background:var(--warning);border-radius:2px;"></div>
      <div style="background:var(--purple);border-radius:2px;"></div>
    </div>
  </div>`;
}

function rangePreview() {
  return `<div style="width:120px;height:50px;position:relative;">
    <div style="position:absolute;left:10%;top:0;width:25%;height:100%;background:var(--primary);opacity:0.08;border-radius:2px;"></div>
    <div style="position:absolute;left:60%;top:0;width:30%;height:100%;background:var(--danger);opacity:0.08;border-radius:2px;"></div>
    <svg viewBox="0 0 120 50" style="position:absolute;left:0;top:0;width:100%;height:100%;" fill="none">
      <polyline points="5,38 20,30 35,32 50,22 65,26 80,18 95,14 110,10" stroke="var(--primary)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <line x1="50" y1="0" x2="50" y2="50" stroke="var(--purple)" stroke-width="1" stroke-dasharray="3 2"/>
    </svg>
  </div>`;
}

function kpiComparisonPreview() {
  return `<div style="display:flex;gap:6px;align-items:center;">
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:6px;padding:6px 10px;min-width:80px;">
      <div style="font-size:6px;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Revenue</div>
      <div style="font-size:13px;font-weight:700;font-family:var(--mono);color:var(--text);">38.9M</div>
      <div style="height:4px;background:var(--border);border-radius:2px;margin-top:4px;">
        <div style="height:100%;width:78%;background:var(--success);border-radius:2px;"></div>
      </div>
      <div style="display:flex;align-items:center;gap:3px;margin-top:3px;">
        <span style="font-size:7px;color:var(--success-dk);font-weight:600;">&#9650; 12.4%</span>
      </div>
    </div>
  </div>`;
}

function ecommercePreview() {
  return `<div style="display:flex;gap:10px;align-items:center;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;width:60px;">
      <div style="width:100%;height:8px;background:var(--primary);border-radius:2px;"></div>
      <div style="width:78%;height:8px;background:var(--success);border-radius:2px;"></div>
      <div style="width:52%;height:8px;background:var(--warning);border-radius:2px;"></div>
      <div style="width:30%;height:8px;background:var(--danger);border-radius:2px;"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px;width:50px;">
      <div style="height:8px;background:#0ca678;border-radius:1px;opacity:0.3;"></div>
      <div style="height:8px;background:#0ca678;border-radius:1px;opacity:0.6;"></div>
      <div style="height:8px;background:#0ca678;border-radius:1px;opacity:0.9;"></div>
      <div style="height:8px;background:#0ca678;border-radius:1px;opacity:0.5;"></div>
      <div style="height:8px;background:#0ca678;border-radius:1px;opacity:0.7;"></div>
      <div style="height:8px;background:#0ca678;border-radius:1px;opacity:0.4;"></div>
      <div style="height:8px;background:#0ca678;border-radius:1px;opacity:0.8;"></div>
      <div style="height:8px;background:#0ca678;border-radius:1px;opacity:0.2;"></div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:2px;width:45px;height:36px;">
      <div style="background:var(--primary);border-radius:2px;grid-row:span 2;"></div>
      <div style="background:var(--success);border-radius:2px;"></div>
      <div style="background:var(--warning);border-radius:2px;"></div>
    </div>
  </div>`;
}

function dashboardPreview() {
  return `<div style="display:flex;gap:8px;align-items:flex-end;">
    <div style="display:flex;align-items:flex-end;gap:4px;height:50px;">
      <div style="height:25px;width:12px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
      <div style="height:38px;width:12px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
      <div style="height:30px;width:12px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
      <div style="height:42px;width:12px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
      <div style="height:35px;width:12px;background:var(--primary);border-radius:3px 3px 0 0;"></div>
    </div>
    <svg viewBox="0 0 50 50" width="50" height="50">
      <circle cx="25" cy="25" r="18" fill="none" stroke="var(--success)" stroke-width="7" stroke-dasharray="75 38" stroke-dashoffset="0" transform="rotate(-90 25 25)"/>
      <circle cx="25" cy="25" r="18" fill="none" stroke="var(--warning)" stroke-width="7" stroke-dasharray="25 88" stroke-dashoffset="-75" transform="rotate(-90 25 25)"/>
    </svg>
  </div>`;
}

function largedataPreview() {
  const bars = [18,32,24,38,28,35,22,40,30,36,26,34,20,37,29,33,25,39,27,31];
  return `<div style="display:flex;align-items:flex-end;gap:1px;height:50px;overflow:hidden;width:100px;">
    ${bars.map(h => `<div style="height:${h}px;flex:1;min-width:3px;background:var(--primary);border-radius:1px 1px 0 0;opacity:0.8;"></div>`).join('')}
  </div>`;
}

function livePreview() {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
    <div style="display:flex;align-items:flex-end;gap:16px;">
      <div style="text-align:center;">
        <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Online</div>
        <div style="font-size:28px;font-weight:800;color:var(--text);line-height:1;">19</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:7px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Carts</div>
        <div style="font-size:28px;font-weight:800;color:var(--success);line-height:1;">3</div>
      </div>
    </div>
    <div style="width:8px;height:8px;border-radius:50%;background:var(--success);animation:nc-lw-pulse 2s ease-in-out infinite;"></div>
  </div>`;
}

function drilldownPreview() {
  return `<div style="display:flex;align-items:center;gap:8px;">
    <div style="display:flex;align-items:flex-end;gap:3px;height:40px;">
      <div style="height:25px;width:14px;background:var(--primary);border-radius:2px 2px 0 0;opacity:0.3;"></div>
      <div style="height:35px;width:14px;background:var(--primary);border-radius:2px 2px 0 0;opacity:0.3;"></div>
      <div style="height:40px;width:14px;background:var(--primary);border-radius:2px 2px 0 0;border:2px solid var(--primary-dk);"></div>
      <div style="height:28px;width:14px;background:var(--primary);border-radius:2px 2px 0 0;opacity:0.3;"></div>
    </div>
    <div style="font-size:16px;color:var(--primary);">&#x279C;</div>
    <div style="display:flex;align-items:flex-end;gap:2px;height:40px;">
      <div style="height:20px;width:10px;background:var(--success);border-radius:2px 2px 0 0;"></div>
      <div style="height:32px;width:10px;background:var(--success);border-radius:2px 2px 0 0;"></div>
      <div style="height:28px;width:10px;background:var(--success);border-radius:2px 2px 0 0;"></div>
    </div>
  </div>`;
}
