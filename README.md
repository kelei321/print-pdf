# Print PDF Renderer

Vue 3 + Node + Playwright 的前端专用打印页与服务端 PDF 导出示例。

当前示例包含：

- A3 横向复杂表格打印页
- 动态数据量调节
- 浏览器打印
- 服务端 Playwright PDF 导出
- 导出耗时控制台日志与成功提示
- Playwright Chromium / Edge / Chrome 启动 fallback

## 文档

- [部署文档](docs/deployment.md)
- [使用文档](docs/usage.md)

## 本地启动

```bash
npm install
npm run dev
```

前端默认地址：

```text
http://127.0.0.1:5173
```

PDF 服务默认地址：

```text
http://127.0.0.1:3000
```

