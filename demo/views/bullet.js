/**
 * Bullet Chart view
 */
import api from '../api.js';

export default function bulletView() {
  return {
    title: 'Bullet Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Bullet Chart</h1>
        <p>Compact target-vs-actual comparison — Stephen Few's bullet graph for KPI dashboards.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>E-Commerce KPI Dashboard</h2><p>Actual performance vs targets with previous period markers</p></div>
          <div class="example-body"><div class="chart-container" id="chart-bullet-kpis" style="min-height:360px;"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      api.getBulletKPIs().then(kpis => {
        charts.push(NewChart.create('#chart-bullet-kpis', {
          type: 'bullet',
          data: {
            datasets: kpis.map((k, i) => ({
              label: k.label,
              subtitle: k.subtitle,
              value: k.value,
              target: k.target,
              comparative: k.comparative,
              min: k.min,
              max: k.max
            }))
          }
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
