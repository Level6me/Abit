# 🍏 Apple Torrent Dashboard (Torrent Omni) — WebUI 主题版

这是一个精美的、完全运行在浏览器沙箱中的 **qBittorrent 自定义备用 WebUI 主题（Alternative Web UI）**。

通过与 qBittorrent 原生 WebAPI 直接通信，它完全剥离了 Python 后端服务。您不再需要部署 Flask、Gunicorn 或运行后台进程，只需将其下载并指定给 qBittorrent，即可替换原版过时的 WebUI。

---

## 📐 系统架构 (纯前端)

```mermaid
graph LR
    Browser[用户浏览器] -->|加载静态网页| index.html[内置 JS & CSS 控制逻辑]
    index.html -->|直接请求 WebAPI| qBt[qBittorrent 服务本身]
```

---

## 🌟 主题模式的特性

1. **零资源开销**：完全由浏览器解析运行，服务器不需要开启任何额外的 Python 后台程序或占用额外端口，极为省电和省资源。
2. **纯原生 API 驱动**：所有操作（获取种子、添加磁力、限速设置、RSS 订阅规则编辑、全网检索）全部通过浏览器直接发请求给 qBittorrent 原生接口。
3. **数据展现优化**：
   - 将原有的主机负载卡片，重构为 qBittorrent 本身的 **网络连接状态**、**DHT 节点数** 监控。
   - 流量曲线图自动对接 qBittorrent 自身的**实时上传/下载速率趋势**。
   - 磁盘监控卡片自动转换为显示 qBittorrent 下载路径的**可用剩余空间**与**历史总传输量数据**。
4. **彻底免转义安全机制**：在文件详情（Files Tree）、Tracker 及 Peers 的渲染上，全部基于 JSON 数据绑定，避免任何可能引发 JS 语法报错或 XSS 注入的字符串拼接。

---

## 🚀 极速安装与部署步骤

由于剥离了后端，部署极其简单：

1. **获取代码**：
   将本项目克隆或下载解压到安装了 qBittorrent 的服务器（或任何您能访问到的本地目录）。确保该目录内包含 `index.html`。
2. **启用备用 Web UI**：
   - 登录您的 qBittorrent 网页控制台。
   - 点击顶部菜单栏的 **“工具 (Tools)”** -> **“选项 (Options)”**。
   - 切换到 **“Web UI”** 标签页。
   - 勾选 **“使用备用 Web UI (Use alternative Web UI)”**。
   - 在 **“文件路路径 (Files path)”** 输入框中，填写您存放本项目的**绝对路径**（即包含 `index.html` 的那个文件夹路径，例如 `/home/ubuntu/apple_torrent_dashboard`）。
3. **保存并应用**：
   - 滚动到页面底部，点击 **“保存 (Save)”**。
   - 刷新您的浏览器页面，即可开始体验精美的苹果风格 Torrent Omni 备用面板！

---

## ❓ 常见问题

*   **Q：为什么我访问页面时显示“qBittorrent 离线/未登入”？**
    *   **A**：主题直接通过当前浏览器的 Session 会话进行 API 通信。若显示离线，请先访问 qBittorrent 默认的 Web 登录接口进行登录，验证通过后刷新页面即可恢复在线。
*   **Q：此版本支持服务器 CPU 温度和系统负载显示吗？**
    *   **A**：不支持。由于安全沙箱限制，纯前端主题无法越权访问服务器的底层硬件接口。如果您需要服务器整机负载看板，请使用先前的 Python 后端版本。
