import * as cv from 'opencv4nodejs';
import { BaseService } from './BaseService';

export class FaceDetector extends BaseService {
  private img!: cv.Mat;
  private classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

  async setImg(img: cv.Mat) {
    this.img = img;
  }

  async init() {}
  async release() {}

  async detectAllFaces() {
    // 图片灰化
    const grayImg = this.img.bgrToGray();

    const detections = await this.classifier.detectMultiScaleAsync(grayImg);
    const count = detections.objects.length;

    console.log(detections);

    const faces = await Promise.all(
      detections.objects.map(async r => {
        const _mat = this.img.getRegion(r);
        const _grayMat = grayImg.getRegion(r);

        return { mat: _mat, grayMat: _grayMat };
      })
    );

    return { detections, count, faces };
  }
}
