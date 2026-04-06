import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const ROOT = resolve(import.meta.dirname, '../..');
const DOCS = resolve(ROOT, 'docs');
const PUBLIC = resolve(DOCS, 'public');

describe('docs:prepare copies files correctly', () => {
  beforeAll(() => {
    execSync('npm run docs:prepare', { cwd: ROOT, stdio: 'pipe' });
  });

  it('copies demo HTML files to docs/public/demo/', () => {
    const demoFiles = [
      'index.html', 'bar.html', 'line.html', 'pie.html',
      'area.html', 'gauge.html', 'sparkline.html', 'combo.html',
      'scatter.html', 'kpicard.html', 'dashboard.html', 'docs.html'
    ];
    for (const file of demoFiles) {
      const path = resolve(PUBLIC, 'demo', file);
      expect(existsSync(path), `${file} should exist in docs/public/demo/`).toBe(true);
    }
  });

  it('copies UMD bundle to docs/public/', () => {
    const path = resolve(PUBLIC, 'newchartjs.umd.js');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('demo HTML files reference /newchartjs.umd.js correctly', () => {
    const barHtml = readFileSync(resolve(PUBLIC, 'demo', 'bar.html'), 'utf-8');
    expect(barHtml).toContain('src="/newchartjs.umd.js"');
  });

  it('copies theme.js to docs/public/', () => {
    const path = resolve(PUBLIC, 'theme.js');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('newchart-theme');
  });
});

describe('dark mode theme bridge', () => {
  const DEMO = resolve(ROOT, 'demo');

  it('theme.js exists in demo/', () => {
    expect(existsSync(resolve(DEMO, 'theme.js'))).toBe(true);
  });

  it('theme.js defines dark CSS variables', () => {
    const content = readFileSync(resolve(DEMO, 'theme.js'), 'utf-8');
    expect(content).toContain('html.dark');
    expect(content).toContain('--bg:');
    expect(content).toContain('--surface:');
    expect(content).toContain('--nc-background:');
  });

  it('theme.js listens for postMessage with type newchart-theme', () => {
    const content = readFileSync(resolve(DEMO, 'theme.js'), 'utf-8');
    expect(content).toContain("e.data.type === 'newchart-theme'");
    expect(content).toContain('e.data.dark');
  });

  it('all demo HTML files include theme.js', () => {
    const demoFiles = [
      'index.html', 'bar.html', 'line.html', 'pie.html',
      'area.html', 'gauge.html', 'sparkline.html', 'combo.html',
      'scatter.html', 'kpicard.html', 'dashboard.html', 'docs.html'
    ];
    for (const file of demoFiles) {
      const filePath = resolve(DEMO, file);
      if (!existsSync(filePath)) continue;
      const content = readFileSync(filePath, 'utf-8');
      expect(content, `${file} should include theme.js`).toContain('src="/theme.js"');
    }
  });

  it('demo.md sends postMessage to iframe on theme change', () => {
    const content = readFileSync(resolve(DOCS, 'demo.md'), 'utf-8');
    expect(content).toContain('postMessage');
    expect(content).toContain('newchart-theme');
    expect(content).toContain('MutationObserver');
  });
});

describe('VitePress config', () => {
  const configPath = resolve(DOCS, '.vitepress/config.js');
  let configContent;

  beforeAll(() => {
    configContent = readFileSync(configPath, 'utf-8');
  });

  it('config file exists', () => {
    expect(existsSync(configPath)).toBe(true);
  });

  it('config has title', () => {
    expect(configContent).toContain("title: 'NewChart JS'");
  });

  it('config has themeConfig with nav and sidebar', () => {
    expect(configContent).toContain('themeConfig:');
    expect(configContent).toContain('nav:');
    expect(configContent).toContain('sidebar:');
  });

  it('nav contains Demo link pointing to VitePress page /demo', () => {
    // Must point to /demo (VitePress page), NOT /demo/ or /demo/index.html (static file)
    expect(configContent).toMatch(/text:\s*'Demo'.*link:\s*'\/demo'/s);
    // Must NOT point to /demo/ or /demo/index.html (would 404 via VitePress router)
    expect(configContent).not.toContain("link: '/demo/'");
    expect(configContent).not.toContain("link: '/demo/index.html'");
  });

  it('nav contains all required sections', () => {
    for (const section of ['Guide', 'Components', 'Styling', 'API', 'Demo']) {
      expect(configContent).toContain(`text: '${section}'`);
    }
  });
});

describe('VitePress pages', () => {
  const requiredPages = [
    'index.md',
    'getting-started.md',
    'components.md',
    'styling.md',
    'api-reference.md',
    'demo.md'
  ];

  for (const page of requiredPages) {
    it(`${page} exists`, () => {
      expect(existsSync(resolve(DOCS, page))).toBe(true);
    });
  }

  it('index.md has hero frontmatter', () => {
    const content = readFileSync(resolve(DOCS, 'index.md'), 'utf-8');
    expect(content).toContain('layout: home');
    expect(content).toContain('hero:');
  });

  it('index.md has Live Demo action link', () => {
    const content = readFileSync(resolve(DOCS, 'index.md'), 'utf-8');
    expect(content).toContain('text: Live Demo');
    expect(content).toContain('link: /demo');
  });

  it('demo.md embeds demo via iframe pointing to /demo/index.html', () => {
    const content = readFileSync(resolve(DOCS, 'demo.md'), 'utf-8');
    expect(content).toContain('<iframe');
    expect(content).toContain('src="/demo/index.html"');
  });
});

describe('VitePress build', () => {
  let distDir;

  beforeAll(() => {
    execSync('npm run docs:build', { cwd: ROOT, stdio: 'pipe', timeout: 60000 });
    distDir = resolve(DOCS, '.vitepress/dist');
  });

  it('build output directory exists', () => {
    expect(existsSync(distDir)).toBe(true);
  });

  it('generates HTML for all pages', () => {
    const pages = [
      'index.html',
      'getting-started.html',
      'components.html',
      'styling.html',
      'api-reference.html',
      'demo.html'
    ];
    for (const page of pages) {
      expect(existsSync(resolve(distDir, page)), `${page} should exist in dist`).toBe(true);
    }
  });

  it('demo.html contains iframe to /demo/index.html', () => {
    const html = readFileSync(resolve(distDir, 'demo.html'), 'utf-8');
    expect(html).toContain('/demo/index.html');
  });

  it('static demo files are included in build output', () => {
    expect(existsSync(resolve(distDir, 'demo/index.html'))).toBe(true);
    expect(existsSync(resolve(distDir, 'demo/bar.html'))).toBe(true);
    expect(existsSync(resolve(distDir, 'newchartjs.umd.js'))).toBe(true);
  });
});
