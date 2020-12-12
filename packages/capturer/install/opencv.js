const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import('child_process').ExecSyncOptions} opt
 */
function exec(command, args, opt = {}) {
  const envStr = Object.entries(opt.env || {})
    .map(([k, v]) => [k, v].join('='))
    .join(' ');

  const shellStr = [command, ...args].join(' ');

  console.log('>>>', envStr, shellStr);

  execSync(shellStr, {
    stdio: ['inherit', 'inherit', 'inherit'],
    ...opt,
    env: {
      ...process.env,
      ...opt.env,
    },
  });
}

/**
 * @see https://nodejs.org/api/os.html#os_os_platform
 * @type {'aix' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32'};
 */
const platform = os.platform();

/**
 * @see https://nodejs.org/api/os.html#os_os_platform
 * @type {'arm' | 'arm64' | 'x64'};
 */
const arch = os.arch();

console.log('current platform:', platform, arch);

// 准备目录
const buildTargetDir = '_opencv_build';
if (!fs.existsSync(buildTargetDir)) exec('mkdir', [buildTargetDir]);

/** @type {string} */
let tarName;

if (platform === 'darwin') {
  tarName = 'opencv-3.4.12-build-mac.xz';
} else if (platform === 'linux' && arch === 'arm') {
  tarName = 'opencv-3.4.12-build-linux-armv7l.xz';
} else {
  throw new Error(`not support ${platform} ${arch}`);
}

if (!fs.existsSync(tarName)) {
  exec('wget', [`https://admin.shiluyizhan.com/gw/assets/${tarName}`]);
}

exec('tar', ['xvJf', tarName, '-C', buildTargetDir]);

// 安装 opencv4nodejs
exec('cnpm', ['i', 'opencv4nodejs@^5.6.0'], {
  env: {
    // 禁用自动安装
    OPENCV4NODEJS_DISABLE_AUTOBUILD: '1',
    OPENCV_INCLUDE_DIR: path.join(process.cwd(), buildTargetDir, 'include'),
    OPENCV_LIB_DIR: path.join(process.cwd(), buildTargetDir, 'lib'),
    OPENCV_BIN_DIR: path.join(process.cwd(), buildTargetDir, 'bin'),
  },
});
