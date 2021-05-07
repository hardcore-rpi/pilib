import { BaseController, IContext, IRouterMeta } from 'ah-server';
import { CapturerFrameEvt } from '../Event';
import { LiveStream } from '../LiveStream';

export class LiveStreamController extends BaseController {
  mapper: IRouterMeta[] = [
    {
      path: '/liveStream',
      method: 'GET',
      handler: this.getStream,
    },
  ];

  async getStream(ctx: IContext) {
    const streamIns = new LiveStream(
      ctx.app.config.CAMERA_WIDTH,
      ctx.app.config.CAMERA_HEIGHT,
      ctx.app.config.CAMERA_FRAME_RATE
    );

    const update = ({ detector }: CapturerFrameEvt) => {
      streamIns.update(detector.mark().markedSnapshot);
    };
    ctx.app.on(CapturerFrameEvt, update);

    const clearUp = () => {
      ctx.app.off(CapturerFrameEvt, update);
      streamIns.dispose();
    };

    ctx.response.res.once('close', clearUp);

    ctx.status = 200;
    ctx.set({
      'Content-Type': streamIns.mimeType,
      'Access-Control-Allow-Origin': '*',
    });

    ctx.flushHeaders();
    ctx.body = streamIns.output;
  }
}
