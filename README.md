# Web MediaDevices Player

用于播放【视频/音频】输入设备的网页应用，使用了 [Media Capture and Streams API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) 技术。

- 网页版：https://canwdev.github.io/web-mediadevices-player/
- Tauri 打包的客户端：[Releases](https://github.com/canwdev/web-mediadevices-player/releases)
- [English Readme](./README-en.md)

主要用途：
- HDMI to USB 采集卡查看
- Webcam 视频播放，桌面录屏
- 画面截图，录制为 webm 格式
- v1.1.5 新增功能
  - [CH9329](https://one-kvm.mofeng.run/ch9329_hid/) KVM 键鼠控制，参考: [webusbkvm](https://github.com/kkocdko/kblog/blob/master/source/toys/webusbkvm/README.md)
  - 支持相对鼠标、绝对鼠标、快捷键、ASCII文本发送
  - 视频画面二维码扫描

![screenshot](docs/screenshot-2.jpg)
![screenshot](docs/screenshot-3.jpg)
![screenshot](docs/screenshot.png)

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

---

## Star History

- Thanks for your stars https://www.ruanyifeng.com/blog/2024/06/weekly-issue-303.html

[![Star History Chart](https://api.star-history.com/svg?repos=canwdev/web-mediadevices-player&type=Date)](https://star-history.com/#canwdev/web-mediadevices-player&Date)