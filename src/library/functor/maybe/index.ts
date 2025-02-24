export abstract class Maybe<T> {
  abstract map<U>(fn: (val: T) => U): Maybe<U>;
  abstract otherwise(defaultValue: T): T;
  abstract invoke(fn: (val: T) => void): void;

  static Present<T>(value: T): Maybe<T> {
    return new Present(value);
  }

  static Absent<T>(): Maybe<T> {
    return new Absent<T>();
  }

  static Fault<T>(error: Error): Maybe<T> {
    return new Fault<T>(error);
  }
}

class Present<T> extends Maybe<T> {
  constructor(private value: T) {
    super();
  }

  map<U>(fn: (val: T) => U): Maybe<U> {
    return new Present(fn(this.value));
  }

  otherwise(_: T): T {
    return this.value;
  }

  invoke(fn: (val: T) => void): void {
    fn(this.value);
  }
}

class Absent<T> extends Maybe<T> {
  map<U>(_: (val: T) => U): Maybe<U> {
    return new Absent<U>();
  }

  otherwise(defaultValue: T): T {
    return defaultValue;
  }

  invoke(_: (val: T) => void): void {
    return;
  }
}

class Fault<T> extends Maybe<T> {
  constructor(private error: Error) {
    super();
  }

  map<U>(_: (val: T) => U): Maybe<U> {
    return new Fault<U>(this.error);
  }

  otherwise(_: T): T {
    throw this.error;
  }

  invoke(_: (val: T) => void): void {
    throw this.error;
  }
}
