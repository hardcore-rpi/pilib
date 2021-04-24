import { ITunnelStage } from './Tunnel';
import { BaseEvent } from 'ah-event-bus';
import { BaseDTO, DTOPayload } from './dto';

export class StageChangeEvt extends BaseEvent {
  constructor(readonly from: ITunnelStage, readonly to: ITunnelStage) {
    super();
  }
}

export class TunnelMsgEvt extends BaseEvent {
  constructor(readonly dto: BaseDTO, readonly payload: DTOPayload) {
    super();
  }
}

export class TunnelErrorEvt extends BaseEvent {
  constructor(readonly err: Error) {
    super();
  }
}

export class ReconnectEvt extends BaseEvent {
  constructor(readonly delay: number) {
    super();
  }
}
