# NewChart JS Documentation

**NewChart JS** is a zero-dependency, vanilla JavaScript charting library built for professional business applications and ERP-grade dashboards.

## Table of Contents

- [Getting Started](getting-started.md)
- [Components](components.md) - All chart types and UI components
- [Styling & Theming](styling.md) - Config, CSS tokens, colors, and typography
- [API Reference](api-reference.md) - Methods, callbacks, and lifecycle

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
