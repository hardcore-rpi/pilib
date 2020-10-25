# 树莓派人脸识别库

人脸识别 + 抓拍 + 上传

- USB 摄像头输入
- 基于 OpenCV 人脸分类器
- 抓拍上传指定地址

# CLI

```bash
cnpm i pilib-capturer -g
pilib-capturer
```

- `CAMERA_ID`: 摄像头输入编号，默认 0
- `CAMERA_WIDTH`: 图像缩放宽度，默认 320
- `CAMERA_HEIGHT`: 图像缩放高度，默认 240
- `UPLOAD_ENDPOINT`: 抓拍上传地址