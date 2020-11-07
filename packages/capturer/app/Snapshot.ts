import * as cv from 'opencv4nodejs';
import dayjs from 'dayjs';
import memoize from 'fast-memoize';

export class Snapshot {
  static classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

  constructor(
    readonly mat: cv.Mat,
    readonly extra: {
      timestamp: Date;
      cameraId: number;
      cameraName: string;
    }
  ) {}

  /** 转换成 buffer */
  toBuf = memoize(() => {
    const fileExt = 'jpg';
    const buf = cv.imencode('.' + fileExt, this.mat);
    return { fileExt, buf };
  });

  get timestampStr() {
    return dayjs(this.extra.timestamp).format('YYYY-MM-DD HH:mm:ss');
  }

  detectAllFaces = memoize(() => {
    // 图片灰化
    const grayImg = this.mat.bgrToGray();
    const detection = Snapshot.classifier.detectMultiScale(grayImg);

    return { detection, grayImg };
  });

  markAllFaces = memoize(() => {
    const { detection } = this.detectAllFaces();

    const markedMat = this.mat.copy();
    detection.objects.forEach(r => {
      markedMat.drawRectangle(r, new cv.Vec3(0, 0, 255));
    });

    return { markedMat };
  });

  copy = memoize((opt: { markAllFaces?: boolean }) => {
    if (opt.markAllFaces) {
      const { markedMat } = this.markAllFaces();
      return new Snapshot(markedMat, { ...this.extra });
    }

    return new Snapshot(this.mat, { ...this.extra });
  });

  release() {
    this.mat.release();
  }
}
