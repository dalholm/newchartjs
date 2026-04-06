/**
 * Heatmap Chart view
 */
import api from '../api.js';

export default function heatmapView() {
  return {
    title: 'Heatmap Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Heatmap Chart</h1>
        <p>Color-coded grids for pattern discovery — sales by hour, category performance, and more.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Sales by Day &times; Hour</h2><p>Find peak selling hours across the week</p></div>
          <div class="example-body"><div class="chart-container" id="chart-heatmap-sales" style="min-height:320px;"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Heatmap (Red-Yellow-Green)</h2><p>Same data with a diverging color scale</p></div>
          <div class="example-body"><div class="chart-container" id="chart-heatmap-ryg" style="min-height:320px;"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      api.getHeatmapSales().then(data => {
        charts.push(NewChart.create('#chart-heatmap-sales', {
          type: 'heatmap',
          data
        }));

        charts.push(NewChart.create('#chart-heatmap-ryg', {
          type: 'heatmap',
          data,
          style: {
            heatmap: {
              colorLow: '#e03131',
              colorMid: '#fcc419',
              colorHigh: '#0ca678'
            }
          }
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
