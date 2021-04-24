import { ITunnelAdapter } from 'pilib-tunnel-core';
import { w3cwebsocket as WebSocketClient } from 'websocket';
import { curl } from 'urllib';

/** Tunnel adapter for Node */
export const createNodeAdapter = (session: string) => {
  const adapter: ITunnelAdapter = {
    async getTunnelToken({ cfg }) {
      const httpProtocol = cfg.secure ? 'https' : 'http';

      const resp = await curl<{ data: { token: string } }>(
        `${httpProtocol}://${cfg.endpoint}/tunnelConnectToken`,
        { dataType: 'json', headers: { 'x-user-session': session } }
      );

      if (resp.status !== 200) throw new Error(`getTunnelToken error: ${resp.status}`);
      return resp.data.data.token;
    },

    getWs(url: string, protocol: string) {
      return new WebSocketClient(url, protocol) as any;
    },
  };

  return adapter;
};
