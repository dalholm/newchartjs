# Drill-Down Navigation

Drill-down lets users click a bar to zoom into sub-data, with a breadcrumb trail to navigate back. Supports arbitrary depth and both client-side and server-side data sources.

## Quick Start

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
  options: { drillDown: true }
});
```

Click Q1 to see January–March. A breadcrumb appears: **All** › **Q1**. Click "All" to go back.

## Client-Side (data.children)

Embed all levels in the data object. Best for small, known hierarchies.

```js
data: {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [{ values: [12000, 14000, 11000, 15000] }],
  children: {
    Q1: {
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ values: [3900, 4100, 4000] }],
      children: {
        Jan: { labels: ['W1', 'W2', 'W3', 'W4'], datasets: [{ values: [900, 1100, 1000, 900] }] }
      }
    }
  }
}
```

Each child can have its own `children` for arbitrary depth. Labels without a matching key in `children` are not drillable.

## Server-Side (onDrillDown callback)

Fetch data on demand. Best for large datasets or dynamic data.

```js
options: {
  drillDown: true,
  onDrillDown: async ({ label, level, path }) => {
    const res = await fetch(`/api/revenue?path=${path.join(',')}`);
    return res.json(); // must return { labels, datasets }
  }
}
```

The callback receives:

| Parameter | Type | Description |
|-----------|------|-------------|
| `label` | `string` | The clicked bar label |
| `level` | `number` | Target level (1 = first drill) |
| `path` | `string[]` | Full trail from root, e.g. `['All', 'Q1', 'Jan']` |

During the async call, the chart shows a loading state (reduced opacity). If the callback throws, the chart stays at the current level.

## Mixed Mode

You can combine both: use `children` for known levels and `onDrillDown` as a fallback for deeper levels.

```js
data: {
  labels: ['Q1', 'Q2'],
  datasets: [{ values: [12000, 14000] }],
  children: {
    Q1: { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ values: [3900, 4100, 4000] }] }
  }
},
options: {
  drillDown: true,
  onDrillDown: async ({ label, level, path }) => {
    // Only called when children[label] doesn't exist
    return await fetchFromServer(path);
  }
}
```

Client-side children are always checked first. The callback is only invoked when no matching child exists.

## Breadcrumb Styling

```js
style: {
  breadcrumb: {
    fontSize: 12,
    color: '#6B7280',
    activeColor: '#4c6ef5',
    separator: ' › ',
    padding: '6px 0'
  }
}
```

In dark mode, colors are automatically adjusted. Override with `style.breadcrumb.color` and `style.breadcrumb.activeColor`.

## Programmatic Navigation

```js
const chart = NewChart.create('#chart', { /* ... */ });

chart.drillUp();    // Go up one level
chart.drillUp(0);   // Go to root
chart.drillTo(1);   // Go to level 1
```

## Combining with Large Datasets

Drill-down works with `maxVisibleBars`. The scroll position resets when drilling into sub-data.

```js
options: {
  drillDown: true,
  maxVisibleBars: 10 // scroll if more than 10 bars at any level
}
```

## Config Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `options.drillDown` | `boolean` | `false` | Enable drill-down |
| `options.onDrillDown` | `Function\|null` | `null` | Async data callback |
| `options.drillDownRootLabel` | `string` | `'All'` | Root breadcrumb label |
| `data.children` | `Object` | – | `{ [label]: { labels, datasets, children? } }` |
| `style.breadcrumb.*` | – | – | See Breadcrumb Styling above |
