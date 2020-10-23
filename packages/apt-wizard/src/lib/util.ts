import { IFS } from '../type/fs';

export function mkdirp(path: string, fs: IFS) {
  const lastSlashIndex = path.lastIndexOf('/');

  // 这里的 || 是为了保留根路径
  const parentPath = path.slice(0, lastSlashIndex) || '/';

  // 如果父目录不在，就先创建父目录
  if (!fs.existsSync(parentPath)) mkdirp(parentPath, fs);
  if (!fs.existsSync(path)) fs.mkdirSync(path);
}

export function getSystemInfo(fs: IFS) {
  let releaseCodeName: string = '';

  if (fs.existsSync('/etc/os-release')) {
    const content: string = fs.readFileSync('/etc/os-release', { encoding: 'utf-8' });
    releaseCodeName = (content.match(/^VERSION_CODENAME=(.*)\n/) || [])[1];
  }

  return { releaseCodeName };
}
