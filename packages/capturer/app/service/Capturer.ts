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
  private lastValue = 0;

  // 一阶滤波系数
  // 系数越小，滤波结果越平稳，但是灵敏度越低；滤波系数越大，灵敏度越高，但是滤波结果越不稳定
  private readonly fa = 0.2;
  private readonly threshold = 0.9;

  public snapshot?: Snapshot;

  async update() {
    try {
      const snapshot = await this.service.camera.read();
      this.snapshot = snapshot;

      const { detection } = await snapshot.detectAllFaces();

      // 一阶滤波
      const currentValue = this.fa * detection.objects.length + (1 - this.fa) * this.lastValue;
      this.lastValue = currentValue;

      const delta = currentValue - this.lastFaceCnt;

      // 差值大于阈值
      if (Math.abs(delta) > this.threshold) {
        // 记录阶段值
        this.lastFaceCnt = Math.round(currentValue);

        const faceIn = delta > 0;
        this.logger.info(
          `faceCount ${this.lastFaceCnt} ${
            faceIn ? `+${delta.toFixed(2)}` : `-${delta.toFixed(2)}`
          }`
        );

        if (faceIn) {
          // 有人进入画面，上传
          const ds = await snapshot.copy({ markAllFaces: true });
          await this.service.uploader.upload(ds);
        }
      }
    } catch (e) {
      this.logger.error(e.message || e);

      // 重置，并继续执行
      this.lastFaceCnt = 0;
    }
  }
}
