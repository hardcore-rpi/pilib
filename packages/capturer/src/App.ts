import { BaseApp, BaseController, IService, BaseScheduler } from 'ah-server';
import { LiveMonitorController, LiveStreamController, ShotController } from './controller';
import { RefreshCapturer } from './RefreshCapturer';
import { Camera, Capturer, Uploader } from './service';

declare module 'ah-server' {
  interface IApplication extends CapturerApp {}
}

export class CapturerApp extends BaseApp {
  service: IService = {
    camera: new Camera(this),
    capturer: new Capturer(this),
    uploader: new Uploader(this),
  };

  schedulers: BaseScheduler[] = [new RefreshCapturer(this)];
  controllers: BaseController[] = [
    LiveMonitorController,
    ShotController,
    this.config.LIVE_STREAM_ENABLE && LiveStreamController,
  ]
    .filter(C => !!C)
    .map((C: any) => new C(this));
}
