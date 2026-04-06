/**
 * AI Network Ball view
 */
export default function networkballView() {
  return {
    title: 'AI Network Ball',
    style: `
      :root { --active: #4ade80; }
      .chart-container { height: 450px; min-height: auto; border-radius: 8px; overflow: hidden; }
      .controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .btn {
        padding: 8px 16px; border: 1px solid var(--border); border-radius: 6px;
        background: var(--surface); color: var(--text); font-family: var(--mono);
        font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;
      }
      .btn:hover { background: var(--surface-alt); border-color: var(--text-muted); }
      .btn.green { background: rgba(74, 222, 128, 0.08); color: var(--success); border-color: rgba(74, 222, 128, 0.4); }
      .btn.green:hover { background: rgba(74, 222, 128, 0.18); }
      .btn.active { background: var(--active); color: #fff; border-color: var(--active); }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
      .chart-sm { height: 300px; }
    `,
    html: `
      <a href="/" class="back-link">&larr; Back to gallery</a>
      <div class="page-header">
        <h1>AI Network Ball</h1>
        <p>A 3D rotating sphere of nodes. Push events to send cursors hopping between nodes —
          they light up connections and show AI activity labels. Multiple cursors run in parallel.</p>
      </div>
      <div class="examples">
        <div class="example-card">
          <div class="example-header"><h2>Interactive</h2><p>Push events to spawn cursors. Each one travels its own path through the network.</p></div>
          <div class="example-body">
            <div id="ball1" class="chart-container"></div>
            <div class="controls">
              <button class="btn green" id="btn-push">Push Event</button>
              <button class="btn green" id="btn-burst">Burst (3x)</button>
              <button class="btn" id="btn-auto">Start Auto</button>
              <button class="btn" id="btn-custom">Custom Label</button>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div class="example-card">
            <div class="example-header"><h2>Dense (80 nodes)</h2><p>More nodes, tighter connections.</p></div>
            <div class="example-body"><div id="ball2" class="chart-container chart-sm"></div></div>
          </div>
          <div class="example-card">
            <div class="example-header"><h2>Dark Mode</h2><p>Dark background with bright green pulses.</p></div>
            <div class="example-body"><div id="ball3" class="chart-container chart-sm" style="background:#0a0e1a; border-radius:8px;"></div></div>
          </div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>Compact — Loading Indicator</h2><p>Small inline sphere for status messages.</p></div>
          <div class="example-body" style="display:flex; align-items:center; gap:24px;">
            <div id="ball4" style="width:120px; height:120px;"></div>
            <div>
              <div style="font-size:13px; font-weight:600; margin-bottom:4px;">AI is analyzing your data...</div>
              <div style="font-size:11px; color:var(--text-muted);">Processing 12,847 records across 3 data sources</div>
            </div>
          </div>
        </div>
        <div class="example-card">
          <div class="example-header"><h2>API Reference</h2></div>
          <div class="example-body">
            <pre style="background:#f8f9fb; padding:16px; border-radius:6px; font-family:var(--mono); font-size:12px; line-height:1.7; color:var(--text-sec); overflow-x:auto;">
<span style="color:#8993a4;">// Create a 3D network ball</span>
<span style="color:#172b4d;">const ball = NewChart.create('#el', {</span>
<span style="color:#172b4d;">  type: 'networkball',</span>
<span style="color:#172b4d;">  data: { nodeCount: 40 }</span>
<span style="color:#172b4d;">});</span>

<span style="color:#8993a4;">// Push event — spawns a cursor</span>
<span style="color:#172b4d;">ball.pushEvent();</span>
<span style="color:#172b4d;">ball.pushEvent({ label: 'thinking...' });</span>

<span style="color:#8993a4;">// Multiple events run in parallel</span>
<span style="color:#172b4d;">ball.burst(3, 200);</span>

<span style="color:#8993a4;">// Continuous auto-events</span>
<span style="color:#172b4d;">ball.startAutoEvents(1500);</span>
<span style="color:#172b4d;">ball.stopAutoEvents();</span></pre>
          </div>
        </div>
      </div>
    `,
    mount() {
      const charts = [];
      let autoRunning = false;

      // 1. Interactive
      const ball1 = NewChart.create('#ball1', {
        type: 'networkball',
        data: { nodeCount: 40 }
      });
      charts.push(ball1);

      const btnPush = document.getElementById('btn-push');
      const btnBurst = document.getElementById('btn-burst');
      const btnAuto = document.getElementById('btn-auto');
      const btnCustom = document.getElementById('btn-custom');

      const handlePush = () => ball1.pushEvent();
      const handleBurst = () => ball1.burst(3, 200);
      const handleCustom = () => ball1.pushEvent({ label: 'analyzing data...' });
      const handleAuto = () => {
        if (autoRunning) {
          ball1.stopAutoEvents();
          btnAuto.textContent = 'Start Auto';
          btnAuto.classList.remove('active');
        } else {
          ball1.startAutoEvents(1500);
          btnAuto.textContent = 'Stop Auto';
          btnAuto.classList.add('active');
        }
        autoRunning = !autoRunning;
      };

      if (btnPush) btnPush.addEventListener('click', handlePush);
      if (btnBurst) btnBurst.addEventListener('click', handleBurst);
      if (btnAuto) btnAuto.addEventListener('click', handleAuto);
      if (btnCustom) btnCustom.addEventListener('click', handleCustom);

      // 2. Dense
      const ball2 = NewChart.create('#ball2', {
        type: 'networkball',
        data: { nodeCount: 80 },
        style: {
          networkball: {
            connectionDistance: 0.6,
            nodeRadius: 2.5,
            rotationSpeed: 0.2,
            travelerMaxHops: 7
          }
        }
      });
      ball2.startAutoEvents(1200);
      charts.push(ball2);

      // 3. Dark
      const ball3 = NewChart.create('#ball3', {
        type: 'networkball',
        data: { nodeCount: 50 },
        style: {
          background: '#0a0e1a',
          networkball: {
            nodeColor: '#3a4a7a',
            activeColor: '#4ade80',
            connectionOpacity: 0.06,
            glowRadius: 18,
            rotationSpeed: 0.4
          }
        }
      });
      ball3.startAutoEvents(1400);
      charts.push(ball3);

      // 4. Compact
      const ball4 = NewChart.create('#ball4', {
        type: 'networkball',
        data: { nodeCount: 20 },
        style: {
          networkball: {
            nodeRadius: 2.5,
            sphereScale: 0.7,
            travelerSpeed: 1.8,
            travelerMaxHops: 4,
            labelFontSize: 0,
            rotationSpeed: 0.5
          }
        }
      });
      ball4.startAutoEvents(800);
      charts.push(ball4);

      return () => {
        if (btnPush) btnPush.removeEventListener('click', handlePush);
        if (btnBurst) btnBurst.removeEventListener('click', handleBurst);
        if (btnAuto) btnAuto.removeEventListener('click', handleAuto);
        if (btnCustom) btnCustom.removeEventListener('click', handleCustom);
        charts.forEach(c => c?.destroy());
      };
    }
  };
}
