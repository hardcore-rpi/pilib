import { BaseSchedule, IScheduleInterval } from './base';

export class RefreshCapturer extends BaseSchedule<IScheduleInterval> {
  name = 'RefreshCapturer';
  config: IScheduleInterval = {
    type: 'interval',
    // 20 帧
    interval: 1000 / 20,
  };

  async invoke() {
    await this.app.service.capturer.update();
  }
}
