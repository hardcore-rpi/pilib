import { Volume, createFsFromVolume } from 'memfs';
import { getSystemInfo } from '../src/lib/util';

describe('getSystemInfo', () => {
  it('normal', () => {
    const vol = Volume.fromJSON({
      '/etc/os-release': 'VERSION_CODENAME=buster\nID=raspbian',
    });
    const fs = createFsFromVolume(vol);

    const info = getSystemInfo(fs);

    expect(info).toEqual({
      releaseCodeName: 'buster',
    });
  });
});
