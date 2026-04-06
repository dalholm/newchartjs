/**
 * NewChart Demo — Mock API
 * Centralized demo data with optional simulated latency.
 */

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const QUARTERS = ['Q1','Q2','Q3','Q4'];

/** Simulated network delay (ms). Set to 0 for instant. */
let _delay = 0;

function wait(data) {
  if (_delay <= 0) return Promise.resolve(data);
  return new Promise(r => setTimeout(() => r(data), _delay));
}

// ─── Revenue / Bar data ────────────────────────────────────────────

const REV_26 = [2850,3120,2960,3480,3210,3650,2890,3340,3580,3120,3890,4210];
const REV_25 = [2200,2450,2380,2710,2590,2840,2310,2680,2920,2510,3120,3580];
const BUDGET = [2700,2900,3000,3200,3100,3400,3000,3200,3500,3300,3700,4000];

// ─── Product breakdown ─────────────────────────────────────────────

const PRODUCTS = {
  mattresses:  { q: [4200,4800,3900,5100], monthly: [980,1050,1020,1180,1120,1280,1050,1200,1300,1100,1380,1480] },
  pillows:     { q: [2800,2600,2900,3100], monthly: [680,720,700,780,740,820,680,760,800,700,860,940] },
  bedFrames:   { q: [1800,2100,1600,2400], monthly: [580,540,560,520,500,530,480,520,500,490,510,480] },
  bathTextiles:{ q: [0,0,0,0],             monthly: [320,340,360,380,400,420,380,410,440,400,460,500] },
  duvets:      { q: [0,0,0,0],             monthly: [240,250,260,270,265,280,260,275,290,270,300,310] },
  accessories: { q: [900,1100,800,1200],   monthly: [100,105,110,120,125,135,115,130,140,120,150,165] },
};

// ─── Cost breakdown ────────────────────────────────────────────────

const COSTS = {
  personnel: [420,430,440,445,450,460,465,470,480,490,500,510],
  materials: [280,290,285,300,310,295,305,315,320,310,325,330],
  logistics: [180,175,185,190,195,200,205,210,215,220,225,230],
  other:     [120,105,90,65,45,45,25,5,85,80,50,30],
};

// ─── Line chart data ───────────────────────────────────────────────

const SESSIONS = [12400,13200,11800,14600,13800,15200,12600,14100,15400,13600,16200,17800];
const CONVERSION = [3.2,3.4,3.1,3.6,3.3,3.8,3.2,3.5,3.7,3.4,3.9,4.1];

// ─── Area chart data ───────────────────────────────────────────────

const CASHFLOW_IN  = [4200,4500,4100,5200,4800,5400,4300,5100,5600,4900,6000,6500];
const CASHFLOW_OUT = [3800,4100,3600,4400,4200,4600,3900,4300,4700,4100,5000,5200];
const INVENTORY = [12500,12800,12200,13400,13000,13800,12600,13200,14000,13400,14600,15200];

// ─── Pie / Donut data ──────────────────────────────────────────────

const CHANNEL_DIST = [
  { label: 'Online Store', value: 42 },
  { label: 'Retail', value: 28 },
  { label: 'Wholesale', value: 18 },
  { label: 'Marketplace', value: 12 },
];

const CATEGORY_DIST = [
  { label: 'Mattresses', value: 38 },
  { label: 'Pillows', value: 22 },
  { label: 'Bed Frames', value: 18 },
  { label: 'Bath', value: 12 },
  { label: 'Other', value: 10 },
];

// ─── Gauge data ────────────────────────────────────────────────────

const GAUGE_KPIS = {
  satisfaction: { value: 78, min: 0, max: 100, suffix: '%', label: 'Customer Satisfaction' },
  delivery:    { value: 94.2, min: 80, max: 100, suffix: '%', label: 'On-Time Delivery' },
  margin:      { value: 32.5, min: 0, max: 50, suffix: '%', label: 'Gross Margin' },
  fill:        { value: 68, min: 0, max: 100, suffix: '%', label: 'Warehouse Fill Rate' },
};

// ─── KPI summary ───────────────────────────────────────────────────

const KPI_SUMMARY = [
  { label: 'Revenue', value: '38.9M', change: 12.4, trend: REV_26 },
  { label: 'Orders', value: '5,872', change: 8.2, trend: [412,468,431,502,478,528,419,487,519,453,564,611] },
  { label: 'Avg Order', value: '6,624', change: 3.8, trend: [6917,6667,6868,6932,6715,6913,6897,6861,6898,6887,6898,6891] },
  { label: 'Return Rate', value: '3.8%', change: -0.6, trend: [4.2,4.0,4.5,3.9,4.1,3.7,3.8,3.5,3.6,3.9,3.4,3.8] },
];

// ─── Product table (for sparkline page) ────────────────────────────

const PRODUCT_TABLE = [
  { name: 'Mattresses', revenue: '14,200', change: 15.2, trend: PRODUCTS.mattresses.monthly },
  { name: 'Pillows', revenue: '8,900', change: 9.8, trend: PRODUCTS.pillows.monthly },
  { name: 'Bed Frames', revenue: '6,300', change: -2.1, trend: PRODUCTS.bedFrames.monthly },
  { name: 'Bath Textiles', revenue: '4,800', change: 22.4, trend: PRODUCTS.bathTextiles.monthly },
  { name: 'Duvets', revenue: '3,200', change: 5.6, trend: PRODUCTS.duvets.monthly },
  { name: 'Accessories', revenue: '1,520', change: 18.9, trend: PRODUCTS.accessories.monthly },
];

// ─── Scatter data ──────────────────────────────────────────────────

const SCATTER_PRODUCTS = [
  { x: 12, y: 35, z: 4200, label: 'Mattresses' },
  { x: 8, y: 28, z: 2800, label: 'Pillows' },
  { x: 22, y: 18, z: 1800, label: 'Bed Frames' },
  { x: 5, y: 42, z: 900, label: 'Accessories' },
  { x: 15, y: 22, z: 1200, label: 'Bath Textiles' },
  { x: 18, y: 15, z: 600, label: 'Duvets' },
];

const SCATTER_RISK = [
  { x: 2, y: 12 }, { x: 5, y: 28 }, { x: 8, y: 18 }, { x: 3, y: 35 },
  { x: 12, y: 8 }, { x: 7, y: 22 }, { x: 15, y: 5 }, { x: 4, y: 30 },
  { x: 10, y: 15 }, { x: 6, y: 25 }, { x: 9, y: 20 }, { x: 11, y: 10 },
];

// ─── Combo data ────────────────────────────────────────────────────

const COMBO_REVENUE = [2850,3120,2960,3480,3210,3650,2890,3340,3580,3120,3890,4210];
const COMBO_MARGIN = [28.5,30.2,29.1,32.4,31.0,33.8,29.8,31.5,33.2,30.8,34.5,35.1];

// ─── Sparkline change data ─────────────────────────────────────────

const CHANGES = {
  margin:    [1.2,-0.8,0.5,1.5,-0.3,0.8,-1.2,0.6,1.0,-0.5,1.4,0.9],
  inventory: [-200,150,-350,400,-100,280,-180,320,500,-150,400,-80],
};

// ─── Funnel data ──────────────────────────────────────────────────

const FUNNEL_ECOMMERCE = {
  labels: ['Website Visits', 'Product Views', 'Add to Cart', 'Checkout', 'Purchase'],
  values: [45200, 28400, 12800, 8200, 5870]
};

const FUNNEL_SIGNUP = {
  labels: ['Landing Page', 'Sign Up Started', 'Email Verified', 'Profile Complete', 'First Purchase'],
  values: [32000, 18500, 14200, 9800, 6100]
};

// ─── Waterfall data ───────────────────────────────────────────────

const WATERFALL_REVENUE = {
  labels: ['Gross Revenue', 'Discounts', 'Returns', 'Shipping Cost', 'Payment Fees', 'Net Revenue'],
  values: [48500, -4200, -2800, -3100, -1450, 0],
  types: ['increase', 'decrease', 'decrease', 'decrease', 'decrease', 'total']
};

const WATERFALL_MONTHLY = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'H1 Total'],
  values: [2850, 270, -160, 520, -270, 440, 0],
  types: ['increase', 'increase', 'decrease', 'increase', 'decrease', 'increase', 'total']
};

// ─── Heatmap data ─────────────────────────────────────────────────

const HEATMAP_SALES_BY_HOUR = {
  xLabels: ['06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'],
  yLabels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  values: [
    [2,5,12,28,35,42,38,32,45,52,48,55,62,58,45,38,28,15],
    [1,4,10,25,32,38,35,30,42,48,45,52,58,55,42,35,25,12],
    [3,6,14,30,38,45,42,35,48,55,52,58,65,60,48,40,30,18],
    [2,5,11,26,34,40,36,31,44,50,46,53,60,56,44,36,26,14],
    [4,8,16,32,40,48,44,38,52,58,54,62,68,65,52,42,32,20],
    [8,15,22,38,48,55,52,45,58,65,62,68,72,68,55,48,38,25],
    [6,12,18,32,40,45,42,38,48,52,48,55,58,52,42,35,28,18]
  ]
};

// ─── Cohort data ──────────────────────────────────────────────────

const COHORT_RETENTION = {
  labels: ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'],
  periodLabels: ['Users', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
  values: [
    [4200, 68, 52, 41, 35, 30, 26],
    [4800, 72, 56, 44, 37, 32],
    [3900, 65, 48, 38, 31],
    [5100, 70, 54, 42],
    [4600, 74, 58],
    [5200, 71]
  ]
};

// ─── Bullet data ──────────────────────────────────────────────────

const BULLET_KPIS = [
  { label: 'Revenue', subtitle: 'YTD (M kr)', value: 38.9, target: 42, comparative: 34.5, min: 0, max: 50 },
  { label: 'New Customers', subtitle: 'This Quarter', value: 1850, target: 2000, comparative: 1620, min: 0, max: 2500 },
  { label: 'Avg Order Value', subtitle: 'kr', value: 6624, target: 7000, comparative: 6100, min: 0, max: 8000 },
  { label: 'Customer Satisfaction', subtitle: 'NPS', value: 78, target: 80, comparative: 72, min: 0, max: 100 },
  { label: 'Return Rate', subtitle: '%', value: 3.8, target: 3.0, comparative: 4.2, min: 0, max: 8 }
];

// ─── Sankey data ──────────────────────────────────────────────────

const SANKEY_TRAFFIC = {
  nodes: [
    { id: 'Google', label: 'Google', color: '#4c6ef5' },
    { id: 'Direct', label: 'Direct', color: '#0ca678' },
    { id: 'Social', label: 'Social', color: '#f08c00' },
    { id: 'Email', label: 'Email', color: '#7048e8' },
    { id: 'Homepage', label: 'Homepage', color: '#1098ad' },
    { id: 'Category', label: 'Category Page', color: '#d6336c' },
    { id: 'Product', label: 'Product Page', color: '#5c7cfa' },
    { id: 'Cart', label: 'Cart', color: '#20c997' },
    { id: 'Purchase', label: 'Purchase', color: '#0ca678' },
    { id: 'Bounce', label: 'Bounce', color: '#e03131' }
  ],
  links: [
    { source: 'Google', target: 'Homepage', value: 12000 },
    { source: 'Google', target: 'Product', value: 8000 },
    { source: 'Direct', target: 'Homepage', value: 9000 },
    { source: 'Social', target: 'Product', value: 5000 },
    { source: 'Social', target: 'Homepage', value: 2000 },
    { source: 'Email', target: 'Product', value: 4000 },
    { source: 'Email', target: 'Category', value: 2000 },
    { source: 'Homepage', target: 'Category', value: 15000 },
    { source: 'Homepage', target: 'Bounce', value: 8000 },
    { source: 'Category', target: 'Product', value: 14000 },
    { source: 'Category', target: 'Bounce', value: 5000 },
    { source: 'Product', target: 'Cart', value: 18000 },
    { source: 'Product', target: 'Bounce', value: 13000 },
    { source: 'Cart', target: 'Purchase', value: 12000 },
    { source: 'Cart', target: 'Bounce', value: 6000 }
  ]
};

// ─── Treemap data ─────────────────────────────────────────────────

const TREEMAP_CATEGORIES = {
  labels: ['Mattresses','Pillows','Bed Frames','Bath Textiles','Duvets','Accessories',
           'Sheets','Blankets','Nightstands','Mattress Protectors'],
  values: [14200, 8900, 6300, 4800, 3200, 1520, 2800, 2100, 1800, 1400],
  growth: [15.2, 9.8, -2.1, 22.4, 5.6, 18.9, 8.3, -4.2, 12.1, 6.8]
};

// ─── Range chart data ─────────────────────────────────────────────

const RANGE_CAMPAIGNS = {
  labels: MONTHS,
  datasets: [
    { label: 'Revenue (k)', values: REV_26, fill: true }
  ],
  zones: [
    { from: 0, to: 2, label: 'Winter Sale', color: '#4c6ef5', opacity: 0.08 },
    { from: 4, to: 5, label: 'Spring Campaign', color: '#0ca678', opacity: 0.08 },
    { from: 9, to: 11, label: 'Black Friday + Xmas', color: '#e03131', opacity: 0.08 }
  ],
  annotations: [
    { index: 3, label: 'New website launch', color: '#7048e8' },
    { index: 7, label: 'Price increase', color: '#f08c00' }
  ]
};

// ─── KPI Comparison data ──────────────────────────────────────────

const KPI_COMPARISON = [
  { label: 'Revenue', value: 38900000, previousValue: 34600000, target: 42000000,
    prefix: '', suffix: ' kr', sparklineData: REV_26, direction: 'up-good' },
  { label: 'Orders', value: 5872, previousValue: 5420, target: 6500,
    sparklineData: [412,468,431,502,478,528,419,487,519,453,564,611], direction: 'up-good' },
  { label: 'Avg Order Value', value: 6624, previousValue: 6382, target: 7000,
    prefix: '', suffix: ' kr', sparklineData: [6917,6667,6868,6932,6715,6913,6897,6861,6898,6887,6898,6891], direction: 'up-good' },
  { label: 'Return Rate', value: 3.8, previousValue: 4.2, target: 3.0,
    suffix: '%', decimals: 1, sparklineData: [4.2,4.0,4.5,3.9,4.1,3.7,3.8,3.5,3.6,3.9,3.4,3.8], direction: 'down-good' },
  { label: 'Customer Satisfaction', value: 78, previousValue: 72, target: 80,
    suffix: '%', sparklineData: [68,70,72,71,74,73,75,74,76,75,77,78], direction: 'up-good' },
  { label: 'Conversion Rate', value: 4.1, previousValue: 3.6, target: 4.5,
    suffix: '%', decimals: 1, sparklineData: CONVERSION, direction: 'up-good' }
];

// ═══ Public API ════════════════════════════════════════════════════

const api = {
  /** Set simulated delay in ms */
  set delay(ms) { _delay = ms; },
  get delay() { return _delay; },

  /** Shared constants */
  MONTHS,
  QUARTERS,

  // ── Bar ──

  async getRevenue() {
    return wait({
      labels: MONTHS,
      datasets: [{ label: 'Revenue (k)', values: REV_26 }],
      meta: { budget: BUDGET }
    });
  },

  async getRevenueComparison() {
    return wait({
      labels: MONTHS,
      datasets: [
        { label: '2026', values: REV_26 },
        { label: '2025', values: REV_25, ref: true }
      ]
    });
  },

  async getStackedCategories() {
    return wait({
      labels: QUARTERS,
      datasets: [
        { label: 'Mattresses', values: PRODUCTS.mattresses.q },
        { label: 'Pillows', values: PRODUCTS.pillows.q },
        { label: 'Bed Frames', values: PRODUCTS.bedFrames.q },
        { label: 'Accessories', values: PRODUCTS.accessories.q }
      ]
    });
  },

  async getCostBreakdown() {
    return wait({
      labels: MONTHS,
      datasets: [
        { label: 'Personnel', values: COSTS.personnel },
        { label: 'Materials', values: COSTS.materials },
        { label: 'Logistics', values: COSTS.logistics },
        { label: 'Other', values: COSTS.other }
      ]
    });
  },

  // ── Line ──

  async getSessionTrend() {
    return wait({
      labels: MONTHS,
      datasets: [{ label: 'Sessions', values: SESSIONS }]
    });
  },

  async getConversionTrend() {
    return wait({
      labels: MONTHS,
      datasets: [
        { label: 'Conversion %', values: CONVERSION },
        { label: 'Target', values: Array(12).fill(3.5), dash: true, ref: true }
      ]
    });
  },

  async getMultiLine() {
    return wait({
      labels: MONTHS,
      datasets: [
        { label: 'Revenue', values: REV_26 },
        { label: 'Sessions', values: SESSIONS.map(v => v / 4) },
        { label: 'Orders', values: [412,468,431,502,478,528,419,487,519,453,564,611] }
      ]
    });
  },

  // ── Area ──

  async getCashflow() {
    return wait({
      labels: MONTHS,
      datasets: [
        { label: 'Inflow', values: CASHFLOW_IN },
        { label: 'Outflow', values: CASHFLOW_OUT }
      ]
    });
  },

  async getInventoryTrend() {
    return wait({
      labels: MONTHS,
      datasets: [{ label: 'Inventory Units', values: INVENTORY }]
    });
  },

  // ── Pie ──

  async getChannelDistribution() {
    return wait({
      labels: CHANNEL_DIST.map(d => d.label),
      datasets: [{ values: CHANNEL_DIST.map(d => d.value) }]
    });
  },

  async getCategoryDistribution() {
    return wait({
      labels: CATEGORY_DIST.map(d => d.label),
      datasets: [{ values: CATEGORY_DIST.map(d => d.value) }]
    });
  },

  // ── Gauge ──

  async getGaugeKPIs() {
    return wait(GAUGE_KPIS);
  },

  // ── KPI / Sparkline ──

  async getKPISummary() {
    return wait(KPI_SUMMARY);
  },

  async getProductTable() {
    return wait(PRODUCT_TABLE);
  },

  async getChanges() {
    return wait(CHANGES);
  },

  // ── Combo ──

  async getRevenueMargin() {
    return wait({
      labels: MONTHS,
      datasets: [
        { label: 'Revenue (k)', values: COMBO_REVENUE, type: 'bar' },
        { label: 'Margin %', values: COMBO_MARGIN, type: 'line' }
      ]
    });
  },

  // ── Scatter ──

  async getProductScatter() {
    return wait({
      datasets: [{
        label: 'Products',
        points: SCATTER_PRODUCTS
      }]
    });
  },

  async getRiskScatter() {
    return wait({
      datasets: [{
        label: 'Risk Assessment',
        points: SCATTER_RISK
      }]
    });
  },

  // ── Funnel ──

  async getFunnelEcommerce() {
    return wait({
      labels: FUNNEL_ECOMMERCE.labels,
      datasets: [{ values: FUNNEL_ECOMMERCE.values }]
    });
  },

  async getFunnelSignup() {
    return wait({
      labels: FUNNEL_SIGNUP.labels,
      datasets: [{ values: FUNNEL_SIGNUP.values }]
    });
  },

  // ── Waterfall ──

  async getWaterfallRevenue() {
    return wait({
      labels: WATERFALL_REVENUE.labels,
      datasets: [{ label: 'Revenue Breakdown', values: WATERFALL_REVENUE.values, types: WATERFALL_REVENUE.types }]
    });
  },

  async getWaterfallMonthly() {
    return wait({
      labels: WATERFALL_MONTHLY.labels,
      datasets: [{ label: 'Monthly Change', values: WATERFALL_MONTHLY.values, types: WATERFALL_MONTHLY.types }]
    });
  },

  // ── Heatmap ──

  async getHeatmapSales() {
    return wait({
      labels: HEATMAP_SALES_BY_HOUR.xLabels,
      yLabels: HEATMAP_SALES_BY_HOUR.yLabels,
      datasets: [{ values: HEATMAP_SALES_BY_HOUR.values }]
    });
  },

  // ── Cohort ──

  async getCohortRetention() {
    return wait({
      labels: COHORT_RETENTION.labels,
      periodLabels: COHORT_RETENTION.periodLabels,
      datasets: [{ values: COHORT_RETENTION.values }]
    });
  },

  // ── Bullet ──

  async getBulletKPIs() {
    return wait(BULLET_KPIS);
  },

  // ── Sankey ──

  async getSankeyTraffic() {
    return wait(SANKEY_TRAFFIC);
  },

  // ── Treemap ──

  async getTreemapCategories() {
    return wait({
      labels: TREEMAP_CATEGORIES.labels,
      datasets: [{ values: TREEMAP_CATEGORIES.values, growth: TREEMAP_CATEGORIES.growth }]
    });
  },

  // ── Range ──

  async getRangeCampaigns() {
    return wait(RANGE_CAMPAIGNS);
  },

  // ── KPI Comparison ──

  async getKPIComparison() {
    return wait(KPI_COMPARISON);
  },
};

export default api;
