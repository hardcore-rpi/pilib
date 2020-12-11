import { App, Controller, IService, Scheduler } from 'ah-server';
import { LiveMonitorController, LiveStreamController, ShotController } from './controller';
import { RefreshCapturer } from './RefreshCapturer';
import { Camera, Capturer, Uploader } from './service';

export class CapturerApp extends App {
  service: IService = {
    camera: new Camera(this),
    capturer: new Capturer(this),
    uploader: new Uploader(this),
  };

  schedulerList: Scheduler[] = [RefreshCapturer].map(S => new S(this));
  controllerList: Controller[] = [
    LiveMonitorController,
    ShotController,
    this.config.LIVE_STREAM_ENABLE && LiveStreamController,
  ]
    .filter(C => !!C)
    .map((C: any) => new C(this));
}
