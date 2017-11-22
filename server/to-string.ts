import { EventEmitter } from "events";

export class ToString extends EventEmitter {
  writable = true;
  data: Uint8Array;

  store(buffer: Buffer | string) {
    let data: Buffer;
    if (typeof buffer !== 'string') {
      data = buffer;
    } else {
      data = new Buffer(buffer);
    }

    let next = new Uint8Array(this.data.length + data.length);
    next.set(this.data, 0);
    next.set(data, this.data.length);
    this.data = next;
  }

  write(buffer: Buffer | string, cb?: Function): boolean;
  write(str: string, encoding?: string, cb?: Function): boolean;
  write(...args: any[]): boolean {
    this.store(args[0]);

    let last = args.pop();
    if (typeof last === 'function') {
      last(null);
    }
    return true;
  }

  end(): void;
  end(buffer: Buffer, cb?: Function): void;
  end(str: string, cb?: Function): void;
  end(str: string, encoding?: string, cb?: Function): void;
  end(...args: any[]) {
    if (args.length > 0) {
      this.store(args[0]);

      let last = args.pop();
      if (typeof last === 'function') {
        last(null);
      }
    }
  }
}
