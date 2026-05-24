# 使用文档

## 1. 功能入口

本地开发启动：

```bash
npm run dev
```

访问：

```text
http://127.0.0.1:5173
```

页面包含：

- 数据量调节输入框
- 数据量滑块
- 浏览器打印按钮
- 服务端生成 PDF 按钮
- A3 横向复杂表格预览
- 导出成功耗时提示

## 2. 调节测试数据量

页面顶部“数据量”可输入或拖动滑块。

默认：

```text
360 行
```

范围：

```text
30 - 10000 行
```

数据量变化后，表格会重新生成，预计 A3 页数也会更新。

## 3. 浏览器打印

点击：

```text
浏览器打印
```

浏览器会打开系统打印预览。

当前打印页配置：

```css
@page {
  size: A3 landscape;
  margin: 0;
}
```

实际页面内边距由 `.print-page` 控制，避免浏览器打印和服务端 PDF 出现双重边距。

## 4. 服务端导出 PDF

点击：

```text
服务端生成 PDF
```

前端会：

1. 根据当前数据量生成报表数据。
2. 使用 `buildReportHtml(report)` 生成完整 HTML。
3. 调用 `POST /api/pdf/render`。
4. 下载 PDF。
5. 弹出导出成功提示。
6. 在控制台输出耗时信息。

成功提示包含：

- 总耗时
- 服务端渲染耗时
- 数据行数
- PDF 文件大小

控制台输出示例：

```js
PDF_EXPORT_TIMING {
  rows: 420,
  estimatedPages: 15,
  htmlBuildMs: 38,
  serverRenderMs: 1760,
  totalMs: 1808,
  pdfBytes: 293171
}
```

## 5. PDF 接口

接口：

```http
POST /api/pdf/render
Content-Type: application/json
```

请求体：

```json
{
  "html": "<!doctype html>...",
  "filename": "a3-inventory-ledger-A3-LEDGER-420.pdf",
  "paper": "A3",
  "margin": {
    "top": "0mm",
    "right": "0mm",
    "bottom": "0mm",
    "left": "0mm"
  },
  "metadata": {
    "businessId": "A3-LEDGER-420",
    "type": "a3-inventory-ledger",
    "rows": 420
  }
}
```

成功响应：

```http
200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="..."
X-PDF-Render-Duration-Ms: 1760
```

失败响应：

```json
{
  "code": "PDF_RENDER_TIMEOUT",
  "message": "PDF render timed out"
}
```

## 6. 前端接入方式

核心代码位于：

```text
src/print/buildReportHtml.js
src/print/PrintReport.vue
src/print/printCss.js
src/print/sampleReport.js
```

接入业务数据时，建议保持这个模式：

```js
const html = await buildReportHtml(report);

await fetch('/api/pdf/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    html,
    filename: 'report.pdf',
    paper: 'A3',
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    },
    metadata: {
      businessId: report.reportNo,
      type: 'your-report-type'
    }
  })
});
```

## 7. iframe 预览方式

打印页可以放入 iframe 渲染。

推荐方式：

1. 父页面负责参数和按钮。
2. iframe 使用 `srcdoc` 渲染 `buildReportHtml(report)` 生成的完整 HTML。
3. 导出时复用同一份 HTML 调用 `/api/pdf/render`。

示例：

```js
const html = await buildReportHtml(report);
iframe.srcdoc = html;
```

导出：

```js
await fetch('/api/pdf/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    html,
    filename: 'report.pdf',
    paper: 'A3',
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    }
  })
});
```

注意：

- 同源 iframe 才能读取 `contentDocument`。
- 跨域 iframe 需要使用 `postMessage` 或改成服务端按 URL 渲染。
- iframe 预览和导出最好复用同一份 HTML，减少样式偏差。

## 8. 打印样式约定

当前 A3 表格使用：

- A3 横向：`size: A3 landscape`
- 零页边距：`@page margin: 0`
- 页面内边距：`.print-page padding`
- 重复表头：`thead { display: table-header-group; }`
- 避免行拆分：`tr { break-inside: avoid; page-break-inside: avoid; }`

宽表列宽和状态样式集中在：

```text
src/print/printCss.js
```

## 9. A4/A3 页面容器

项目提供了通用页面容器：

```text
src/print/PrintPage.vue
```

支持：

- `paper="A4"`
- `paper="A3"`
- `orientation="portrait"`
- `orientation="landscape"`
- `padding="12mm"` 或 `padding="10mm 10mm 9mm"`

示例：

```vue
<PrintPage paper="A4" orientation="portrait" padding="16mm 14mm">
  <YourPrintContent />
</PrintPage>
```

```vue
<PrintPage paper="A3" orientation="landscape" padding="10mm">
  <WideTable />
</PrintPage>
```

注意：`PrintPage` 负责页面容器尺寸和内边距，`@page` 仍是整份 HTML 的打印纸张设置。当前 A3 报表的 `@page` 在 `printCss.js` 中配置为：

```css
@page {
  size: A3 landscape;
  margin: 0;
}
```

如果要切换成 A4 导出，需要同时调整组件参数和 `@page size`。

## 10. 性能观察

前端控制台：

```text
PDF_EXPORT_TIMING
```

服务端日志：

```text
PDF_RENDER_SUCCESS
PDF_RENDER_ERROR
```

服务端响应头：

```text
X-PDF-Render-Duration-Ms
```

建议重点观察：

- HTML 构建时间
- 服务端 PDF 渲染时间
- 总耗时
- PDF 文件大小
- 数据量和页数关系

## 11. 常见错误

### PDF_RENDER_TIMEOUT

渲染超时。可减少数据量，或增大：

```bash
PDF_RENDER_TIMEOUT_MS=180000
```

### PDF_HTML_TOO_LARGE

HTML 超过限制。可减少数据量，或增大：

```bash
PDF_MAX_HTML_BYTES=52428800
```

### PDF_FILE_URL_FORBIDDEN

HTML 中包含 `file://` 资源。需要改为 HTTP/HTTPS、base64 或服务端可访问的安全资源地址。

### 前端导出失败但浏览器打印正常

检查 Node PDF 服务是否启动：

```bash
curl http://127.0.0.1:3000/api/health
```

检查 Vite 代理或 Nginx `/api/` 代理是否正确。
