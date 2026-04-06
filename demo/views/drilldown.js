/**
 * Drill-Down demo view — client-side, server-side, and scroll integration
 */
import api from '../api.js';

export default function drilldownView() {
  return {
    title: 'Drill-Down',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Drill-Down</h1>
        <p>Click any bar to drill into sub-data. Use the breadcrumb trail to navigate back.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header">
            <h2>Revenue Drill-Down (Client-Side)</h2>
            <p>3 levels: Quarters &rarr; Months &rarr; Weeks. All data embedded in <code>data.children</code>.</p>
          </div>
          <div class="example-body"><div class="chart-container" id="chart-drill-client"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header">
            <h2>Product Sales (Server-Side)</h2>
            <p>Categories &rarr; Products fetched via <code>onDrillDown</code> callback with 400ms simulated latency.</p>
          </div>
          <div class="example-body"><div class="chart-container" id="chart-drill-server"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header">
            <h2>Large Dataset + Drill</h2>
            <p>20 regions with <code>maxVisibleBars: 10</code>. Drill into any region to see monthly data.</p>
          </div>
          <div class="example-body"><div class="chart-container" id="chart-drill-scroll"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      // 1. Client-side drill-down
      api.getDrillDownRevenue().then(data => {
        charts.push(NewChart.create('#chart-drill-client', {
          type: 'bar',
          data,
          options: {
            drillDown: true,
            drillDownRootLabel: 'Revenue'
          }
        }));
      });

      // 2. Server-side drill-down
      charts.push(NewChart.create('#chart-drill-server', {
        type: 'bar',
        data: {
          labels: ['Mattresses', 'Pillows', 'Bed Frames', 'Bath', 'Accessories'],
          datasets: [{ label: 'Revenue (kr)', values: [14200, 8900, 6300, 4800, 1520] }]
        },
        options: {
          drillDown: true,
          drillDownRootLabel: 'Categories',
          onDrillDown: (ctx) => api.simulateServerDrillDown(ctx)
        }
      }));

      // 3. Scroll + drill-down
      const regions = [
        'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping',
        'Örebro', 'Västerås', 'Norrköping', 'Helsingborg', 'Jönköping',
        'Umeå', 'Lund', 'Borås', 'Sundsvall', 'Eskilstuna',
        'Gävle', 'Karlstad', 'Täby', 'Växjö', 'Halmstad'
      ];
      const regionValues = regions.map(() => Math.round(2000 + Math.random() * 8000));

      const regionChildren = {};
      regions.forEach(r => {
        regionChildren[r] = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: `${r} Monthly (kr)`,
            values: Array.from({ length: 12 }, () => Math.round(200 + Math.random() * 800))
          }]
        };
      });

      charts.push(NewChart.create('#chart-drill-scroll', {
        type: 'bar',
        data: {
          labels: regions,
          datasets: [{ label: 'Revenue (kr)', values: regionValues }],
          children: regionChildren
        },
        options: {
          drillDown: true,
          drillDownRootLabel: 'Regions',
          maxVisibleBars: 10
        }
      }));

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
