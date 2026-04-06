/**
 * Funnel Chart view
 */
import api from '../api.js';

export default function funnelView() {
  return {
    title: 'Funnel Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Funnel Chart</h1>
        <p>Conversion funnels for e-commerce, signup flows, and sales pipelines.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>E-Commerce Conversion Funnel</h2><p>From website visit to purchase — see where customers drop off</p></div>
          <div class="example-body"><div class="chart-container" id="chart-funnel-ecommerce"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>User Signup Flow</h2><p>Registration funnel from landing page to first purchase</p></div>
          <div class="example-body"><div class="chart-container" id="chart-funnel-signup"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      Promise.all([
        api.getFunnelEcommerce(),
        api.getFunnelSignup()
      ]).then(([ecommerce, signup]) => {
        charts.push(NewChart.create('#chart-funnel-ecommerce', {
          type: 'funnel',
          data: ecommerce
        }));

        charts.push(NewChart.create('#chart-funnel-signup', {
          type: 'funnel',
          data: signup
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
