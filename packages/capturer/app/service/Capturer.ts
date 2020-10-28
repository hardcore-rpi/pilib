import { Service } from 'ah-server';
import { Snapshot } from '../Snapshot';

declare module 'ah-server' {
  interface IService {
    capturer: Capturer;
  }
}

/** 人脸捕捉服务 */
export class Capturer extends Service {
  private lastFaceCnt = 0;

  async init() {}
  async release() {
    this.currentSnapshot?.release();
  }

  public currentSnapshot?: Snapshot;

  async update() {
    try {
      const snapshot = await this.service.camera.read();

      this.currentSnapshot?.release();
      this.currentSnapshot = snapshot;

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
    } catch (e) {
      this.logger.error(e.message || e);

      // 重置，并继续执行
      this.lastFaceCnt = 0;
    }
  }
}
