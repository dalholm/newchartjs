/**
 * TrendBadge view
 */
export default function trendbadgeView() {
  return {
    title: 'TrendBadge',
    style: `
      .badge-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
      .demo-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .demo-table th { text-align: left; font-weight: 600; font-size: 11px; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 2px solid var(--border); }
      .demo-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
      .demo-table tr:last-child td { border-bottom: none; }
      .demo-table .cell-name { font-weight: 500; }
      .demo-table .cell-value { font-family: var(--mono); font-size: 12px; }
      .label { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-bottom: 2px; }
    `,
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>TrendBadge</h1>
        <p>Lightweight inline trend indicators with optional sparkline.
          Designed for tables, headers, toolbars, and anywhere you need a compact trend display.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header">
            <h2>Compact — Change Chip Only</h2>
            <p>Just the trend indicator, perfect for inline use in text or tight layouts</p>
          </div>
          <div class="example-body">
            <div class="badge-row" id="badges-compact"></div>
          </div>
        </div>

        <div class="example-card">
          <div class="example-header">
            <h2>Value + Change</h2>
            <p>Shows the formatted value alongside the trend chip</p>
          </div>
          <div class="example-body">
            <div class="badge-row" id="badges-value"></div>
          </div>
        </div>

        <div class="example-card">
          <div class="example-header">
            <h2>With Sparkline</h2>
            <p>Full variant: value, trend chip, and inline sparkline</p>
          </div>
          <div class="example-body">
            <div class="badge-row" id="badges-sparkline"></div>
          </div>
        </div>

        <div class="example-card">
          <div class="example-header">
            <h2>Sizes: sm / md / lg</h2>
            <p>Three size presets for different contexts</p>
          </div>
          <div class="example-body">
            <div class="badge-row" id="badges-sizes"></div>
          </div>
        </div>

        <div class="example-card">
          <div class="example-header">
            <h2>Inverted Color</h2>
            <p>Use <code>invertColor: true</code> when a decrease is positive (e.g., costs, errors, churn)</p>
          </div>
          <div class="example-body">
            <div class="badge-row" id="badges-inverted"></div>
          </div>
        </div>

        <div class="example-card">
          <div class="example-header">
            <h2>Table Integration</h2>
            <p>TrendBadge embedded in data table cells — the primary use case</p>
          </div>
          <div class="example-body">
            <table class="demo-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Revenue</th>
                  <th>Trend</th>
                  <th>12-Month</th>
                </tr>
              </thead>
              <tbody id="table-body"></tbody>
            </table>
          </div>
        </div>

        <div class="example-card">
          <div class="example-header">
            <h2>Reactive Update</h2>
            <p>Click the button to simulate live data</p>
          </div>
          <div class="example-body">
            <div id="badge-update" style="margin-bottom:12px;"></div>
            <button id="btn-update" style="padding:8px 16px; font-size:12px; font-family:var(--font);
              border:1px solid var(--border); border-radius:6px; cursor:pointer; background:var(--primary);
              color:#fff; font-weight:600;">Simulate Update</button>
          </div>
        </div>

        <div class="example-card">
          <div class="example-header">
            <h2>Usage</h2>
            <p>How to create trend badges</p>
          </div>
          <div class="example-body">
            <div class="code-hint">// Compact — just the change chip
NewChart.trendBadge('#el', { change: 12.3 });

// Value + change
NewChart.trendBadge('#el', {
  value: 38920, previous: 32410, suffix: ' kr'
});

// With sparkline
NewChart.trendBadge('#el', {
  value: 38920,
  previous: 32410,
  suffix: ' kr',
  sparkline: { values: [28,31,29,34,38], variant: 'area' }
});

// Inverted (lower = better)
NewChart.trendBadge('#el', {
  value: 3.2, previous: 4.1, suffix: '%',
  invertColor: true
});

// Update reactively
badge.update({ value: 41500, previous: 38920 });</div>
          </div>
        </div>
      </div>
    `,
    mount() {
      const badges = [];
      const SPARK_DATA = [2850,3120,2960,3480,3210,3650,2890,3340,3580,3120,3890,4210];

      // 1. Compact — change only
      const compactEl = document.getElementById('badges-compact');
      if (compactEl) {
        [
          { change: 12.3 },
          { change: -5.7 },
          { change: 0 },
          { change: 42.1 },
          { change: -0.3 }
        ].forEach(cfg => {
          const el = document.createElement('span');
          compactEl.appendChild(el);
          badges.push(NewChart.trendBadge(el, cfg));
        });
      }

      // 2. Value + change
      const valueEl = document.getElementById('badges-value');
      if (valueEl) {
        [
          { value: 38920000, previous: 32410000, suffix: ' kr' },
          { value: 5872, previous: 5453 },
          { value: 47.2, previous: 44.8, suffix: '%', decimals: 1 },
          { value: 6624, previous: 5943, suffix: ' kr' }
        ].forEach(cfg => {
          const el = document.createElement('span');
          valueEl.appendChild(el);
          badges.push(NewChart.trendBadge(el, cfg));
        });
      }

      // 3. With sparkline
      const sparkEl = document.getElementById('badges-sparkline');
      if (sparkEl) {
        [
          { value: 38920000, previous: 32410000, suffix: ' kr',
            sparkline: { values: SPARK_DATA, color: '#4c6ef5', variant: 'area' } },
          { value: 5872, previous: 5453,
            sparkline: { values: [412,468,431,502,478,528,419,487,519,453,564,611], color: '#0ca678', variant: 'line' } },
          { value: 47.2, previous: 44.8, suffix: '%', decimals: 1,
            sparkline: { values: [42,43,44,45,44,46,45,47,48,46,48,47], color: '#7048e8', variant: 'bar' } }
        ].forEach(cfg => {
          const el = document.createElement('span');
          sparkEl.appendChild(el);
          badges.push(NewChart.trendBadge(el, cfg));
        });
      }

      // 4. Sizes
      const sizesEl = document.getElementById('badges-sizes');
      if (sizesEl) {
        ['sm', 'md', 'lg'].forEach(size => {
          const wrap = document.createElement('div');
          const label = document.createElement('div');
          label.className = 'label';
          label.textContent = size;
          wrap.appendChild(label);
          const el = document.createElement('span');
          wrap.appendChild(el);
          sizesEl.appendChild(wrap);
          badges.push(NewChart.trendBadge(el, {
            value: 38920, previous: 32410, suffix: ' kr', size,
            sparkline: { values: SPARK_DATA, color: '#4c6ef5' }
          }));
        });
      }

      // 5. Inverted
      const invertedEl = document.getElementById('badges-inverted');
      if (invertedEl) {
        [
          { label: 'Return Rate', value: 3.2, previous: 4.1, suffix: '%', decimals: 1, invertColor: true },
          { label: 'Avg Response Time', value: 1.8, previous: 2.4, suffix: 's', decimals: 1, invertColor: true },
          { label: 'Error Rate', value: 0.8, previous: 0.5, suffix: '%', decimals: 1, invertColor: true }
        ].forEach(cfg => {
          const wrap = document.createElement('div');
          const label = document.createElement('div');
          label.className = 'label';
          label.textContent = cfg.label;
          wrap.appendChild(label);
          const el = document.createElement('span');
          wrap.appendChild(el);
          invertedEl.appendChild(wrap);
          badges.push(NewChart.trendBadge(el, cfg));
        });
      }

      // 6. Table integration
      const tableData = [
        { name: 'Widget Pro', rev: 12450000, prev: 11200000, spark: [890,920,880,960,940,1020,950,1040,1080,1010,1120,1190] },
        { name: 'Service Plan', rev: 8320000, prev: 7890000, spark: [620,640,660,650,680,690,700,710,690,720,710,730] },
        { name: 'Custom Build', rev: 4210000, prev: 4580000, spark: [420,410,400,390,380,370,360,350,340,350,340,330] },
        { name: 'Support Addon', rev: 2840000, prev: 2120000, spark: [160,170,180,200,210,230,220,240,250,260,270,280] }
      ];

      const tbody = document.getElementById('table-body');
      if (tbody) {
        tableData.forEach(row => {
          const tr = document.createElement('tr');

          const tdName = document.createElement('td');
          tdName.className = 'cell-name';
          tdName.textContent = row.name;
          tr.appendChild(tdName);

          const tdRev = document.createElement('td');
          tdRev.className = 'cell-value';
          tdRev.textContent = (row.rev / 1e6).toFixed(1) + 'M kr';
          tr.appendChild(tdRev);

          const tdTrend = document.createElement('td');
          const trendEl = document.createElement('span');
          tdTrend.appendChild(trendEl);
          tr.appendChild(tdTrend);
          badges.push(NewChart.trendBadge(trendEl, { value: row.rev, previous: row.prev, size: 'sm' }));

          const tdSpark = document.createElement('td');
          const sparkBadgeEl = document.createElement('span');
          tdSpark.appendChild(sparkBadgeEl);
          tr.appendChild(tdSpark);
          badges.push(NewChart.trendBadge(sparkBadgeEl, {
            sparkline: { values: row.spark, color: row.rev >= row.prev ? '#0ca678' : '#e03131', variant: 'area' },
            size: 'sm'
          }));

          tbody.appendChild(tr);
        });
      }

      // 7. Reactive update
      let updateBadge = null;
      let currentVal = 38920;
      let currentPrev = 32410;
      let sparkVals = SPARK_DATA.slice();

      const updateEl = document.getElementById('badge-update');
      if (updateEl) {
        updateBadge = NewChart.trendBadge(updateEl, {
          value: currentVal, previous: currentPrev, suffix: ' kr', size: 'lg',
          sparkline: { values: sparkVals, color: '#4c6ef5', variant: 'area' }
        });
        badges.push(updateBadge);
      }

      const btnUpdate = document.getElementById('btn-update');
      const handleUpdate = () => {
        if (!updateBadge) return;
        currentPrev = currentVal;
        currentVal += Math.round((Math.random() - 0.3) * 2000);
        sparkVals = sparkVals.slice();
        sparkVals.push(sparkVals[sparkVals.length - 1] + Math.round((Math.random() - 0.3) * 200));
        if (sparkVals.length > 12) sparkVals.shift();
        updateBadge.update({
          value: currentVal,
          previous: currentPrev,
          sparkline: { values: sparkVals, color: '#4c6ef5', variant: 'area' }
        });
      };
      if (btnUpdate) btnUpdate.addEventListener('click', handleUpdate);

      return () => {
        if (btnUpdate) btnUpdate.removeEventListener('click', handleUpdate);
        badges.forEach(b => b?.destroy());
      };
    }
  };
}
