import { Volume, createFsFromVolume } from 'memfs';
import { AptTunaSource } from '../src/lib/AptSource';
import { UpdateAptSource } from '../src/lib/UpdateAptSource';

class MockUpdateAptSource extends UpdateAptSource {
  backUpPath = '/_backUpPath';
}

describe('normal', () => {
  it('normal', () => {
    const vol = Volume.fromJSON({
      '/etc/apt/sources.list': 'aaa',
      '/etc/apt/sources.list.d/raspi.list': 'bbb',
    });
    const fs = createFsFromVolume(vol);

    const ins = new MockUpdateAptSource(
      {
        aptSourceWritePath: '/etc/apt/sources.list',
        cleanPaths: ['/etc/apt/sources.list.d/raspi.list'],
      },
      fs
    );

    ins.update(new AptTunaSource());

    expect(vol.toJSON()).toMatchSnapshot();
  });
});
