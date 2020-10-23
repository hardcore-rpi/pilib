import { Logger } from '../Logger';

export abstract class BaseService {
  protected logger = new Logger(this.constructor.name);

  abstract init(): Promise<void>;
  abstract release(): Promise<void>;
}
