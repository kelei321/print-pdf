import { printCss } from './printCss.js';

export async function buildReportHtml(report) {
  const { createSSRApp, h } = await import('vue');
  const { renderToString } = await import('@vue/server-renderer');
  const { default: PrintReport } = await import('./PrintReport.vue');
  const markup = await renderToString(createSSRApp({ render: () => h(PrintReport, { report }) }));

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(report.title)}</title>
    <style>${printCss}
${buildPageCss(report)}</style>
  </head>
  <body>
    ${markup}
    <script>
      (function () {
        function markReady() {
          window.__PRINT_READY__ = true;
        }

        Promise.all([
          document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
          Promise.all(Array.from(document.images).map(function (img) {
            if (img.complete) return Promise.resolve();
            return new Promise(function (resolve) {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            });
          }))
        ]).then(markReady, markReady);
      })();
    </script>
  </body>
</html>`;
}

export function buildPageCss(report) {
  const paper = report.paper || 'A4';
  const orientation = report.orientation === 'landscape' ? 'landscape' : 'portrait';
  const width = paper === 'A3' ? (orientation === 'landscape' ? '420mm' : '297mm') : orientation === 'landscape' ? '297mm' : '210mm';
  const height = paper === 'A3' ? (orientation === 'landscape' ? '297mm' : '420mm') : orientation === 'landscape' ? '210mm' : '297mm';

  return `@page {
  size: ${paper} ${orientation};
  margin: 0;
}

@media print {
  html,
  body {
    width: ${width};
    height: auto;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow: visible;
  }
}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
