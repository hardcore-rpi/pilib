import * as cv from 'opencv4nodejs';
import { BaseService } from './BaseService';

export class Camera extends BaseService {
  constructor(readonly id: number, private extra: { width: number; height: number }) {
    super();
  }

  private readonly cam = new cv.VideoCapture(this.id);

  async init() {}

  async read() {
    let mat = await this.cam.readAsync();

    // 缩放
    mat = await mat.resizeAsync(this.extra.height, this.extra.width);

    return { mat };
  }

  async release() {
    this.cam.release();
    this.logger.info('camera released');
  }
}
