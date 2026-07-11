# Print PDF Renderer

Vue 3 + Node + Playwright 的打印页预览与服务端 PDF 导出示例，覆盖 A3/A4、多模板、宽表、多页表头重复、二维码/条码和服务端 PDF 渲染。

## 当前能力

- 7 个打印模板：A3 宽表、A4 合同、A4 对账单、A3 看板、A4 面单、A4 巡检单、A3 资产标签
- 前端可切换模板、纸张、方向、数据量
- 组件预览与完整 HTML iframe 预览
- 服务端 Playwright PDF 导出，返回渲染耗时与 requestId
- `/api/health` 基础健康检查，`/api/status` 队列状态，`/api/ready` 浏览器就绪检查
- 浏览器启动 fallback：指定路径、指定 channel、Playwright Chromium、系统 Chromium/Chrome、Chrome/Edge channel
- 默认禁止 HTML JavaScript、`file://` 和外部 HTTP(S) 资源；可信模板可通过环境变量显式放开
- 单测、布局测试、PDF smoke 测试和性能基准脚本

## 运行要求

- Node.js 20.19 或以上
- pnpm 10 或以上（建议通过 Corepack 使用 `packageManager` 固定版本）

## 本地启动

```bash
pnpm install
pnpm dev
```

前端默认地址：

```text
http://127.0.0.1:5173
```

PDF 服务默认地址：

```text
http://127.0.0.1:3000
```

## 常用命令

```bash
pnpm build       # 前端构建
pnpm test        # 全量 vitest
pnpm test:unit   # API/参数校验单测
pnpm test:layout # 打印布局 guardrail
pnpm test:pdf    # 7 个模板真实生成 PDF smoke 测试
pnpm test:perf   # A3 宽表性能基准，默认 30/360/1000 行
pnpm smoke       # build + PDF smoke
```

可扩展性能测试行数：

```bash
PDF_PERF_ROWS=5000,10000 pnpm test:perf
```

## 重要文件

```text
server/browserLauncher.js       浏览器启动 fallback
server/pdfRenderer.js           HTML -> PDF 渲染核心
server/app.js                   Express API
src/print/templates/registry.js 模板注册表
src/print/paperConfig.js        A3/A4 与横竖向配置
src/print/buildReportHtml.js    SSR 构建完整打印 HTML
src/print/printCss.js           打印样式
src/App.vue                     前端测试台
```

## 文档

- [部署文档](docs/deployment.md)
- [使用文档](docs/usage.md)
