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

  public snapshot?: Snapshot;

  async update() {
    try {
      const snapshot = await this.service.camera.read();
      this.snapshot = snapshot;

      const { detection } = await snapshot.detectAllFaces();
      const faceCount = detection.objects.length;

      if (this.lastFaceCnt < faceCount) {
        // 有人进入画面，上传
        const ds = await snapshot.copy({ markAllFaces: true });
        await this.service.uploader.upload(ds);
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
