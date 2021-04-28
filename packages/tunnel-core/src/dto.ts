export abstract class BaseDTO {
  abstract readonly type: string;
  abstract getExtraSeqData(): any;

  namespace = '';

  setNamespace(ns: string) {
    this.namespace = ns;
    return this;
  }

  sequelize() {
    const data = { type: this.type, namespace: this.namespace, ...this.getExtraSeqData() };
    return JSON.stringify(data);
  }
}

/** 文本传输对象 */
export class DataTextDTO extends BaseDTO {
  static fromRaw(input: string) {
    const { type, namespace, ...rest } = JSON.parse(input);
    return type === 'data-text' ? new DataTextDTO(rest.value).setNamespace(namespace) : null;
  }

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
  static fromRaw(input: string) {
    const { type, namespace, ...rest } = JSON.parse(input);
    return type === 'data-binary'
      ? new DataBinaryDTO(Buffer.from(rest.value, 'base64')).setNamespace(namespace)
      : null;
  }

  type = 'data-binary';

  constructor(readonly value: Buffer) {
    super();
  }

  getExtraSeqData() {
    return { value: this.value.toString('base64') };
  }
}

export const parseDTO = (input: string): BaseDTO | null => {
  return DataTextDTO.fromRaw(input) || DataBinaryDTO.fromRaw(input);
};

export class DTOPayload {
  static fromRaw(input: string) {
    const { meta, dto: dtoStr } = JSON.parse(input) as { meta: DTOPayload['meta']; dto: string };

    const dto = parseDTO(dtoStr);
    if (!dto) return null;

    return new DTOPayload(dto, meta);
  }

  constructor(
    readonly dto: BaseDTO,
    readonly meta: { id: number; timestamp: number; stateFlag?: string }
  ) {}

  sequelize() {
    return JSON.stringify({
      meta: this.meta,
      dto: this.dto.sequelize(),
    });
  }
}
