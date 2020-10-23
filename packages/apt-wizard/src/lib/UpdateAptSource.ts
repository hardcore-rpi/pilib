import { IFS } from '../type/fs';
import * as pathUtil from 'path';
import { AptBaseSource } from './AptSource';
import { mkdirp } from './util';

/** 更新软件源 */
export class UpdateAptSource {
  constructor(
    private readonly config: {
      /** 写入路径 */
      aptSourceWritePath: string;

      /** 删除文件 */
      cleanPaths: string[];
    },
    private readonly fs: IFS
  ) {}

  /** 清除和备份 */
  private cleanAndBackUp() {
    const cleanFiles: {
      path: string;
      content: string;
    }[] = [];

    // 收集备份文件(要把 aptSourceWritePath 也加入收集列表)
    const cleanPathSet = new Set([...this.config.cleanPaths, this.config.aptSourceWritePath]);

    cleanPathSet.forEach(path => {
      if (!this.fs.existsSync(path)) return;

      const content = this.fs.readFileSync(path, { encoding: 'utf-8' });
      cleanFiles.push({ path, content });
    });

    // 清空文件
    cleanFiles.forEach(({ path }) => {
      this.fs.writeFileSync(path, `# 由硬核树莓派 wizard 脚本清空, 内容已备份`, {
        encoding: 'utf-8',
      });
    });
  }

  /** 写入软件源 */
  private writeAptSourcesList(source: AptBaseSource) {
    mkdirp(pathUtil.dirname(this.config.aptSourceWritePath), this.fs);

    const data = [
      '# 由硬核树莓派 wizard 脚本自动生成',
      '',
      `# ${source.name} - ${source.title}`,
      ...(source.note ? [`# ${source.note}`] : []),
      ...source.toFullSourceUrls(),
    ].join('\n');

    this.fs.writeFileSync(this.config.aptSourceWritePath, data, {
      encoding: 'utf-8',
    });
  }

  update(source: AptBaseSource) {
    this.cleanAndBackUp();
    this.writeAptSourcesList(source);
  }
}
