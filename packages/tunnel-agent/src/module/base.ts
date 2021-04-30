import { Agent } from '../Agent';

export abstract class BaseModule {
  constructor(protected readonly agent: Agent) {}

  protected logger = this.agent.logger.extend(this.constructor.name);

  abstract start(): void;
  abstract stop(): void;
}
