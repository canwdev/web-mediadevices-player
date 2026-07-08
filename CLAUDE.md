## 项目简介

Web MediaDevices Player 是一个用于播放摄像头/麦克风等媒体输入设备的网页应用，基于 [Media Capture and Streams API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)。主要功能：

- 查看 HDMI 采集卡、Webcam 视频，桌面录屏
- 画面截图、录制为 webm 格式
- CH9329 KVM 键鼠控制（相对/绝对鼠标、快捷键、ASCII 文本发送）
- 视频画面二维码扫描（jsQR）
- Web Serial 串口通信（自动连接）
- 同时提供 PWA 网页版与 Tauri 桌面客户端（Windows）

## 技术栈

- **前端框架**：Vue 3（`<script setup>` + TypeScript）
- **构建工具**：Vite 8
- **包管理器**：Bun（项目使用 `bun.lock`，CI 中使用 `bun install`；README 中的 `yarn` 已过时）
- **状态管理**：Pinia + `pinia-plugin-persistedstate`（设置持久化到 localStorage）
- **路由**：vue-router（hash 模式，仅单一路由）
- **国际化**：vue-i18n（中/英，locale 存储在 localStorage `wmd__locale`）
- **工具库**：@vueuse/core、moment、jsqr、web-serial-polyfill
- **PWA**：vite-plugin-pwa（autoUpdate）
- **桌面端**：Tauri 1.x（Rust），窗口状态插件、shell open、alwaysOnTop、fullscreen
- **代码规范**：ESLint 使用 `@antfu/eslint-config`
- **样式**：SCSS（modern-compiler API），`@mdi/font` 图标

## 常用命令

```sh
bun install          # 安装依赖
bun run dev          # 启动 Vite 开发服务器（端口 8087）
bun run build        # 构建 Web 版到 dist/
bun run preview      # 预览构建产物
bun run type-check   # vue-tsc 类型检查
bun run lint         # eslint 检查
bun run format       # eslint --fix 自动修复

# Tauri（桌面端）
bun run tauri dev    # 启动 Tauri 开发
bun run tauri build  # 打包 Tauri 桌面应用（Windows）
```

注意：代码必须运行在 `https` 或 `localhost`，否则浏览器拒绝媒体设备权限。

## 目录结构

```
src/
  main.ts                 # 应用入口，挂载 router/pinia/i18n
  App.vue                 # 根组件，仅渲染 KvmPlayer，挂载 window.$notification
  assets/                 # 全局 SCSS（main.scss / common.scss）
  router/index.ts         # 单一路由，afterEach 设置标题显示版本号
  stores/settings.ts       # Pinia 设置 store，持久化键 ls_key_wmdp_settings
  i18n/
    index.ts              # vue-i18n 初始化，根据浏览器语言选择默认 locale
    locales/{zh-CN,en-US}/index.json  # 翻译文案
  utils/
    index.ts              # 通用工具（router-utils、event-bus 等）
    event-bus.ts          # 事件总线
    router-utils.ts
  components/
    KvmPlayer/            # 核心组件
      KvmPlayer.vue       # 主播放器（设备枚举、流、录制、滤镜、截图等）
      KvmInput.vue        # KVM 键鼠输入控制
      QRScanner.vue       # 二维码扫描
      SettingsPrompt.vue  # 设置弹窗
      TauriActions.vue    # Tauri 专属操作（置顶、全屏等）
      DragButton.vue      # 可拖动悬浮按钮
      hooks/use-action-bar.ts  # 操作栏逻辑
      utils/
        ch9329.ts         # CH9329 HID 协议封装
        cursor-hider.ts   # 鼠标隐藏
        keys-enum.ts      # 键码枚举
        qrcode-decoder.ts # 二维码解码
        serial-state.ts   # 串口状态
        video-recorder.ts # webm 录制
        index.ts          # 截图/下载等通用工具
    NotificationList/     # 通知组件（window.$notification）
    PromptInput/          # 文本输入组件（用于发送 ASCII 文本）
src-tauri/                # Tauri 1.x Rust 工程（Cargo.toml / tauri.conf.json / build.rs）
.github/workflows/        # build.yml（GitHub Pages 部署）/ tauri.yml（桌面打包）
```

## 代码约定

- 使用 `@` 别名指向 `src/`（`vite.config.js` 中配置），导入优先用 `@/...`。
- 组件采用 Vue 3 `<script setup lang="ts">` 组合式 API；i18n 使用 `const { t: $t } = useI18n()`。
- 翻译 key 通过 `$t('app.xxx')` 引用；新增中文文案同步在 `src/i18n/locales/zh-CN/index.json` 与 `en-US/index.json` 维护。
- 全局通知通过 `window.$notification({ type, message, timeout })`（`App.vue` 挂载于 `window.$notification`）。
- 设置统一走 `useSettingsStore()`（Pinia），并自动持久化，不要直接读写 localStorage。
- Tauri 环境判断使用 `window.__TAURI__`（`isTauri` ref），仅在 Tauri 下显示桌面相关功能。
- 媒体流与重对象使用 `shallowRef`（如 `mediaStreamRef`），避免 Vue 深度响应式开销。
- Tauri 相关代码放 `src-tauri/`，被 ESLint 忽略（`eslint.config.js` ignores）。
- 注释使用中文，遵循现有代码风格；保持 `no-console` 开启（仅关闭了部分规则，见 `eslint.config.js`）。
- 提交信息使用 Conventional Commits 风格（如 `feat(i18n):`、`fix(KvmPlayer):`、`refactor(...)`、`chore(...)`）。

## 重要注意事项

- 编辑 `package.json` 中 `version` 后，需同步更新 `src-tauri/tauri.conf.json` 的 `package.version`，否则 Tauri 打包版本不一致。
- 应用标题与控制台 banner 会显示版本号（`router.afterEach` 与 `main.ts`）。
- `vite.config.js` 中 `base: ''` 为相对路径，便于 PWA 部署到子路径 / Tauri 加载。
- 媒体设备权限、WebUSB、Web Serial 等浏览器 API 仅在安全上下文（https/localhost）可用。
