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

### `NewChart.liveWidget(element, config)`

Factory method that creates and returns a LiveWidget instance.

- **element** `Element|string` - DOM element or CSS selector
- **config** `Object` - Widget configuration (variant, data, theme, colors)
- **Returns** `LiveWidget`

### `NewChart.ecommerceSimulator(config)`

Factory method that creates and returns an EcommerceSimulator instance.

- **config** `Object` - Simulator configuration (baseVisitors, callbacks, etc.)
- **Returns** `EcommerceSimulator`

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
NewChart.LiveWidget
NewChart.EcommerceSimulator
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
| `ComboChart` | `LiveWidget` | `getDarkPalette` |
|  | `createLiveWidget` | |
|  | `EcommerceSimulator` | |
|  | `createEcommerceSimulator` | |
|  | `DataTable` | |
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

## LiveWidget Instance Methods

### `widget.update(data)`

Merge partial data and re-render with smooth transitions. The data shape depends on the variant.

```js
widget.update({ visitors: 30, carts: 5, pages: [...] });
```

### `widget.destroy()`

Remove all DOM elements, cancel animations, and clean up intervals.

---

## EcommerceSimulator Instance Methods

### `sim.start()`

Start the simulation tick loop.

### `sim.stop()`

Pause the simulation (resumable with `start()`).

### `sim.destroy()`

Stop and clean up all state.

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

---

## Drill-Down

Enable drill-down on bar charts by setting `options.drillDown: true`. Data can come from embedded `data.children` (client-side) or an async `onDrillDown` callback (server-side).

### Config

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `options.drillDown` | `boolean` | `false` | Enable drill-down on bar click |
| `options.onDrillDown` | `Function` | `null` | Async callback `({ label, level, path }) => Promise<data>` |
| `options.drillDownRootLabel` | `string` | `'All'` | Label for the root breadcrumb item |
| `data.children` | `Object` | – | Map of `{ [label]: { labels, datasets, children? } }` |
| `style.breadcrumb.fontSize` | `number` | `12` | Breadcrumb font size |
| `style.breadcrumb.color` | `string` | `'#6B7280'` | Current level text color |
| `style.breadcrumb.activeColor` | `string` | `'#4c6ef5'` | Clickable crumb color |
| `style.breadcrumb.separator` | `string` | `' › '` | Separator between crumbs |

### Client-Side (embedded children)

```js
NewChart.create('#chart', {
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{ label: 'Revenue', values: [12000, 14000, 11000, 15000] }],
    children: {
      Q1: { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ values: [3900, 4100, 4000] }] },
      Q2: { labels: ['Apr', 'May', 'Jun'], datasets: [{ values: [4600, 4800, 4600] }] }
    }
  },
  options: { drillDown: true, drillDownRootLabel: 'Revenue' }
});
```

### Server-Side (async callback)

```js
NewChart.create('#chart', {
  type: 'bar',
  data: topLevelData,
  options: {
    drillDown: true,
    onDrillDown: async ({ label, level, path }) => {
      const res = await fetch(`/api/detail?path=${path.join(',')}`);
      return res.json(); // must return { labels, datasets }
    }
  }
});
```

The callback receives `{ label, level, path }` where `path` is the full trail from root. A loading state (reduced opacity) is shown during the async call.

### Instance Methods

#### `chart.drillUp(level?)`

Navigate back. Omit `level` to go up one step, or pass `0` to return to root.

#### `chart.drillTo(level)`

Navigate to a specific drill level (0 = root).

---

## Breadcrumb Instance Methods

The Breadcrumb component is created automatically by drill-down charts but can also be used standalone.

### `new Breadcrumb(container, options)`

Create a breadcrumb. Options: `fontSize`, `color`, `activeColor`, `separator`, `padding`, `dark`, `onClick`.

### `breadcrumb.update(items)`

Update items. Each item: `{ label: string, level: number }`. Hidden when only one item.

### `breadcrumb.show()` / `breadcrumb.hide()`

Toggle visibility.

### `breadcrumb.destroy()`

Remove from DOM.
