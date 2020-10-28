import { App, IScheduler, IService } from 'ah-server';
import { CapturerConfig } from './Config';
import { liveMonitor, shot } from './controller';
import { RefreshCapturer } from './RefreshCapturer';
import { Camera, Capturer, FaceDetector, Uploader } from './service';

declare module 'ah-server' {
  interface IApplication extends CapturerApp {}
}

class CapturerApp extends App {
  service: IService = {
    camera: new Camera(this),
    capturer: new Capturer(this),
    faceDetector: new FaceDetector(this),
    uploader: new Uploader(this),
  };

  scheduler: IScheduler = {
    refreshCapturer: new RefreshCapturer(this),
  };

  async init() {
    await super.init();

    // 路由表
    this.router.get('/live', liveMonitor);
    this.router.get('/shot', shot);
  }
}

new CapturerApp(new CapturerConfig()).start().catch(e => {
  console.error(e);
  process.exit(1);
});
