import { BaseService } from './BaseService';

declare module 'koa' {
  interface IService {
    capturer: Capturer;
  }
}

export class Capturer extends BaseService {
  private lastFaceCnt = 0;

  async init() {}
  async release() {}

  async update() {
    try {
      const snapshot = await this.service.camera.read();
      await this.service.faceDetector.setImg(snapshot.mat);

      const { count: faceCount } = await this.service.faceDetector.detectAllFaces();

      if (this.lastFaceCnt < faceCount) {
        // 有人进入画面，上传
        await this.service.uploader.upload(snapshot);
      }

      if (faceCount !== this.lastFaceCnt) {
        this.logger.info(`faceCount ${this.lastFaceCnt} ${faceCount - this.lastFaceCnt}`);
        this.lastFaceCnt = faceCount;
      }

      // clean
      snapshot.release();
    } catch (e) {
      this.logger.error(e.message || e);

      // 重置，并继续执行
      this.lastFaceCnt = 0;
    }
  }
}
