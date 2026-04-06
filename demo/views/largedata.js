/**
 * Large Dataset Bar Chart view — demonstrates label thinning, rotation, and scrolling
 */
import api from '../api.js';

export default function largedataView() {
  return {
    title: 'Large Datasets',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Large Datasets</h1>
        <p>Auto label rotation, thinning, and horizontal scroll for bar charts with many data points.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header">
            <h2>52 Weeks — Auto Label Thinning</h2>
            <p>Labels auto-rotate and thin out when bars are narrow. No config needed.</p>
          </div>
          <div class="example-body"><div class="chart-container" id="chart-weekly"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header">
            <h2>90 Days — Horizontal Scroll</h2>
            <p><code>maxVisibleBars: 30</code> limits the viewport and enables horizontal scrolling.</p>
          </div>
          <div class="example-body"><div class="chart-container" id="chart-daily"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header">
            <h2>50 SKUs — Scroll + Rotated Labels</h2>
            <p>Long product codes with <code>maxVisibleBars: 20</code>. Labels rotate automatically.</p>
          </div>
          <div class="example-body"><div class="chart-container" id="chart-skus"></div></div>
        </div>
        <div class="example-card">
          <div class="example-header">
            <h2>90 Days — Forced 45&deg; Rotation</h2>
            <p>Explicit <code>labels.rotation: -45</code> without scroll for comparison.</p>
          </div>
          <div class="example-body"><div class="chart-container" id="chart-rotated"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      Promise.all([
        api.getWeeklyRevenue(52),
        api.getDailyRevenue(90),
        api.getSkuRevenue(50),
        api.getDailyRevenue(90),
      ]).then(([weekly, daily, skus, dailyRotated]) => {
        // 52 weeks — auto label thinning, no scroll
        charts.push(NewChart.create('#chart-weekly', {
          type: 'bar',
          data: weekly,
          options: {
            referenceLines: [
              { value: weekly.meta.avg, label: 'Average', color: '#868e96', dash: '6 4' }
            ]
          }
        }));

        // 90 days — horizontal scroll
        charts.push(NewChart.create('#chart-daily', {
          type: 'bar',
          data: daily,
          options: {
            maxVisibleBars: 30,
            referenceLines: [
              { value: daily.meta.avg, label: 'Avg', color: '#868e96', dash: '6 4' }
            ]
          }
        }));

        // 50 SKUs — scroll + auto rotation
        charts.push(NewChart.create('#chart-skus', {
          type: 'bar',
          data: skus,
          options: {
            maxVisibleBars: 20
          }
        }));

        // 90 days — forced 45 degree rotation, no scroll
        charts.push(NewChart.create('#chart-rotated', {
          type: 'bar',
          data: dailyRotated,
          options: {
            labels: { rotation: -45, interval: 5 },
            referenceLines: [
              { value: dailyRotated.meta.avg, label: 'Average', color: '#868e96', dash: '6 4' }
            ]
          }
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
