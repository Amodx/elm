import { SignalData } from "./ElementProps";

class IterableWeakMap<K extends object, V> implements Iterable<[K, V]> {
  private weakMap = new WeakMap<K, { value: V; ref: WeakRef<K> }>();
  private refSet = new Set<WeakRef<K>>();
  private finalizationGroup?: FinalizationRegistry<WeakRef<K>>;

  constructor(iterable?: [key: K, value: V][]) {
    if (typeof FinalizationRegistry !== "undefined") {
      this.finalizationGroup = new FinalizationRegistry((ref) => {
        this.refSet.delete(ref);
      });
    }
    if (iterable) for (const [key, value] of iterable) this.set(key, value);
  }

  set(key: K, value: V): this {
    const existing = this.weakMap.get(key);
    if (existing) {
      this.finalizationGroup?.unregister(existing.ref);
      this.refSet.delete(existing.ref);
    }

    const ref = new WeakRef(key);
    this.weakMap.set(key, { value, ref });
    this.refSet.add(ref);
    this.finalizationGroup?.register(key, ref, ref);
    return this;
  }

  get(key: K): V | undefined {
    return this.weakMap.get(key)?.value;
  }

  has(key: K): boolean {
    return this.weakMap.has(key);
  }

  delete(key: K): boolean {
    const entry = this.weakMap.get(key);
    if (!entry) return false;
    this.weakMap.delete(key);
    this.refSet.delete(entry.ref);
    this.finalizationGroup?.unregister(entry.ref);
    return true;
  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    for (const ref of this.refSet) {
      const key = ref.deref();
      if (!key) {
        this.refSet.delete(ref);
        continue;
      }
      const entry = this.weakMap.get(key);
      if (entry) yield [key, entry.value];
    }
  }

  entries(): IterableIterator<[K, V]> {
    return this[Symbol.iterator]();
  }

  *keys(): IterableIterator<K> {
    for (const [key] of this) yield key;
  }

  *values(): IterableIterator<V> {
    for (const [, value] of this) yield value;
  }
}

export class SignalsController {
  static map = new WeakMap<any, IterableWeakMap<Element, Function[]>>();
  static register(signal: SignalData<any>, elm: Element) {
    if (!this.map.has(signal.origin)) {
      this.map.set(signal.origin, new IterableWeakMap());
    }
    const map = this.map.get(signal.origin)!;
    const updates = map.get(elm);
    if (updates) {
      updates.push(signal.update);
    } else {
      map.set(elm, [signal.update]);
    }
  }
  static run(props: any) {
    const elements = this.map.get(props);
    if (!elements) return false;
    for (const [key, functions] of elements) {
      for (const func of functions) {
        func(key, props);
      }
    }
    return true;
  }
  static async runAsync(props: any) {
    const elements = this.map.get(props);
    if (!elements) return false;
    for (const [key, functions] of elements) {
      for (const func of functions) {
        await func(key, props);
      }
    }
    return true;
  }
}
