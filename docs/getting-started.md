# Getting Started

## Installation

Include the bundled script in your HTML:

```html
<script src="dist/newchart.min.js"></script>
```

Or import as an ES module:

```js
import NewChart from './dist/newchart.esm.js';
```

## Creating a Chart

All charts are created through the `NewChart.create()` factory:

```js
const chart = NewChart.create(element, config);
```

- **element** - A DOM element or CSS selector string (e.g. `'#chart'`)
- **config** - A configuration object with `type`, `data`, `style`, and `options`

## Config Structure

Every chart accepts this structure:

```js
{
  type: 'bar',               // Chart type
  data: {
    labels: [...],           // X-axis labels
    datasets: [{
      label: 'Series name',
      values: [...],         // Numeric values
      color: '#4c6ef5'       // Optional per-dataset color
    }]
  },
  style: { ... },            // Visual appearance (see styling.md)
  options: { ... }           // Behavioral settings (see api-reference.md)
}
```

## Updating a Chart

Use `update()` with a partial config to reactively change data or styling:

```js
chart.update({
  data: {
    datasets: [{
      values: [15000, 21000, 18000, 25000]
    }]
  }
});
```

## Destroying a Chart

Clean up all DOM elements, event listeners, and observers:

```js
chart.destroy();
```

## Renderer Selection

NewChart supports both SVG and Canvas rendering. By default, the renderer is chosen automatically:

| Dataset size | Renderer |
|---|---|
| <= 5,000 data points | SVG |
| > 5,000 data points | Canvas |

Force a specific renderer:

```js
NewChart.create('#chart', {
  options: { renderer: 'canvas' } // or 'svg'
});
```

## Export

Charts rendered with SVG can be exported:

```js
// Export as PNG (returns a Promise<string> data URL)
const pngUrl = await chart.toPNG();

// Export as SVG string
const svgString = chart.toSVG();
```
