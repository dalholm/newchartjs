/**
 * Dashboard view — The Sleep Factory Sales Overview
 */
export default function dashboardView() {
  return {
    title: 'The Sleep Factory — Dashboard',
    pageClass: 'dashboard-page',
    style: `
      /* ═══ LAYOUT ═══ */
      .dashboard { padding: 16px 20px; max-width: 1400px; margin: 0 auto; }
      .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
      .header-left { display:flex; align-items:center; gap:10px; }
      .logo { width:28px; height:28px; border-radius:6px; background:var(--primary); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .header h1 { font-size:16px; font-weight:700; color:var(--text); }
      .header .subtitle { font-size:11px; color:var(--text-muted); }
      .header-right { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

      /* ═══ SEGMENTED CONTROL ═══ */
      .seg { display:inline-flex; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
      .seg button { padding:5px 12px; font-size:11px; font-weight:400; font-family:var(--font);
        border:none; cursor:pointer; background:var(--surface); color:var(--text-muted); transition:all 0.12s; }
      .seg button + button { border-left:1px solid var(--border); }
      .seg button.active { font-weight:600; color:var(--primary-dk); background:var(--primary-lt); }

      .date-badge { padding:5px 10px; font-size:11px; border-radius:var(--radius); border:1px solid var(--border);
        background:var(--surface); color:var(--text-sec); font-family:var(--mono); }

      /* ═══ KPI CARDS ═══ */
      .kpi-row { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
      .kpi { flex:1 1 0; min-width:170px; }

      /* ═══ STATUS DOT ═══ */
      .status-dot { width:8px; height:8px; border-radius:50%; display:inline-block; flex-shrink:0; }
      .status-dot.green { background:var(--success); }
      .status-dot.yellow { background:var(--warning); }
      .status-dot.red { background:var(--danger); }

      /* ═══ CHART CARD ═══ */
      .chart-card { background:var(--surface); border-radius:var(--radius-lg); border:1px solid var(--border);
        box-shadow:var(--shadow); overflow:hidden; margin-bottom:16px; }

      /* TAB BAR */
      .tab-bar { display:flex; border-bottom:1px solid var(--border); background:var(--surface); }
      .tab-bar button { padding:12px 20px; font-size:12px; font-weight:400; font-family:var(--font);
        border:none; cursor:pointer; color:var(--text-muted); background:transparent;
        border-bottom:2px solid transparent; margin-bottom:-1px; transition:all 0.12s; }
      .tab-bar button.active { font-weight:600; color:var(--primary); border-bottom-color:var(--primary); }
      .tab-bar .spacer { flex:1; }
      .tab-bar .live { display:flex; align-items:center; padding:0 12px; gap:6px; font-size:10px;
        color:var(--text-faint); font-family:var(--mono); }
      .tab-bar .live-dot { width:6px; height:6px; border-radius:50%; background:var(--success); }

      /* CHART TOOLBAR */
      .chart-toolbar { display:flex; align-items:center; justify-content:space-between;
        padding:10px 16px; border-bottom:1px solid var(--border-light); background:var(--surface-alt);
        flex-wrap:wrap; gap:8px; }
      .toolbar-left { display:flex; align-items:center; gap:8px; }
      .toolbar-right { display:flex; align-items:center; gap:6px; }
      .toolbar-title { font-size:12px; font-weight:600; color:var(--text); }

      .tool-btn { display:flex; align-items:center; gap:4px; padding:5px 8px; font-size:11px;
        font-family:var(--font); border:1px solid var(--border); border-radius:var(--radius);
        cursor:pointer; color:var(--text-sec); background:var(--surface); font-weight:400; transition:all 0.12s; }
      .tool-btn:hover { border-color:var(--primary); color:var(--primary-dk); }
      .tool-btn.active { border-color:var(--primary-dk); color:var(--primary-dk); background:var(--primary-lt); font-weight:600; }

      /* CHART TYPE SWITCHER */
      .chart-type-switch { display:flex; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
      .chart-type-switch button { padding:4px 8px; border:none; cursor:pointer; background:var(--surface);
        display:flex; align-items:center; transition:all 0.12s; }
      .chart-type-switch button + button { border-left:1px solid var(--border); }
      .chart-type-switch button.active { background:var(--primary-lt); }
      .chart-type-switch button svg { width:14px; height:14px; }

      /* BREADCRUMBS */
      .breadcrumbs { display:flex; align-items:center; gap:2px; margin-right:8px; }
      .breadcrumbs button { border:none; background:none; cursor:pointer; padding:2px 4px;
        font-size:11px; font-family:var(--font); color:var(--primary); }
      .breadcrumbs button.current { color:var(--text); font-weight:600; text-decoration:none; cursor:default; }
      .breadcrumbs button:not(.current):hover { text-decoration:underline; }
      .breadcrumbs .sep { color:var(--text-faint); font-size:10px; }

      /* LEGEND */
      .legend { display:flex; gap:4px; flex-wrap:wrap; padding:12px 16px 4px; }
      .legend-item { display:flex; align-items:center; gap:5px; padding:3px 8px; font-size:11px;
        font-family:var(--font); border:1px solid var(--border); border-radius:3px;
        cursor:pointer; background:var(--surface); color:var(--text); transition:all 0.15s; }
      .legend-item.hidden { border-color:var(--border-light); background:var(--surface-alt);
        color:var(--text-faint); opacity:0.5; }
      .legend-swatch { width:10px; height:3px; border-radius:2px; transition:background 0.15s; }
      .legend-ref { font-size:9px; color:var(--text-muted); }

      /* CHART AREA */
      .chart-area { padding:0 16px 16px; }
      .chart-container { position:relative; width:100%; min-height:350px; }

      /* DATA TABLE */
      .data-table-wrap { border:1px solid var(--border-light); border-radius:var(--radius); overflow:hidden; }
      .data-table-wrap.split { margin-top:12px; max-height:200px; overflow-y:auto; }
      .data-table { width:100%; border-collapse:collapse; font-size:12px; font-family:var(--font); }
      .data-table th { text-align:left; padding:8px 10px; color:var(--text-muted); font-weight:500;
        font-size:10px; text-transform:uppercase; letter-spacing:0.5px;
        border-bottom:2px solid var(--border); background:var(--surface-alt); position:sticky; top:0;
        white-space:nowrap; z-index:1; }
      .data-table th.right { text-align:right; }
      .data-table th.center { text-align:center; }
      .data-table td { padding:7px 10px; border-bottom:1px solid var(--border-light); }
      .data-table td.right { text-align:right; }
      .data-table td.center { text-align:center; }
      .data-table td.mono { font-family:var(--mono); }
      .data-table td.label-cell { font-weight:500; color:var(--text); }
      .data-table tr { transition:background 0.08s; cursor:pointer; }
      .data-table tr:nth-child(even) { background:var(--surface-alt); }
      .data-table tr:hover, .data-table tr.hovered { background:var(--primary-lt); }

      /* DONUT LAYOUT */
      .donut-layout { display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap; padding:8px 16px 16px; }
      .donut-chart-wrap { flex-shrink:0; }
      .donut-table-wrap { flex:1; min-width:300px; border:1px solid var(--border-light); border-radius:var(--radius); overflow:hidden; }

      /* TOOLTIP */
      .chart-tooltip { position:fixed; background:#1a1d23; color:#e8eaed; padding:10px 14px;
        border-radius:6px; font-size:11px; font-family:var(--font); line-height:1.6;
        pointer-events:none; z-index:100; box-shadow:0 8px 24px rgba(0,0,0,0.35);
        max-width:280px; border:1px solid #2d3139; opacity:0; transition:opacity 0.1s; }
      .chart-tooltip.visible { opacity:1; }
      .chart-tooltip .tt-header { font-weight:600; margin-bottom:4px; border-bottom:1px solid #333; padding-bottom:4px; }
      .chart-tooltip .tt-row { display:flex; justify-content:space-between; gap:16px; }
      .chart-tooltip .tt-swatch { width:8px; height:3px; border-radius:1px; display:inline-block; margin-right:4px; vertical-align:middle; }
      .chart-tooltip .tt-value { font-family:var(--mono); }
      .chart-tooltip .tt-divider { border-top:1px solid #333; margin-top:4px; padding-top:4px; }

      /* FOOTER */
      .dashboard-footer { margin-top:12px; display:flex; justify-content:space-between; font-size:10px;
        color:var(--text-faint); padding:0 4px; flex-wrap:wrap; gap:8px; }

      /* ═══ RESPONSIVE ═══ */
      @media (max-width: 768px) {
        .dashboard { padding:12px; }
        .kpi-row { flex-direction:column; }
        .kpi { min-width:100%; flex:0 0 auto; }
        .donut-layout { flex-direction:column; }
        .donut-chart-wrap { width:100%; display:flex; justify-content:center; }
      }

      /* ═══ ANIMATIONS ═══ */
      @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      .animate-in { animation: fadeUp 0.3s ease-out both; }
      .kpi:nth-child(1) { animation-delay:0s; }
      .kpi:nth-child(2) { animation-delay:0.05s; }
      .kpi:nth-child(3) { animation-delay:0.1s; }
      .kpi:nth-child(4) { animation-delay:0.15s; }
    `,
    html: `
      <div class="dashboard">
        <!-- HEADER -->
        <div class="header">
          <div class="header-left">
            <div class="logo">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="7" width="3.5" height="8" rx="1" fill="#fff"/>
                <rect x="6.25" y="3" width="3.5" height="12" rx="1" fill="#fff"/>
                <rect x="11.5" y="1" width="3.5" height="14" rx="1" fill="#fff"/>
              </svg>
            </div>
            <div>
              <h1>Sales Overview</h1>
              <span class="subtitle">The Sleep Factory &middot; <span id="today-date"></span></span>
            </div>
          </div>
          <div class="header-right">
            <div class="seg" id="period-seg">
              <button data-val="mtd">MTD</button>
              <button data-val="qtd">QTD</button>
              <button data-val="ytd" class="active">YTD</button>
              <button data-val="12m">12M</button>
            </div>
            <div class="date-badge">2026-01-01 &rarr; 2026-12-31</div>
          </div>
        </div>

        <!-- KPI ROW -->
        <div class="kpi-row" id="kpi-row"></div>

        <!-- GAUGE ROW -->
        <div class="kpi-row" id="gauge-row">
          <div class="chart-card animate-in" style="flex:1;min-width:200px;animation-delay:0.2s;">
            <div style="padding:8px 14px 4px;font-size:11px;font-weight:600;color:var(--text-sec);">Budget Achievement</div>
            <div id="gauge-budget" style="height:180px;padding:0 8px 8px;"></div>
          </div>
          <div class="chart-card animate-in" style="flex:1;min-width:200px;animation-delay:0.25s;">
            <div style="padding:8px 14px 4px;font-size:11px;font-weight:600;color:var(--text-sec);">Gross Margin</div>
            <div id="gauge-margin" style="height:180px;padding:0 8px 8px;"></div>
          </div>
          <div class="chart-card animate-in" style="flex:1;min-width:200px;animation-delay:0.3s;">
            <div style="padding:8px 14px 4px;font-size:11px;font-weight:600;color:var(--text-sec);">Order Fulfillment</div>
            <div id="gauge-fulfill" style="height:180px;padding:0 8px 8px;"></div>
          </div>
          <div class="chart-card animate-in" style="flex:1;min-width:200px;animation-delay:0.35s;">
            <div style="padding:8px 14px 4px;font-size:11px;font-weight:600;color:var(--text-sec);">Return Rate</div>
            <div id="gauge-returns" style="height:180px;padding:0 8px 8px;"></div>
          </div>
        </div>

        <!-- MAIN CHART CARD -->
        <div class="chart-card">
          <div class="tab-bar">
            <button class="active" data-tab="bar">Time Series</button>
            <button data-tab="donut">Distribution</button>
            <div class="spacer"></div>
            <div class="live"><span class="live-dot"></span> Live &middot; <span id="live-time"></span></div>
          </div>

          <!-- BAR/LINE CHART PANEL -->
          <div id="panel-bar">
            <div class="chart-toolbar">
              <div class="toolbar-left">
                <div class="breadcrumbs" id="breadcrumbs" style="display:none;"></div>
                <span class="toolbar-title" id="chart-title">Revenue</span>
              </div>
              <div class="toolbar-right">
                <div class="chart-type-switch" id="chart-type-switch">
                  <button class="active" data-type="bar" title="Bar chart">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="7" width="3" height="7" rx="0.5"/><rect x="6.5" y="4" width="3" height="10" rx="0.5"/><rect x="11" y="2" width="3" height="12" rx="0.5"/>
                    </svg>
                  </button>
                  <button data-type="line" title="Line chart">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="2,12 5,7 8,9 11,4 14,6"/><circle cx="14" cy="6" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <div class="seg" id="view-mode-seg">
                  <button data-val="chart" class="active">Chart</button>
                  <button data-val="table">Table</button>
                  <button data-val="split">Split</button>
                </div>
                <button class="tool-btn" id="btn-export" title="Export CSV">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 2v8m0 0l-3-3m3 3l3-3"/><path d="M3 12v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V12"/>
                  </svg>
                  CSV
                </button>
              </div>
            </div>
            <div class="legend" id="bar-legend"></div>
            <div class="chart-area">
              <div class="chart-container" id="bar-chart-container"></div>
              <div id="bar-table-container" style="display:none;"></div>
            </div>
          </div>

          <!-- DONUT CHART PANEL -->
          <div id="panel-donut" style="display:none;">
            <div class="chart-toolbar">
              <div class="toolbar-left">
                <span class="toolbar-title">Distribution</span>
              </div>
              <div class="toolbar-right">
                <div class="seg" id="donut-source-seg">
                  <button data-val="channel" class="active">By Channel</button>
                  <button data-val="category">By Category</button>
                </div>
                <div class="seg" id="donut-view-seg">
                  <button data-val="chart">Chart</button>
                  <button data-val="table">Table</button>
                  <button data-val="split" class="active">Split</button>
                </div>
                <button class="tool-btn" id="btn-donut-export">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 2v8m0 0l-3-3m3 3l3-3"/><path d="M3 12v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V12"/>
                  </svg>
                  CSV
                </button>
              </div>
            </div>
            <div class="legend" id="donut-legend"></div>
            <div class="donut-layout" id="donut-layout">
              <div class="donut-chart-wrap">
                <div id="donut-chart-container" style="width:260px;height:260px;"></div>
              </div>
              <div class="donut-table-wrap" id="donut-table-container"></div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="dashboard-footer">
          <span>Source: Nyehandel Platform API &middot; All amounts in SEK excl. VAT &middot; Powered by NewChart.js v0.1.0</span>
          <span>Click KPI card to switch metric &middot; Double-click bar for drill-down</span>
        </div>
      </div>

      <!-- Custom tooltip -->
      <div class="chart-tooltip" id="tooltip"></div>
    `,
    mount() {
      /* ═══ DATA ═══ */
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const REV_26 = [2850,3120,2960,3480,3210,3650,2890,3340,3580,3120,3890,4210];
      const REV_25 = [2200,2450,2380,2710,2590,2840,2310,2680,2920,2510,3120,3580];
      const ORD_26 = [412,468,431,502,478,528,419,487,519,453,564,611];
      const ORD_25 = [320,358,346,394,377,413,336,390,425,365,454,521];
      const AOV_26 = REV_26.map((r, i) => Math.round(r * 1000 / ORD_26[i]));
      const AOV_25 = REV_25.map((r, i) => Math.round(r * 1000 / ORD_25[i]));
      const BUDGET = [2700,2900,3000,3200,3100,3400,3000,3200,3500,3300,3700,4000];

      const CHANNEL_DATA = [
        { label: 'Direct', value: 12480, prev: 9860 },
        { label: 'Google Ads', value: 8320, prev: 7110 },
        { label: 'Organic', value: 6940, prev: 5230 },
        { label: 'Email', value: 4680, prev: 3920 },
        { label: 'Social', value: 2510, prev: 2180 },
        { label: 'Referral', value: 1590, prev: 1340 },
      ];

      const CATEGORY_DATA = [
        { label: 'Mattresses', value: 14200, orders: 284, margin: 42.3 },
        { label: 'Pillows', value: 8900, orders: 1780, margin: 51.2 },
        { label: 'Bed Frames', value: 6300, orders: 126, margin: 38.7 },
        { label: 'Bed Linen', value: 4800, orders: 960, margin: 55.1 },
        { label: 'Duvets', value: 3200, orders: 640, margin: 48.6 },
        { label: 'Accessories', value: 1520, orders: 304, margin: 62.4 },
      ];

      const SERIES_COLORS = ['#4c6ef5','#0ca678','#f08c00','#e03131','#7048e8','#1098ad','#d6336c','#5c7cfa','#20c997','#fcc419'];
      const COMPARE_COLOR = '#b3bac5';

      /* Drill-down generators */
      function genWeeks(monthVal) {
        const w = [0.22, 0.26, 0.28, 0.24];
        return w.map((f, i) => ({ label: 'W' + (i + 1), value: Math.round(monthVal * f * (0.9 + Math.random() * 0.2)) }));
      }
      function genDays(weekVal) {
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const wt = [0.16, 0.15, 0.14, 0.14, 0.13, 0.16, 0.12];
        return days.map((d, i) => ({ label: d, value: Math.round(weekVal * wt[i] * (0.85 + Math.random() * 0.3)) }));
      }

      /* ═══ UTILITIES ═══ */
      function fmt(n) {
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e4) return Math.round(n / 1e3) + 'k';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
        return n.toLocaleString('en-US');
      }
      function fmtSEK(n) { return fmt(n) + ' SEK'; }
      function pctChange(c, p) { return p === 0 ? 0 : ((c - p) / p * 100); }

      function makeBadge(value) {
        const pos = value >= 0;
        return '<span class="badge ' + (pos ? 'up' : 'down') + '">' + (pos ? '&#9650;' : '&#9660;') + ' ' + Math.abs(value).toFixed(1) + '%</span>';
      }

      function statusDotClass(value, target) {
        const r = value / target;
        return r >= 1 ? 'green' : r >= 0.9 ? 'yellow' : 'red';
      }

      /* ═══ STATE ═══ */
      const state = {
        metric: 'revenue',
        activeTab: 'bar',
        chartType: 'bar',
        viewMode: 'chart',
        drillStack: [],
        legendVis: { current: true, previous: true, budget: true, average: true },
        donutSource: 'channel',
        donutView: 'split',
        donutLegendVis: {},
      };

      let barChartInstance = null;
      let lineChartInstance = null;
      let donutChartInstance = null;
      let _donutTable = null;
      let kpiInstances = [];
      let gaugeInstances = [];
      let liveInterval = null;

      /* ═══ KPI CARDS ═══ */
      function renderKPIs() {
        const totR26 = REV_26.reduce((s, v) => s + v, 0) * 1000;
        const totR25 = REV_25.reduce((s, v) => s + v, 0) * 1000;
        const totO26 = ORD_26.reduce((s, v) => s + v, 0);
        const totO25 = ORD_25.reduce((s, v) => s + v, 0);
        const aov26 = Math.round(totR26 / totO26);
        const aov25 = Math.round(totR25 / totO25);
        const budgetTarget = BUDGET.reduce((s, v) => s + v, 0) * 1000;

        const kpis = [
          { id: 'revenue', label: 'Revenue', value: totR26, previous: totR25, suffix: ' SEK',
            sparkline: { values: REV_26, color: SERIES_COLORS[0] }, target: budgetTarget },
          { id: 'orders', label: 'Orders', value: totO26, previous: totO25, suffix: '',
            sparkline: { values: ORD_26, color: SERIES_COLORS[1] }, target: null },
          { id: 'aov', label: 'AOV', value: aov26, previous: aov25, suffix: ' SEK',
            sparkline: { values: AOV_26, color: SERIES_COLORS[2] }, target: null },
          { id: 'margin', label: 'Gross Margin', value: 47.2, previous: 44.8, suffix: '%', decimals: 1,
            sparkline: { values: [42,43,44,45,44,46,45,47,48,46,48,47], color: SERIES_COLORS[3] }, target: null },
        ];

        kpiInstances.forEach(inst => inst.destroy());
        kpiInstances = [];

        const row = document.getElementById('kpi-row');
        if (!row) return;
        row.innerHTML = '';

        kpis.forEach(k => {
          const el = document.createElement('div');
          el.className = 'kpi animate-in';
          row.appendChild(el);

          const isActive = k.id === state.metric;
          const sparkColor = isActive ? '#4c6ef5' : '#b3bac5';

          const card = NewChart.kpiCard(el, {
            label: k.label,
            value: k.value,
            previous: k.previous,
            suffix: k.suffix,
            decimals: k.decimals || 0,
            target: k.target,
            active: isActive,
            sparkline: k.sparkline ? { ...k.sparkline, color: sparkColor } : null,
            onClick: k.id !== 'margin' ? () => {
              state.metric = k.id;
              state.drillStack = [];
              renderKPIs();
              renderBarChart();
              updateBreadcrumbs();
            } : null
          });

          kpiInstances.push(card);
        });
      }

      /* ═══ GAUGE CHARTS ═══ */
      function renderGauges() {
        gaugeInstances.forEach(g => g.destroy());
        gaugeInstances = [];

        const totR26 = REV_26.reduce((s, v) => s + v, 0) * 1000;
        const budgetTarget = BUDGET.reduce((s, v) => s + v, 0) * 1000;
        const budgetPct = (totR26 / budgetTarget * 100);

        const gaugeStyle = {
          animation: { duration: 800, easing: 'easeOutCubic' },
          fontFamily: "'Inter',sans-serif",
          monoFamily: "'JetBrains Mono',monospace",
          background: '#ffffff',
          gauge: { needle: false, valueFontSize: 20 }
        };

        gaugeInstances.push(NewChart.create('#gauge-budget', {
          type: 'gauge',
          data: { datasets: [{ label: 'av budget', values: [Math.round(budgetPct)] }] },
          options: {
            min: 0, max: 100, ticks: 0, valueSuffix: '%', showMax: false,
            zones: [
              { from: 0, to: 0.5, color: '#e03131' },
              { from: 0.5, to: 0.8, color: '#f08c00' },
              { from: 0.8, to: 1.0, color: '#0ca678' }
            ]
          },
          style: gaugeStyle
        }));

        gaugeInstances.push(NewChart.create('#gauge-margin', {
          type: 'gauge',
          data: { datasets: [{ label: 'Bruttomarginal', values: [47.2] }] },
          options: {
            min: 0, max: 60, target: 45, ticks: 0, valueSuffix: '%', valueDecimals: 1, showMax: false,
            zones: [
              { from: 0, to: 0.5, color: '#e03131' },
              { from: 0.5, to: 0.75, color: '#f08c00' },
              { from: 0.75, to: 1.0, color: '#0ca678' }
            ]
          },
          style: gaugeStyle
        }));

        gaugeInstances.push(NewChart.create('#gauge-fulfill', {
          type: 'gauge',
          data: { datasets: [{ label: 'Orderfyllnad', values: [94] }] },
          options: {
            min: 0, max: 100, ticks: 0, valueSuffix: '%', showMax: false,
            zones: [
              { from: 0, to: 0.6, color: '#e03131' },
              { from: 0.6, to: 0.85, color: '#f08c00' },
              { from: 0.85, to: 1.0, color: '#0ca678' }
            ]
          },
          style: gaugeStyle
        }));

        gaugeInstances.push(NewChart.create('#gauge-returns', {
          type: 'gauge',
          data: { datasets: [{ label: 'Returandel', values: [3.8] }] },
          options: {
            min: 0, max: 10, ticks: 0, valueSuffix: '%', valueDecimals: 1, showMax: false,
            zones: [
              { from: 0, to: 0.3, color: '#0ca678' },
              { from: 0.3, to: 0.6, color: '#f08c00' },
              { from: 0.6, to: 1.0, color: '#e03131' }
            ]
          },
          style: gaugeStyle
        }));
      }

      /* ═══ BAR/LINE CHART ═══ */
      function getTopData() {
        const curr = state.metric === 'revenue' ? REV_26 : state.metric === 'orders' ? ORD_26 : AOV_26;
        const prev = state.metric === 'revenue' ? REV_25 : state.metric === 'orders' ? ORD_25 : AOV_25;
        const bud = state.metric === 'revenue' ? BUDGET : null;
        return MONTHS.map((m, i) => ({ label: m, value: curr[i], prev: prev[i], budget: bud ? bud[i] : null }));
      }

      function getCurrentData() {
        if (state.drillStack.length === 0) return getTopData();
        return state.drillStack[state.drillStack.length - 1].data;
      }

      function renderBarChart() {
        const data = getCurrentData();
        const isSEK = state.metric === 'revenue' || state.metric === 'aov';
        const mult = state.metric === 'aov' ? 1 : 1000;
        const container = document.getElementById('bar-chart-container');
        const tableContainer = document.getElementById('bar-table-container');
        const show = state.viewMode;

        const titleEl = document.getElementById('chart-title');
        if (titleEl) {
          titleEl.textContent = state.metric === 'revenue' ? 'Revenue' : state.metric === 'orders' ? 'Orders' : 'Avg Order';
        }

        if (container) {
          container.style.display = 'block';
          container.style.minHeight = show === 'table' ? '0' : '350px';
        }
        if (tableContainer) tableContainer.style.display = 'none';

        if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
        if (lineChartInstance) { lineChartInstance.destroy(); lineChartInstance = null; }

        if (!container) return;
        container.innerHTML = '';

        const datasets = [];
        if (state.legendVis.current) {
          datasets.push({
            label: state.drillStack.length === 0 ? '2026' : 'Current',
            values: data.map(d => d.value),
            color: SERIES_COLORS[0]
          });
        }
        if (state.legendVis.previous) {
          datasets.push({
            label: state.drillStack.length === 0 ? '2025' : 'Previous',
            values: data.map(d => d.prev || 0),
            color: COMPARE_COLOR,
            dash: true,
            dashPattern: '5 3'
          });
        }

        const labels = data.map(d => d.label);

        const referenceLines = [];
        if (state.legendVis.average) {
          referenceLines.push({
            value: 'average', label: 'Average', color: '#868e96', dash: '4 3', strokeWidth: 1
          });
        }
        if (state.legendVis.budget && state.drillStack.length === 0 && state.metric === 'revenue') {
          const budgetAvg = Math.round(BUDGET.reduce((s, v) => s + v, 0) / BUDGET.length);
          referenceLines.push({
            value: budgetAvg, label: 'Budget', color: '#f08c00', dash: '6 4', strokeWidth: 1.5,
            labelPosition: 'right', labelBackground: '#ffec99'
          });
        }

        const barMarkers = [];
        if (state.legendVis.budget && state.drillStack.length === 0 && state.metric === 'revenue') {
          barMarkers.push({ values: BUDGET, color: '#f08c00', strokeWidth: 2 });
        }

        const sharedStyle = {
          animation: { duration: 600, easing: 'easeOutCubic' },
          fontFamily: "'Inter',sans-serif",
          monoFamily: "'JetBrains Mono',monospace",
          grid: { color: '#ebecf0', width: 1 },
          axis: { color: '#8993a4', fontSize: 11 },
          background: '#ffffff',
          tooltip: { background: '#1a1d23', color: '#e8eaed', borderRadius: 6, fontSize: 11, padding: 10 }
        };

        const hasBudget = state.drillStack.length === 0 && state.metric === 'revenue';
        const tableConfig = {
          enabled: show === 'table' || show === 'split',
          viewMode: show,
          maxHeight: 200,
          columns: [
            { key: '_label', label: 'Period', align: 'left' },
            { key: datasets[0]?.label || 'Value', label: isSEK ? 'Revenue' : 'Count', align: 'right', mono: true,
              render: (row, ri) => isSEK ? fmtSEK(data[ri].value * mult) : fmt(data[ri].value) },
            ...(datasets.length > 1 ? [{ key: datasets[1]?.label || 'Prev', label: 'Prev. Period', align: 'right', mono: true,
              render: (row, ri) => data[ri].prev ? (isSEK ? fmtSEK(data[ri].prev * mult) : fmt(data[ri].prev)) : '\u2013' }] : []),
            { key: '_change', label: 'Change', align: 'right',
              render: (row, ri) => data[ri].prev ? makeBadge(pctChange(data[ri].value, data[ri].prev)) : '\u2013' },
            ...(hasBudget ? [{ key: '_budget', label: 'Budget', align: 'right', mono: true,
              render: (row, ri) => data[ri].budget ? fmtSEK(data[ri].budget * mult) : '' }] : []),
            { key: '_status', label: 'Status', align: 'center',
              render: (row, ri) => {
                const d = data[ri];
                const chg = d.prev ? pctChange(d.value, d.prev) : 0;
                return d.budget
                  ? '<span class="status-dot ' + statusDotClass(d.value, d.budget) + '"></span>'
                  : '<span style="color:' + (chg >= 0 ? 'var(--success)' : 'var(--danger)') + '">&#9679;</span>';
              }
            }
          ]
        };

        if (state.chartType === 'bar') {
          barChartInstance = NewChart.create('#bar-chart-container', {
            type: 'bar',
            data: { labels, datasets },
            style: { ...sharedStyle, bar: { borderRadius: 4, gap: 0.15 } },
            options: {
              responsive: true,
              legend: { enabled: false },
              padding: 20,
              referenceLines,
              barMarkers,
              table: tableConfig
            }
          });
        } else {
          lineChartInstance = NewChart.create('#bar-chart-container', {
            type: 'line',
            data: { labels, datasets },
            style: { ...sharedStyle, line: { width: 2.5, tension: 0.3, pointRadius: 5, pointBorderWidth: 2.5, pointBorderColor: '#ffffff' } },
            options: {
              responsive: true,
              smooth: true,
              showPoints: true,
              fill: state.legendVis.current,
              legend: { enabled: false },
              padding: 20,
              table: tableConfig
            }
          });
        }

        container.addEventListener('dblclick', handleDrillDown);
      }

      function handleDrillDown(e) {
        if (state.drillStack.length >= 2) return;
        const data = getCurrentData();
        const container = document.getElementById('bar-chart-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        const idx = Math.min(data.length - 1, Math.max(0, Math.floor(pct * data.length)));
        const d = data[idx];

        if (state.drillStack.length === 0) {
          const weeks = genWeeks(d.value);
          state.drillStack.push({
            label: d.label,
            data: weeks.map(w => ({ ...w, prev: Math.round(w.value * 0.82), budget: null }))
          });
        } else if (state.drillStack.length === 1) {
          const days = genDays(d.value);
          state.drillStack.push({
            label: d.label,
            data: days.map(dy => ({ ...dy, prev: Math.round(dy.value * 0.85), budget: null }))
          });
        }

        updateBreadcrumbs();
        renderBarChart();
      }

      /* ═══ BREADCRUMBS ═══ */
      function updateBreadcrumbs() {
        const bc = document.getElementById('breadcrumbs');
        const title = document.getElementById('chart-title');
        if (!bc || !title) return;

        if (state.drillStack.length === 0) {
          bc.style.display = 'none';
          title.style.display = '';
          return;
        }

        bc.style.display = 'flex';
        title.style.display = 'none';

        let html = '<button data-drill="-1" title="Home">' +
          '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4c6ef5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M2 8l6-5.5L14 8"/><path d="M3.5 9v5a.5.5 0 00.5.5h3v-3.5h2v3.5h3a.5.5 0 00.5-.5V9"/></svg></button>';

        state.drillStack.forEach((s, i) => {
          const isCurrent = i === state.drillStack.length - 1;
          html += '<span class="sep">&#8250;</span>';
          html += '<button' + (isCurrent ? ' class="current"' : ' data-drill="' + i + '"') + '>' + s.label + '</button>';
        });

        bc.innerHTML = html;

        bc.querySelectorAll('button[data-drill]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.drill);
            if (idx === -1) state.drillStack = [];
            else state.drillStack = state.drillStack.slice(0, idx + 1);
            updateBreadcrumbs();
            renderBarChart();
          });
        });
      }

      /* ═══ LEGEND ═══ */
      function renderBarLegend() {
        const items = [
          { key: 'current', label: '2026', color: SERIES_COLORS[0] },
          { key: 'previous', label: '2025', color: COMPARE_COLOR, ref: true },
          ...(state.metric === 'revenue' ? [{ key: 'budget', label: 'Budget', color: '#f08c00', ref: true }] : []),
          { key: 'average', label: 'Average', color: '#868e96', ref: true },
        ];

        const el = document.getElementById('bar-legend');
        if (!el) return;

        el.innerHTML = items.map(it => {
          const vis = state.legendVis[it.key] !== false;
          return '<button class="legend-item' + (vis ? '' : ' hidden') + '" data-key="' + it.key + '">' +
            '<span class="legend-swatch" style="background:' + (vis ? it.color : 'var(--text-faint)') + '"></span>' +
            it.label +
            (it.ref ? ' <span class="legend-ref">(ref)</span>' : '') +
            '</button>';
        }).join('');

        el.querySelectorAll('.legend-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const k = btn.dataset.key;
            state.legendVis[k] = state.legendVis[k] === false ? true : false;
            renderBarLegend();
            renderBarChart();
          });
        });
      }

      /* ═══ DONUT CHART ═══ */
      function renderDonutChart() {
        const raw = state.donutSource === 'channel' ? CHANNEL_DATA : CATEGORY_DATA;
        const data = raw.filter((_, i) => state.donutLegendVis[i] !== false);
        const show = state.donutView;
        const chartWrap = document.querySelector('.donut-chart-wrap');
        const tableWrap = document.getElementById('donut-table-container');

        if (chartWrap) chartWrap.style.display = (show === 'chart' || show === 'split') ? '' : 'none';
        if (tableWrap) tableWrap.style.display = (show === 'table' || show === 'split') ? '' : 'none';

        if (donutChartInstance) { donutChartInstance.destroy(); donutChartInstance = null; }
        if (_donutTable) { _donutTable.destroy(); _donutTable = null; }

        const colors = data.map(d => SERIES_COLORS[raw.indexOf(d) % SERIES_COLORS.length]);
        const isChannel = state.donutSource === 'channel';
        const rawTotal = raw.reduce((s, x) => s + x.value, 0);

        if (show === 'chart' || show === 'split') {
          const container = document.getElementById('donut-chart-container');
          if (container) {
            container.innerHTML = '';

            donutChartInstance = NewChart.create('#donut-chart-container', {
              type: 'pie',
              data: {
                labels: data.map(d => d.label),
                datasets: [{ values: data.map(d => d.value), colors }]
              },
              style: {
                pie: { innerRadius: 50, borderWidth: 2, borderColor: '#ffffff' },
                animation: { duration: 600, easing: 'easeOutCubic' },
                fontFamily: "'Inter',sans-serif",
                monoFamily: "'JetBrains Mono',monospace",
                fontColor: '#172b4d',
                background: '#ffffff',
                tooltip: { background: '#1a1d23', color: '#e8eaed', borderRadius: 6, fontSize: 11, padding: 10 }
              },
              options: {
                responsive: true,
                legend: { enabled: false },
                labels: { enabled: false },
                padding: 10,
                onClick: function (info) {
                  console.log('Donut slice clicked:', info.label, info.value, info.percent.toFixed(1) + '%');
                },
                onHover: function (sliceIndex) {
                  if (_donutTable) _donutTable.highlightRow(sliceIndex);
                },
                onHoverEnd: function () {
                  if (_donutTable) _donutTable.clearHighlight();
                }
              }
            });
          }
        }

        if ((show === 'table' || show === 'split') && tableWrap) {
          tableWrap.innerHTML = '';
          _donutTable = new NewChart.DataTable(tableWrap, {
            enabled: true,
            viewMode: 'table',
            fontFamily: "'Inter',sans-serif",
            monoFamily: "'JetBrains Mono',monospace"
          });

          _donutTable.onHover(
            (index) => {
              if (donutChartInstance && donutChartInstance.highlightSlice) donutChartInstance.highlightSlice(index);
            },
            () => {
              if (donutChartInstance && donutChartInstance.clearHighlight) donutChartInstance.clearHighlight();
            }
          );

          _donutTable.setData(
            { labels: data.map(d => d.label), datasets: [{ label: 'Value', values: data.map(d => d.value) }] },
            {
              columns: [
                { key: '_label', label: isChannel ? 'Channel' : 'Category', align: 'left',
                  render: (row, ri) => {
                    const color = colors[ri] || SERIES_COLORS[ri % SERIES_COLORS.length];
                    return '<span style="display:inline-flex;align-items:center;gap:8px">' +
                      '<span style="width:10px;height:10px;border-radius:3px;background:' + color + ';flex-shrink:0"></span>' +
                      data[ri].label + '</span>';
                  }
                },
                { key: '_revenue', label: 'Revenue', align: 'right', mono: true,
                  render: (row, ri) => fmtSEK(data[ri].value * 1000) },
                { key: '_share', label: 'Share', align: 'right', mono: true,
                  render: (row, ri) => ((data[ri].value / rawTotal) * 100).toFixed(1) + '%' },
                { key: '_extra', label: isChannel ? 'YoY' : 'Margin', align: 'right',
                  render: (row, ri) => {
                    const d = data[ri];
                    return isChannel ? makeBadge(pctChange(d.value, d.prev)) : '<span style="font-family:var(--mono)">' + d.margin + '%</span>';
                  }
                }
              ]
            }
          );
        }

        renderDonutLegend(raw);
      }

      function renderDonutLegend(raw) {
        const el = document.getElementById('donut-legend');
        if (!el) return;

        el.innerHTML = raw.map((d, i) => {
          const vis = state.donutLegendVis[i] !== false;
          return '<button class="legend-item' + (vis ? '' : ' hidden') + '" data-idx="' + i + '">' +
            '<span class="legend-swatch" style="background:' + (vis ? SERIES_COLORS[i % SERIES_COLORS.length] : 'var(--text-faint)') + '"></span>' +
            d.label + '</button>';
        }).join('');

        el.querySelectorAll('.legend-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            state.donutLegendVis[idx] = state.donutLegendVis[idx] === false ? true : false;
            renderDonutChart();
          });
        });
      }

      /* ═══ CSV EXPORT ═══ */
      function exportCSV() {
        const data = getCurrentData();
        const isSEK = state.metric === 'revenue' || state.metric === 'aov';
        const mult = state.metric === 'aov' ? 1 : 1000;
        const header = ['Period', state.metric === 'revenue' ? 'Revenue' : state.metric === 'orders' ? 'Orders' : 'AOV', 'Previous'];
        const csv = [header.join(';'), ...data.map(d => [d.label, d.value * mult, (d.prev || 0) * mult].join(';'))].join('\n');
        downloadCSV(csv, state.metric + '_export.csv');
      }

      function exportDonutCSV() {
        const raw = state.donutSource === 'channel' ? CHANNEL_DATA : CATEGORY_DATA;
        const isChannel = state.donutSource === 'channel';
        const header = [isChannel ? 'Channel' : 'Category', 'Revenue', isChannel ? 'Previous' : 'Margin'];
        const csv = [header.join(';'), ...raw.map(d => {
          return [d.label, d.value * 1000, isChannel ? (d.prev * 1000) : d.margin].join(';');
        })].join('\n');
        downloadCSV(csv, state.donutSource + '_export.csv');
      }

      function downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      /* ═══ EVENT BINDING ═══ */
      function setupSeg(id, onChange) {
        const seg = document.getElementById(id);
        if (!seg) return;
        seg.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            seg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            onChange(btn.dataset.val);
          });
        });
      }

      function setupEvents() {
        document.querySelectorAll('.tab-bar button[data-tab]').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-bar button[data-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeTab = btn.dataset.tab;
            const panelBar = document.getElementById('panel-bar');
            const panelDonut = document.getElementById('panel-donut');
            if (panelBar) panelBar.style.display = state.activeTab === 'bar' ? '' : 'none';
            if (panelDonut) panelDonut.style.display = state.activeTab === 'donut' ? '' : 'none';
            if (state.activeTab === 'donut') renderDonutChart();
          });
        });

        document.querySelectorAll('#chart-type-switch button').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('#chart-type-switch button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.chartType = btn.dataset.type;
            renderBarChart();
          });
        });

        setupSeg('view-mode-seg', val => { state.viewMode = val; renderBarChart(); });
        setupSeg('donut-view-seg', val => { state.donutView = val; renderDonutChart(); });
        setupSeg('donut-source-seg', val => {
          state.donutSource = val;
          state.donutLegendVis = {};
          renderDonutChart();
        });
        setupSeg('period-seg', () => { /* period change - visual only for demo */ });

        const btnExport = document.getElementById('btn-export');
        const btnDonutExport = document.getElementById('btn-donut-export');
        if (btnExport) btnExport.addEventListener('click', exportCSV);
        if (btnDonutExport) btnDonutExport.addEventListener('click', exportDonutCSV);
      }

      /* ═══ INIT ═══ */
      const todayEl = document.getElementById('today-date');
      const liveEl = document.getElementById('live-time');
      if (todayEl) todayEl.textContent = new Date().toLocaleDateString('en-US');
      if (liveEl) liveEl.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      liveInterval = setInterval(() => {
        const el = document.getElementById('live-time');
        if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }, 60000);

      setupEvents();
      renderKPIs();
      renderGauges();
      renderBarLegend();
      renderBarChart();
      updateBreadcrumbs();

      /* ═══ CLEANUP ═══ */
      return () => {
        if (liveInterval) clearInterval(liveInterval);
        kpiInstances.forEach(inst => inst.destroy());
        gaugeInstances.forEach(g => g.destroy());
        if (barChartInstance) barChartInstance.destroy();
        if (lineChartInstance) lineChartInstance.destroy();
        if (donutChartInstance) donutChartInstance.destroy();
        if (_donutTable) _donutTable.destroy();
      };
    }
  };
}
