import { BaseService } from './BaseService';
import * as fs from 'fs';
import * as path from 'path';
import * as urllib from 'urllib';
import { Snapshot } from '../Snapshot';

declare module 'koa' {
  interface IService {
    uploader: Uploader;
  }
}

export class Uploader extends BaseService {
  async init() {}
  async release() {}

  get endpoint() {
    return this.config.UPLOAD_ENDPOINT;
  }

  private async saveToLocal(snapshot: Snapshot) {
    const { buf, fileExt } = await snapshot.toBuf();
    const filePath = path.join(
      this.endpoint,
      snapshot.extra.cameraName,
      `${snapshot.extra.timestamp.valueOf()}.${fileExt}`
    );

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(filePath, buf);

    this.logger.info(`save local ${filePath}`);
  }

  private async saveToRemote(snapshot: Snapshot) {
    const { buf, fileExt } = await snapshot.toBuf();

    const upload_time = snapshot.timestampStr;

    const data = {
      path: '/snapshot',
      method: 'POST',
      data: {
        camera_id: snapshot.extra.cameraName,
        upload_time,
        file: {
          content: buf.toString('base64'),
          filename: `snapshot-${snapshot.extra.timestamp.valueOf()}.${fileExt}`,
        },
      },
    };

    // 不用等待 promise 结束
    urllib
      .curl(this.endpoint, {
        method: 'POST',
        dataType: 'json',
        contentType: 'json',
        data,
        timeout: 5000,
      })
      .then(r => {
        if (r.status !== 200) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
        if (r.data.status !== 200)
          throw new Error(`${r.data.status}: ${JSON.stringify(r.data.data)}`);

        this.logger.info(
          `save remote ${data.data.camera_id} ${upload_time} ${data.data.file.filename}`
        );
      })
      .catch(err => {
        this.logger.error(err.message || err);
      });
  }

  async upload(snapshot: Snapshot) {
    if (this.endpoint.startsWith('http://') || this.endpoint.startsWith('https://')) {
      await this.saveToRemote(snapshot);
    } else {
      await this.saveToLocal(snapshot);
    }
  }
}
