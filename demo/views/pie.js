/**
 * Pie & Donut Chart view
 */
export default function pieView() {
  return {
    title: 'Pie & Donut Chart',
    style: `
      .row > .example-card { min-width: 350px; }
      .example-body { display: flex; justify-content: center; }
    `,
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Pie & Donut Chart</h1>
        <p>Distribution charts for channels, categories, and cost items — with hover-explode and center text.</p>
      </div>
      <div class="examples">
        <div class="row">
          <div class="example-card">
            <div class="example-header"><h2>Sales by Channel (Pie)</h2><p>Classic pie with percentage labels</p></div>
            <div class="example-body"><div class="chart-container small" id="chart-pie"></div></div>
          </div>
          <div class="example-card">
            <div class="example-header"><h2>Sales by Channel (Donut)</h2><p>Donut with total in the center — hover shows details</p></div>
            <div class="example-body"><div class="chart-container small" id="chart-donut"></div></div>
          </div>
        </div>
        <div class="row">
          <div class="example-card">
            <div class="example-header"><h2>Product Categories</h2><p>Revenue breakdown by product group</p></div>
            <div class="example-body"><div class="chart-container small" id="chart-category"></div></div>
          </div>
          <div class="example-card">
            <div class="example-header"><h2>Cost Breakdown</h2><p>Donut with value labels instead of percentages</p></div>
            <div class="example-body"><div class="chart-container small" id="chart-costs"></div></div>
          </div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Supplier Share — Top 8</h2><p>Donut with many segments and legend to the right</p></div>
          <div class="example-body"><div class="chart-container" id="chart-suppliers" style="max-width: 500px;"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];
      const channelLabels = ['Direct','Google Ads','Organic','Email','Social','Referral'];
      const channelValues = [12480,8320,6940,4680,2510,1590];

      // 1. Pie
      charts.push(NewChart.create('#chart-pie', {
        type: 'pie',
        data: { labels: channelLabels, datasets: [{ values: channelValues }] },
        options: { labels: { position: 'outside', format: 'percent' } }
      }));

      // 2. Donut
      charts.push(NewChart.create('#chart-donut', {
        type: 'pie',
        data: { labels: channelLabels, datasets: [{ values: channelValues }] },
        style: { pie: { innerRadius: 70 } },
        options: { labels: { position: 'outside', format: 'percent' } }
      }));

      // 3. Category
      charts.push(NewChart.create('#chart-category', {
        type: 'pie',
        data: {
          labels: ['Mattresses','Pillows','Bed Frames','Bed Linen','Duvets','Accessories'],
          datasets: [{ values: [14200,8900,6300,4800,3200,1520] }]
        },
        style: { pie: { innerRadius: 65 } },
        options: { labels: { position: 'outside', format: 'label' } }
      }));

      // 4. Cost breakdown
      charts.push(NewChart.create('#chart-costs', {
        type: 'pie',
        data: {
          labels: ['Personnel','Materials','Logistics','Marketing','Premises','IT'],
          datasets: [{ values: [5200,3400,1800,1200,900,600] }]
        },
        style: { pie: { innerRadius: 60 } },
        options: { labels: { position: 'outside', format: 'value' } }
      }));

      // 5. Suppliers
      charts.push(NewChart.create('#chart-suppliers', {
        type: 'pie',
        data: {
          labels: ['Hilding Anders','Bico','Jensen','Hastens','Carpe Diem','Dux','Tempur','Others'],
          datasets: [{ values: [28,18,14,12,9,7,5,7] }]
        },
        style: { pie: { innerRadius: 80 } },
        options: { legend: { position: 'right' }, labels: { position: 'none' } }
      }));

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
