export class FSM<T extends { type: string }> {
  constructor(public cur: T, private effect: (ctx: { to: T; from: T }) => void) {}

  transform(to: T) {
    const from = this.cur;
    this.cur = to;

    this.effect({ to, from });
  }
}
