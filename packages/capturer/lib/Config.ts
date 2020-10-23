export class Config {
  readonly CAMERA_ID: number = +(process.env.CAMERA_ID || '0');
  readonly CAMERA_WIDTH: number = +(process.env.CAMERA_WIDTH || '320');
  readonly CAMERA_HEIGHT: number = +(process.env.CAMERA_HEIGHT || '240');
  readonly UPLOAD_ENDPOINT: string = process.env.UPLOAD_ENDPOINT || './output/';

  toLogStr() {
    return Object.entries(this)
      .map(([n, v]) => `${n}=${v}`)
      .join(' ');
  }
}
