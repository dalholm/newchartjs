/**
 * KPI Comparison Card view
 */
import api from '../api.js';

export default function kpicomparisonView() {
  return {
    title: 'KPI Comparison Card',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>KPI Comparison Card</h1>
        <p>Enhanced KPI cards with sparkline, target progress, trend badge, and status indicators.</p>
      </div>
      <div class="examples">
        <div class="example-card" style="max-width:100%;">
          <div class="example-header"><h2>E-Commerce KPI Dashboard</h2><p>Key metrics with sparklines, targets, and period comparison</p></div>
          <div class="example-body">
            <div id="kpi-comparison-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;padding:8px;"></div>
          </div>
        </div>
      </div>
    `,
    mount() {
      const cards = [];

      api.getKPIComparison().then(kpis => {
        const grid = document.querySelector('#kpi-comparison-grid');
        if (!grid) return;

        kpis.forEach(kpi => {
          const el = document.createElement('div');
          grid.appendChild(el);
          cards.push(NewChart.kpiComparisonCard(el, kpi));
        });
      });

      return () => cards.forEach(c => c?.destroy());
    }
  };
}
