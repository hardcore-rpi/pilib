export enum DebTypeEnum {
  deb = 'deb',
  debSrc = 'deb-src',
}

export enum DebVersionEnum {
  buster = 'buster',
  stretch = 'stretch',
  jessie = 'jessie',
  wheezy = 'wheezy',
}

export enum DebRepoEnum {
  main = 'main',
  contrib = 'contrib',
  nonFree = 'non-free',
  firmware = 'firmware',
  ui = 'ui',
}

export abstract class AptBaseSource {
  abstract readonly name: string;
  abstract readonly title: string;
  abstract readonly note: string;
  abstract readonly sources: {
    debType: DebTypeEnum;
    url: string;
    version: DebVersionEnum;
    repoList: DebRepoEnum[];
  }[];

  toFullSourceUrls(): string[] {
    return this.sources.map(s => [s.debType, s.url, s.version, ...s.repoList].join(' '));
  }
}

/** 清华大学开源镜像 */
export class AptTunaSource extends AptBaseSource {
  name = 'tuna';
  title = '清华大学开源软件镜像站';
  note = 'https://mirrors.tuna.tsinghua.edu.cn/help/raspbian/';
  sources = [
    {
      debType: DebTypeEnum.deb,
      url: 'http://mirrors.tuna.tsinghua.edu.cn/raspbian/raspbian/',
      version: DebVersionEnum.buster,
      repoList: [DebRepoEnum.main, DebRepoEnum.nonFree, DebRepoEnum.contrib],
    },
    {
      debType: DebTypeEnum.debSrc,
      url: 'http://mirrors.tuna.tsinghua.edu.cn/raspbian/raspbian/',
      version: DebVersionEnum.buster,
      repoList: [DebRepoEnum.main, DebRepoEnum.nonFree, DebRepoEnum.contrib],
    },
    {
      debType: DebTypeEnum.deb,
      url: 'http://mirrors.tuna.tsinghua.edu.cn/raspberrypi/',
      version: DebVersionEnum.buster,
      repoList: [DebRepoEnum.main, DebRepoEnum.ui],
    },
  ];
}

export class AptSourceCollection {
  list: AptBaseSource[] = [new AptTunaSource()];

  getByName(name: string) {
    return this.list.find(s => s.name === name);
  }
}
