# Web MediaDevices Player

用于播放系统【视频/音频】输入设备的网页应用，使用了 [Media Capture and Streams API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) 技术。

- 网页版：https://canwdev.github.io/web-mediadevices-player/
- Tauri 打包的客户端：[Releases](https://github.com/canwdev/web-mediadevices-player/releases)

主要用途：
- HDMI to USB 采集卡查看
- Webcam 视频播放，桌面录屏
- 画面截图，录制为 webm 格式

![screenshot](screenshot.png)

提示：
- 首次使用会请求摄像头和麦克风权限，如果不需要麦克风权限可以拒绝，请求过后会等待几秒钟加载设备。
- 此页面必须运行在 https 或 localhost 环境，其他环境（如：filesystem）无访问设备的权限。
- 录制的 webm 视频拖动进度条可能存在问题，手动转码成 mp4 即可解决。

---

## 开发

> 欢迎提交PR

```sh
# 安装依赖
yarn install

# 开发模式
yarn dev

# 构建 Web 版
yarn build

# 构建 Tauri App
yarn build:tauri
```
