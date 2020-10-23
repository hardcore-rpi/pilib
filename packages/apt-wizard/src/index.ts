import { UpdateAptSource } from './lib/UpdateAptSource';
import { prompt } from 'inquirer';
import { AptSourceCollection, DebVersionEnum } from './lib/AptSource';
import * as diskFs from 'fs';
import { FsProxy, WriteCacheEnum } from './lib/FsProxy';
import { getSystemInfo } from './lib/util';

async function run() {
  console.log(`自动更新软件源工具`);

  const fsp = new FsProxy(diskFs);

  const info = getSystemInfo(fsp);
  const sourceCollection = new AptSourceCollection();

  const questions = [
    {
      type: 'list',
      name: 'debianReleaseCodeName',
      message: '选择 Debian 发行版',
      default: info.releaseCodeName,
      choices: Object.values(DebVersionEnum),
    },
    {
      type: 'list',
      name: 'source',
      message: '选择软件源',
      default: sourceCollection.list[0].name,
      choices: sourceCollection.list.map(s => ({
        name: `${s.name} - ${s.title}`,
        value: s.name,
      })),
    },
  ];

  const answers = await prompt<{
    debianReleaseCodeName: DebVersionEnum;
    source: string;
  }>(questions);

  const updater = new UpdateAptSource(
    {
      aptSourceWritePath: '/etc/apt/sources.list',
      cleanPaths: ['/etc/apt/sources.list.d/raspi.list'],
    },
    fsp
  );

  // 初始化软件源描述
  const aptSource = sourceCollection.getByName(answers.source)!;
  aptSource.sources.forEach(s => (s.version = answers.debianReleaseCodeName));

  // 更新软件源
  updater.update(aptSource);

  const cache = fsp.getWriteCache();

  console.log('文件变更:');
  Object.entries(cache).forEach(([path, spec]) => {
    const typeStr = spec.type === WriteCacheEnum.write ? spec.type : spec.type;

    console.log(typeStr, path);
  });

  const { confirm } = await prompt<{ confirm: boolean }>([
    { type: 'confirm', name: 'confirm', message: '确定执行' },
  ]);

  if (!confirm) {
    if (
      (
        await prompt<{ confirm: boolean }>([
          { type: 'confirm', name: 'confirm', message: '导出变更到当前目录' },
        ])
      ).confirm
    ) {
      fsp.flushWriteCache(null, process.cwd());
      return;
    }
  }

  const backupDir = process.cwd();
  fsp.flushWriteCache(backupDir);

  console.log(`文件已备份到 ${backupDir}`);
}

run();
