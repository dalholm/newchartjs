# NewChart JS

A modern, lightweight charting library with SVG rendering, responsive design, and beautiful animations. Built with vanilla JavaScript - **zero dependencies**.

## Features

- **Three Chart Types**: Bar, Pie, and Line charts
- **SVG Rendering**: Clean vector graphics with Canvas fallback for large datasets
- **Responsive**: Automatically adapts to container size with ResizeObserver support
- **Animated**: Smooth animations with customizable easing functions
- **Interactive**: Tooltips, legends, and hover effects
- **Declarative API**: Simple config-based chart creation
- **Production-Ready**: Well-documented, thoroughly tested code

## Installation

```bash
npm install newchartjs
```

## Quick Start

```javascript
import NewChart from 'newchartjs';

// Create a simple bar chart
const chart = NewChart.create('#my-chart', {
  type: 'bar',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{
      label: 'Revenue',
      values: [120, 200, 150, 300],
      color: '#4F46E5'
    }]
  },
  options: {
    responsive: true,
    legend: { position: 'top' }
  }
});

// Update chart data
chart.update({
  data: {
    datasets: [{ values: [200, 300, 250, 400] }]
  }
});

// Destroy chart
chart.destroy();
```

## API Documentation

### NewChart.create(element, config)

Creates and returns a chart instance.

**Parameters:**
- `element` (Element|string): DOM element or CSS selector
- `config` (Object): Chart configuration

**Returns:** Chart instance with methods `update()` and `destroy()`

### Configuration Object

```javascript
{
  type: 'bar',                    // 'bar', 'pie', or 'line'
  data: {
    labels: [],                   // Category labels
    datasets: [{
      label: 'Series Name',
      values: [],
      color: '#4F46E5',
      colors: []                  // Optional: per-item colors
    }]
  },
  style: {
    background: '#ffffff',
    fontFamily: 'system fonts',
    fontSize: 12,
    fontColor: '#374151',
    grid: {
      color: '#E5E7EB',
      width: 1
    },
    axis: {
      color: '#374151',
      width: 1,
      fontSize: 12
    },
    animation: {
      duration: 600,
      easing: 'easeOutCubic'      // See Animation Easing
    },
    tooltip: {
      background: '#1F2937',
      color: '#FFFFFF',
      fontSize: 12,
      padding: 8,
      borderRadius: 4
    },
    legend: {
      fontSize: 12,
      color: '#374151',
      marker: { size: 8 }
    },
    // Chart-specific styles:
    bar: {
      borderRadius: 4,
      gap: 0.2
    },
    line: {
      width: 2,
      tension: 0.4,               // Bezier tension (0-1)
      pointRadius: 4,
      pointBorderWidth: 2
    },
    pie: {
      startAngle: -Math.PI / 2,
      endAngle: Math.PI * 1.5,
      innerRadius: 0,             // > 0 for donut
      borderWidth: 2,
      borderColor: '#ffffff'
    }
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    renderer: 'auto',             // 'svg', 'canvas', or 'auto'
    padding: 20,
    legend: {
      position: 'top',            // 'top', 'bottom', 'left', 'right'
      enabled: true
    },
    tooltip: {
      enabled: true
    },
    // Bar chart options:
    orientation: 'vertical',      // 'vertical' or 'horizontal'
    stacked: false,
    axis: {
      x: { enabled: true, label: '' },
      y: { enabled: true, label: '' }
    },
    // Line chart options:
    smooth: true,
    fill: false,
    showPoints: true,
    // Pie chart options:
    labels: {
      enabled: true,
      position: 'outside',        // 'inside', 'outside', 'none'
      format: 'percent'           // 'percent', 'value', 'label'
    }
  }
}
```

### Chart Instance Methods

#### update(config)

Update chart data and/or configuration.

```javascript
chart.update({
  data: { datasets: [{ values: [100, 200, 300] }] },
  style: { background: '#f0f0f0' }
});
```

#### destroy()

Remove chart from DOM and cleanup resources.

```javascript
chart.destroy();
```

#### toPNG()

Export chart as PNG (SVG renderer only).

```javascript
const pngDataUrl = await chart.toPNG();
```

#### toSVG()

Export chart as SVG string (SVG renderer only).

```javascript
const svgString = chart.toSVG();
```

## Chart Types

### Bar Chart

Vertical or horizontal bars with optional grouping or stacking.

```javascript
NewChart.create('#chart', {
  type: 'bar',
  data: {
    labels: ['A', 'B', 'C'],
    datasets: [
      { label: 'Series 1', values: [10, 20, 15] },
      { label: 'Series 2', values: [15, 25, 20] }
    ]
  },
  options: {
    stacked: false,
    orientation: 'vertical'
  }
});
```

### Pie Chart

Pie or donut chart with optional labels and legend.

```javascript
NewChart.create('#chart', {
  type: 'pie',
  data: {
    labels: ['A', 'B', 'C', 'D'],
    datasets: [{ values: [30, 25, 20, 25] }]
  },
  options: {
    labels: { position: 'outside', format: 'percent' }
  },
  style: {
    pie: { innerRadius: 0 }  // Set > 0 for donut
  }
});
```

### Line Chart

Single or multi-series line chart with smooth curves and area fill.

```javascript
NewChart.create('#chart', {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { label: 'Series 1', values: [10, 20, 15] },
      { label: 'Series 2', values: [15, 25, 20] }
    ]
  },
  options: {
    smooth: true,
    fill: false,
    showPoints: true
  }
});
```

## Animation Easing

Available easing functions:
- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInQuart`, `easeOutQuart`, `easeInOutQuart`
- `easeInQuint`, `easeOutQuint`, `easeInOutQuint`

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Requires: ES6+ support, ResizeObserver (polyfill available for older browsers)

## License

MIT - See LICENSE file

## Author

Nyehandel

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Watch for changes
npm run watch
```

## Contributing

Contributions welcome! Please submit pull requests with tests and documentation.
