import { BaseService } from './BaseService';
import * as fs from 'fs';
import * as cv from 'opencv4nodejs';
import * as path from 'path';

export class Uploader extends BaseService {
  constructor(readonly endpoint: string) {
    super();
  }

  async init() {}
  async release() {}

  private async saveToLocal(filename: string, content: Buffer | cv.Mat) {
    const buf =
      content instanceof Buffer
        ? content
        : await cv.imencodeAsync('.' + filename.split('.').pop()!, content);

    const filePath = path.join(this.endpoint, filename);

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(filePath, buf);

    this.logger.info(`save to ${filePath}`);
  }

  async upload(filename: string, content: Buffer | cv.Mat) {
    await this.saveToLocal(filename, content);
  }
}
