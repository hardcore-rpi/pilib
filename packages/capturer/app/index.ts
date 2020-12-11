#!/usr/bin/env node

import { App, Controller, IService, Scheduler } from 'ah-server';
import { CapturerConfig } from './Config';
import { LiveMonitorController, LiveStreamController, ShotController } from './controller';
import { RefreshCapturer } from './RefreshCapturer';
import { Camera, Capturer, Uploader } from './service';

class CapturerApp extends App {
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

new CapturerApp(new CapturerConfig()).start().catch(e => {
  console.error(e);
  process.exit(1);
});
