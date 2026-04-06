/**
 * Live Widgets — Real-time e-commerce dashboard widgets demo
 * Shows 4 variants: Visitors, Revenue Ticker, Activity Feed, Conversion Pulse
 * All driven by a shared EcommerceSimulator for realistic data.
 */
export default function livewidgetsView() {
  return {
    title: 'Live Widgets — E-Commerce',
    pageClass: 'page--medium',
    style: `
      .lw-demo { padding: 0; }
      .lw-demo-header { margin-bottom: 24px; }
      .lw-demo-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      .lw-demo-header p { font-size: 13px; color: var(--text-sec); line-height: 1.6; }
      .lw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
      .lw-full { grid-column: 1 / -1; }
      .lw-widget-wrap { min-height: 100px; }
      .lw-section { margin-top: 32px; margin-bottom: 12px; }
      .lw-section h2 { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
      .lw-controls { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
      .lw-controls button {
        padding: 6px 14px; font-size: 11px; font-weight: 600; font-family: var(--font);
        border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer;
        background: var(--surface); color: var(--text-sec); transition: all 0.12s;
      }
      .lw-controls button:hover { border-color: var(--primary); color: var(--primary); }
      .lw-controls button.active { background: var(--primary); color: #fff; border-color: var(--primary); }
      .lw-controls .lw-status {
        font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;
        margin-left: auto;
      }
      .lw-controls .lw-status-dot {
        width: 8px; height: 8px; border-radius: 50%;
        animation: nc-lw-pulse 2s ease-in-out infinite;
      }
      .lw-controls .lw-status-dot.running { background: #0ca678; }
      .lw-controls .lw-status-dot.stopped { background: #e03131; animation: none; }
      @keyframes nc-lw-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.8); }
      }
      @media (max-width: 700px) {
        .lw-grid { grid-template-columns: 1fr; }
      }
    `,
    html: `
      <div class="lw-demo">
        <a href="#/" class="back-link">← Tillbaka</a>
        <div class="lw-demo-header">
          <h1>Live Widgets</h1>
          <p>Realtidswidgets för e-handel — drivna av en EcommerceSimulator som genererar verklighetstrogen trafik, varukorgar, ordrar och konverteringsdata. Alla fyra widgetarna uppdateras live med 2-sekunders intervall.</p>
        </div>

        <div class="lw-controls">
          <button id="lw-btn-start" class="active">▶ Kör simulator</button>
          <button id="lw-btn-stop">⏸ Pausa</button>
          <button id="lw-btn-speed-slow">1× Normal</button>
          <button id="lw-btn-speed-fast" class="active">2× Snabb</button>
          <button id="lw-btn-speed-turbo">5× Turbo</button>
          <div class="lw-status">
            <span class="lw-status-dot running" id="lw-status-dot"></span>
            <span id="lw-status-text">Simulerar...</span>
          </div>
        </div>

        <div class="lw-section"><h2>Widget 1 — Besökare & Varukorgar</h2></div>
        <div class="lw-grid">
          <div class="lw-widget-wrap lw-full" id="lw-visitors"></div>
        </div>

        <div class="lw-section"><h2>Widget 2 — Omsättning Live</h2></div>
        <div class="lw-grid">
          <div class="lw-widget-wrap lw-full" id="lw-revenue"></div>
        </div>

        <div class="lw-section"><h2>Widget 3 — Orderflöde</h2></div>
        <div class="lw-grid">
          <div class="lw-widget-wrap lw-full" id="lw-activity"></div>
        </div>

        <div class="lw-section"><h2>Widget 4 — Konverteringspuls</h2></div>
        <div class="lw-grid">
          <div class="lw-widget-wrap lw-full" id="lw-pulse"></div>
        </div>
      </div>
    `,
    mount() {
      const NC = window.NewChart;

      // Create all 4 widgets
      const visitorsWidget = NC.liveWidget('#lw-visitors', {
        variant: 'visitors',
        data: { visitors: 0, carts: 0, pages: [], cartItems: [] }
      });

      const revenueWidget = NC.liveWidget('#lw-revenue', {
        variant: 'revenue',
        title: 'Omsättning idag',
        data: { revenue: 0, orders: 0, avgOrder: 0, convRate: 0, sparkline: [] }
      });

      const activityWidget = NC.liveWidget('#lw-activity', {
        variant: 'activity',
        title: 'Orderflöde',
        data: { events: [] }
      });

      const pulseWidget = NC.liveWidget('#lw-pulse', {
        variant: 'pulse',
        title: 'Konvertering senaste 30 min',
        data: { conversionRate: 0, totalVisitors: 0, totalOrders: 0, steps: [] }
      });

      // Create simulator with callbacks to all widgets
      const sim = NC.ecommerceSimulator({
        baseVisitors: 25,
        avgOrderValue: 890,
        conversionRate: 3.2,
        tickInterval: 1000,
        onVisitorsUpdate: (d) => visitorsWidget.update(d),
        onRevenueUpdate: (d) => revenueWidget.update(d),
        onActivityUpdate: (d) => activityWidget.update(d),
        onPulseUpdate: (d) => pulseWidget.update(d)
      });

      sim.start();

      // Controls
      const btnStart = document.getElementById('lw-btn-start');
      const btnStop = document.getElementById('lw-btn-stop');
      const btnSlow = document.getElementById('lw-btn-speed-slow');
      const btnFast = document.getElementById('lw-btn-speed-fast');
      const btnTurbo = document.getElementById('lw-btn-speed-turbo');
      const statusDot = document.getElementById('lw-status-dot');
      const statusText = document.getElementById('lw-status-text');

      let running = true;

      btnStart.addEventListener('click', () => {
        if (!running) {
          sim.start();
          running = true;
          btnStart.classList.add('active');
          btnStop.classList.remove('active');
          statusDot.className = 'lw-status-dot running';
          statusText.textContent = 'Simulerar...';
        }
      });

      btnStop.addEventListener('click', () => {
        if (running) {
          sim.stop();
          running = false;
          btnStop.classList.add('active');
          btnStart.classList.remove('active');
          statusDot.className = 'lw-status-dot stopped';
          statusText.textContent = 'Pausad';
        }
      });

      const setSpeed = (interval, activeBtn) => {
        [btnSlow, btnFast, btnTurbo].forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
        sim.stop();
        sim.config.tickInterval = interval;
        if (running) sim.start();
      };

      btnSlow.addEventListener('click', () => setSpeed(2000, btnSlow));
      btnFast.addEventListener('click', () => setSpeed(1000, btnFast));
      btnTurbo.addEventListener('click', () => setSpeed(400, btnTurbo));

      // Cleanup on navigation
      return () => {
        sim.destroy();
        visitorsWidget.destroy();
        revenueWidget.destroy();
        activityWidget.destroy();
        pulseWidget.destroy();
      };
    }
  };
}
