import { Volume, createFsFromVolume } from 'memfs';
import { FsProxy } from '../src/lib/FsProxy';

describe('normal', () => {
  it('normal', () => {
    const vol1 = Volume.fromJSON({
      '/a': 'a',
    });
    const fs1 = createFsFromVolume(vol1);
    const fsProxy = new FsProxy(fs1);

    expect(fsProxy.readFileSync('/a', { encoding: 'utf-8' })).toEqual('a');

    fsProxy.writeFileSync('/a', 'aa', { encoding: 'utf-8' });
    expect(fsProxy.readFileSync('/a', { encoding: 'utf-8' })).toEqual('aa');
    expect(fs1.readFileSync('/a', { encoding: 'utf-8' })).toEqual('a');

    fsProxy.writeFileSync('/b', 'b', { encoding: 'utf-8' });
    expect(fsProxy.readFileSync('/b', { encoding: 'utf-8' })).toEqual('b');
    expect(fs1.existsSync('/b')).toBeFalsy();

    const vol2 = Volume.fromJSON({});
    const fs2 = createFsFromVolume(vol2);

    fsProxy.flushWriteCache('/backup', '', fs2);
    expect(fs2.readFileSync('/a', { encoding: 'utf-8' })).toEqual('aa');
    expect(fs2.readFileSync('/b', { encoding: 'utf-8' })).toEqual('b');
    expect(fs2.readFileSync('/backup/a', { encoding: 'utf-8' })).toEqual('a');
  });
});
