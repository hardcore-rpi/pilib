import { ITunnelSlaveCfg } from './type';
import { execSync } from 'child_process';

export class Config implements ITunnelSlaveCfg {
  endpoint = 'api.biko.pub';
  secure = true;
  name = execSync('uname -a', { encoding: 'utf-8' });
  session = '';

  update(cfg: Partial<ITunnelSlaveCfg>) {
    Object.entries(cfg).forEach(([n, v]) => {
      if (typeof v === 'undefined') return;
      (this as any)[n] = v;
    });

    return this;
  }
}
