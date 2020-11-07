import { Snapshot } from './Snapshot';

export const CapturerUpdateEvt = Symbol('CapturerUpdateEvt');
export interface CapturerUpdateEvt {
  snapshot: Snapshot;
}
