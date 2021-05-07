import * as cv from 'opencv4nodejs';
import { memoize } from 'lodash';
import { Snapshot } from './Snapshot';

export class Detector {
  static classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

  constructor(
    readonly snapshot: Snapshot,
    readonly opt: {
      roi?: {
        area: {
          x0: number;
          y0: number;
          width: number;
          height: number;
        };
      };
    } = {}
  ) {}

  detect = memoize<
    () => {
      detection: {
        objects: cv.Rect[];
        numDetections: number[];
      };
    }
  >(() => {
    const mat = this.snapshot.mat.copy();

    // roi 剪裁
    if (this.opt.roi) {
      const roi = this.opt.roi;

      const roiMat = mat.getRegion(
        new cv.Rect(roi.area.x0, roi.area.y0, roi.area.width, roi.area.height)
      );

      // 图片灰化
      const roiGrayImg = roiMat.bgrToGray();
      const roiDetection = Detector.classifier.detectMultiScale(roiGrayImg);

      const detection = {
        ...roiDetection,
        objects: roiDetection.objects.map(r => {
          // 要加回 roi 起点偏移量
          return new cv.Rect(roi.area.x0 + r.x, roi.area.y0 + r.y, r.width, r.height);
        }),
      };

      return { detection };
    }

    const grayMat = mat.bgrToGray();
    const detection = Detector.classifier.detectMultiScale(grayMat);

    return { detection };
  });

  mark = memoize(() => {
    const { detection } = this.detect();

    const markedMat = this.snapshot.mat.copy();

    detection.objects.forEach(r => {
      markedMat.drawRectangle(r, new cv.Vec3(0, 0, 255));
    });

    if (this.opt.roi) {
      const roi = this.opt.roi;

      // 绘制 roi 边框
      markedMat.drawRectangle(
        new cv.Rect(roi.area.x0, roi.area.y0, roi.area.width, roi.area.height),
        new cv.Vec3(0, 255, 0)
      );
    }

    const markedSnapshot = new Snapshot(markedMat, this.snapshot.extra);

    return { markedSnapshot };
  });
}
