import { Tunnel } from 'pilib-tunnel-core';
import { PingProtocol } from './lib/Ping';
import { SystemProtocol } from './lib/System';
import { TerminalProtocol } from './lib/Terminal';

export class TunnelProtocol extends Tunnel {
  terminal = new TerminalProtocol(this);
  system = new SystemProtocol(this);
  ping = new PingProtocol(this);
}
