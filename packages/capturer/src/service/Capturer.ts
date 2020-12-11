import { Service } from 'ah-server';
import { Detector } from '../Detector';
import { CapturerUpdateEvt } from '../Event';

declare module 'ah-server' {
  interface IService {
    capturer: Capturer;
  }
}

/** 人脸捕捉服务 */
export class Capturer extends Service {
  private lastFaceCnt = 0;
  private lastValue = 0;

  private getRoi() {
    if (!this.config.CAPTURER_ROI_AREA) return;

    const [x0, y0, width, height] = this.config.CAPTURER_ROI_AREA.split(':').map(s => +s);
    return { area: { x0, y0, width, height } };
  }

  // 一阶滤波系数
  // 系数越小，滤波结果越平稳，但是灵敏度越低；滤波系数越大，灵敏度越高，但是滤波结果越不稳定
  private get fa() {
    return this.config.CAPTURER_LPF_FA;
  }

  private get threshold() {
    return this.config.CAPTURER_LPF_THRESHOLD;
  }

  async update() {
    try {
      const snapshot = await this.service.camera.read();
      const detector = new Detector(snapshot, {
        roi: this.getRoi(),
      });

      this.app.emit(CapturerUpdateEvt, { snapshot, detector } as CapturerUpdateEvt);

      const { detection } = detector.detect();

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
          const { markedSnapshot } = detector.mark();
          await this.service.uploader.upload(markedSnapshot);
        }
      }
    } catch (e) {
      this.logger.error(e.message || e);

      // 重置，并继续执行
      this.lastFaceCnt = 0;
    }
  }
}
