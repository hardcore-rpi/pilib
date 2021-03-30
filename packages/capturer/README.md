![pilib](https://tech.biko.pub/gw/52b8d91a-eb9f-4057-9d5d-00679fed4493.png)

# 树莓派人脸识别库

人脸识别 + 抓拍 + 上传

- USB 摄像头输入
- 基于 OpenCV HAAR 人脸分类器
- 一阶滤波器防抓拍抖动
- 抓拍上传指定地址

![](https://hardcore-rpi.biko.pub/gw/3d33350d-4f2f-46be-89e5-37f79b9d93ab.jpg)

# CLI

```bash
cnpm i pilib-capturer -g
pilib-capturer
```

通过环境变量指定 cli 参数

摄像头控制：
- `CAMERA_ID`: 摄像头输入编号，默认 0
- `CAMERA_WIDTH`: 图像缩放宽度，默认 320
- `CAMERA_HEIGHT`: 图像缩放高度，默认 240
- `CAMERA_FRAME_RATE`: 摄像头刷新率，默认 20帧/秒

人脸识别配置：
- `CAPTURER_ROI_AREA`: 指定 ROI 区域，默认为空
- `CAPTURER_LPF_FA`: 防抖一阶滤波系数，默认 0.2
- `CAPTURER_LPF_THRESHOLD`: 防抖一阶滤波判断阈值，默认 0.9

上传配置：
- `UPLOAD_ENDPOINT`: 抓拍上传地址，默认当前路径 ./output
- `DISABLE_UPLOAD`: 是否禁用上传功能，默认 false

实时预览配置：
- `LIVE_REFRESH_INTERVAL`: 实时预览刷新周期，默认 0.5s

端口配置：
- `LOCAL_PORT`: 本地 http 监听端口号，默认 10001

# HTTP API

- `GET /live`: 实时预览图片
- `GET /shot?upload=1&detect=1`: 触发抓拍
