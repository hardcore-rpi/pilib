export interface IAuthAdapter {
  getTunnelToken(): Promise<string>;
}

export interface IWebsocket {
  onopen: () => any;
  onmessage: (ev: { data: any }) => any;
  onerror: (err: Error) => any;
  onclose: (ev: { code: number; reason: string }) => any;
  close(code?: number, reason?: string): void;
  send(msg: string): void;
}

export interface IWsAdapter {
  createWs(url: string, protocol: string): IWebsocket;
}
