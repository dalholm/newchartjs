# NewChart JS - Usage Examples

## Bar Chart

```javascript
const chart = NewChart.create('#chart', {
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Revenue',
      values: [120, 200, 150, 300],
      color: '#4F46E5'
    }]
  },
  style: {
    bar: { borderRadius: 4, gap: 0.2 },
    animation: { duration: 800, easing: 'easeOutCubic' }
  },
  options: {
    responsive: true,
    legend: { position: 'top' }
  }
});
```

## Grouped Bar Chart

```javascript
const chart = NewChart.create('#chart', {
  type: 'bar',
  data: {
    labels: ['Product A', 'Product B', 'Product C'],
    datasets: [
      { label: '2022', values: [100, 150, 120], color: '#4F46E5' },
      { label: '2023', values: [150, 180, 160], color: '#059669' },
      { label: '2024', values: [200, 210, 190], color: '#DC2626' }
    ]
  },
  options: {
    stacked: false,
    orientation: 'vertical'
  }
});
```

## Stacked Bar Chart

```javascript
const chart = NewChart.create('#chart', {
  type: 'bar',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { label: 'Chrome', values: [400, 350, 420], color: '#4F46E5' },
      { label: 'Firefox', values: [200, 250, 200], color: '#F59E0B' },
      { label: 'Safari', values: [150, 200, 180], color: '#059669' }
    ]
  },
  options: {
    stacked: true,
    legend: { position: 'top' }
  }
});
```

## Pie Chart

```javascript
const chart = NewChart.create('#chart', {
  type: 'pie',
  data: {
    labels: ['React', 'Vue', 'Angular', 'Svelte'],
    datasets: [{
      values: [400, 200, 150, 100]
    }]
  },
  options: {
    labels: { enabled: true, position: 'outside', format: 'percent' },
    legend: { position: 'right' }
  }
});
```

## Donut Chart

```javascript
const chart = NewChart.create('#chart', {
  type: 'pie',
  data: {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      values: [600, 300, 100]
    }]
  },
  style: {
    pie: { innerRadius: 60 }
  },
  options: {
    labels: { position: 'inside', format: 'percent' }
  }
});
```

## Line Chart

```javascript
const chart = NewChart.create('#chart', {
  type: 'line',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Visitors',
      values: [100, 150, 120, 200, 180, 220, 190],
      color: '#4F46E5'
    }]
  },
  options: {
    smooth: true,
    fill: false,
    showPoints: true
  }
});
```

## Multi-Series Line Chart

```javascript
const chart = NewChart.create('#chart', {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        values: [100, 150, 120, 200, 180, 220],
        color: '#4F46E5'
      },
      {
        label: 'Expenses',
        values: [80, 100, 110, 130, 140, 150],
        color: '#DC2626'
      }
    ]
  },
  options: {
    smooth: true,
    showPoints: true,
    legend: { position: 'top' }
  }
});
```

## Line Chart with Area Fill

```javascript
const chart = NewChart.create('#chart', {
  type: 'line',
  data: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Traffic',
      values: [1000, 1500, 1200, 1800],
      color: '#059669'
    }]
  },
  options: {
    smooth: true,
    fill: true,  // Enable area fill
    showPoints: true
  }
});
```

## Updating Chart Data

```javascript
// Update chart data after creation
chart.update({
  data: {
    datasets: [{
      values: [200, 300, 250, 400]
    }]
  }
});

// Update multiple config options
chart.update({
  data: { ... },
  style: { background: '#f0f0f0' },
  options: { ... }
});
```

## Exporting Charts

```javascript
// Export as PNG (SVG renderer only)
const pngUrl = await chart.toPNG();
const link = document.createElement('a');
link.href = pngUrl;
link.download = 'chart.png';
link.click();

// Export as SVG (SVG renderer only)
const svgString = chart.toSVG();
const blob = new Blob([svgString], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'chart.svg';
link.click();
```

## Responsive Container

```javascript
// Charts automatically adapt to container size
const container = document.getElementById('chart');
container.style.width = '100%';
container.style.height = '400px';

const chart = NewChart.create('#chart', {
  type: 'bar',
  data: { ... },
  options: {
    responsive: true  // Enable responsiveness
  }
});

// Resize container - chart updates automatically
window.addEventListener('resize', () => {
  // Chart will re-render automatically via ResizeObserver
});
```

## Custom Styling

```javascript
const chart = NewChart.create('#chart', {
  type: 'bar',
  data: { ... },
  style: {
    background: '#ffffff',
    fontFamily: 'Inter, sans-serif',
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
      duration: 800,
      easing: 'easeOutCubic'
    },
    tooltip: {
      background: '#1F2937',
      color: '#FFFFFF',
      fontSize: 12,
      padding: 8,
      borderRadius: 4
    },
    bar: {
      borderRadius: 4,
      gap: 0.2
    }
  }
});
```

## Animation Easing Functions

All easing functions available for use:

```javascript
// Linear
easing: 'linear'

// Quadratic
easing: 'easeInQuad'
easing: 'easeOutQuad'
easing: 'easeInOutQuad'

// Cubic (default)
easing: 'easeInCubic'
easing: 'easeOutCubic'
easing: 'easeInOutCubic'

// Quartic
easing: 'easeInQuart'
easing: 'easeOutQuart'
easing: 'easeInOutQuart'

// Quintic
easing: 'easeInQuint'
easing: 'easeOutQuint'
easing: 'easeInOutQuint'
```

## Canvas Renderer Fallback

```javascript
// Use canvas renderer for very large datasets
const chart = NewChart.create('#chart', {
  type: 'bar',
  data: { ... },
  options: {
    renderer: 'canvas'  // Force canvas
    // or 'auto' (default) - automatically selects based on data size
    // or 'svg' - force SVG
  }
});
```

## Cleanup

```javascript
// Destroy chart and cleanup resources
chart.destroy();
// - Cancels all ongoing animations
// - Removes event listeners
// - Disconnects ResizeObserver
// - Removes DOM elements
```

## Complete Example with Dynamic Updates

```html
<!DOCTYPE html>
<html>
<head>
  <script src="dist/newchartjs.umd.js"></script>
</head>
<body>
  <div id="chart" style="width: 100%; height: 400px;"></div>

  <script>
    let chart = NewChart.create('#chart', {
      type: 'bar',
      data: {
        labels: ['A', 'B', 'C', 'D'],
        datasets: [{
          label: 'Data',
          values: [10, 20, 30, 40]
        }]
      }
    });

    // Update data every 2 seconds
    setInterval(() => {
      chart.update({
        data: {
          datasets: [{
            values: [
              Math.random() * 100,
              Math.random() * 100,
              Math.random() * 100,
              Math.random() * 100
            ]
          }]
        }
      });
    }, 2000);
  </script>
</body>
</html>
```

## Module Imports

```javascript
// ES6 import
import NewChart from 'newchartjs';

// CommonJS require
const NewChart = require('newchartjs');

// UMD global
// <script src="dist/newchartjs.umd.js"></script>
// window.NewChart

// Access chart classes
NewChart.BarChart      // BarChart class
NewChart.PieChart      // PieChart class
NewChart.LineChart     // LineChart class
NewChart.create(...)   // Factory method
NewChart.version       // '0.1.0'
```
