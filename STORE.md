# FBX 3D Viewer - Chrome 应用店上架指南

## 扩展包

运行以下命令打包：

```bash
zip -r fbx-viewer.zip manifest.json content.js viewer.html viewer.js three.min.js fflate.min.js FBXLoader.js OrbitControls.js icon16.png icon48.png icon128.png
```

或在 Windows 上直接用资源管理器选中这些文件，右键 → 压缩。

---

## 商店填写内容

### 标题
FBX 3D Viewer

### 简短说明（132 字符以内）
在 GitHub / GitLab 页面中一键预览 FBX 三维模型，支持模型线框、悬停快速预览。

### 详细说明（中英双语）

**中文：**

FBX 3D Viewer 是一款轻量级 Chrome 扩展，让你在浏览 GitHub 或 GitLab 仓库时，无需下载即可直接在页面上预览 .fbx 三维模型文件。

核心功能：
- 单文件预览：打开任意 .fbx 文件，页面顶部自动出现「3D 预览」按钮，点击即可在当前页面弹窗中查看模型
- 目录批量预览：在仓库目录页浏览时，每个 .fbx 文件旁都会显示预览按钮，不用逐个点进文件页
- 悬停快速预览：鼠标放在目录页的预览按钮上 0.5 秒，自动弹出迷你预览窗口
- 线框显示：一键切换模型的布线线框叠层，方便检查拓扑结构
- 完整 3D 操控：支持鼠标旋转、缩放、平移模型

**English:**

FBX 3D Viewer is a lightweight Chrome extension that lets you preview .fbx 3D model files directly on GitHub or GitLab without downloading.

Key features:
- Single-file preview: A "3D Preview" button appears on any .fbx file page
- Directory preview: Preview buttons appear next to every .fbx file in repository tree views
- Hover quick preview: Hover over a preview button for 0.5s to see a mini 3D view
- Wireframe toggle: Show/hide model wireframe overlay to inspect topology
- Full 3D controls: Rotate, zoom, and pan the model

### 分类
Developer Tools（开发者工具）

### 语言
中文（简体）

### 权限说明
该扩展仅使用 "activeTab" 权限，仅在用户主动点击预览按钮时访问当前标签页。**不收集、不存储、不传输任何用户数据。**

### 截图要求
需要提供至少 1 张截图（1280×800 或 640×400），建议 3-5 张：
1. 单文件页预览效果
2. 目录页批量预览效果
3. 悬停小窗预览效果
4. 线框模式效果

### 隐私政策
本扩展不收集任何个人数据。它仅在用户点击时访问当前标签页以读取文件名和构造预览链接。所有 3D 渲染在用户本地浏览器中完成，无任何数据发送到外部服务器。

---

## 提交步骤

1. 访问 [Chrome 开发者控制台](https://chrome.google.com/webstore/devconsole)
2. 注册开发者账号（一次性费用 $5 USD）
3. 点击「新增项」→ 上传 `fbx-viewer.zip`
4. 填写商店信息（参考上方内容）
5. 上传截图
6. 提交审核

审核通常需要 1-3 个工作日。
