export abstract class BaseDTO {
  abstract readonly type: string;
  abstract sequelize(): string;
}

/** 指令传输对象 */
export class CommandDTO extends BaseDTO {
  type = 'command';

  constructor(readonly cmd: string, readonly args: string) {
    super();
  }

  sequelize() {
    return JSON.stringify({ type: this.type, cmd: this.cmd, args: this.args });
  }
}

/** 文本传输对象 */
export class DataTextDTO extends BaseDTO {
  type = 'data-text';

  constructor(readonly value: string) {
    super();
  }

  sequelize() {
    return JSON.stringify({ type: this.type, value: this.value });
  }
}

/** 二进制传输对象 */
export class DataBinaryDTO extends BaseDTO {
  type = 'data-binary';

  constructor(readonly value: Buffer) {
    super();
  }

  sequelize() {
    return JSON.stringify({ type: this.type, value: this.value.toString('base64') });
  }
}

export const parseDTO = (input: string): BaseDTO | null => {
  const { type, ...rest } = JSON.parse(input);

  if (type === 'command') return new CommandDTO(rest.cmd, rest.args);
  if (type === 'data-text') return new DataTextDTO(rest.value);
  if (type === 'data-binary') return new DataBinaryDTO(rest.value);

  return null;
};
