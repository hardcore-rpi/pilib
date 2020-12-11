import { Controller, IContext, IControllerMapperItem } from 'ah-server';
import { CapturerUpdateEvt } from '../Event';
import { LiveStream } from '../LiveStream';

export class LiveStreamController extends Controller {
  mapper: IControllerMapperItem[] = [
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

    const update = ({ detector }: CapturerUpdateEvt) => {
      streamIns.update(detector.mark().markedSnapshot);
    };
    ctx.app.on(CapturerUpdateEvt, update);

    const clearUp = () => {
      ctx.app.off(CapturerUpdateEvt, update);
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
