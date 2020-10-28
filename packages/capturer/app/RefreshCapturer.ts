import { Scheduler } from 'ah-server';

declare module 'ah-server' {
  interface IScheduler {
    refreshCapturer: RefreshCapturer;
  }
}

export class RefreshCapturer extends Scheduler {
  interval = 1000 / 20;

  async invoke() {
    await this.app.service.capturer.update();
  }
}
