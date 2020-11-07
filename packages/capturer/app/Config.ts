import { Config } from 'ah-server';

declare module 'ah-server' {
  interface IConfig extends CapturerConfig {}
}

export class CapturerConfig extends Config {
  readonly CAMERA_ID: number = +(process.env.CAMERA_ID || '0');
  readonly CAMERA_NAME: string = process.env.CAMERA_NAME || 'new_camera';
  readonly CAMERA_WIDTH: number = +(process.env.CAMERA_WIDTH || '320');
  readonly CAMERA_HEIGHT: number = +(process.env.CAMERA_HEIGHT || '240');
  readonly CAMERA_FRAME_RATE: number = +(process.env.CAMERA_FRAME_RATE || '20');

  readonly UPLOAD_ENDPOINT: string = process.env.UPLOAD_ENDPOINT || './output/';
  readonly LOCAL_PORT: number = +(process.env.LOCAL_PORT || 10001);
  readonly LIVE_REFRESH_INTERVAL: number = +(process.env.LIVE_REFRESH_INTERVAL || '0.5');

  readonly CAPTURER_LPF_FA = +(process.env.CAPTURER_LPF_FA || '0.2');
  readonly CAPTURER_LPF_THRESHOLD = +(process.env.CAPTURER_LPF_THRESHOLD || '0.9');

  readonly LIVE_STREAM_ENABLE = !!process.env.LIVE_STREAM_ENABLE;
}
