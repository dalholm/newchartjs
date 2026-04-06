/**
 * EcommerceSimulator — Realistic e-commerce traffic simulator
 *
 * Generates realistic, time-weighted e-commerce data for LiveWidget demos.
 * Simulates visitors arriving/leaving, cart additions, orders completing,
 * and revenue accumulating. Uses Poisson-like random events with
 * time-of-day traffic curves.
 *
 * Usage:
 *   const sim = new EcommerceSimulator({
 *     baseVisitors: 25,
 *     avgOrderValue: 890,
 *     conversionRate: 2.8,
 *     onUpdate: (data) => widget.update(data)
 *   });
 *   sim.start();  // begins ticking
 *   sim.stop();   // pauses
 *   sim.destroy(); // cleanup
 */

const PRODUCT_CATALOG = [
  { name: 'Volang Rosa Badlakan', url: '/sv/products/volang-rosa-badlakan', price: 449 },
  { name: 'Ulltacke 2100g', url: '/sv/products/ulltacke-2100g-premium', price: 1890 },
  { name: 'Tilly Svart Pais', url: '/sv/products/tilly-svart-paisley', price: 349 },
  { name: 'Stormhagen Marinblå', url: '/sv/products/stormhagen-marinbla', price: 695 },
  { name: 'Skalhamn Rödbla', url: '/sv/products/skalhamn-rodbla-kudde', price: 279 },
  { name: 'Pomegranate Grön', url: '/sv/products/pomegranate-gron', price: 529 },
  { name: 'Pomegranate Aprikos', url: '/sv/products/pomegranate-aprikos', price: 529 },
  { name: 'Örngott Allan Grå', url: '/sv/products/orngott-allan-gra', price: 189 },
  { name: 'Kuvertlakan Percale', url: '/sv/products/kuvertlakan-percale', price: 399 },
  { name: 'Hotell Satin Grå', url: '/sv/products/hotell-satin-gra', price: 799 },
  { name: 'Nordic Dream Duntäcke', url: '/sv/products/nordic-dream-duntacke', price: 2490 },
  { name: 'Linnelakan Sand', url: '/sv/products/linnelakan-sand', price: 1290 },
  { name: 'Hampton Överkast', url: '/sv/products/hampton-overkast', price: 1690 },
  { name: 'Dimma Mörkgrå Filt', url: '/sv/products/dimma-morkgra-filt', price: 549 },
  { name: 'Classic White Handduk Set', url: '/sv/products/classic-white-handduk-set', price: 389 },
];

const PAGE_PATHS = [
  '/sv/products/',
  '/sv/collections/nytt',
  '/sv/collections/baddagar',
  '/sv/collections/sangkläder',
  '/sv/',
  '/sv/cart',
  '/sv/checkout',
  '/sv/collections/sale',
  '/sv/pages/om-oss',
  '/sv/collections/present',
];

const FIRST_NAMES = ['Anna', 'Erik', 'Sara', 'Johan', 'Lisa', 'Karl', 'Emma', 'Nils', 'Maja', 'Oskar', 'Klara', 'Gustav'];
const CITIES = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping', 'Örebro', 'Lund', 'Umeå'];

/**
 * Traffic weight curve — simulates realistic e-commerce traffic by hour
 * Peak at lunch (12-13) and evening (19-21), low at night
 */
const HOURLY_WEIGHT = [
  0.05, 0.03, 0.02, 0.02, 0.02, 0.04,  // 00-05
  0.08, 0.15, 0.30, 0.50, 0.65, 0.80,  // 06-11
  0.90, 0.85, 0.70, 0.65, 0.70, 0.80,  // 12-17
  0.95, 1.00, 0.95, 0.80, 0.50, 0.20   // 18-23
];

export class EcommerceSimulator {
  /**
   * Create a simulator
   * @param {Object} config - Simulator configuration
   * @param {number} [config.baseVisitors=25] - Base number of concurrent visitors at peak
   * @param {number} [config.avgOrderValue=890] - Average order value in SEK
   * @param {number} [config.conversionRate=2.8] - Conversion rate in percent
   * @param {number} [config.tickInterval=2000] - Update interval in ms
   * @param {Function} [config.onUpdate] - Called with new data each tick
   * @param {Function} [config.onVisitorsUpdate] - Called with visitors data each tick
   * @param {Function} [config.onRevenueUpdate] - Called with revenue data each tick
   * @param {Function} [config.onActivityUpdate] - Called with activity feed data each tick
   * @param {Function} [config.onPulseUpdate] - Called with pulse/funnel data each tick
   */
  constructor(config = {}) {
    this.config = {
      baseVisitors: 25,
      avgOrderValue: 890,
      conversionRate: 2.8,
      tickInterval: 2000,
      ...config
    };

    // State
    this._visitors = [];
    this._carts = [];
    this._orders = [];
    this._revenue = 0;
    this._totalVisitors = 0;
    this._revenueHistory = [];
    this._activityFeed = [];
    this._tickCount = 0;
    this._timer = null;

    // Seed initial state
    this._seedInitialState();
  }

  /**
   * Start the simulator
   */
  start() {
    if (this._timer) return;
    this._tick();
    this._timer = setInterval(() => this._tick(), this.config.tickInterval);
  }

  /**
   * Stop the simulator (pausable)
   */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * Destroy and clean up
   */
  destroy() {
    this.stop();
    this._visitors = [];
    this._carts = [];
    this._orders = [];
    this._activityFeed = [];
  }

  /**
   * Get current traffic weight based on time of day
   * @returns {number} 0-1 weight
   */
  _getTrafficWeight() {
    const hour = new Date().getHours();
    return HOURLY_WEIGHT[hour] || 0.5;
  }

  /**
   * Seed the simulator with initial realistic data
   */
  _seedInitialState() {
    const weight = this._getTrafficWeight();
    const targetVisitors = Math.round(this.config.baseVisitors * weight);

    // Spawn initial visitors
    for (let i = 0; i < targetVisitors; i++) {
      this._visitors.push(this._createVisitor());
    }

    // Some already have carts
    const cartCount = Math.floor(targetVisitors * 0.12);
    for (let i = 0; i < cartCount; i++) {
      this._carts.push(this._createCart());
    }

    // Seed some revenue for today
    const hoursElapsed = new Date().getHours() + new Date().getMinutes() / 60;
    const avgHourlyOrders = (this.config.baseVisitors * 24 * 0.6) * (this.config.conversionRate / 100) / 24;
    const estimatedOrders = Math.round(avgHourlyOrders * hoursElapsed * (0.7 + Math.random() * 0.6));
    this._revenue = estimatedOrders * this.config.avgOrderValue * (0.8 + Math.random() * 0.4);
    this._orders = [];
    for (let i = 0; i < estimatedOrders; i++) {
      this._orders.push({ value: this.config.avgOrderValue * (0.5 + Math.random()) });
    }

    // Seed sparkline with some history
    const base = this._revenue * 0.7;
    for (let i = 0; i < 20; i++) {
      this._revenueHistory.push(base + (this._revenue - base) * (i / 20) + (Math.random() - 0.5) * this.config.avgOrderValue * 2);
    }

    // Seed a few activity items
    for (let i = 0; i < 5; i++) {
      this._activityFeed.unshift(this._generateActivityEvent(i * 60 + Math.random() * 120));
    }
  }

  /**
   * Create a new visitor
   * @returns {Object} Visitor object
   */
  _createVisitor() {
    const product = PRODUCT_CATALOG[Math.floor(Math.random() * PRODUCT_CATALOG.length)];
    const browsingProduct = Math.random() > 0.4;

    return {
      id: Math.random().toString(36).slice(2, 8),
      page: browsingProduct ? product.url : PAGE_PATHS[Math.floor(Math.random() * PAGE_PATHS.length)],
      enteredAt: Date.now() - Math.random() * 300000,
      ttl: 30000 + Math.random() * 180000  // 30s - 3.5min before leaving
    };
  }

  /**
   * Create a cart
   * @returns {Object} Cart object
   */
  _createCart() {
    const items = 1 + Math.floor(Math.random() * 3);
    const products = [];
    let total = 0;
    for (let i = 0; i < items; i++) {
      const p = PRODUCT_CATALOG[Math.floor(Math.random() * PRODUCT_CATALOG.length)];
      const qty = Math.random() > 0.7 ? 2 : 1;
      products.push({ product: p.name, qty, value: p.price * qty });
      total += p.price * qty;
    }
    return { id: Math.random().toString(36).slice(2, 8), items: products, total, createdAt: Date.now() };
  }

  /**
   * Generate a past activity event
   * @param {number} secsAgo - Seconds ago the event happened
   * @returns {Object} Activity event
   */
  _generateActivityEvent(secsAgo = 0) {
    const types = ['order', 'order', 'order', 'cart', 'cart', 'visit'];
    const type = types[Math.floor(Math.random() * types.length)];
    const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const product = PRODUCT_CATALOG[Math.floor(Math.random() * PRODUCT_CATALOG.length)];
    const mins = Math.round(secsAgo / 60);
    const timeStr = mins < 1 ? 'just nu' : mins === 1 ? '1 min sedan' : `${mins} min sedan`;

    switch (type) {
      case 'order': {
        const items = 1 + Math.floor(Math.random() * 3);
        const amount = Math.round(product.price * items * (0.8 + Math.random() * 0.6));
        return { type: 'order', text: `<strong>${name}</strong> från ${city} beställde ${items} ${items === 1 ? 'artikel' : 'artiklar'}`, time: timeStr, amount };
      }
      case 'cart':
        return { type: 'cart', text: `<strong>${name}</strong> la till <strong>${product.name}</strong> i varukorgen`, time: timeStr, amount: product.price };
      case 'visit':
        return { type: 'visit', text: `Ny besökare från ${city}`, time: timeStr, amount: null };
      default:
        return { type: 'visit', text: `Ny besökare`, time: timeStr, amount: null };
    }
  }

  /**
   * Main simulation tick
   */
  _tick() {
    this._tickCount++;
    const weight = this._getTrafficWeight();
    const targetVisitors = Math.round(this.config.baseVisitors * weight);

    // ── Visitors arriving / leaving ──
    const now = Date.now();

    // Remove expired visitors
    this._visitors = this._visitors.filter(v => (now - v.enteredAt) < v.ttl);

    // Add new visitors to approach target
    const diff = targetVisitors - this._visitors.length;
    if (diff > 0) {
      const toAdd = Math.min(diff, 1 + Math.floor(Math.random() * 3));
      for (let i = 0; i < toAdd; i++) {
        this._visitors.push(this._createVisitor());
        this._totalVisitors++;
      }
    } else if (diff < -2 && Math.random() > 0.6) {
      // Remove a couple if way over target
      this._visitors.splice(0, 1);
    }

    // Random page changes for existing visitors
    this._visitors.forEach(v => {
      if (Math.random() < 0.08) {
        const product = PRODUCT_CATALOG[Math.floor(Math.random() * PRODUCT_CATALOG.length)];
        v.page = Math.random() > 0.3 ? product.url : PAGE_PATHS[Math.floor(Math.random() * PAGE_PATHS.length)];
      }
    });

    // ── Cart activity ──
    // Random cart additions
    if (Math.random() < 0.15 * weight) {
      this._carts.push(this._createCart());
      const cart = this._carts[this._carts.length - 1];
      const item = cart.items[0];
      const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      this._activityFeed.unshift({
        type: 'cart',
        text: `<strong>${name}</strong> la till <strong>${item.product}</strong> i varukorgen`,
        time: 'just nu',
        amount: item.value
      });
    }

    // Random cart abandonment
    if (this._carts.length > 0 && Math.random() < 0.08) {
      this._carts.splice(Math.floor(Math.random() * this._carts.length), 1);
    }

    // ── Orders ──
    const orderChance = (this.config.conversionRate / 100) * 0.15 * weight;
    if (Math.random() < orderChance && this._carts.length > 0) {
      const cartIdx = Math.floor(Math.random() * this._carts.length);
      const cart = this._carts[cartIdx];
      const orderValue = cart.total * (0.9 + Math.random() * 0.2);

      this._orders.push({ value: orderValue, time: now });
      this._revenue += orderValue;
      this._carts.splice(cartIdx, 1);

      const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const itemCount = cart.items.reduce((s, i) => s + i.qty, 0);
      this._activityFeed.unshift({
        type: 'order',
        text: `<strong>${name}</strong> från ${city} beställde ${itemCount} ${itemCount === 1 ? 'artikel' : 'artiklar'}`,
        time: 'just nu',
        amount: Math.round(orderValue)
      });
    } else if (Math.random() < orderChance * 0.5) {
      // Direct order (no cart tracked)
      const product = PRODUCT_CATALOG[Math.floor(Math.random() * PRODUCT_CATALOG.length)];
      const items = 1 + Math.floor(Math.random() * 2);
      const orderValue = product.price * items;
      this._orders.push({ value: orderValue, time: now });
      this._revenue += orderValue;

      const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      this._activityFeed.unshift({
        type: 'order',
        text: `<strong>${name}</strong> från ${city} beställde ${items} ${items === 1 ? 'artikel' : 'artiklar'}`,
        time: 'just nu',
        amount: Math.round(orderValue)
      });
    }

    // Age activity feed times
    this._activityFeed.forEach((e, i) => {
      if (i === 0) return;
      const ticksSinceAdded = i;
      const secs = ticksSinceAdded * (this.config.tickInterval / 1000);
      const mins = Math.round(secs / 60);
      if (mins < 1) e.time = 'just nu';
      else if (mins === 1) e.time = '1 min sedan';
      else e.time = `${mins} min sedan`;
    });

    // Keep feed to 15 items
    if (this._activityFeed.length > 15) {
      this._activityFeed = this._activityFeed.slice(0, 15);
    }

    // Update sparkline
    this._revenueHistory.push(this._revenue);
    if (this._revenueHistory.length > 30) {
      this._revenueHistory = this._revenueHistory.slice(-30);
    }

    // ── Build update payloads ──
    const pageMap = {};
    this._visitors.forEach(v => {
      const shortUrl = v.page.length > 35 ? v.page.slice(0, 32) + '...' : v.page;
      pageMap[shortUrl] = (pageMap[shortUrl] || 0) + 1;
    });
    const pages = Object.entries(pageMap)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const cartItems = this._carts.flatMap(c => c.items).slice(0, 10);

    const lastOrder = this._orders.length > 0 ? this._orders[this._orders.length - 1] : null;
    const avgOrder = this._orders.length > 0
      ? this._orders.reduce((s, o) => s + o.value, 0) / this._orders.length
      : 0;

    const totalVisitorsToday = this._totalVisitors + this._visitors.length;
    const convRate = totalVisitorsToday > 0
      ? (this._orders.length / totalVisitorsToday * 100)
      : 0;

    // Funnel steps for pulse widget
    const visitorsLast30 = this._visitors.length * 3 + Math.floor(Math.random() * 10);
    const productViews = Math.round(visitorsLast30 * (0.55 + Math.random() * 0.15));
    const addToCarts = Math.round(productViews * (0.18 + Math.random() * 0.08));
    const purchases = Math.round(addToCarts * (0.25 + Math.random() * 0.15));

    // ── Dispatch callbacks ──
    const visitorsData = {
      visitors: this._visitors.length,
      carts: this._carts.length,
      pages,
      cartItems
    };

    const revenueData = {
      revenue: Math.round(this._revenue),
      orders: this._orders.length,
      avgOrder: Math.round(avgOrder),
      convRate: Math.round(convRate * 10) / 10,
      lastOrderValue: lastOrder ? Math.round(lastOrder.value) : 0,
      lastOrderTime: lastOrder ? 'just nu' : '—',
      changePercent: 5 + (Math.random() - 0.5) * 8,
      sparkline: [...this._revenueHistory]
    };

    const activityData = {
      events: this._activityFeed.slice(0, 10)
    };

    const pulseData = {
      conversionRate: visitorsLast30 > 0 ? (purchases / visitorsLast30 * 100) : 0,
      totalVisitors: visitorsLast30,
      totalOrders: purchases,
      steps: [
        { label: 'Besökare', count: visitorsLast30 },
        { label: 'Produktvisningar', count: productViews },
        { label: 'Lagt i varukorg', count: addToCarts },
        { label: 'Genomfört köp', count: purchases }
      ]
    };

    if (this.config.onUpdate) {
      this.config.onUpdate({ visitors: visitorsData, revenue: revenueData, activity: activityData, pulse: pulseData });
    }
    if (this.config.onVisitorsUpdate) this.config.onVisitorsUpdate(visitorsData);
    if (this.config.onRevenueUpdate) this.config.onRevenueUpdate(revenueData);
    if (this.config.onActivityUpdate) this.config.onActivityUpdate(activityData);
    if (this.config.onPulseUpdate) this.config.onPulseUpdate(pulseData);
  }
}

/**
 * Factory function
 * @param {Object} config
 * @returns {EcommerceSimulator}
 */
export function createEcommerceSimulator(config) {
  return new EcommerceSimulator(config);
}

export default EcommerceSimulator;
