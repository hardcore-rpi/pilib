import { Detector } from './Detector';
import { Snapshot } from './Snapshot';

export const CapturerFrameEvt = Symbol('CapturerFrameEvt');
export interface CapturerFrameEvt {
  snapshot: Snapshot;
  detector: Detector;
}

export const CapturerFaceInEvt = Symbol('CapturerFaceInEvt');
export interface CapturerFaceInEvt {
  snapshot: Snapshot;
  markedSnapshot: Snapshot;
  detector: Detector;
}
