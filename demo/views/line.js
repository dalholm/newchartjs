/**
 * Line Chart view
 */
import api from '../api.js';

export default function lineView() {
  return {
    title: 'Line Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Line Chart</h1>
        <p>Trend lines, multi-series, comparisons with dashed lines, and crosshair interaction.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Order Intake Trend</h2><p>Single line with crosshair and data points</p></div>
          <div class="example-body"><div class="chart-container" id="chart-trend"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Sales by Channel</h2><p>Multiple series with legend toggle for visibility</p></div>
          <div class="example-body"><div class="chart-container" id="chart-multi"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>2026 vs 2025 (dashed reference)</h2><p>Compare current year against previous with a dashed line</p></div>
          <div class="example-body"><div class="chart-container" id="chart-compare"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Cumulative Revenue with Area Fill</h2><p>LineChart with fill: true to visualize accumulated revenue</p></div>
          <div class="example-body"><div class="chart-container" id="chart-fill"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Inventory Levels (straight lines)</h2><p>smooth: false for step changes</p></div>
          <div class="example-body"><div class="chart-container" id="chart-straight"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      // 1. Single trend
      charts.push(NewChart.create('#chart-trend', {
        type: 'line',
        data: {
          labels: api.MONTHS,
          datasets: [{
            label: 'Orders',
            values: [412,468,431,502,478,528,419,487,519,453,564,611],
            color: '#4c6ef5'
          }]
        }
      }));

      // 2. Multi-series
      charts.push(NewChart.create('#chart-multi', {
        type: 'line',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Direct', values: [980,1120,1050,1250,1180,1340,1020,1210,1290,1100,1420,1520], color: '#4c6ef5' },
            { label: 'Google Ads', values: [640,720,680,810,760,870,660,780,840,720,920,1000], color: '#0ca678' },
            { label: 'Organic', values: [480,560,520,630,590,680,500,600,650,540,720,790], color: '#f08c00' },
            { label: 'Email', values: [320,380,350,420,390,450,340,400,430,360,480,530], color: '#7048e8' }
          ]
        }
      }));

      // 3. Comparison with dashed
      api.getRevenueComparison().then(comp => {
        charts.push(NewChart.create('#chart-compare', {
          type: 'line',
          data: comp
        }));
      });

      // 4. Line with fill
      const monthly = [2850,3120,2960,3480,3210,3650,2890,3340,3580,3120,3890,4210];
      const cumulative = [monthly[0]];
      for (let i = 1; i < monthly.length; i++) cumulative.push(cumulative[i - 1] + monthly[i]);

      charts.push(NewChart.create('#chart-fill', {
        type: 'line',
        data: {
          labels: api.MONTHS,
          datasets: [{
            label: 'Cumulative (k)',
            values: cumulative,
            color: '#0ca678'
          }]
        },
        options: { fill: true }
      }));

      // 5. Straight lines
      charts.push(NewChart.create('#chart-straight', {
        type: 'line',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Warehouse A', values: [1200,1150,1080,1250,1180,1100,1050,1200,1320,1280,1350,1400], color: '#4c6ef5' },
            { label: 'Warehouse B', values: [800,820,780,850,830,790,810,870,900,880,920,950], color: '#0ca678' }
          ]
        },
        options: { smooth: false }
      }));

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
