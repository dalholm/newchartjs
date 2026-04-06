/**
 * Sparkline Chart view
 */
import api from '../api.js';

export default function sparklineView() {
  return {
    title: 'Sparkline Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Sparkline Chart</h1>
        <p>Compact inline charts without axes — for KPI cards, table cells, and status overviews.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>KPI Cards with Trend Lines</h2><p>Typical ERP dashboard top row — large value + sparkline trend</p></div>
          <div class="example-body"><div class="kpi-grid" id="kpi-grid"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Product Table with Trend Column</h2><p>Sparklines in table cells — showing 12-month trend per product row</p></div>
          <div class="example-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="right">Revenue</th>
                  <th>Trend (12m)</th>
                  <th class="right">Change</th>
                </tr>
              </thead>
              <tbody id="product-table"></tbody>
            </table>
          </div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Variants: line, area, bar</h2><p>Three rendering modes — same data, different visual style</p></div>
          <div class="example-body"><div class="variant-row" id="variant-row"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Bar Sparklines with Negative Values</h2><p>Shows daily changes — negative bars in red</p></div>
          <div class="example-body"><div class="kpi-grid" id="change-grid"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>With Reference Line</h2><p>Dashed zero line or target value — shows where trend sits relative to target</p></div>
          <div class="example-body"><div class="variant-row" id="ref-row"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      Promise.all([
        api.getKPISummary(),
        api.getProductTable(),
        api.getChanges()
      ]).then(([kpis, products, changes]) => {

        // 1. KPI Cards
        const kpiGrid = document.getElementById('kpi-grid');
        if (!kpiGrid) return;

        kpis.forEach(kpi => {
          const card = document.createElement('div');
          card.className = 'kpi-card';
          const isUp = kpi.change >= 0;
          const id = 'spark-' + kpi.label.toLowerCase().replace(/[^a-z]/g, '');
          card.innerHTML = `
            <div class="kpi-label">${kpi.label}</div>
            <div class="kpi-row">
              <div class="kpi-value">${kpi.value}</div>
              <div class="kpi-spark" id="${id}"></div>
            </div>
            <div class="kpi-change ${isUp ? 'up' : 'down'}">${isUp ? '&#9650;' : '&#9660;'} ${Math.abs(kpi.change).toFixed(1)}%</div>
          `;
          kpiGrid.appendChild(card);

          setTimeout(() => {
            charts.push(NewChart.create(`#${id}`, {
              type: 'sparkline',
              data: { datasets: [{ values: kpi.trend }] },
              options: { variant: 'area' }
            }));
          }, 0);
        });

        // 2. Product table
        const tbody = document.getElementById('product-table');
        if (!tbody) return;

        products.forEach((p, i) => {
          const tr = document.createElement('tr');
          const isUp = p.change >= 0;
          tr.innerHTML = `
            <td class="name">${p.name}</td>
            <td class="right">${p.revenue} k</td>
            <td><div class="table-spark" id="table-spark-${i}"></div></td>
            <td class="right"><span class="badge ${isUp ? 'up' : 'down'}">${isUp ? '&#9650;' : '&#9660;'} ${Math.abs(p.change).toFixed(1)}%</span></td>
          `;
          tbody.appendChild(tr);

          setTimeout(() => {
            charts.push(NewChart.create(`#table-spark-${i}`, {
              type: 'sparkline',
              data: { datasets: [{ values: p.trend }] },
              options: { variant: 'line' }
            }));
          }, 0);
        });

        // 3. Variants
        const variantData = [28,32,25,38,34,42,30,36,40,35,44,48];
        const variants = ['line', 'area', 'bar'];
        const variantRow = document.getElementById('variant-row');
        if (!variantRow) return;

        variants.forEach(v => {
          const item = document.createElement('div');
          item.className = 'variant-item';
          item.innerHTML = `
            <div class="spark-demo" style="width:140px;height:40px;" id="variant-${v}"></div>
            <div class="label">${v}</div>
          `;
          variantRow.appendChild(item);

          setTimeout(() => {
            charts.push(NewChart.create(`#variant-${v}`, {
              type: 'sparkline',
              data: { datasets: [{ values: variantData }] },
              options: { variant: v }
            }));
          }, 0);
        });

        // 4. Bar sparklines with negatives
        const changeItems = [
          { label: 'Margin Change', data: changes.margin },
          { label: 'Inventory Level Delta', data: changes.inventory }
        ];
        const changeGrid = document.getElementById('change-grid');
        if (!changeGrid) return;

        changeItems.forEach((c, i) => {
          const card = document.createElement('div');
          card.className = 'kpi-card';
          card.innerHTML = `
            <div class="kpi-label">${c.label}</div>
            <div style="width:200px;height:40px;margin-top:8px;" id="change-spark-${i}"></div>
          `;
          changeGrid.appendChild(card);

          setTimeout(() => {
            charts.push(NewChart.create(`#change-spark-${i}`, {
              type: 'sparkline',
              data: { datasets: [{ values: c.data }] },
              options: { variant: 'bar', highlightLast: false },
              style: { sparkline: { negativeColor: '#e03131' } }
            }));
          }, 0);
        });

        // 5. Reference lines
        const refRow = document.getElementById('ref-row');
        if (!refRow) return;

        const refExamples = [
          { label: 'Zero Line', data: [2,-1,3,-2,1,4,-1,2,3,-1,2,5], ref: 0, color: '#4c6ef5' },
          { label: 'Target Line (400)', data: [380,390,410,395,420,405,430,415,440,425,450,460], ref: 400, color: '#0ca678' },
          { label: 'Avg Ref', data: [50,55,48,62,58,70,52,65,72,60,78,82], ref: 62.7, color: '#7048e8' }
        ];

        refExamples.forEach((r, i) => {
          const item = document.createElement('div');
          item.className = 'variant-item';
          item.innerHTML = `
            <div class="spark-demo" style="width:160px;height:44px;" id="ref-spark-${i}"></div>
            <div class="label">${r.label}</div>
          `;
          refRow.appendChild(item);

          setTimeout(() => {
            charts.push(NewChart.create(`#ref-spark-${i}`, {
              type: 'sparkline',
              data: { datasets: [{ values: r.data }] },
              options: { variant: 'area', referenceLine: r.ref }
            }));
          }, 0);
        });
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
