import { BaseService } from './BaseService';
import * as fs from 'fs';
import * as path from 'path';
import * as urllib from 'urllib';
import { Snapshot } from '../Snapshot';

export class Uploader extends BaseService {
  constructor(readonly endpoint: string) {
    super();
  }

  async init() {}
  async release() {}

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

    const data = {
      path: '/snapshot',
      method: 'POST',
      data: {
        camera_id: snapshot.extra.cameraName,
        upload_time: snapshot.extra.timestamp.valueOf(),
        file: {
          content: buf.toString('base64'),
          filename: `snapshot-${snapshot.extra.timestamp.valueOf()}.${fileExt}`,
        },
      },
    };

    // 不用等待 promise 结束
    urllib
      .curl(this.endpoint, { method: 'POST', contentType: 'json', data, timeout: 5000 })
      .then(r => {
        if (r.status !== 200) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
        this.logger.info(`save remote ${this.endpoint} ${data.data.file.filename}`);
      })
      .catch(err => {
        this.logger.error(err.message || err);
      });

    this.logger.info(`saving remote ${this.endpoint} ${data.data.file.filename}`);
  }

  async upload(snapshot: Snapshot) {
    if (this.endpoint.startsWith('http://') || this.endpoint.startsWith('https://')) {
      await this.saveToRemote(snapshot);
    } else {
      await this.saveToLocal(snapshot);
    }
  }
}
