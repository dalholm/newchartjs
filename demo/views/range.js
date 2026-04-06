/**
 * Range Chart view
 */
import api from '../api.js';

export default function rangeView() {
  return {
    title: 'Range Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Range Chart</h1>
        <p>Timeline charts with annotated zones, campaign periods, and event markers.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Revenue with Campaign Periods</h2><p>Revenue trend with highlighted campaign zones and event annotations</p></div>
          <div class="example-body"><div class="chart-container" id="chart-range-campaigns"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      api.getRangeCampaigns().then(data => {
        charts.push(NewChart.create('#chart-range-campaigns', {
          type: 'range',
          data
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
