import { BaseController, IApplication, IContext, IRouterMeta } from 'ah-server';
import { CapturerUpdateEvt } from '../Event';

export class LiveMonitorController extends BaseController {
  mapper: IRouterMeta[] = [
    {
      path: '/live',
      method: 'GET',
      handler: this.getSnapshot,
    },
  ];

  private capturerEvt?: CapturerUpdateEvt;

  constructor(app: IApplication) {
    super(app);

    const update = (evt: CapturerUpdateEvt) => (this.capturerEvt = evt);
    this.app.on(CapturerUpdateEvt, update);
  }

  async getSnapshot(ctx: IContext) {
    if (!this.capturerEvt) return;

    const { detector } = this.capturerEvt;

    ctx.set({
      'Content-Type': 'image',
      Refresh: ctx.app.config.LIVE_REFRESH_INTERVAL + '',
    });

    const { markedSnapshot } = detector.mark();
    ctx.body = markedSnapshot.toBuf().buf;
  }
}
