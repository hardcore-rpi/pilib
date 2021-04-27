import { execSync } from 'child_process';
import { IAgentCfg } from './Agent';

export class Config implements IAgentCfg {
  endpoint = 'api.biko.pub';
  secure = true;
  name = execSync('uname -a', { encoding: 'utf-8' });
  session = '';

  update(cfg: Partial<IAgentCfg>) {
    Object.entries(cfg).forEach(([n, v]) => {
      if (typeof v === 'undefined') return;
      (this as any)[n] = v;
    });

    return this;
  }
}
