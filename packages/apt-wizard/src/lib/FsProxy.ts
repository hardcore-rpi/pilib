import { IFS } from '../type/fs';
import * as pathUtil from 'path';
import { mkdirp } from './util';

export enum WriteCacheEnum {
  write = 'write',
}

export class FsProxy implements IFS {
  private writeCache: {
    [path: string]: {
      type: WriteCacheEnum;
      content?: Buffer;
    };
  } = {};

  constructor(private readonly diskFs: IFS) {}

  readFileSync: IFS['readFileSync'] = (...args) => {
    const [path, opt] = args;

    // 先从缓存中找
    if (this.writeCache[path]) {
      return opt?.encoding
        ? this.writeCache[path].content!.toString(opt.encoding)
        : this.writeCache[path];
    }

    return this.diskFs.readFileSync(...args);
  };

  writeFileSync: IFS['writeFileSync'] = (...args) => {
    // 同步写入缓存
    const [path, data, opt] = args;
    this.writeCache[path] = {
      type: WriteCacheEnum.write,
      content: Buffer.from(data, opt?.encoding),
    };

    return this.writeCache[path].content;
  };

  existsSync: IFS['existsSync'] = (...args) => {
    const [path] = args;

    // 先从缓存中找
    return !!this.writeCache[path] || this.diskFs.existsSync(...args);
  };

  mkdirSync: IFS['mkdirSync'] = () => {};

  getWriteCache() {
    return { ...this.writeCache };
  }

  /** 写 cache 到 fs */
  flushWriteCache(
    backupDir: string | null,
    writePathPrefix: string = '',
    targetFs: IFS = this.diskFs
  ) {
    // 从 diskFs 备份
    if (backupDir !== null) {
      const cachePaths = Object.keys(this.writeCache);

      cachePaths.forEach(path => {
        // 跳过不存的路径（比如 cache 中新增的）
        if (!this.diskFs.existsSync(path)) return;

        const originContent = this.diskFs.readFileSync(path);
        const writePath = pathUtil.join(backupDir, path);

        mkdirp(pathUtil.dirname(writePath), targetFs);

        targetFs.writeFileSync(writePath, originContent);
      });
    }

    // 写 cache 到 targetFs
    Object.entries(this.writeCache).forEach(([path, spec]) => {
      const writePath = pathUtil.join(writePathPrefix, path);

      mkdirp(pathUtil.dirname(writePath), targetFs);

      switch (spec.type) {
        case WriteCacheEnum.write:
          targetFs.writeFileSync(writePath, spec.content);
          break;
        default:
          break;
      }
    });
  }
}
