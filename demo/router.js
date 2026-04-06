/**
 * NewChart Demo — Minimal pushState SPA Router
 */

const router = {
  /** @type {Object<string, function>} path -> view factory */
  routes: {},

  /** @type {{ path: string, cleanup: function|null }|null} */
  current: null,

  /**
   * Register a route
   * @param {string} path - URL path (e.g. '/bar')
   * @param {function} viewFn - Returns { html, mount?, style?, title? }
   */
  register(path, viewFn) {
    this.routes[path] = viewFn;
  },

  /**
   * Navigate to a path
   * @param {string} path
   * @param {boolean} [push=true] - Whether to push state
   */
  navigate(path, push = true) {
    // Cleanup previous view
    if (this.current?.cleanup) {
      this.current.cleanup();
    }

    // Remove old view style
    const oldStyle = document.getElementById('view-style');
    if (oldStyle) oldStyle.remove();

    // Resolve view
    const viewFn = this.routes[path] || this.routes['/'];
    const view = viewFn();

    // Update title
    document.title = view.title
      ? `NewChart JS — ${view.title}`
      : 'NewChart JS — Demo Gallery';

    // Inject page-specific CSS
    if (view.style) {
      const styleEl = document.createElement('style');
      styleEl.id = 'view-style';
      styleEl.textContent = view.style;
      document.head.appendChild(styleEl);
    }

    // Inject HTML
    const app = document.getElementById('app');
    // Set page modifier class
    app.className = 'page' + (view.pageClass ? ' ' + view.pageClass : '');
    app.innerHTML = view.html;

    // Mount view and store cleanup
    const cleanup = view.mount?.() ?? null;
    this.current = { path, cleanup };

    // Push state
    if (push) {
      history.pushState({ path }, '', path);
    }

    // Scroll to top
    window.scrollTo(0, 0);
  },

  /**
   * Start the router — intercept clicks and handle popstate
   */
  start() {
    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      // Only handle internal routes (starting with / and not external)
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;

      // Check if it's a registered route
      const path = href.replace(/\.html$/, '').replace(/\/index$/, '/');
      if (this.routes[path] || this.routes[path.replace(/\/$/, '') || '/']) {
        e.preventDefault();
        this.navigate(path.replace(/\/$/, '') || '/');
      }
    });

    // Handle back/forward
    window.addEventListener('popstate', (e) => {
      const path = e.state?.path || location.pathname;
      this.navigate(path, false);
    });

    // Render initial route
    const initial = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    this.navigate(initial || '/', false);
  }
};

export default router;
