export interface IAuthAdapter {
  getTunnelToken(): Promise<string>;
}
