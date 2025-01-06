export const enum Transmit {
  Unicast = "unicast",
  Multicast = "multicast",
  Broadcast = "broadcast",
}

export const enum State {
  Pending = "pending",
  Failed = "failed",
  Optimistic = "optimistic",
}

const Pending = Symbol("pending");
const Failed = Symbol("failed");
const Optimistic = Symbol("optimistic");

export type Reactive<P> =
  | typeof Pending
  | typeof Failed
  | typeof Optimistic
  | P;

export type Actions = [any] | [any, any];

export type Model = Record<string, any>;

export type RoutePaths<R extends Routes> = R[keyof R];

// export type RoutePaths<R extends Routes> = R[keyof R];

export type Routes = Record<string, string | number | symbol>;
