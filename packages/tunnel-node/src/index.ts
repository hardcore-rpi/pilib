import { Tunnel } from 'pilib-tunnel-core';
import { w3cwebsocket as WebSocketClient } from 'websocket';
import { curl } from 'urllib';

export * from 'pilib-tunnel-core';

// 安全原因，从 env 中读取 session (命令行参数的 session 会被记录在 bash history 中)
const session = process.env.TUNNEL_SESSION || '';

/** Node 环境的 Tunnel */
export class TunnelNode extends Tunnel {
  async getTunnelToken() {
    const httpProtocol = this.cfg.secure ? 'https' : 'http';

    const resp = await curl<{ data: { token: string } }>(
      `${httpProtocol}://${this.cfg.endpoint}/user/tunnelToken`,
      { dataType: 'json', headers: { 'x-user-session': session } }
    );

    if (resp.status !== 200) throw new Error(`getTunnelToken error: ${resp.status}`);
    return resp.data.data.token;
  }

  getWs(url: string, protocol: string) {
    return new WebSocketClient(url, protocol) as any;
  }
}
