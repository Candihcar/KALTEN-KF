import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_BASE = '/kf-portal/'

function normalizeBase(value: string): string {
  const raw = value.trim()
  if (!raw || raw === '/') return '/'
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

/**
 * GitHub Pages не умеет отдавать index.html для произвольных вложенных адресов.
 * Плагин создаёт 404.html, который возвращает пользователя в SPA, а также
 * восстанавливает маршрут из ?/path при загрузке index.html.
 */
function githubPagesSpaFallback(base: string): Plugin {
  return {
    name: 'kf-github-pages-spa-fallback',
    apply: 'build',
    transformIndexHtml(html) {
      const restore = `
(function () {
  var search = window.location.search;
  if (search.indexOf('?/') !== 0) return;
  var route = search.slice(2);
  var base = ${JSON.stringify(base)};
  if (!route) route = '';
  window.history.replaceState(null, '', base + route + window.location.hash);
})();`
      return html.replace(
        '</head>',
        `  <script>${restore}</script>\n  </head>`
      )
    },
    closeBundle() {
      const outDir = path.resolve(process.cwd(), 'dist')
      if (!fs.existsSync(outDir)) return
      const redirect = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Официальный портал Комаринской Федерации</title>
  <script>
    (function () {
      var base = ${JSON.stringify(base)};
      var location = window.location;
      var rest = location.pathname.indexOf(base) === 0
        ? location.pathname.slice(base.length)
        : location.pathname.replace(/^\\//, '');
      location.replace(location.origin + base + '?/' + rest + location.search + location.hash);
    })();
  </script>
</head>
<body>
  <p>Перенаправление на <a href="${base}">официальный портал</a>…</p>
</body>
</html>
`
      fs.writeFileSync(path.join(outDir, '404.html'), redirect, 'utf8')
      fs.writeFileSync(path.join(outDir, '.nojekyll'), '', 'utf8')
    }
  }
}

export default defineConfig(() => {
  const base = normalizeBase(process.env.VITE_BASE || DEFAULT_BASE)
  return {
    base,
    plugins: [react(), githubPagesSpaFallback(base)],
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})
