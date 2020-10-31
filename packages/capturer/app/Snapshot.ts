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
  toBuf = memoize(async () => {
    const fileExt = 'png';
    const buf = await cv.imencodeAsync('.' + fileExt, this.mat);
    return { fileExt, buf };
  });

  get timestampStr() {
    return dayjs(this.extra.timestamp).format('YYYY-MM-DD HH:mm:ss');
  }

  detectAllFaces = memoize(async () => {
    // 图片灰化
    const grayImg = this.mat.bgrToGray();
    const detection = await Snapshot.classifier.detectMultiScaleAsync(grayImg);

    return { detection, grayImg };
  });

  markAllFaces = memoize(async () => {
    const { detection } = await this.detectAllFaces();

    const markedMat = await this.mat.copyAsync();
    detection.objects.forEach(r => {
      markedMat.drawRectangle(r, new cv.Vec3(0, 0, 255));
    });

    return { markedMat };
  });

  copy = memoize(async (opt: { markAllFaces?: boolean }) => {
    if (opt.markAllFaces) {
      const { markedMat } = await this.markAllFaces();
      return new Snapshot(markedMat, { ...this.extra });
    }

    return new Snapshot(this.mat, { ...this.extra });
  });

  release() {
    this.mat.release();
  }
}
