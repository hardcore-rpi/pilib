import * as cv from 'opencv4nodejs';
import { Snapshot } from '../Snapshot';
import { BaseService } from './BaseService';

declare module 'koa' {
  interface IService {
    camera: Camera;
  }
}

export class Camera extends BaseService {
  private readonly cam = new cv.VideoCapture(this.config.CAMERA_ID);

  async init() {}

  async read(): Promise<Snapshot> {
    const originMat = await this.cam.readAsync();
    const resizeMat = await originMat.resizeAsync(
      this.config.CAMERA_HEIGHT,
      this.config.CAMERA_WIDTH
    );

    // clean
    originMat.release();

    const snapshot = new Snapshot(resizeMat, {
      timestamp: new Date(),
      cameraId: this.config.CAMERA_ID,
      cameraName: this.config.CAMERA_NAME,
    });

    return snapshot;
  }

  async release() {
    this.cam.release();
    this.logger.info('released');
  }
}
