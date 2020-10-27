import * as cv from 'opencv4nodejs';
import { Snapshot } from '../Snapshot';
import { BaseService } from './BaseService';

export class Camera extends BaseService {
  constructor(
    readonly id: number,
    readonly name: string,
    private extra: { width: number; height: number }
  ) {
    super();
  }

  private readonly cam = new cv.VideoCapture(this.id);

  async init() {}

  async read(): Promise<Snapshot> {
    const originMat = await this.cam.readAsync();
    const resizeMat = await originMat.resizeAsync(this.extra.height, this.extra.width);

    // clean
    originMat.release();

    const snapshot = new Snapshot(resizeMat, {
      timestamp: new Date(),
      cameraId: this.id,
      cameraName: this.name,
    });

    return snapshot;
  }

  async release() {
    this.cam.release();
    this.logger.info('released');
  }
}
