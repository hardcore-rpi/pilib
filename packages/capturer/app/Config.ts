export class Config {
  readonly CAMERA_ID: number = +(process.env.CAMERA_ID || '0');
  readonly CAMERA_NAME: string = process.env.CAMERA_NAME || 'new_camera';
  readonly CAMERA_WIDTH: number = +(process.env.CAMERA_WIDTH || '320');
  readonly CAMERA_HEIGHT: number = +(process.env.CAMERA_HEIGHT || '240');
  readonly UPLOAD_ENDPOINT: string = process.env.UPLOAD_ENDPOINT || './output/';
  readonly LOCAL_PORT: number = +(process.env.LOCAL_PORT || 10001);
  readonly LIVE_REFRESH_INTERVAL: number = +(process.env.LIVE_REFRESH_INTERVAL || '0.5');

  toLogStr() {
    return Object.entries(this)
      .map(([n, v]) => `${n}=${v}`)
      .join(' ');
  }
}