import { EventBus } from 'ah-event-bus';
import { ITunnelConfig } from 'pilib-tunnel-core';

export type ITunnelSlaveCfg = Omit<ITunnelConfig, 'protocol'> & {
  session: string;
};

export interface ITunnelSlaveImpl extends EventBus {
  start(): void;
}
