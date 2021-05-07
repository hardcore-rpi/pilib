import { BaseScheduler } from 'ah-server';

export class RefreshCapturer extends BaseScheduler {
  timer = {
    type: 'interval' as 'interval',
    interval: 1000 / this.config.CAMERA_FRAME_RATE,
  };

  async invoke() {
    await this.app.service.capturer.update();
  }
}
