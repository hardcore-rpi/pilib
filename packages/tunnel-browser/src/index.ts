import { Tunnel } from 'pilib-tunnel-core';

export * from 'pilib-tunnel-core';

/**
 * Browser 环境的 Tunnel
 *
 * - `getTunnelToken` 要业务上自己定义
 */
export abstract class TunnelBrowser extends Tunnel {
  getWs(url: string, protocol: string) {
    return new WebSocket(url, protocol) as any;
  }
}
