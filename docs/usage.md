# 使用文档

## 1. 功能入口

本地开发启动：

```bash
pnpm dev
```

访问：

```text
http://127.0.0.1:5173
```

页面包含：

- 模板选择
- 纸张选择：跟随示例 / A4 / A3
- 方向选择：跟随示例 / 横向 / 纵向
- 数据量输入与滑块
- 浏览器打印
- HTML iframe 预览
- 服务端生成 PDF
- 导出状态、耗时、PDF 大小、requestId

## 2. 模板注册

模板集中在：

```text
src/print/templates/registry.js
```

新增模板时注册：

```js
export const templateRegistry = {
  'your-template': {
    component: YourTemplate,
    name: '业务模板',
    description: '模板说明',
    paper: 'A4',
    orientation: 'portrait',
    padding: '12mm',
    rowsEnabled: false
  }
};
```

`PrintReport.vue` 会通过 registry 自动选择组件，避免继续堆 `if/else`。

## 3. 纸张配置

A3/A4 和横竖向配置集中在：

```text
src/print/paperConfig.js
```

`PrintPage.vue` 和 `buildPageCss(report)` 共用这份配置，确保组件预览、HTML 预览和服务端 PDF 的纸张尺寸一致。

## 4. 服务端导出 PDF

前端会生成完整 HTML 并调用：

```http
POST /api/pdf/render
Content-Type: application/json
```

请求体：

```json
{
  "html": "<!doctype html>...",
  "filename": "report.pdf",
  "paper": "A3",
  "margin": {
    "top": "0mm",
    "right": "0mm",
    "bottom": "0mm",
    "left": "0mm"
  },
  "metadata": {
    "businessId": "A3-LEDGER-360",
    "type": "a3-ledger",
    "rows": 360,
    "paper": "A3",
    "orientation": "landscape"
  }
}
```

成功响应：

```http
200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="..."
X-Request-Id: ...
X-PDF-Render-Duration-Ms: 1760
```

失败响应示例：

```json
{
  "code": "PDF_PRINT_READY_TIMEOUT",
  "message": "Waiting for window.__PRINT_READY__ timed out",
  "requestId": "..."
}
```

## 5. HTML 预览

点击页面的“HTML 预览”会使用同一个 `buildReportHtml(report)` 生成 `iframe srcdoc`。这样可以确认导出 HTML 与服务端 PDF 使用的是同一份结构和样式。

## 6. 测试与回归

推荐改打印样式或模板后按顺序执行：

```bash
pnpm build
pnpm test:unit
pnpm test:layout
pnpm test:pdf
```

大数据性能基准：

```bash
pnpm test:perf
PDF_PERF_ROWS=5000,10000 pnpm test:perf
```

## 7. 常见错误码

| 错误码 | 含义 |
| --- | --- |
| `PDF_HTML_REQUIRED` | 请求缺少 HTML |
| `PDF_HTML_TOO_LARGE` | HTML 超过最大字节数 |
| `PDF_REQUEST_TOO_LARGE` | 整个 JSON 请求体超过最大字节数 |
| `PDF_FILE_URL_FORBIDDEN` | HTML 中包含 `file://` 资源 |
| `PDF_RENDER_QUEUE_FULL` | 并发已满，且等待队列超过 `PDF_MAX_QUEUE` |
| `PDF_RENDER_QUEUE_TIMEOUT` | 请求在队列中等待超过 `PDF_QUEUE_TIMEOUT_MS` |
| `PDF_BROWSER_UNAVAILABLE` | 没有可用 Chromium 浏览器 |
| `PDF_HTML_LOAD_TIMEOUT` | HTML 加载超时 |
| `PDF_PRINT_READY_TIMEOUT` | 等待字体、图片或可信模板的 `window.__PRINT_READY__` 超时 |
| `PDF_RENDER_TIMEOUT` | PDF 生成超时 |
| `PDF_RENDER_FAILED` | 未分类渲染错误 |

## 8. 打印样式约定

- `@page margin: 0`，业务边距由 `.print-page` padding 控制。
- `thead { display: table-header-group; }` 用于多页表头重复。
- 表格行、签字区、卡片类区域应设置 `break-inside: avoid`。
- 新增样式优先限定在模板 class 下，避免污染其他模板。
