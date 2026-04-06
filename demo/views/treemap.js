/**
 * Treemap Chart view
 */
import api from '../api.js';

export default function treemapView() {
  return {
    title: 'Treemap Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Treemap Chart</h1>
        <p>Nested rectangles showing proportional data — size represents value, color shows category.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Revenue by Product Category</h2><p>Size = revenue, labels show growth rate</p></div>
          <div class="example-body"><div class="chart-container" id="chart-treemap-categories" style="min-height:380px;"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      api.getTreemapCategories().then(data => {
        charts.push(NewChart.create('#chart-treemap-categories', {
          type: 'treemap',
          data
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
