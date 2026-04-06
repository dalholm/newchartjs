/**
 * E-Commerce Dashboard — Nordic Outdoors
 * Showcases: Funnel, Sankey, Treemap, Heatmap, Waterfall, Bullet, Cohort + KPI cards
 */
export default function ecommerceView() {
  return {
    title: 'Nordic Outdoors — E-Commerce Dashboard',
    pageClass: 'ecom-page',
    style: `
      /* ═══ LAYOUT ═══ */
      .ecom { padding: 16px 20px; max-width: 1400px; margin: 0 auto; }
      .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
      .header-left { display:flex; align-items:center; gap:10px; }
      .logo { width:28px; height:28px; border-radius:6px; background:#0ca678; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
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

      /* ═══ KPI ROW ═══ */
      .kpi-row { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
      .kpi { flex:1 1 0; min-width:150px; }

      /* ═══ GRID ═══ */
      .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
      .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:16px; }
      .full-width { margin-bottom:16px; }

      /* ═══ CHART CARD ═══ */
      .chart-card { background:var(--surface); border-radius:var(--radius-lg); border:1px solid var(--border);
        box-shadow:var(--shadow); overflow:hidden; }
      .card-header { padding:12px 16px; border-bottom:1px solid var(--border-light); display:flex; align-items:center; justify-content:space-between; }
      .card-title { font-size:12px; font-weight:600; color:var(--text); }
      .card-subtitle { font-size:10px; color:var(--text-muted); margin-top:2px; }
      .card-body { padding:16px; }
      .card-body-flush { padding:0; }

      /* ═══ SECTION HEADING ═══ */
      .section-heading { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase;
        letter-spacing:0.8px; margin-bottom:10px; margin-top:8px; }

      /* ═══ FOOTER ═══ */
      .ecom-footer { margin-top:12px; display:flex; justify-content:space-between; font-size:10px;
        color:var(--text-faint); padding:0 4px; flex-wrap:wrap; gap:8px; }

      /* ═══ ANIMATIONS ═══ */
      @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      .animate-in { animation: fadeUp 0.3s ease-out both; }

      /* ═══ RESPONSIVE ═══ */
      @media (max-width: 900px) {
        .grid-2, .grid-3 { grid-template-columns: 1fr; }
        .kpi-row { flex-direction:column; }
        .kpi { min-width:100%; }
      }
    `,
    html: `
      <div class="ecom">
        <!-- HEADER -->
        <div class="header">
          <div class="header-left">
            <div class="logo">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L2 5v6l6 4 6-4V5L8 1z" stroke="#fff" stroke-width="1.5" fill="none"/>
                <path d="M8 6v5m-3-2.5L8 11l3-2.5" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h1>E-Commerce Analytics</h1>
              <span class="subtitle">Nordic Outdoors &middot; <span id="ecom-date"></span></span>
            </div>
          </div>
          <div class="header-right">
            <div class="seg" id="ecom-period">
              <button data-val="7d">7D</button>
              <button data-val="30d" class="active">30D</button>
              <button data-val="90d">90D</button>
              <button data-val="ytd">YTD</button>
            </div>
            <div class="date-badge">Mar 2026</div>
          </div>
        </div>

        <!-- KPI ROW -->
        <div class="kpi-row" id="ecom-kpi-row"></div>

        <!-- ROW 1: Funnel + Sankey -->
        <div class="section-heading">Conversion & Traffic Flow</div>
        <div class="grid-2">
          <div class="chart-card animate-in" style="animation-delay:0.1s">
            <div class="card-header">
              <div>
                <div class="card-title">Conversion Funnel</div>
                <div class="card-subtitle">Last 30 days &middot; All channels</div>
              </div>
            </div>
            <div class="card-body" id="ecom-funnel" style="height:320px;"></div>
          </div>
          <div class="chart-card animate-in" style="animation-delay:0.15s">
            <div class="card-header">
              <div>
                <div class="card-title">Revenue Flow</div>
                <div class="card-subtitle">Traffic source &rarr; Category &rarr; Outcome</div>
              </div>
            </div>
            <div class="card-body" id="ecom-sankey" style="height:320px;"></div>
          </div>
        </div>

        <!-- ROW 2: Treemap + Bullet -->
        <div class="section-heading">Product Performance</div>
        <div class="grid-2">
          <div class="chart-card animate-in" style="animation-delay:0.2s">
            <div class="card-header">
              <div>
                <div class="card-title">Revenue by Category</div>
                <div class="card-subtitle">Size = revenue, label = YoY growth</div>
              </div>
            </div>
            <div class="card-body" id="ecom-treemap" style="height:300px;"></div>
          </div>
          <div class="chart-card animate-in" style="animation-delay:0.25s">
            <div class="card-header">
              <div>
                <div class="card-title">Category vs Target</div>
                <div class="card-subtitle">Actual revenue vs quarterly target</div>
              </div>
            </div>
            <div class="card-body" id="ecom-bullet" style="height:300px;"></div>
          </div>
        </div>

        <!-- ROW 3: Heatmap + Waterfall -->
        <div class="section-heading">Patterns & Financials</div>
        <div class="grid-2">
          <div class="chart-card animate-in" style="animation-delay:0.3s">
            <div class="card-header">
              <div>
                <div class="card-title">Orders by Hour & Day</div>
                <div class="card-subtitle">Peak ordering patterns, last 30 days</div>
              </div>
            </div>
            <div class="card-body" id="ecom-heatmap" style="height:300px;"></div>
          </div>
          <div class="chart-card animate-in" style="animation-delay:0.35s">
            <div class="card-header">
              <div>
                <div class="card-title">Revenue Bridge</div>
                <div class="card-subtitle">Gross to net revenue breakdown</div>
              </div>
            </div>
            <div class="card-body" id="ecom-waterfall" style="height:300px;"></div>
          </div>
        </div>

        <!-- ROW 4: Cohort (full width) -->
        <div class="section-heading">Customer Retention</div>
        <div class="full-width">
          <div class="chart-card animate-in" style="animation-delay:0.4s">
            <div class="card-header">
              <div>
                <div class="card-title">Monthly Cohort Retention</div>
                <div class="card-subtitle">% of customers returning in subsequent months</div>
              </div>
            </div>
            <div class="card-body" id="ecom-cohort" style="height:320px;"></div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="ecom-footer">
          <span>Source: Nordic Outdoors Analytics API &middot; All amounts in SEK &middot; Powered by NewChart.js v0.1.0</span>
          <span>7 chart types in one dashboard</span>
        </div>
      </div>
    `,
    mount() {
      /* ═══ UTILITIES ═══ */
      function fmt(n) {
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (n >= 1e4) return Math.round(n / 1e3) + 'k';
        if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
        return n.toLocaleString('en-US');
      }

      const sharedStyle = {
        animation: { duration: 600, easing: 'easeOutCubic' },
        fontFamily: "'Inter',sans-serif",
        monoFamily: "'JetBrains Mono',monospace",
        background: '#ffffff',
        tooltip: { background: '#1a1d23', color: '#e8eaed', borderRadius: 6, fontSize: 11, padding: 10 }
      };

      /* ═══ DATE ═══ */
      const dateEl = document.getElementById('ecom-date');
      if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US');

      /* ═══ PERIOD SEGMENT (visual only for demo) ═══ */
      const periodSeg = document.getElementById('ecom-period');
      if (periodSeg) {
        periodSeg.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            periodSeg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          });
        });
      }

      const instances = [];

      /* ═══ KPI CARDS ═══ */
      const kpiRow = document.getElementById('ecom-kpi-row');
      if (kpiRow) {
        const kpis = [
          { label: 'Revenue', value: 4280000, previous: 3640000, suffix: ' SEK',
            sparkline: { values: [310,340,290,380,360,420,350,390,410,370,440,480] } },
          { label: 'Orders', value: 8420, previous: 7180, suffix: '',
            sparkline: { values: [620,680,590,740,710,810,680,760,800,720,860,930] } },
          { label: 'Conversion', value: 3.2, previous: 2.8, suffix: '%', decimals: 1,
            sparkline: { values: [2.6,2.8,2.7,3.0,2.9,3.2,3.0,3.1,3.3,3.1,3.4,3.2] } },
          { label: 'AOV', value: 508, previous: 507, suffix: ' SEK',
            sparkline: { values: [490,495,500,510,505,520,508,515,512,505,520,508] } },
          { label: 'Return Rate', value: 4.1, previous: 5.2, suffix: '%', decimals: 1, invertTrend: true,
            sparkline: { values: [5.8,5.4,5.1,4.9,4.7,4.5,4.3,4.2,4.1,4.0,4.1,4.1] } },
        ];

        kpis.forEach((k, i) => {
          const el = document.createElement('div');
          el.className = 'kpi animate-in';
          el.style.animationDelay = (i * 0.05) + 's';
          kpiRow.appendChild(el);

          const card = NewChart.kpiCard(el, {
            label: k.label,
            value: k.value,
            previous: k.previous,
            suffix: k.suffix,
            decimals: k.decimals || 0,
            sparkline: k.sparkline,
            invertTrend: k.invertTrend || false,
          });
          instances.push(card);
        });
      }

      /* ═══ FUNNEL CHART ═══ */
      const funnelEl = document.getElementById('ecom-funnel');
      if (funnelEl) {
        instances.push(NewChart.create('#ecom-funnel', {
          type: 'funnel',
          data: {
            labels: ['Sessions', 'Product Views', 'Add to Cart', 'Checkout', 'Purchase'],
            datasets: [{
              values: [264000, 158400, 42768, 29138, 8420]
            }]
          },
          style: { ...sharedStyle, funnel: { gap: 4, minWidth: 0.15 } },
          options: {
            responsive: true,
            padding: 16,
            legend: { enabled: false }
          }
        }));
      }

      /* ═══ SANKEY CHART ═══ */
      const sankeyEl = document.getElementById('ecom-sankey');
      if (sankeyEl) {
        instances.push(NewChart.create('#ecom-sankey', {
          type: 'sankey',
          data: {
            nodes: [
              { id: 'google', label: 'Google Ads' },
              { id: 'organic', label: 'Organic' },
              { id: 'direct', label: 'Direct' },
              { id: 'social', label: 'Social' },
              { id: 'email', label: 'Email' },
              { id: 'jackets', label: 'Jackets' },
              { id: 'boots', label: 'Boots' },
              { id: 'backpacks', label: 'Backpacks' },
              { id: 'tents', label: 'Tents' },
              { id: 'accessories', label: 'Accessories' },
              { id: 'purchased', label: 'Purchased' },
              { id: 'abandoned', label: 'Abandoned' },
            ],
            links: [
              { source: 'google', target: 'jackets', value: 420 },
              { source: 'google', target: 'boots', value: 310 },
              { source: 'google', target: 'backpacks', value: 180 },
              { source: 'google', target: 'tents', value: 90 },
              { source: 'organic', target: 'jackets', value: 350 },
              { source: 'organic', target: 'boots', value: 280 },
              { source: 'organic', target: 'backpacks', value: 220 },
              { source: 'organic', target: 'accessories', value: 150 },
              { source: 'direct', target: 'jackets', value: 290 },
              { source: 'direct', target: 'tents', value: 180 },
              { source: 'direct', target: 'boots', value: 130 },
              { source: 'social', target: 'accessories', value: 210 },
              { source: 'social', target: 'backpacks', value: 140 },
              { source: 'email', target: 'jackets', value: 180 },
              { source: 'email', target: 'boots', value: 120 },
              { source: 'jackets', target: 'purchased', value: 820 },
              { source: 'jackets', target: 'abandoned', value: 420 },
              { source: 'boots', target: 'purchased', value: 560 },
              { source: 'boots', target: 'abandoned', value: 280 },
              { source: 'backpacks', target: 'purchased', value: 380 },
              { source: 'backpacks', target: 'abandoned', value: 160 },
              { source: 'tents', target: 'purchased', value: 190 },
              { source: 'tents', target: 'abandoned', value: 80 },
              { source: 'accessories', target: 'purchased', value: 270 },
              { source: 'accessories', target: 'abandoned', value: 90 },
            ]
          },
          style: { ...sharedStyle },
          options: {
            responsive: true,
            padding: 16,
            legend: { enabled: false }
          }
        }));
      }

      /* ═══ TREEMAP CHART ═══ */
      const treemapEl = document.getElementById('ecom-treemap');
      if (treemapEl) {
        instances.push(NewChart.create('#ecom-treemap', {
          type: 'treemap',
          data: {
            labels: ['Jackets', 'Boots', 'Backpacks', 'Tents', 'Accessories', 'Sleeping Bags', 'Clothing', 'Cookware'],
            datasets: [{
              values: [1240, 840, 540, 480, 360, 320, 280, 220],
              growth: ['+18%', '+12%', '+24%', '+8%', '+31%', '-3%', '+15%', '+6%']
            }]
          },
          style: { ...sharedStyle },
          options: {
            responsive: true,
            padding: 8,
            legend: { enabled: false }
          }
        }));
      }

      /* ═══ BULLET CHART ═══ */
      const bulletEl = document.getElementById('ecom-bullet');
      if (bulletEl) {
        instances.push(NewChart.create('#ecom-bullet', {
          type: 'bullet',
          data: {
            datasets: [
              { label: 'Jackets', subtitle: 'k SEK', value: 1240, target: 1100, min: 0, max: 1500 },
              { label: 'Boots', subtitle: 'k SEK', value: 840, target: 900, min: 0, max: 1100 },
              { label: 'Backpacks', subtitle: 'k SEK', value: 540, target: 600, min: 0, max: 750 },
              { label: 'Tents', subtitle: 'k SEK', value: 480, target: 500, min: 0, max: 650 },
              { label: 'Accessories', subtitle: 'k SEK', value: 360, target: 300, min: 0, max: 450 },
              { label: 'Sleeping Bags', subtitle: 'k SEK', value: 320, target: 400, min: 0, max: 500 },
            ]
          },
          style: { ...sharedStyle },
          options: {
            responsive: true,
            padding: 16,
            legend: { enabled: false }
          }
        }));
      }

      /* ═══ HEATMAP CHART ═══ */
      const heatmapEl = document.getElementById('ecom-heatmap');
      if (heatmapEl) {
        // Generate realistic e-commerce order patterns (hour x day)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = [];
        for (let h = 6; h <= 23; h++) {
          hours.push(h.toString().padStart(2, '0') + ':00');
        }

        // Base patterns: morning spike, lunch spike, evening peak
        const hourWeights = [
          0.15, 0.25, 0.40, 0.55, 0.70, 0.85,  // 06-11
          0.95, 0.80, 0.65, 0.70, 0.75, 0.80,  // 12-17
          0.90, 1.00, 0.95, 0.75, 0.50, 0.30,  // 18-23
        ];
        const dayWeights = [0.85, 0.90, 0.95, 1.00, 0.90, 0.75, 0.65];

        const heatmapValues = [];
        days.forEach((_, di) => {
          const row = [];
          hours.forEach((_, hi) => {
            const base = hourWeights[hi] * dayWeights[di];
            const jitter = 0.85 + Math.random() * 0.3;
            row.push(Math.round(base * jitter * 120));
          });
          heatmapValues.push(row);
        });

        instances.push(NewChart.create('#ecom-heatmap', {
          type: 'heatmap',
          data: {
            labels: hours,
            yLabels: days,
            datasets: [{ values: heatmapValues }]
          },
          style: { ...sharedStyle },
          options: {
            responsive: true,
            padding: 8,
            legend: { enabled: false },
            showValues: true,
            showScale: true
          }
        }));
      }

      /* ═══ WATERFALL CHART ═══ */
      const waterfallEl = document.getElementById('ecom-waterfall');
      if (waterfallEl) {
        instances.push(NewChart.create('#ecom-waterfall', {
          type: 'waterfall',
          data: {
            labels: ['Gross Revenue', 'Discounts', 'Returns', 'Shipping', 'Payment Fees', 'VAT', 'Net Revenue'],
            datasets: [{
              values: [4280, -385, -176, -214, -86, -856, 0],
              types: ['increase', 'decrease', 'decrease', 'decrease', 'decrease', 'decrease', 'total']
            }]
          },
          style: { ...sharedStyle },
          options: {
            responsive: true,
            padding: 16,
            legend: { enabled: false },
            valueSuffix: 'k SEK'
          }
        }));
      }

      /* ═══ COHORT CHART ═══ */
      const cohortEl = document.getElementById('ecom-cohort');
      if (cohortEl) {
        instances.push(NewChart.create('#ecom-cohort', {
          type: 'cohort',
          data: {
            labels: ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'],
            periodLabels: ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'],
            datasets: [{
              values: [
                [100, 38, 24, 18, 14, 11],
                [100, 41, 27, 20, 16, null],
                [100, 45, 30, 22, null, null],
                [100, 42, 28, null, null, null],
                [100, 44, null, null, null, null],
                [100, null, null, null, null, null],
              ],
              cohortSizes: [1240, 1380, 1860, 1420, 1510, 1680]
            }]
          },
          style: { ...sharedStyle },
          options: {
            responsive: true,
            padding: 8,
            legend: { enabled: false }
          }
        }));
      }

      /* ═══ CLEANUP ═══ */
      return () => {
        instances.forEach(inst => {
          if (inst && inst.destroy) inst.destroy();
        });
      };
    }
  };
}
