/**
 * Bar Chart view
 */
import api from '../api.js';

export default function barView() {
  return {
    title: 'Bar Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Bar Chart</h1>
        <p>Vertical and horizontal bars, grouped, stacked, and 100% stacked — typical ERP scenarios.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Monthly Revenue</h2><p>Simple bar series with a budget reference line</p></div>
          <div class="example-body"><div class="chart-container" id="chart-revenue"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Current Year vs Previous Year</h2><p>Grouped bars for period comparison</p></div>
          <div class="example-body"><div class="chart-container" id="chart-comparison"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Revenue by Product Category (stacked)</h2><p>Stacked view shows totals and breakdown by category</p></div>
          <div class="example-body"><div class="chart-container" id="chart-stacked"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Cost Breakdown (100% stacked)</h2><p>Shows proportional breakdown per month — each bar sums to 100%</p></div>
          <div class="example-body"><div class="chart-container" id="chart-percent"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Budget vs Actual with Markers</h2><p>Per-bar budget markers show targets per month</p></div>
          <div class="example-body"><div class="chart-container" id="chart-markers"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      Promise.all([
        api.getRevenue(),
        api.getRevenueComparison(),
        api.getStackedCategories(),
        api.getCostBreakdown(),
      ]).then(([rev, comp, stacked, costs]) => {
        charts.push(NewChart.create('#chart-revenue', {
          type: 'bar',
          data: rev,
          options: {
            referenceLines: [{ value: 3200, label: 'Budget average', color: '#868e96', dash: '6 4' }]
          }
        }));

        charts.push(NewChart.create('#chart-comparison', {
          type: 'bar',
          data: comp
        }));

        charts.push(NewChart.create('#chart-stacked', {
          type: 'bar',
          data: stacked,
          options: { stacked: true }
        }));

        charts.push(NewChart.create('#chart-percent', {
          type: 'bar',
          data: costs,
          options: { stacked: 'percent' }
        }));

        charts.push(NewChart.create('#chart-markers', {
          type: 'bar',
          data: {
            labels: api.MONTHS,
            datasets: [{ label: 'Actual (k)', values: rev.datasets[0].values }]
          },
          options: {
            barMarkers: [{ label: 'Budget', values: rev.meta.budget, color: '#f08c00', strokeWidth: 2 }]
          }
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
