export abstract class BaseDTO {
  abstract readonly type: string;
  abstract getExtraSeqData(): any;

  sequelize() {
    const data = { type: this.type, ...this.getExtraSeqData() };
    return JSON.stringify(data);
  }
}

/** 指令传输对象 */
export class CommandDTO extends BaseDTO {
  type = 'command';

  constructor(readonly cmd: string, readonly args: string) {
    super();
  }

  getExtraSeqData() {
    return { cmd: this.cmd, args: this.args };
  }
}

/** 文本传输对象 */
export class DataTextDTO extends BaseDTO {
  type = 'data-text';

  constructor(readonly value: string) {
    super();
  }

  getExtraSeqData() {
    return { value: this.value };
  }
}

/** 二进制传输对象 */
export class DataBinaryDTO extends BaseDTO {
  type = 'data-binary';

  constructor(readonly value: Buffer) {
    super();
  }

  getExtraSeqData() {
    return { value: this.value.toString('base64') };
  }
}

export const parseDTO = (input: string): BaseDTO | null => {
  const { type, ...rest } = JSON.parse(input);

  if (type === 'command') return new CommandDTO(rest.cmd, rest.args);
  if (type === 'data-text') return new DataTextDTO(rest.value);
  if (type === 'data-binary') return new DataBinaryDTO(Buffer.from(rest.value, 'base64'));

  return null;
};

export class DTOPayload {
  static fromRaw(input: string) {
    const { meta, dto: dtoStr } = JSON.parse(input) as { meta: DTOPayload['meta']; dto: string };

    const dto = parseDTO(dtoStr);
    if (!dto) return null;

    return new DTOPayload(dto, meta);
  }

  constructor(readonly dto: BaseDTO, readonly meta: { id: number; timestamp: number }) {}

  sequelize() {
    return JSON.stringify({
      meta: this.meta,
      dto: this.dto.sequelize(),
    });
  }
}
