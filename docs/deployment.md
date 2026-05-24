# 部署文档

## 1. 服务组成

本项目由两部分组成：

- Vue 3 前端：负责打印页预览、模板/纸张/方向/数据量选择、生成完整打印 HTML。
- Node PDF 服务：接收完整 HTML，使用 Playwright Chromium 渲染 PDF。

核心接口：

```text
GET  /api/health
GET  /api/status
GET  /api/ready
POST /api/pdf/render
```

`/api/health` 只表示 Node 服务可用；`/api/status` 返回当前渲染队列和限制配置；`/api/ready` 会真实启动/复用浏览器并执行页面检查，适合作为容器或负载均衡就绪检查。

## 2. 运行要求

- Node.js 20.19 或以上
- pnpm 10 或以上（建议通过 Corepack 使用 `packageManager` 固定版本）
- Chromium / Chrome / Microsoft Edge / Playwright Chromium 任意一种可用浏览器

## 3. 安装依赖

```bash
pnpm install --frozen-lockfile
```

安装 Playwright Chromium：

```bash
pnpm exec playwright install chromium
```

如不安装 Playwright 自带 Chromium，也可以使用服务器已有浏览器：

```bash
PDF_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium pnpm start
```

## 4. 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | PDF 服务端口 |
| `PDF_MAX_HTML_BYTES` | `20971520` | 请求 HTML 最大字节数 |
| `PDF_RENDER_TIMEOUT_MS` | `120000` | HTML 加载和 PDF 生成超时 |
| `PDF_PRINT_READY_TIMEOUT_MS` | `120000` | 等待 `window.__PRINT_READY__` 超时 |
| `PDF_MAX_CONCURRENT` | `3` | 最大并发渲染数 |
| `PDF_MAX_QUEUE` | `20` | 并发满时允许等待的最大队列长度 |
| `PDF_QUEUE_TIMEOUT_MS` | `30000` | 请求在队列中最长等待时间 |
| `PDF_BROWSER_EXECUTABLE_PATH` | 空 | 指定浏览器可执行文件路径 |
| `PDF_BROWSER_CHANNEL` | 空 | 指定浏览器通道，如 `chrome`、`msedge` |
| `PDF_BROWSER_SANDBOX` | `false` | 是否启用 Chromium sandbox |
| `PDF_ALLOW_EXTERNAL_RESOURCES` | `false` | 是否允许任意外部 HTTP(S) 资源 |
| `PDF_ALLOWED_RESOURCE_ORIGINS` | 空 | 外部资源白名单，多个 origin 用逗号分隔 |

浏览器选择优先级：

```text
PDF_BROWSER_EXECUTABLE_PATH
> PDF_BROWSER_CHANNEL
> Playwright Chromium
> /usr/bin/chromium 等常见系统路径
> chrome/msedge channel fallback
```

## 5. 构建与启动

```bash
pnpm build
pnpm start
```

生产环境可由 Nginx 托管 `dist/`，并把 `/api/` 转发到 Node PDF 服务。

健康检查：

```bash
curl http://127.0.0.1:3000/api/health
```

就绪检查：

```bash
curl http://127.0.0.1:3000/api/ready
```

## 6. Docker

项目已提供 `Dockerfile`：

```bash
docker build -t print-pdf-renderer .
docker run --rm -p 3000:3000 print-pdf-renderer
```

容器内置 `HEALTHCHECK`，检查 `/api/ready`。

## 7. Nginx 示例

```nginx
server {
  listen 80;
  server_name example.com;

  root /var/www/print-pdf-renderer/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Request-Id $request_id;
    proxy_read_timeout 180s;
  }
}
```

## 8. 生产安全建议

- PDF 服务应加鉴权，不要直接开放给匿名公网请求。
- 默认已禁止 `file://` 和外部 HTTP(S) 资源；确需外部图片/字体时，优先用 `PDF_ALLOWED_RESOURCE_ORIGINS` 做白名单。
- 根据机器资源调整 `PDF_MAX_CONCURRENT`、`PDF_MAX_QUEUE` 和 `PDF_QUEUE_TIMEOUT_MS`，避免并发渲染耗尽 CPU/内存，也避免请求无限等待。
- 使用日志中的 `requestId`、`metadata.businessId`、耗时和错误码追踪导出问题。
- 大数据导出前先用 `pnpm test:perf` 建立性能基准。

## 9. 常见问题

### Playwright Chromium 不存在

执行：

```bash
pnpm exec playwright install chromium
```

或指定系统浏览器：

```bash
PDF_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium pnpm start
```

### `/api/ready` 返回 `PDF_BROWSER_UNAVAILABLE`

说明当前环境没有可用 Chromium。优先使用 Playwright 官方镜像、安装 Chromium，或设置 `PDF_BROWSER_EXECUTABLE_PATH`。

### 外部图片/字体没有进入 PDF

默认会拦截外部 HTTP(S) 资源。可以选择：

```bash
PDF_ALLOWED_RESOURCE_ORIGINS=https://static.example.com pnpm start
```

或放开所有外部资源：

```bash
PDF_ALLOW_EXTERNAL_RESOURCES=true pnpm start
```
