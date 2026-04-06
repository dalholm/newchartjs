# API Reference

## NewChart (namespace)

### `NewChart.create(element, config)`

Factory method that creates and returns a chart instance.

- **element** `Element|string` - DOM element or CSS selector
- **config** `Object` - Chart configuration
- **Returns** `Chart` - Chart instance (BarChart, LineChart, etc.)

```js
const chart = NewChart.create('#chart', { type: 'bar', data: { ... } });
```

### `NewChart.kpiCard(element, config)`

Factory method that creates and returns a KPICard instance.

- **element** `Element|string` - DOM element or CSS selector
- **config** `Object` - KPI card configuration
- **Returns** `KPICard`

### `NewChart.getSupportedTokens()`

Returns an array of all supported CSS custom property names.

- **Returns** `string[]`

### `NewChart.PALETTE`

The default 10-color palette array.

### `NewChart.COMPARE_COLOR`

The default compare/previous-period color: `'#b3bac5'`.

### `NewChart.version`

Library version string: `'0.1.0'`.

### Direct class access

All chart classes are available as properties on the default export:

```js
NewChart.BarChart
NewChart.LineChart
NewChart.PieChart
NewChart.AreaChart
NewChart.GaugeChart
NewChart.SparklineChart
NewChart.ComboChart
NewChart.ScatterChart
NewChart.NetworkBallChart
NewChart.FunnelChart
NewChart.WaterfallChart
NewChart.HeatmapChart
NewChart.CohortChart
NewChart.BulletChart
NewChart.SankeyChart
NewChart.TreemapChart
NewChart.RangeChart
NewChart.KPICard
NewChart.KPIComparisonCard
NewChart.DataTable
```

### Named exports (tree-shaking)

All classes and utilities are also available as named exports, enabling bundlers to tree-shake unused code:

```js
import { BarChart, PieChart, KPICard } from 'newchartjs';
```

Available named exports:

| Charts | Components | Utilities |
|---|---|---|
| `BarChart` | `KPICard` | `getSupportedTokens` |
| `PieChart` | `createKPICard` | `COMPARE_COLOR` |
| `LineChart` | `TrendBadge` | `COLOR_PALETTE` |
| `AreaChart` | `createTrendBadge` | `DARK_STYLE` |
| `GaugeChart` | `KPIComparisonCard` | `DARK_KPI_COLORS` |
| `SparklineChart` | `createKPIComparisonCard` | `isDarkMode` |
| `ComboChart` | `DataTable` | `getDarkPalette` |
| `ScatterChart` | | `deepMerge` |
| `NetworkBallChart` | | |
| `FunnelChart` | | |
| `WaterfallChart` | | |
| `HeatmapChart` | | |
| `CohortChart` | | |
| `BulletChart` | | |
| `SankeyChart` | | |
| `TreemapChart` | | |
| `RangeChart` | | |

---

## Chart Instance Methods

All chart types share these methods from the base `Chart` class:

### `chart.update(config)`

Merge partial config and re-render.

```js
chart.update({
  data: { datasets: [{ values: [10, 20, 30] }] },
  style: { bar: { borderRadius: 8 } }
});
```

### `chart.destroy()`

Remove all DOM elements, event listeners, resize observers, and animations.

### `chart.toPNG()`

Export chart as PNG. SVG renderer only.

- **Returns** `Promise<string>` - Data URL

### `chart.toSVG()`

Export chart as SVG markup string. SVG renderer only.

- **Returns** `string`

### `chart.highlightColumn(index)` / `chart.highlightSlice(index)`

Programmatically highlight a data point by index. Available on BarChart, LineChart (highlightColumn) and PieChart (highlightSlice).

### `chart.clearHighlight()`

Clear all programmatic highlights.

---

## Callbacks

### `options.onHover(index, label)`

Called when a data point/column is hovered.

```js
{
  options: {
    onHover: (index, label) => {
      console.log(`Hovered: ${label} (index ${index})`);
    }
  }
}
```

### `options.onHoverEnd()`

Called when mouse leaves a data point/column.

### `options.onClick({ index, label, value, percent, event })`

PieChart only. Called when a slice is clicked.

---

## KPICard Instance Methods

### `card.update(config)`

Merge partial config and re-render.

### `card.setActive(boolean)`

Toggle the active/selected visual state.

### `card.destroy()`

Clean up DOM, event listeners, and sparkline instance.

---

## Animation API

The animation engine is used internally but can also be accessed via chart methods:

### `chart.animateValue(options)`

Start an animation. Returns a cancel function.

```js
const cancel = chart.animateValue({
  from: 0,
  to: 100,
  duration: 600,
  easing: 'easeOutCubic',
  onUpdate: (value, progress) => { ... },
  onComplete: () => { ... }
});

// Cancel animation
cancel();
```

### `chart.cancelAnimations()`

Cancel all running animations on the chart.

---

## DataTable Instance Methods

### `dataTable.setData(chartData, extra)`

Set table data from chart data format.

### `dataTable.setViewMode(mode)`

Switch between `'chart'`, `'table'`, or `'split'`.

### `dataTable.highlightRow(index)`

Highlight a row by index.

### `dataTable.clearHighlight()`

Clear all row highlights.

### `dataTable.show()` / `dataTable.hide()`

Show or hide the table.

### `dataTable.destroy()`

Remove the table from DOM.

---

## Legend Instance Methods

### `legend.setVisibility(key, boolean)`

Programmatically toggle a series.

### `legend.isVisible(key)`

Check if a series is visible.

### `legend.getVisibility()`

Get full visibility state map `{ key: boolean }`.

### `legend.show()` / `legend.hide()`

Show or hide the legend element.

### `legend.destroy()`

Remove the legend from DOM.
