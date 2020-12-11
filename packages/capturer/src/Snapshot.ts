import * as cv from 'opencv4nodejs';
import dayjs from 'dayjs';
import memoize from 'fast-memoize';

export class Snapshot {
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

  release() {
    this.mat.release();
  }
}
