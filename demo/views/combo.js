/**
 * Combo Chart view
 */
import api from '../api.js';

export default function comboView() {
  return {
    title: 'Combo Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Combo Chart</h1>
        <p>Mix bars and lines on shared axes — ideal for revenue vs. margin, volume vs. price, and other dual-metric views.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Revenue & Margin</h2><p>Monthly revenue as bars with profit margin as an overlay line</p></div>
          <div class="example-body"><div class="chart-container" id="chart-revenue"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Sales by Channel + Growth Rate</h2><p>Two bar datasets (Direct, Online) with a growth line overlay</p></div>
          <div class="example-body"><div class="chart-container" id="chart-multi"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Actual vs Forecast</h2><p>Actual revenue bars with a dashed forecast line and budget reference</p></div>
          <div class="example-body"><div class="chart-container" id="chart-forecast"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Inventory Volume & Turnover Rate</h2><p>Combo with smooth: false for step-style line</p></div>
          <div class="example-body"><div class="chart-container" id="chart-inventory"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Orders with Conversion & Return Rate</h2><p>One bar dataset with two line overlays</p></div>
          <div class="example-body"><div class="chart-container" id="chart-rates"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      // 1. Revenue & Margin
      charts.push(NewChart.create('#chart-revenue', {
        type: 'combo',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Revenue (k)', values: [320,380,350,420,390,460,410,480,450,520,490,560], type: 'bar', color: '#4c6ef5' },
            { label: 'Margin %', values: [28,31,29,33,30,35,32,36,34,38,35,40], type: 'line', color: '#0ca678' }
          ]
        }
      }));

      // 2. Multi-bar + growth line
      charts.push(NewChart.create('#chart-multi', {
        type: 'combo',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Direct Sales', values: [180,210,195,240,220,260,230,270,255,290,275,310], type: 'bar', color: '#4c6ef5' },
            { label: 'Online Sales', values: [140,160,155,180,170,200,180,210,195,230,215,250], type: 'bar', color: '#7048e8' },
            { label: 'Growth %', values: [5,8,6,12,9,15,10,16,13,18,14,20], type: 'line', color: '#f08c00' }
          ]
        }
      }));

      // 3. Actual vs forecast
      charts.push(NewChart.create('#chart-forecast', {
        type: 'combo',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Actual', values: [290,340,310,380,355,410,370,430,405,470,440,510], type: 'bar', color: '#4c6ef5' },
            { label: 'Forecast', values: [300,330,320,370,360,400,390,420,410,450,440,480], type: 'line', color: '#868e96', dash: true, dashPattern: '6 4' }
          ]
        },
        options: {
          referenceLines: [
            { value: 400, label: 'Budget target', color: '#e03131', dash: '4 4' }
          ]
        }
      }));

      // 4. Inventory + turnover
      charts.push(NewChart.create('#chart-inventory', {
        type: 'combo',
        data: {
          labels: ['Q1','Q2','Q3','Q4'],
          datasets: [
            { label: 'Volume (units)', values: [12400,11800,13200,14500], type: 'bar', color: '#1098ad' },
            { label: 'Turnover rate', values: [4.2,4.8,4.5,5.1], type: 'line', color: '#d6336c' }
          ]
        },
        options: { smooth: false }
      }));

      // 5. Orders + rates
      charts.push(NewChart.create('#chart-rates', {
        type: 'combo',
        data: {
          labels: api.MONTHS,
          datasets: [
            { label: 'Orders', values: [1200,1350,1280,1500,1420,1600,1480,1700,1620,1800,1720,1900], type: 'bar', color: '#4c6ef5' },
            { label: 'Conversion %', values: [3.2,3.5,3.3,3.8,3.6,4.0,3.7,4.2,3.9,4.4,4.1,4.6], type: 'line', color: '#0ca678' },
            { label: 'Return %', values: [2.1,1.8,2.0,1.6,1.9,1.5,1.7,1.4,1.6,1.3,1.5,1.2], type: 'line', color: '#e03131' }
          ]
        }
      }));

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
