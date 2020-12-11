import { Scheduler } from 'ah-server';

declare module 'ah-server' {
  interface IScheduler {
    refreshCapturer: RefreshCapturer;
  }
}

export class RefreshCapturer extends Scheduler {
  interval = 1000 / this.config.CAMERA_FRAME_RATE;

  async invoke() {
    await this.app.service.capturer.update();
  }
}
