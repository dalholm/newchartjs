---
layout: home

hero:
  name: NewChart JS
  text: Zero-dependency charting for business apps
  tagline: SVG & Canvas rendering, ERP-grade components, config-driven API
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Components
      link: /components
    - theme: alt
      text: Live Demo
      link: /demo

features:
  - title: Zero Dependencies
    details: Pure vanilla JavaScript — no frameworks, no bloat. Drop it into any project.
  - title: SVG + Canvas
    details: Automatic renderer selection based on dataset size. SVG for crisp visuals, Canvas for 10,000+ data points.
  - title: ERP-Grade
    details: Reference lines, data tables, KPI cards, sparklines — built for dashboards, not demos.
  - title: Config-Driven
    details: Declarative config object with reactive updates. Theme with CSS custom properties or JS config.
---

## Quick Example

```html
<div id="chart" style="width: 600px; height: 400px;"></div>
<script src="dist/newchart.min.js"></script>
<script>
  const chart = NewChart.create('#chart', {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [{
        label: 'Revenue',
        values: [12000, 19000, 15000, 22000]
      }]
    }
  });
</script>
```
