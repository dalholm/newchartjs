/**
 * Sankey Chart view
 */
import api from '../api.js';

export default function sankeyView() {
  return {
    title: 'Sankey Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Sankey Chart</h1>
        <p>Flow diagrams showing traffic and revenue flows between stages.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Website Traffic Flow</h2><p>From traffic source through site pages to conversion or bounce</p></div>
          <div class="example-body"><div class="chart-container" id="chart-sankey-traffic" style="min-height:420px;"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      api.getSankeyTraffic().then(data => {
        charts.push(NewChart.create('#chart-sankey-traffic', {
          type: 'sankey',
          data: {
            nodes: data.nodes,
            links: data.links,
            datasets: []
          }
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
