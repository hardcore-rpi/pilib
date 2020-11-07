#!/usr/bin/env node

import { App, IScheduler, IService } from 'ah-server';
import { CapturerConfig } from './Config';
import { liveMonitor, liveStream, shot } from './controller';
import { RefreshCapturer } from './RefreshCapturer';
import { Camera, Capturer, Uploader } from './service';

class CapturerApp extends App {
  service: IService = {
    camera: new Camera(this),
    capturer: new Capturer(this),
    uploader: new Uploader(this),
  };

  scheduler: IScheduler = {
    refreshCapturer: new RefreshCapturer(this),
  };

  protected async init() {
    await super.init();

    // 路由表
    this.router.get('/live', liveMonitor);
    this.router.get('/shot', shot);

    if (this.config.LIVE_STREAM_ENABLE) {
      this.router.get('/liveStream', liveStream);
    }
  }
}

new CapturerApp(new CapturerConfig()).start().catch(e => {
  console.error(e);
  process.exit(1);
});
