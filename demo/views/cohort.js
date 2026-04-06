/**
 * Cohort Chart view
 */
import api from '../api.js';

export default function cohortView() {
  return {
    title: 'Cohort Chart',
    html: `
      <a href="/" class="back-link">&larr; All demos</a>
      <div class="page-header">
        <h1>Cohort Chart</h1>
        <p>Customer retention analysis — track how cohorts behave over time.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Monthly Retention Cohorts</h2><p>How many customers from each month return in subsequent months?</p></div>
          <div class="example-body"><div class="chart-container" id="chart-cohort" style="min-height:320px;"></div></div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];

      api.getCohortRetention().then(data => {
        charts.push(NewChart.create('#chart-cohort', {
          type: 'cohort',
          data
        }));
      });

      return () => charts.forEach(c => c?.destroy());
    }
  };
}
