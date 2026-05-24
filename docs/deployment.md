# 部署文档

## 1. 服务组成

本项目由两部分组成：

- Vue 3 前端：负责打印页预览、动态数据量调节、生成完整打印 HTML。
- Node PDF 服务：接收完整 HTML，使用 Playwright Chromium 渲染 PDF。

核心接口：

```text
POST /api/pdf/render
GET  /api/health
```

## 2. 运行要求

- Node.js 20 或以上
- npm 10 或以上
- Chromium / Chrome / Microsoft Edge 三者之一

推荐生产环境：

- Linux 服务器 + PM2 / systemd
- Nginx 反向代理
- Playwright 官方 Chromium 或服务器已安装 Chrome

## 3. 安装依赖

```bash
npm install
```

如网络在国内，安装 Playwright Chromium 可使用镜像：

```bash
PLAYWRIGHT_DOWNLOAD_HOST=https://registry.npmmirror.com/-/binary/playwright npx playwright install chromium
```

Windows PowerShell：

```powershell
$env:PLAYWRIGHT_DOWNLOAD_HOST="https://registry.npmmirror.com/-/binary/playwright"
npx playwright install chromium
```

如果不安装 Playwright 自带 Chromium，也可以使用服务器已有浏览器。

## 4. 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | PDF 服务端口 |
| `PDF_MAX_HTML_BYTES` | `20971520` | 请求 HTML 最大字节数 |
| `PDF_RENDER_TIMEOUT_MS` | `120000` | 单次 PDF 渲染超时 |
| `PDF_MAX_CONCURRENT` | `3` | 最大并发渲染数 |
| `PDF_BROWSER_CHANNEL` | 空 | 指定浏览器通道，如 `chrome`、`msedge` |
| `PDF_BROWSER_EXECUTABLE_PATH` | 空 | 指定浏览器可执行文件路径 |

浏览器选择优先级：

```text
PDF_BROWSER_EXECUTABLE_PATH > PDF_BROWSER_CHANNEL > Playwright Chromium > msedge/chrome fallback
```

Windows 使用 Edge 示例：

```powershell
$env:PDF_BROWSER_CHANNEL="msedge"
npm run start
```

Linux 使用 Chrome 示例：

```bash
PDF_BROWSER_CHANNEL=chrome npm run start
```

指定浏览器路径：

```bash
PDF_BROWSER_EXECUTABLE_PATH=/usr/bin/google-chrome npm run start
```

## 5. 构建前端

```bash
npm run build
```

构建产物位于：

```text
dist/
```

生产环境可由 Nginx 托管 `dist/`，并把 `/api/` 转发到 Node PDF 服务。

## 6. 启动 PDF 服务

开发：

```bash
npm run dev:server
```

生产：

```bash
npm run start
```

健康检查：

```bash
curl http://127.0.0.1:3000/api/health
```

预期返回：

```json
{"ok":true}
```

## 7. PM2 部署

安装 PM2：

```bash
npm install -g pm2
```

启动：

```bash
PDF_BROWSER_CHANNEL=chrome pm2 start server/index.js --name pdf-render-server
```

Windows PowerShell：

```powershell
$env:PDF_BROWSER_CHANNEL="msedge"
pm2 start server/index.js --name pdf-render-server
```

查看日志：

```bash
pm2 logs pdf-render-server
```

保存进程列表：

```bash
pm2 save
```

## 8. Nginx 示例

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
    proxy_read_timeout 120s;
  }
}
```

## 9. Docker 建议

如果使用 Docker，推荐基于 Playwright 官方镜像，避免手动安装浏览器依赖：

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.1-noble

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
```

## 10. 生产安全建议

- PDF 服务应加鉴权，不要开放给匿名公网请求。
- 限制 HTML 大小，当前默认 `20MB`。
- 控制并发，当前默认 `3`。
- 禁止 `file://` 资源，当前服务端已拦截。
- 外链图片和字体建议使用可信域名、签名 URL 或资源代理。
- 记录 `metadata.businessId`、操作者、耗时和失败原因，便于审计。

## 11. 常见问题

### Playwright 提示 Chromium 不存在

执行：

```bash
npx playwright install chromium
```

国内镜像：

```bash
PLAYWRIGHT_DOWNLOAD_HOST=https://registry.npmmirror.com/-/binary/playwright npx playwright install chromium
```

也可以使用系统浏览器：

```bash
PDF_BROWSER_CHANNEL=chrome npm run start
```

### Linux 启动浏览器失败

优先使用 Playwright 官方 Docker 镜像。裸机部署时需要安装 Chrome/Chromium 运行依赖。

### 导出超时

可以增大：

```bash
PDF_RENDER_TIMEOUT_MS=180000
```

同时检查数据量、图片资源、字体资源和服务端 CPU。
