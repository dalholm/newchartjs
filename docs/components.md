# Components

NewChart JS includes six chart types, a KPI card component, and supporting UI components (legend, tooltip, data table).

---

## BarChart

Bar, grouped, and stacked bar charts with vertical orientation.

```js
NewChart.create('#chart', {
  type: 'bar',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { label: '2026', values: [120, 200, 150] },
      { label: '2025', values: [100, 170, 130], dash: true }
    ]
  }
});
```

### Bar-specific options

| Option | Type | Default | Description |
|---|---|---|---|
| `options.orientation` | `string` | `'vertical'` | `'vertical'` or `'horizontal'` |
| `options.stacked` | `boolean\|string` | `false` | `true` for stacked, `'percent'` for 100% stacked |
| `options.referenceLines` | `array` | `[]` | Horizontal reference lines (see below) |
| `options.barMarkers` | `array` | `[]` | Per-bar marker lines (e.g. budget per category) |
| `options.tooltipChangeLabel` | `string` | auto | Custom label for the YoY footer in tooltip |
| `style.bar.borderRadius` | `number` | `4` | Corner radius of bars |
| `style.bar.gap` | `number` | `0.2` | Gap between bars (fraction of bar width) |
| `style.bar.groupGap` | `number` | `0.5` | Gap between groups (fraction of bar width) |

### Reference Lines

```js
options: {
  referenceLines: [
    {
      value: 150,              // Numeric value, or 'average'/'mean'
      label: 'Budget',
      color: '#f08c00',
      strokeWidth: 1.5,
      dash: '6 4',
      labelPosition: 'right',  // 'left' (default) or 'right'
      labelBackground: '#fff'  // Optional background pill
    }
  ]
}
```

### Bar Markers

Per-column markers that span only the bar width:

```js
options: {
  barMarkers: [
    {
      label: 'Target',
      values: [130, 180, 160],  // One value per label
      color: '#f08c00',
      strokeWidth: 2
    }
  ]
}
```

### Grouped & Stacked

```js
// Grouped (default with multiple datasets)
{ options: { stacked: false } }

// Stacked
{ options: { stacked: true } }

// 100% Stacked
{ options: { stacked: 'percent' } }
```

### Compare/Previous Period

Mark a dataset as a reference series to get dashed rendering and "(ref)" in the legend:

```js
datasets: [
  { label: '2026', values: [...] },
  { label: '2025', values: [...], dash: true, ref: true, color: '#b3bac5' }
]
```

---

## LineChart

Multi-series line chart with bezier curves, crosshair interaction, and optional area fill.

```js
NewChart.create('#chart', {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      { label: 'Revenue', values: [120, 200, 150, 220, 180] }
    ]
  }
});
```

### Line-specific options

| Option | Type | Default | Description |
|---|---|---|---|
| `options.smooth` | `boolean` | `true` | Bezier curve smoothing |
| `options.fill` | `boolean` | `false` | Fill area under line with gradient |
| `options.showPoints` | `boolean` | `true` | Show data points on hover |
| `style.line.width` | `number` | `2` | Line stroke width |
| `style.line.tension` | `number` | `0.4` | Bezier curve tension (0 = straight, 1 = very curved) |
| `style.line.pointRadius` | `number` | `4` | Data point circle radius |
| `style.line.pointBorderWidth` | `number` | `2` | Point border stroke width |
| `style.line.pointBorderColor` | `string` | `'#ffffff'` | Point border color |

### Dashed Lines

```js
datasets: [
  { label: 'Actual', values: [...] },
  { label: 'Forecast', values: [...], dash: true, dashPattern: '5 3' }
]
```

### Crosshair Interaction

LineChart shows a vertical crosshair line and data points when hovering. No configuration needed - this is built-in behavior.

---

## AreaChart

Dedicated area chart with gradient fill, supporting stacked areas.

```js
NewChart.create('#chart', {
  type: 'area',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      { label: 'Product A', values: [30, 40, 35, 50] },
      { label: 'Product B', values: [20, 25, 30, 20] }
    ]
  },
  options: { stacked: true }
});
```

### Area-specific options

| Option | Type | Default | Description |
|---|---|---|---|
| `options.stacked` | `boolean` | `false` | Stack areas on top of each other |
| `options.smooth` | `boolean` | `true` | Bezier curve smoothing |
| `options.showPoints` | `boolean` | `true` | Show data points on crosshair hover |
| `style.area.fillOpacity` | `number` | `0.25` | Gradient top opacity (0-1) |
| `style.line.width` | `number` | `2` | Stroke width of the area outline |
| `style.line.tension` | `number` | `0.4` | Bezier curve tension |

---

## PieChart

Pie and donut charts with label positioning, explode-on-hover, and center text for donut variant.

```js
// Pie
NewChart.create('#chart', {
  type: 'pie',
  data: {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      values: [55, 35, 10]
    }]
  }
});

// Donut
NewChart.create('#chart', {
  type: 'pie',
  data: {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      values: [55, 35, 10]
    }]
  },
  style: {
    pie: { innerRadius: 60 }
  }
});
```

### Pie-specific options

| Option | Type | Default | Description |
|---|---|---|---|
| `style.pie.innerRadius` | `number` | `0` | Inner radius. `0` = pie, `> 0` = donut |
| `style.pie.startAngle` | `number` | `-PI/2` | Start angle in radians (top) |
| `style.pie.endAngle` | `number` | `PI*1.5` | End angle in radians |
| `style.pie.borderWidth` | `number` | `2` | Border between slices |
| `style.pie.borderColor` | `string` | `'#ffffff'` | Border color between slices |
| `options.labels.enabled` | `boolean` | `true` | Show labels |
| `options.labels.position` | `string` | `'outside'` | `'inside'`, `'outside'`, or `'none'` |
| `options.labels.format` | `string` | `'percent'` | `'percent'`, `'value'`, `'label'` |
| `options.onClick` | `function` | `null` | Click handler `({ index, label, value, percent, event })` |

### Per-Slice Colors

```js
datasets: [{
  values: [55, 35, 10],
  colors: ['#4c6ef5', '#0ca678', '#f08c00']  // One color per slice
}]
```

### Donut Center Text

In donut mode, the center displays the total by default. On hover, it shows the hovered slice's percentage and label.

---

## GaugeChart

Circular gauge with threshold zones, needle, target marker, and center value display.

```js
NewChart.create('#chart', {
  type: 'gauge',
  data: {
    datasets: [{
      label: 'Conversion Rate',
      values: [73]
    }]
  },
  options: {
    min: 0,
    max: 100,
    target: 85,
    valueSuffix: '%'
  }
});
```

### Gauge-specific options

| Option | Type | Default | Description |
|---|---|---|---|
| `options.min` | `number` | `0` | Minimum scale value |
| `options.max` | `number` | `100` | Maximum scale value |
| `options.target` | `number` | `null` | Target marker value |
| `options.targetLabel` | `string` | `'Mal: {value}'` | Target marker label. Set `false` to hide |
| `options.targetColor` | `string` | `'#1a1d23'` | Target marker color |
| `options.ticks` | `number` | `5` | Number of tick marks |
| `options.showMax` | `boolean` | `true` | Show "av {max}" below the value |
| `options.valueSuffix` | `string` | `''` | Suffix after the value (e.g. `'%'`, `' kr'`) |
| `options.valuePrefix` | `string` | `''` | Prefix before the value (e.g. `'$'`) |
| `options.valueDecimals` | `number` | `0` | Decimal places |
| `options.formatValue` | `function` | `null` | Custom value formatter `(value) => string` |
| `options.needleColor` | `string` | `'#1a1d23'` | Needle and center dot color |
| `style.gauge.arcWidth` | `number` | auto | Arc width (auto-calculated from radius) |
| `style.gauge.trackColor` | `string` | `'#f1f3f5'` | Background track color |
| `style.gauge.needle` | `boolean` | `true` | Show/hide needle |
| `style.gauge.valueFontSize` | `number` | `28` | Center value font size |
| `style.gauge.tickFontSize` | `number` | `10` | Tick label font size |

### Threshold Zones

Zones control both the arc fill color and the center value text color:

```js
style: {
  gauge: {
    zones: [
      { from: 0,    to: 0.6,  color: '#e03131' },  // Red: 0-60%
      { from: 0.6,  to: 0.85, color: '#f08c00' },  // Orange: 60-85%
      { from: 0.85, to: 1.0,  color: '#0ca678' }   // Green: 85-100%
    ]
  }
}
```

Zone `from`/`to` values are fractions of the full arc (0-1), not data values.

---

## SparklineChart

Tiny inline charts designed for KPI cards, table cells, and dashboard widgets. No axes, legend, or tooltip.

```js
NewChart.create('#spark', {
  type: 'sparkline',
  data: {
    datasets: [{
      values: [12, 15, 11, 18, 14, 20, 17]
    }]
  },
  options: {
    variant: 'area'  // 'line', 'area', or 'bar'
  }
});
```

### Sparkline-specific options

| Option | Type | Default | Description |
|---|---|---|---|
| `options.variant` | `string` | `'line'` | `'line'`, `'area'`, or `'bar'` |
| `options.smooth` | `boolean` | `true` | Bezier smoothing (line/area) |
| `options.highlightLast` | `boolean` | `true` | Show a dot on the last data point |
| `options.referenceLine` | `number` | `null` | Horizontal reference line value |
| `style.sparkline.color` | `string` | `'#4c6ef5'` | Line/bar color |
| `style.sparkline.lineWidth` | `number` | `1.5` | Line stroke width |
| `style.sparkline.tension` | `number` | `0.3` | Bezier tension |
| `style.sparkline.dotRadius` | `number` | `2.5` | Last-point dot radius |
| `style.sparkline.barGap` | `number` | `1` | Gap between bars (bar variant) |
| `style.sparkline.barRadius` | `number` | `1` | Bar corner radius |
| `style.sparkline.negativeColor` | `string` | `'#e03131'` | Color for negative bar values |
| `style.sparkline.referenceColor` | `string` | `'#b3bac5'` | Reference line color |
| `style.sparkline.paddingX` | `number` | `2` | Horizontal padding |
| `style.sparkline.paddingY` | `number` | `4` | Vertical padding |

### Sizing

Sparklines adapt to their container. The recommended sizes are:

- **KPI card**: 64x22 px
- **Table cell**: 80x20 px
- **Dashboard widget**: 120x32 px

---

## KPICard

A standalone, config-driven KPI card with value, change badge, progress bar, status dot, and inline sparkline.

```js
const card = NewChart.kpiCard('#card', {
  label: 'Revenue',
  value: 38920000,
  previous: 32410000,
  suffix: ' kr',
  target: 42000000,
  sparkline: {
    values: [2850, 3120, 2960, 3400, 3100, 3800, 3550],
    variant: 'area',
    color: '#4c6ef5'
  },
  onClick: ({ config }) => console.log('Clicked', config.label)
});
```

### KPICard config

| Option | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `''` | Card title (uppercase, small) |
| `value` | `number` | `0` | Main value |
| `previous` | `number` | `null` | Previous period value (shows change badge) |
| `target` | `number` | `null` | Target value (shows progress bar + status dot) |
| `suffix` | `string` | `''` | Value suffix (e.g. `' kr'`, `'%'`) |
| `prefix` | `string` | `''` | Value prefix (e.g. `'$'`) |
| `decimals` | `number` | `0` | Decimal places |
| `formatValue` | `function` | auto | Custom value formatter `(n) => string` |
| `formatPrevious` | `function` | auto | Custom previous-value formatter |
| `active` | `boolean` | `false` | Active/selected state (blue border + shadow) |
| `onClick` | `function` | `null` | Click handler `({ element, config, event })` |

### Sparkline config (nested)

| Option | Type | Default | Description |
|---|---|---|---|
| `sparkline.values` | `number[]` | required | Data values |
| `sparkline.variant` | `string` | `'area'` | `'line'`, `'area'`, or `'bar'` |
| `sparkline.color` | `string` | inherit | Sparkline color |
| `sparkline.width` | `number` | `64` | Container width in px |
| `sparkline.height` | `number` | `22` | Container height in px |
| `sparkline.highlightLast` | `boolean` | `true` | Last-point dot |
| `sparkline.referenceLine` | `number` | `null` | Reference line value |
| `sparkline.animated` | `boolean` | `true` | Enable animation |

### Thresholds & Status

When `target` is set, a status dot and progress bar appear. The color is determined by `value / target`:

| Ratio | Status | Default Color |
|---|---|---|
| >= 1.0 (100%) | `good` | `#0ca678` (green) |
| >= 0.9 (90%) | `warning` | `#f08c00` (orange) |
| < 0.9 | `danger` | `#e03131` (red) |

Customize thresholds:

```js
{ thresholds: { good: 0.95, warning: 0.8 } }
```

### KPICard Colors

All colors are configurable:

```js
{
  colors: {
    up: '#099268',           // Change badge positive text
    upBg: '#c3fae8',         // Change badge positive background
    down: '#c92a2a',         // Change badge negative text
    downBg: '#ffc9c9',       // Change badge negative background
    good: '#0ca678',         // Status dot / progress bar (good)
    warning: '#f08c00',      // Status dot / progress bar (warning)
    danger: '#e03131',       // Status dot / progress bar (danger)
    label: '#8993a4',        // Label text color
    value: '#172b4d',        // Main value text color
    previous: '#b3bac5',     // Previous period text color
    border: '#dfe1e6',       // Card border
    borderActive: '#4c6ef5', // Card border when active
    surface: '#ffffff',      // Card background
    progressTrack: '#ebecf0' // Progress bar track
  }
}
```

### Updating a KPICard

```js
card.update({ value: 41500000, previous: 38920000 });
card.setActive(true);
```

---

## DataTable

Auto-generated data table that syncs hover highlights with the chart. Enabled via chart config.

```js
NewChart.create('#chart', {
  type: 'bar',
  data: { ... },
  options: {
    table: {
      enabled: true,
      viewMode: 'split',   // 'chart', 'table', or 'split'
      maxHeight: 200        // Max table height in split mode (scrollable)
    }
  }
});
```

### View Modes

| Mode | Description |
|---|---|
| `'chart'` | Chart only, table hidden |
| `'table'` | Table only, chart hidden |
| `'split'` | Chart on top, scrollable table below |

### Hover Sync

Hovering a table row highlights the corresponding bar/slice/point in the chart. Hovering a chart element highlights the corresponding table row. This is automatic when `table.enabled: true`.

### Custom Columns

```js
options: {
  table: {
    enabled: true,
    columns: [
      { key: '_label', label: 'Month', align: 'left' },
      { key: 'Revenue', label: 'Revenue (kr)', align: 'right', mono: true },
      { key: 'Costs', label: 'Costs (kr)', align: 'right', mono: true }
    ]
  }
}
```

---

## Legend

Interactive legend rendered automatically when `options.legend.enabled: true`.

### Legend options

| Option | Type | Default | Description |
|---|---|---|---|
| `options.legend.enabled` | `boolean` | `true` | Show/hide legend |
| `options.legend.position` | `string` | `'top'` | `'top'`, `'bottom'`, `'left'`, `'right'` |

Click a legend item to toggle series visibility. The chart re-renders automatically.

Datasets with `dash: true` or `ref: true` display a "(ref)" tag in the legend.

---

## Tooltip

Mouse-tracking tooltip shown on chart hover. Supports simple key-value and rich structured format.

### Tooltip options

| Option | Type | Default | Description |
|---|---|---|---|
| `options.tooltip.enabled` | `boolean` | `true` | Show/hide tooltip |
| `style.tooltip.background` | `string` | `'#1F2937'` | Background color |
| `style.tooltip.color` | `string` | `'#FFFFFF'` | Text color |
| `style.tooltip.fontSize` | `number` | `12` | Font size |
| `style.tooltip.padding` | `number` | `8` | Padding |
| `style.tooltip.borderRadius` | `number` | `4` | Border radius |
| `style.tooltip.shadow` | `string` | `'0 10px 15px...'` | Box shadow |

Rich tooltips with header, color swatches, and YoY footer are built automatically for BarChart and LineChart when multiple datasets are present.
