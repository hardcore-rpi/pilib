import * as cv from 'opencv4nodejs';
import * as dayjs from 'dayjs';

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
  async toBuf() {
    const fileExt = 'png';
    const buf = await cv.imencodeAsync('.' + fileExt, this.mat);
    return { fileExt, buf };
  }

  get timestampStr() {
    return dayjs(this.extra.timestamp).format('YYYY-MM-DD HH:mm:ss');
  }

  release() {
    this.mat.release();
  }
}