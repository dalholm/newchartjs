/**
 * Area Chart view
 */
import api from '../api.js';

export default function areaView() {
  return {
    title: 'Area Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Area Chart</h1>
        <p>Gradient-filled areas for cash flow, inventory levels, cumulative revenue, and stacked distribution over time.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Cash Flow Analysis</h2><p>Inflow and outflow series with gradient fill</p></div>
          <div class="example-body"><div class="chart-container" id="chart-cashflow"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Cumulative Revenue</h2><p>Accumulated revenue with filled area</p></div>
          <div class="example-body"><div class="chart-container" id="chart-cumulative"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Traffic Sources Over Time</h2><p>Multiple series with overlapping gradient fills</p></div>
          <div class="example-body"><div class="chart-container" id="chart-traffic"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Revenue by Region (stacked)</h2><p>Stacked area view showing total and per-region contribution</p></div>
          <div class="example-body"><div class="chart-container" id="chart-stacked-area"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Inventory Value Over Time</h2><p>Smooth area with light gradient — showing inventory level per month</p></div>
          <div class="example-body"><div class="chart-container" id="chart-inventory"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      // 1. Cashflow
      charts.push(NewChart.create('#chart-cashflow', {
        type: 'area',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Inflow', values: [3200,3500,3100,3800,3600,4000,3300,3700,3900,3400,4200,4500], color: '#0ca678' },
            { label: 'Outflow', values: [2800,2900,3000,2700,3100,2900,3200,3000,2800,3100,3000,3200], color: '#e03131' }
          ]
        }
      }));

      // 2. Cumulative
      const monthly = [2850,3120,2960,3480,3210,3650,2890,3340,3580,3120,3890,4210];
      const cumulative = [monthly[0]];
      for (let i = 1; i < monthly.length; i++) cumulative.push(cumulative[i - 1] + monthly[i]);

      charts.push(NewChart.create('#chart-cumulative', {
        type: 'area',
        data: {
          labels: api.MONTHS,
          datasets: [{
            label: 'Cumulative Revenue (k)',
            values: cumulative,
            color: '#4c6ef5'
          }]
        }
      }));

      // 3. Multi-series
      charts.push(NewChart.create('#chart-traffic', {
        type: 'area',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Direct', values: [12000,13200,12800,14500,13800,15200,12500,14000,14800,13000,16000,17200], color: '#4c6ef5' },
            { label: 'Organic', values: [8400,9200,8800,10100,9600,10800,8900,10000,10500,9100,11200,12400], color: '#0ca678' },
            { label: 'Paid', values: [5600,6100,5800,6800,6400,7200,5900,6600,7000,6100,7500,8200], color: '#f08c00' }
          ]
        },
        style: {
          area: { fillOpacity: 0.15 }
        }
      }));

      // 4. Stacked area
      charts.push(NewChart.create('#chart-stacked-area', {
        type: 'area',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Sweden', values: [1800,2000,1900,2200,2100,2400,1850,2150,2300,2000,2500,2700], color: '#4c6ef5' },
            { label: 'Norway', values: [600,680,640,750,710,800,620,700,750,650,800,880], color: '#0ca678' },
            { label: 'Finland', values: [350,400,380,430,410,460,370,420,450,380,480,530], color: '#f08c00' },
            { label: 'Denmark', values: [200,240,220,280,260,290,210,250,270,230,310,340], color: '#7048e8' }
          ]
        },
        options: { stacked: true },
        style: {
          area: { fillOpacity: 0.4 }
        }
      }));

      // 5. Inventory
      charts.push(NewChart.create('#chart-inventory', {
        type: 'area',
        data: {
          labels: api.MONTHS,
          datasets: [{
            label: 'Inventory Value (k)',
            values: [8200,7800,8500,7600,8900,8100,7400,8300,9200,8800,9500,8600],
            color: '#1098ad'
          }]
        },
        style: {
          area: { fillOpacity: 0.2 }
        }
      }));

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
