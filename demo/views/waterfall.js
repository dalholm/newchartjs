/**
 * Waterfall Chart view
 */
import api from '../api.js';

export default function waterfallView() {
  return {
    title: 'Waterfall Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Waterfall Chart</h1>
        <p>Bridge/waterfall diagrams for revenue breakdown, cost analysis, and running totals.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Revenue Breakdown</h2><p>From gross revenue to net — discounts, returns, shipping, fees</p></div>
          <div class="example-body"><div class="chart-container" id="chart-waterfall-revenue"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Monthly Revenue Changes</h2><p>Month-over-month delta with H1 total</p></div>
          <div class="example-body"><div class="chart-container" id="chart-waterfall-monthly"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      Promise.all([
        api.getWaterfallRevenue(),
        api.getWaterfallMonthly()
      ]).then(([revenue, monthly]) => {
        charts.push(NewChart.create('#chart-waterfall-revenue', {
          type: 'waterfall',
          data: revenue
        }));

        charts.push(NewChart.create('#chart-waterfall-monthly', {
          type: 'waterfall',
          data: monthly
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
